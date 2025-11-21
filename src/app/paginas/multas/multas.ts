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
  partes: any[] = [];

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
    collectionData(partesQuery, { idField: 'id' }).subscribe({
      next: async (partesData) => {
        if (partesData) {
          // 🔹 Para cada parte, cargar el nombre del usuario que la creó desde 'users'
          const partesConNombre = await Promise.all(
            partesData.map(async (parte) => {
              const usuarioUID = parte['usuarioUID']; // ✅ Notación de corchetes
              let nombreCreador = 'Usuario desconocido';
              let correoCreador = 'Sin correo';

              if (usuarioUID) {
                const userRef = doc(this.firestore, 'users', usuarioUID);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  nombreCreador = userData['nombre'] || 'Desconocido';
                  correoCreador = userData['correo'] || 'Sin correo';
                }
              }

              // 🔥 Formatear la fecha
              const fechaFormateada = this.formatearFecha(parte['fecha']); // ✅ Notación de corchetes

              return {
                ...parte,
                nombreCreador,
                correoCreador,
                fechaFormateada // ✅ Añadido al objeto
              };
            })
          );

          this.partes = partesConNombre;
          console.log('✅ partes recibidas con nombre del creador:', this.partes);
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar partes:', err);
      }
    });
  }

  /** 🕓 Convierte fecha (Timestamp o string) a formato legible */
  formatearFecha(fecha: any): string {
    // Caso 1: Es un Timestamp de Firebase
    if (fecha && fecha.toDate && typeof fecha.toDate === 'function') {
      const date = fecha.toDate();
      return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }

    // Caso 2: Es un string (ya tiene el formato correcto)
    if (typeof fecha === 'string') {
      return fecha;
    }

    // Caso 3: Fecha en milisegundos o número
    if (typeof fecha === 'number') {
      const date = new Date(fecha);
      return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }

    // Fallback
    return 'Fecha no disponible';
  }

  irADetalle(parte: any) {
    const id = parte?.id?.toString();
    if (!id) {
      alert('ID inválido, no se puede abrir detalle.');
      return;
    }
    this.router.navigate(['/partedetalle', id]);
  }

  puedeVer(ruta: string): boolean {
    if (!this.accesoPermitido) return false;

    const permisos: { [key: string]: string[] } = {
      alertasvecinales: ['admin', 'camaras'],
      camarassolicitadas: ['admin', 'camaras'],
      mapa: ['admin', 'camaras', 'usuario'],
      multas: ['admin', 'multas'],
      crearusuario: ['admin']
    };

    return permisos[ruta]?.includes(this.usuarioRango);
  }

  isCurrentRoute(route: string): boolean {
    return this.router.url === route;
  }

  cerrarSesion(): void {
    console.log('Cerrar sesión');
    this.router.navigate(['/login']);
  }
}