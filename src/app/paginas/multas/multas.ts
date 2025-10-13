import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterMultasPipe } from './filter-multas-pipe';

@Component({
  selector: 'app-multas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FilterMultasPipe],
  templateUrl: './multas.html',
  styleUrls: ['./multas.css']
})
export class Multas {
  multas = [
    { id: 1, fecha: '22/09/2025', infraccion: 'Mal estacionado', comentarios: 'Auto arriba de la vereda (pasto)', ubicacion: 'Guafo 1002, San Bernardo', patente: 'fk-tz-23' },
    { id: 2, fecha: '21/09/2025', infraccion: 'Mal estacionado', comentarios: 'Auto arriba de la vereda (pasto)', ubicacion: 'General Urrutia 2302, San Bernardo', patente: 'fk-tz-23' },
    { id: 3, fecha: '20/09/2025', infraccion: 'Mal estacionado', comentarios: 'Auto arriba de la vereda (pasto)', ubicacion: 'San Jose 1203, San Bernardo', patente: 'fk-tz-23' }
  ];

  filtroFecha = '';
  filtroInfraccion = '';
  filtroComentarios = '';
  filtroUbicacion = '';
  filtroPatente = '';
}

