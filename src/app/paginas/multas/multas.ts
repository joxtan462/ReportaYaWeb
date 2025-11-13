import { Component, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEsCL from '@angular/common/locales/es-CL';
import { FormsModule } from '@angular/forms';
import { FilterMultasPipe } from './filter-multas-pipe';
import { RouterModule, Router } from '@angular/router';
import {
  Firestore,
  collection,
  collectionData,
  query,
  orderBy,
  doc,
  getDoc
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Observable } from 'rxjs';

// 🔹 Registrar idioma español (Chile)
registerLocaleData(localeEsCL);

@Component({
  selector: 'app-multas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FilterMultasPipe],
  providers: [{ provide: LOCALE_ID, useValue: 'es-CL' }],
  templateUrl: './multas.html',
  styleUrls: ['./multas.css']
})
export class Multas {
  partes$!: Observable<any[]>;

  filtroFecha = '';
  filtroInfraccion = '';
  filtroComentarios = '';
  filtroUbicacion = '';
  filtroPatente = '';

  usuarioNombre: string = '';
  usuarioRango: string = '';
  accesoPermitido: boolean = false;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {
    // 🔹 Verificar sesión actual
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.router.navigate(['/']); // si no hay usuario, redirige al login
        return;
      }

      // 🔹 Buscar información del usuario en Firestore
      const userRef = doc(this.firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        this.usuarioNombre = data['nombre'] || 'Desconocido';
        this.usuarioRango = data['rango'] || 'sin-rango';

        // 🔹 Solo admin y multas pueden acceder
        this.accesoPermitido =
          this.usuarioRango === 'admin' || this.usuarioRango === 'multas';

        if (!this.accesoPermitido) {
          alert('⚠️ No tienes permiso para acceder a esta sección.');
          this.router.navigate(['/menu']);
          return;
        }

        // 🔹 Cargar partes si tiene acceso
        this.cargarPartes();
      } else {
        alert('⚠️ No se encontró tu información de usuario.');
        this.router.navigate(['/']);
      }
    });
  }

  private cargarPartes() {
    const partesRef = collection(this.firestore, 'partes');
    const partesQuery = query(partesRef, orderBy('fecha', 'asc'));
    this.partes$ = collectionData(partesQuery, { idField: 'id' });

    this.partes$.subscribe((d) => console.log('✅ partes recibidas:', d));
  }

  irADetalle(parte: any) {
    const id = parte?.id?.toString();
    if (!id) {
      alert('ID inválido, no se puede abrir detalle.');
      return;
    }
    this.router.navigate(['/partedetalle', id]);
  }
}
