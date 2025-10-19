import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Firestore, doc, docData, updateDoc, Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-alertadetalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './alertadetalle.html',
  styleUrls: ['./alertadetalle.css']
})
export class Alertadetalle implements OnInit {
  alerta: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) {
        this.router.navigate(['/alertasvecinales']);
        return;
      }

      const alertaDocRef = doc(this.firestore, `reportes/${idParam}`);
      docData(alertaDocRef, { idField: 'id' }).subscribe(data => {
        if (!data) {
          this.router.navigate(['/alertasvecinales']);
          return;
        }

        this.alerta = data;

        // Convierte Timestamp de Firebase a Date
        if (this.alerta.creadoEn instanceof Timestamp) {
          this.alerta.creadoEn = this.alerta.creadoEn.toDate();
        }

        // Estructura de estado por defecto
        this.alerta.estado = this.alerta.estado || {
          pendiente: true,
          enTerreno: false,
          concluido: false
        };

        // Si faltan campos en el objeto estado, los agregamos
        this.alerta.estado.pendiente ??= false;
        this.alerta.estado.enTerreno ??= false;
        this.alerta.estado.concluido ??= false;

        this.alerta.privado = this.alerta.privado ?? true;
      });
    });
  }

  async actualizarEstado(nombreCampo: string, valor: boolean) {
    if (!this.alerta?.id) return;

    const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
    const nuevoEstado = { ...this.alerta.estado, [nombreCampo]: valor };

    try {
      await updateDoc(alertaDocRef, { estado: nuevoEstado });
      console.log(`Estado '${nombreCampo}' actualizado a ${valor}`);
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  }

  onPrioridadChange() {
    this.guardarCambios('prioridad');
  }

  onVisibilidadChange() {
    this.guardarCambios('privado');
  }

  guardarCambios(campo: string) {
    if (!this.alerta?.id) return;

    const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
    updateDoc(alertaDocRef, { [campo]: this.alerta[campo] })
      .then(() => console.log(`${campo} actualizado correctamente`))
      .catch(err => console.error(`Error actualizando ${campo}:`, err));
  }
}
