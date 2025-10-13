import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterAlertasPipe } from './filter-alertas.pipe';
import { RouterModule, Router } from '@angular/router';
 
@Component({
  selector: 'app-alertasvecinales',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterAlertasPipe, RouterModule],
  templateUrl: './alertasvecinales.html',
  styleUrls: ['./alertasvecinales.css']
})
export class AlertasVecinales {
  alertas = [
    { id: 1, fecha: '2025-10-03', nombre: 'Juan Pérez', descripcion: 'Personas peleando en la plaza con cuchillos y muchos gritos', ubicacion: 'Guafo 1002, San Bernardo', prioridad: 'Alta' },
    { id: 2, fecha: '2025-10-02', nombre: 'María López', descripcion: 'Robo con violencia en local comercial', ubicacion: 'Calle 123', prioridad: 'alta' },
    { id: 3, fecha: '2025-10-01', nombre: 'Carlos Gómez', descripcion: 'Ruido fuerte de madrugada', ubicacion: 'Barrio Norte', prioridad: 'Baja' }
  ];

   constructor(private router: Router) {}

  irADetalle(alerta: any) {
    const id = alerta?.id?.toString();
    console.log('irADetalle id ->', id);
    if (!id) {
      alert('ID inválido, no se puede abrir detalle.');
      return;
    }
    this.router.navigate(['/alertadetalle', id]);
  }
  filtroNombre: string = '';
  filtroDescripcion: string = '';
  filtroUbicacion: string = '';
  filtroFecha: string = '';
  
}

