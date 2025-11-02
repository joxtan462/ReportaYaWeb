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

  constructor(
    private firestore: Firestore,
    private router: Router,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // ✅ Solo ejecuta Leaflet en el navegador
    if (this.isBrowser) {
      import('leaflet').then((leaflet) => {
        L = leaflet;

        // 🔹 Fijar rutas correctas para íconos por defecto de Leaflet
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'src\assets\leaflet\marker-icon-2x.png',
          iconUrl: 'src\assets\leaflet\marker-icon.png',
          shadowUrl: 'src\assets\leaflet\marker-shadow.png'
        });

        // ✅ Esperar a que Angular termine de renderizar
        this.zone.runOutsideAngular(() => {
          setTimeout(() => this.inicializarMapa(), 500);
        });
      });

      const reportesRef = collection(this.firestore, 'reportes');
      this.alertas$ = collectionData(reportesRef, { idField: 'id' });
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 1000);
    }
  }

  inicializarMapa() {
    if (!this.isBrowser || !L) return;

    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // 🔹 Si el mapa ya existe, lo removemos para reinicializar
    if (this.map) this.map.remove();

    this.map = L.map(mapContainer, {
      center: [-33.45, -70.6667],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // 🔹 Asegurar tamaño correcto del mapa
    setTimeout(() => this.map.invalidateSize(), 1500);

    // 🔹 Cargar marcadores desde Firebase
    this.alertas$?.subscribe((alertas) => {
      alertas.forEach((alerta) => {
        if (alerta.coordenadas?.lat && alerta.coordenadas?.lng) {
          this.agregarMarcador(alerta);
        }
      });
    });
  }

  agregarMarcador(alerta: any) {
    const icono = L.icon({
      iconUrl: 'assets/pin.png',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });

    const marker = L.marker(
      [alerta.coordenadas.lat, alerta.coordenadas.lng],
      { icon: icono }
    ).addTo(this.map);

    marker.bindPopup(`
      <b>${alerta.categoria || 'Sin categoría'}</b><br>
      ${alerta.subcategoria || ''}<br>
      Estado: ${
        alerta.estado?.pendiente
          ? 'Pendiente'
          : alerta.estado?.enProceso
          ? 'En proceso'
          : 'Resuelto'
      }
    `);

    marker.on('click', () => this.router.navigate(['/alertadetalle', alerta.id]));
  }

  // 📍 Centrar en la ubicación del usuario
  centrarEnUsuario() {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        this.map.setView([latitude, longitude], 15);

        const marker = L.marker([latitude, longitude]).addTo(this.map);
        marker.bindPopup('📍 Estás aquí').openPopup();

        L.circle([latitude, longitude], {
          radius: accuracy,
          color: 'blue',
          fillColor: '#3f51b5',
          fillOpacity: 0.3
        }).addTo(this.map);
      },
      (err) => {
        console.error('Error obteniendo ubicación', err);
        alert('No se pudo obtener tu ubicación');
      }
    );
  }
}
