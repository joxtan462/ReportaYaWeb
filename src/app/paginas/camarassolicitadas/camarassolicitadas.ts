import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { FilterCamarasPipe } from './filtercamaraspipe';
import { UsuarioService, Usuario } from '../../servicios/usuario.service';

interface Camara {
  id?: string;
  nombre: string;
  apellido: string;
  telefono: string;
  rut: string;
  calle: string;
  motivo: string;
  fecha: string;
}

@Component({
  selector: 'app-camarassolicitadas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FilterCamarasPipe],
  templateUrl: './camarassolicitadas.html',
  styleUrls: ['./camarassolicitadas.css']
})
export class CamarasSolicitadas implements OnInit {
  camarasSolicitadas: Camara[] = [];

  filtroNombre = '';
  filtroApellido = '';
  filtroTelefono = '';
  filtroRut = '';
  filtroCalle = '';
  filtroMotivo = '';
  filtroFecha = '';

  usuario: Usuario | null = null;

  constructor(
    private firestore: Firestore,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit() {
    // 🔹 Obtener usuario actual desde el servicio
    this.usuarioService.usuario$.subscribe(usuario => {
      this.usuario = usuario;

      // 🔸 Verificar permisos
      if (!usuario || !['admin', 'camaras'].includes(usuario.rango || '')) {
        alert('Acceso denegado.');
        this.router.navigate(['/menu']);
        return;
      }

      // 🔹 Cargar lista de cámaras
      this.cargarCamaras();
    });
  }

  /** 🔥 Carga los documentos desde la colección 'camaras' y los ordena por fecha (ascendente) */
  private cargarCamaras() {
    const camarasRef = collection(this.firestore, 'camaras');
    collectionData(camarasRef, { idField: 'id' }).subscribe({
      next: (data) => {
        const camaras = (data as Camara[])
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
          .map(camara => ({
            ...camara,
            fecha: this.formatearFecha(camara.fecha)
          }));
        this.camarasSolicitadas = camaras;
      },
      error: (err) => console.error('❌ Error al cargar cámaras:', err)
    });
  }

  /** 🕓 Convierte la fecha ISO en formato legible (dd/MM/yyyy HH:mm) */
  private formatearFecha(fecha: any): string {
    if (!fecha) return '';
    try {
      const dateObj = new Date(fecha);
      return dateObj.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
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

  cerrarSesion(): void {
    console.log('Cerrar sesión');
    this.router.navigate(['/login']);
  }
}