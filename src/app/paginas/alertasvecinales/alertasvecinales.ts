import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy, Timestamp } from '@angular/fire/firestore'; // 🔥 Agregado orderBy
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { UsuarioService, Usuario } from '../../servicios/usuario.service';

@Component({
  selector: 'app-alertasvecinales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './alertasvecinales.html',
  styleUrls: ['./alertasvecinales.css']
})
export class AlertasVecinales implements OnInit, OnDestroy {
  alertas: any[] = [];
  alertasFiltradas: any[] = [];

  filtroCorreo = '';
  filtroDescripcion = '';
  filtroUbicacion = '';
  filtroFecha = '';

  usuario: Usuario | null = null;
  usuarioNombre = '';
  usuarioRango = '';

  private alertasSub?: Subscription;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.usuarioService.usuario$
      .subscribe(usuario => {
        this.usuario = usuario;
        this.usuarioNombre = usuario?.nombre || 'Usuario';
        this.usuarioRango = usuario?.rango || 'Invitado';

        if (!usuario || !['admin', 'camaras'].includes(usuario.rango || '')) {
          alert('Acceso denegado.');
          this.router.navigate(['/menu']);
          return;
        }

        const alertasRef = collection(this.firestore, 'reportes');
        // 🔥 Ahora sí usamos orderBy para ordenar por fecha (ascendente = más antiguas primero)
        const alertasQuery = query(alertasRef, orderBy('fecha', 'asc')); // ✅ Orden ascendente

        this.alertasSub = collectionData(alertasQuery, { idField: 'id' }).pipe(
          map(data => data || [])
        ).subscribe(data => {
          console.log('✅ Datos cargados:', data); // 👈 Debug
          this.alertas = data.map(alerta => ({
            ...alerta,
            fechaString: this.fechaToString(alerta['fecha']) // ✅ Notación de corchetes
          }));
          this.aplicarFiltros();
        });
      });
  }

  ngOnDestroy() {
    if (this.alertasSub) {
      this.alertasSub.unsubscribe();
    }
  }

  // Función para convertir fecha (Timestamp o string) a string
  fechaToString(fecha: any): string {
    if (fecha instanceof Timestamp) {
      return fecha.toDate().toLocaleString('es-ES');
    }
    if (typeof fecha === 'string') {
      return fecha;
    }
    return 'Fecha no disponible';
  }

  aplicarFiltros() {
    const correoFiltro = this.filtroCorreo?.toLowerCase() || '';
    const descFiltro = this.filtroDescripcion?.toLowerCase() || '';
    const ubiFiltro = this.filtroUbicacion?.toLowerCase() || '';
    const fechaFiltro = this.filtroFecha?.toLowerCase() || '';

    this.alertasFiltradas = this.alertas.filter(alerta => {
      const correo = (alerta['usuarioEmail'] || '').toLowerCase(); // ✅ Notación de corchetes
      const descripcion = (alerta['descripcion'] || '').toLowerCase();
      const ubicacion = (alerta['ubicacion'] || '').toLowerCase();
      const fecha = (alerta.fechaString || '').toLowerCase(); // ✅ Esta ya está bien

      return (
        (!correoFiltro || correo.includes(correoFiltro)) &&
        (!descFiltro || descripcion.includes(descFiltro)) &&
        (!ubiFiltro || ubicacion.includes(ubiFiltro)) &&
        (!fechaFiltro || fecha.includes(fechaFiltro))
      );
    });

    console.log('📊 Alertas filtradas:', this.alertasFiltradas); // 👈 Debug
  }

  puedeVer(ruta: string): boolean {
    const usuario = this.usuario;
    if (!usuario) return false;

    const permisos: { [key: string]: string[] } = {
      alertasvecinales: ['admin', 'camaras'],
      camarassolicitadas: ['admin', 'camaras'],
      mapa: ['admin', 'camaras', 'usuario'],
      multas: ['admin'],
      crearusuario: ['admin']
    };

    return permisos[ruta]?.includes(usuario.rango || '');
  }

  isCurrentRoute(route: string): boolean {
    return this.router.url === route;
  }

  async cambiarPrioridad(alerta: any, nuevaPrioridad: string) {
    if (!this.usuario || this.usuario.rango !== 'admin') {
      alert('Solo un administrador puede cambiar prioridades.');
      return;
    }

    try {
      const docRef = doc(this.firestore, `reportes/${alerta['id']}`); // ✅ Notación de corchetes
      await updateDoc(docRef, { prioridad: nuevaPrioridad });
      console.log(`✅ Prioridad actualizada para ${alerta['id']}: ${nuevaPrioridad}`);
    } catch (error) {
      console.error('❌ Error al actualizar prioridad:', error);
    }
  }

  irADetalle(alerta: any) {
    const id = alerta['id']?.toString(); // ✅ Notación de corchetes
    if (!id) {
      alert('ID inválido, no se puede abrir detalle.');
      return;
    }

    this.router.navigate(['/alertadetalle', id]);
  }

  cerrarSesion(): void {
    console.log('Cerrar sesión');
    this.router.navigate(['/login']);
  }
}