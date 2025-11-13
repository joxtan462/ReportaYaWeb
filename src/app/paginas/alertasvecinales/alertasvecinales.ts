import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterAlertasPipe } from './filter-alertas.pipe';
import { RouterModule, Router } from '@angular/router';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { UsuarioService, Usuario } from '../../servicios/usuario.service';

@Component({
  selector: 'app-alertasvecinales',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterAlertasPipe, RouterModule],
  templateUrl: './alertasvecinales.html',
  styleUrls: ['./alertasvecinales.css']
})
export class AlertasVecinales implements OnInit {
  alertas$!: Observable<any[]>;

  filtroCorreo = '';
  filtroDescripcion = '';
  filtroUbicacion = '';
  filtroFecha = '';

  usuario: Usuario | null = null;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    // 🔹 Escuchar el usuario actual (solo una vez)
    this.usuarioService.usuario$
      .pipe(take(1))
      .subscribe(usuario => {
        this.usuario = usuario;

        // 🚫 Verificar permisos
        if (!usuario || !['admin', 'camaras'].includes(usuario.rango || '')) {
          alert('Acceso denegado.');
          this.router.navigate(['/menu']);
          return;
        }

        // 🔹 Cargar alertas ordenadas por fecha ascendente
        const alertasRef = collection(this.firestore, 'reportes');
        const alertasQuery = query(alertasRef, orderBy('fecha', 'asc'));
        this.alertas$ = collectionData(alertasQuery, { idField: 'id' });
      });
  }

  async cambiarPrioridad(alerta: any, nuevaPrioridad: string) {
    // 🚫 Solo admin puede cambiar la prioridad
    if (!this.usuario || this.usuario.rango !== 'admin') {
      alert('Solo un administrador puede cambiar prioridades.');
      return;
    }

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
