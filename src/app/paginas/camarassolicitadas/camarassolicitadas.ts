import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FilterCamarasPipe } from './filtercamaraspipe';

@Component({
  selector: 'app-camarassolicitadas',
  imports: [CommonModule, FormsModule, RouterModule, FilterCamarasPipe],
  templateUrl: './camarassolicitadas.html',
  styleUrl: './camarassolicitadas.css'
})
export class CamarasSolicitadas {
  camarasSolicitadas = [
    { id: 1, nombre: 'Christopher', apellido: 'Osorio', telefono: '937073605', rut: '21415705-5', calle: 'Guafo 1002, San Bernardo', motivo: 'Necesito la cámara de la esquina por un asalto de un familiar', fecha: '22/09/2025' },
    { id: 2, nombre: 'Christopher', apellido: 'Osorio', telefono: '937073605', rut: '21415705-5', calle: 'General Urrutia 2302, San Bernardo', motivo: 'Necesito la cámara de la esquina por un asalto de un familiar', fecha: '22/09/2025' },
    { id: 3, nombre: 'Christopher', apellido: 'Osorio', telefono: '937073605', rut: '21415705-5', calle: 'San Jose 1203, San Bernardo', motivo: 'Necesito la cámara de la esquina por un asalto de un familiar', fecha: '22/09/2025' }
  ];

  filtroNombre = '';
  filtroApellido = '';
  filtroTelefono = '';
  filtroRut = '';
  filtroCalle = '';
  filtroMotivo = '';
  filtroFecha = '';
}
