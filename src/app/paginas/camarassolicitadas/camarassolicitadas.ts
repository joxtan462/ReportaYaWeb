import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { FilterCamarasPipe } from './filtercamaraspipe';

// ✅ Interfaz para tipar los documentos
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

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.cargarCamaras();
  }

  /**
   * 🔥 Carga los documentos desde la colección 'camaras' y los ordena por fecha (más antiguos primero)
   */
  cargarCamaras() {
    const camarasRef = collection(this.firestore, 'camaras');
    collectionData(camarasRef, { idField: 'id' }).subscribe({
      next: (data) => {
        const camaras = (data as Camara[])
          // 🔹 Ordenamos por fecha ASC (más antiguos primero)
          .sort((a, b) => {
            const fechaA = new Date(a['fecha']).getTime();
            const fechaB = new Date(b['fecha']).getTime();
            return fechaA - fechaB; // ascendente
          })
          // 🔹 Formateamos las fechas para mostrar en formato local
          .map(camara => ({
            ...camara,
            fecha: this.formatearFecha(camara['fecha'])
          }));

        this.camarasSolicitadas = camaras;
        console.log('✅ Cámaras cargadas y ordenadas:', this.camarasSolicitadas);
      },
      error: (err) => {
        console.error('❌ Error al cargar cámaras:', err);
      }
    });
  }

  /**
   * 🕓 Convierte la fecha ISO en formato legible (dd/MM/yyyy HH:mm)
   */
  private formatearFecha(fecha: any): string {
    if (!fecha) return '';
    try {
      const dateObj = new Date(fecha);
      const opciones: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return dateObj.toLocaleString('es-CL', opciones);
    } catch {
      return fecha;
    }
  }
}
