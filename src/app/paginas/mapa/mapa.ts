import { Component, AfterViewInit, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { UsuarioService, Usuario } from '../../servicios/usuario.service';

let L: any;

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mapa.html',
  styleUrls: ['./mapa.css']
})
export class Mapa implements AfterViewInit {
  private map!: any;
  alertas$: Observable<any[]> | undefined;
  private isBrowser: boolean;
  private userMarker: any = null;
  private marcadores = new Map<string, any>();
  usuario: Usuario | null = null;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private zone: NgZone,
    private usuarioService: UsuarioService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.usuario = this.usuarioService.usuario;

    if (this.isBrowser) {
      const reportesRef = collection(this.firestore, 'reportes');
      this.alertas$ = collectionData(reportesRef, { idField: 'id' });
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    const leaflet = await import('leaflet');
    L = leaflet;

    // 🔹 Configurar íconos personalizados desde /assets/leaflet/
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png'
    });

    await this.inicializarMapa();

    // 🔹 Suscribirse a cambios en "reportes"
    this.alertas$?.subscribe((alertas) => {
      if (!this.map) return;

      this.zone.runOutsideAngular(() => {
        const idsActuales = new Set(alertas.map(a => a.id));

        // 🧹 Eliminar marcadores que ya no existen
        this.marcadores.forEach((marker, id) => {
          if (!idsActuales.has(id)) {
            this.map.removeLayer(marker);
            this.marcadores.delete(id);
          }
        });

        // ➕ Agregar o actualizar
        alertas.forEach((alerta) => {
          if (!alerta.coordenadas?.lat || !alerta.coordenadas?.lng) return;

          const existente = this.marcadores.get(alerta.id);
          if (existente) {
            existente.setLatLng([alerta.coordenadas.lat, alerta.coordenadas.lng]);
          } else {
            const nuevo = this.crearMarcador(alerta);
            this.marcadores.set(alerta.id, nuevo);
          }
        });
      });
    });
  }

  inicializarMapa(): Promise<void> {
    return new Promise((resolve) => {
      const mapContainer = document.getElementById('map');
      if (!mapContainer) return resolve();

      if (this.map) this.map.remove();

      this.map = L.map(mapContainer, {
        center: [-33.45, -70.6667],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.whenReady(() => {
        setTimeout(() => this.map.invalidateSize(), 300);
        resolve();
      });
    });
  }

  crearMarcador(alerta: any) {
    // 🔥 Icono rojo para alertas (más grande y con sombra)
    const iconoAlerta = L.icon({
      iconUrl: 'assets/leaflet/alert-marker-icon.png',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
      className: 'alerta-marker' // Clase CSS para estilos adicionales
    });

    const marker = L.marker(
      [alerta.coordenadas.lat, alerta.coordenadas.lng],
      { icon: iconoAlerta }
    ).addTo(this.map);

    const estado =
      alerta.estado?.pendiente
        ? 'Pendiente'
        : alerta.estado?.enProceso
        ? 'En proceso'
        : 'Resuelto';

    marker.bindPopup(`
      <b>${alerta.categoria || 'Sin categoría'}</b><br>
      ${alerta.subcategoria || ''}<br>
      Estado: ${estado}
    `);

    marker.on('click', () =>
      this.router.navigate(['/alertadetalle', alerta.id])
    );

    return marker;
  }

  centrarEnUsuario() {
    if (!this.map || !navigator.geolocation) return;

    const btn = document.querySelector('.btn-geo') as HTMLButtonElement;
    btn.textContent = '⌛';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        this.map.setView([lat, lng], 15, { animate: true });

        if (this.userMarker) {
          this.userMarker.setLatLng([lat, lng]);
        } else {
          // 🔥 Icono azul para usuario (más grande y con sombra)
          const iconoUsuario = L.icon({
            iconUrl: 'assets/leaflet/user-marker-icon.png',
            iconSize: [45, 45],
            iconAnchor: [22, 45],
            popupAnchor: [0, -45],
            className: 'user-marker' // Clase CSS para estilos adicionales
          });
          this.userMarker = L.marker([lat, lng], { icon: iconoUsuario })
            .addTo(this.map)
            .bindPopup('Tu ubicación');
        }

        btn.textContent = '📍';
        btn.disabled = false;
      },
      (error) => {
        console.error('Error al obtener ubicación:', error);
        alert('No se pudo acceder a tu ubicación.');
        btn.textContent = '📍';
        btn.disabled = false;
      }
    );
  }

  // ✅ Métodos auxiliares
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

  cerrarSesion(): void {
    console.log('Cerrar sesión');
    this.router.navigate(['/login']);
  }
}