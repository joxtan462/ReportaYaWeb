import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Firestore, doc, getDoc, deleteDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-partedetalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './partedetalle.html',
  styleUrls: ['./partedetalle.css'],
})
export class Partedetalle implements OnInit {
  multa: any = null;
  usuarioNombre: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private router: Router
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/multas']);
      return;
    }

    try {
      const docRef = doc(this.firestore, `partes/${id}`);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert('Parte no encontrado');
        this.router.navigate(['/multas']);
        return;
      }

      // Datos crudos del parte
      const data = docSnap.data() || {};
      this.multa = { id: docSnap.id, ...data };

      // === Formatear fecha ===
      const rawFecha = this.multa.fecha ?? this.multa.createdAt ?? null;
      if (rawFecha instanceof Timestamp) {
        const d = rawFecha.toDate();
        this.multa.fechaFormateada = d.toLocaleString('es-CL', {
          dateStyle: 'long',
          timeStyle: 'medium',
          timeZone: 'America/Santiago',
        });
      } else if (rawFecha instanceof Date) {
        this.multa.fechaFormateada = rawFecha.toLocaleString('es-CL', {
          dateStyle: 'long',
          timeStyle: 'medium',
          timeZone: 'America/Santiago',
        });
      } else if (typeof rawFecha === 'string') {
        this.multa.fechaFormateada = rawFecha;
      } else {
        this.multa.fechaFormateada = 'Sin fecha';
      }

      // === Normalizar fotos ===
      const imgs: string[] = [];
      if (Array.isArray(this.multa.fotos)) {
        this.multa.fotos.forEach((u: any) => {
          if (u && typeof u === 'string' && !imgs.includes(u)) imgs.push(u);
        });
      }
      ['fotoURL', 'fotoURL1', 'fotoURL2', 'fotoURL3'].forEach((k) => {
        const v = this.multa[k];
        if (v && typeof v === 'string' && !imgs.includes(v)) imgs.push(v);
      });
      this.multa.fotos = imgs;

      // === Buscar el nombre del creador (en 'users' por uid) ===
      if (this.multa.usuarioUID) {
        await this.cargarUsuarioCreador(this.multa.usuarioUID);
      } else {
        this.usuarioNombre = 'Desconocido';
      }
    } catch (err) {
      console.error('Error cargando parte:', err);
      alert('Ocurrió un error al cargar el parte.');
      this.router.navigate(['/multas']);
    }
  }

  // 🔹 Busca en la colección 'users' por el campo uid
  private async cargarUsuarioCreador(uid: string) {
    try {
      const usersCol = collection(this.firestore, 'users');
      const q = query(usersCol, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as any;
        this.usuarioNombre = userData.nombre || 'Sin nombre';
      } else {
        this.usuarioNombre = 'Desconocido';
      }
    } catch (err) {
      console.error('Error cargando usuario creador:', err);
      this.usuarioNombre = 'Desconocido';
    }
  }

  async eliminarMulta(id: string | undefined) {
    if (!id) return;
    const ok = confirm('¿Seguro que deseas eliminar este parte? Esta acción no se puede deshacer.');
    if (!ok) return;

    try {
      await deleteDoc(doc(this.firestore, `partes/${id}`));
      alert('Parte eliminado correctamente.');
      this.router.navigate(['/multas']);
    } catch (err) {
      console.error('Error eliminando parte:', err);
      alert('Ocurrió un error al eliminar el parte.');
    }
  }
}
