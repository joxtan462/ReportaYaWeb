import { Component, AfterViewInit, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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

  constructor(
    private firestore: Firestore,
    private router: Router,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // 🔹 Cargar datos de Firebase dentro del contexto Angular
    if (this.isBrowser) {
      const reportesRef = collection(this.firestore, 'reportes');
      this.alertas$ = collectionData(reportesRef, { idField: 'id' });
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    const leaflet = await import('leaflet');
    L = leaflet;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png'
    });

    await this.inicializarMapa();

    // 🔹 Cargar alertas
    this.alertas$?.subscribe((alertas) => {
      if (!this.map) return;
      this.zone.runOutsideAngular(() => {
        alertas.forEach((alerta) => {
          if (alerta.coordenadas?.lat && alerta.coordenadas?.lng) {
            this.agregarMarcador(alerta);
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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map);

      this.map.whenReady(() => {
        setTimeout(() => this.map.invalidateSize(), 300);
        resolve();
      });
    });
  }

  agregarMarcador(alerta: any) {
    if (!this.map) return;

    const icono = L.icon({
      iconUrl: 'assets/pin.png',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });

    const marker = L.marker([alerta.coordenadas.lat, alerta.coordenadas.lng], {
      icon: icono
    }).addTo(this.map);

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

    marker.on('click', () => this.router.navigate(['/alertadetalle', alerta.id]));
  }

  // 🧭 NUEVO: Centrar mapa en ubicación del usuario
  centrarEnUsuario() {
    if (!this.map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        this.map.setView([lat, lng], 15, { animate: true });

        // Si ya existe el marcador del usuario, solo moverlo
        if (this.userMarker) {
          this.userMarker.setLatLng([lat, lng]);
        } else {
          const iconoUsuario = L.icon({
            iconUrl: 'assets/usuario.png', // puedes cambiar el ícono
            iconSize: [45, 45],
            iconAnchor: [22, 45]
          });
          this.userMarker = L.marker([lat, lng], { icon: iconoUsuario })
            .addTo(this.map)
            .bindPopup('Tu ubicación');
        }
      },
      (error) => {
        console.error('Error al obtener ubicación:', error);
        alert('No se pudo acceder a tu ubicación.');
      }
    );
  }
}
