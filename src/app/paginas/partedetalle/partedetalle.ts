import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 🔥 Agregado
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Firestore, doc, getDoc, deleteDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-partedetalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // 🔥 Agregado FormsModule
  templateUrl: './partedetalle.html',
  styleUrls: ['./partedetalle.css'],
})
export class Partedetalle implements OnInit {
  multa: any = null;
  usuarioNombre: string | null = null;
  usuarioActual: any = null; // 🔹 Usuario logueado
  tabActual = 'general'; // 🔹 Pestaña activa

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private router: Router
  ) {}

  async ngOnInit() {
    // === Recuperar usuario logueado ===
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) {
      alert('Debes iniciar sesión para acceder.');
      this.router.navigate(['/']);
      return;
    }

    this.usuarioActual = JSON.parse(usuarioGuardado);
    this.usuarioNombre = this.usuarioActual.nombre;

    // === Verificar rango permitido ===
    const rango = this.usuarioActual.rango;
    console.log('🔹 Rango detectado:', rango);

    if (rango !== 'admin' && rango !== 'multas') {
      alert('No tienes permiso para ver esta sección.');
      this.router.navigate(['/menu']);
      return;
    }

    // === Cargar multa por ID ===
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

      // === Buscar el nombre del creador ===
      if (this.multa.usuarioUID) {
        await this.cargarUsuarioCreador(this.multa.usuarioUID);
      }
    } catch (err) {
      console.error('Error cargando parte:', err);
      alert('Ocurrió un error al cargar el parte.');
      this.router.navigate(['/multas']);
    }
  }

  private async cargarUsuarioCreador(uid: string) {
    try {
      const usersCol = collection(this.firestore, 'users');
      const q = query(usersCol, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as any;
        this.usuarioNombre = userData.nombre || this.usuarioNombre;
      }
    } catch (err) {
      console.error('Error cargando usuario creador:', err);
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

  cambiarTab(tab: string) {
    this.tabActual = tab;
  }

  puedeVer(ruta: string): boolean {
    if (!this.usuarioActual) return false;

    const permisos: { [key: string]: string[] } = {
      alertasvecinales: ['admin', 'camaras'],
      camarassolicitadas: ['admin', 'camaras'],
      mapa: ['admin', 'camaras', 'usuario'],
      multas: ['admin', 'multas'],
      crearusuario: ['admin']
    };

    return permisos[ruta]?.includes(this.usuarioActual.rango);
  }

  esAdmin(): boolean {
    return this.usuarioActual?.rango === 'admin';
  }

  isCurrentRoute(route: string): boolean {
    return this.router.url === route;
  }

  volver(): void {
    this.router.navigate(['/multas']);
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuario');
    this.router.navigate(['/']);
  }

  guardarCambios(campo: string) {
    // En este caso, no hay lógica de guardado, pero puedes agregarla si lo necesitas.
    console.log(`Campo ${campo} guardado.`);
  }
}