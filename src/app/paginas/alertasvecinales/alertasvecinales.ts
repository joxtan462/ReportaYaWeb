import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterAlertasPipe } from './filter-alertas.pipe';
import { RouterModule, Router } from '@angular/router';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-alertasvecinales',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterAlertasPipe, RouterModule],
  templateUrl: './alertasvecinales.html',
  styleUrls: ['./alertasvecinales.css']
})
export class AlertasVecinales {
  alertas$!: Observable<any[]>;

  filtroCorreo = '';
  filtroDescripcion = '';
  filtroUbicacion = '';
  filtroFecha = '';

  constructor(private firestore: Firestore, private router: Router) {
    // 🔹 Creamos la referencia a la colección con orden por fecha ascendente
    const alertasRef = collection(this.firestore, 'reportes');
    const alertasQuery = query(alertasRef, orderBy('fecha', 'asc')); // más viejos primero

    // 🔹 Traemos los datos ordenados
    this.alertas$ = collectionData(alertasQuery, { idField: 'id' });
  }

  async cambiarPrioridad(alerta: any, nuevaPrioridad: string) {
    try {
      const docRef = doc(this.firestore, `reportes/${alerta.id}`);
      await updateDoc(docRef, { prioridad: nuevaPrioridad });
      console.log(`✅ Prioridad actualizada para ${alerta.id}: ${nuevaPrioridad}`);
    } catch (error) {
      console.error('❌ Error al actualizar prioridad:', error);
    }
  }

  irADetalle(alerta: any) {
    const id = alerta?.id?.toString();
    if (!id) {
      alert('ID inválido, no se puede abrir detalle.');
      return;
    }
    this.router.navigate(['/alertadetalle', id]);
  }
}
