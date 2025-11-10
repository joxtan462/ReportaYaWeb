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
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
  partes$!: Observable<any[]>;

  filtroFecha = '';
  filtroInfraccion = '';
  filtroComentarios = '';
  filtroUbicacion = '';
  filtroPatente = '';

  constructor(private firestore: Firestore, private router: Router) {
    // 🔹 Referencia a la colección 'partes'
    const partesRef = collection(this.firestore, 'partes');

    // 🔹 Ordenar por campo 'fecha' (Timestamp o string)
    const partesQuery = query(partesRef, orderBy('fecha', 'asc'));

    // 🔹 Obtenemos los datos de Firestore
    this.partes$ = collectionData(partesQuery, { idField: 'id' });

    // 🔹 Debug para verificar que llegan bien los datos
    this.partes$.subscribe((d) => console.log('✅ partes recibidas:', d));
  }

  // 🔹 Navegar a detalle del parte
  irADetalle(parte: any) {
    const id = parte?.id?.toString();
    if (!id) {
      alert('ID inválido, no se puede abrir detalle.');
      return;
    }
    this.router.navigate(['/partedetalle', id]);
  }
}
