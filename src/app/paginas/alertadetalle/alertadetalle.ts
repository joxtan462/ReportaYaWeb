import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import {
  Firestore,
  doc,
  docData,
  updateDoc,
  deleteDoc,
  Timestamp,
  collection,
  collectionData,
  query,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { DATA } from './categorias';

@Component({
  selector: 'app-alertadetalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './alertadetalle.html',
  styleUrls: ['./alertadetalle.css'],
})
export class Alertadetalle implements OnInit {
  alerta: any = null;
  categorias = DATA;
  subcategoriasFiltradas: string[] = [];

  inspectores$!: Observable<any[]>; // 🟢 Observa los inspectores disponibles

  private categoriaTimeout: any;
  private subcategoriaTimeout: any;
  private descripcionTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    // 🔸 1. Cargar la alerta seleccionada
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam) {
        console.warn('⚠️ ID no encontrado');
        this.router.navigate(['/alertasvecinales']);
        return;
      }

      const alertaDocRef = doc(this.firestore, `reportes/${idParam}`);
      docData(alertaDocRef, { idField: 'id' }).subscribe((data) => {
        if (!data) {
          console.warn('⚠️ Reporte no encontrado');
          this.router.navigate(['/alertasvecinales']);
          return;
        }

        this.alerta = data;

        // 🔧 Convertir fecha si viene como Timestamp
        const fechaCampo = this.alerta.fecha || this.alerta.creadoEn;
        if (fechaCampo instanceof Timestamp) {
          this.alerta.fecha = fechaCampo.toDate();
        }

        // Asegurar estructura del estado
        this.alerta.estado = this.alerta.estado || {
          pendiente: false,
          enProceso: false,
          resuelto: false,
        };
        this.alerta.visibilidad = this.alerta.visibilidad ?? false;

        // Cargar subcategorías si ya hay categoría
        if (this.alerta.categoria) this.onCategoriaChange(false);
      });
    });

    // 🔸 2. Traer todos los usuarios con rango = "inspector" desde la colección "users"
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('rango', '==', 'inspector'));
    this.inspectores$ = collectionData(q, { idField: 'uid' });
  }

  // ============================================================
  // 🔹 Categorías y subcategorías
  // ============================================================

  onCategoriaChange(autoSave = true) {
    if (!this.alerta) return;
    const categoriaSeleccionada = this.categorias.find(
      (c) => c.FAMILIA === this.alerta.categoria
    );
    this.subcategoriasFiltradas = categoriaSeleccionada
      ? categoriaSeleccionada.REQUERIMIENTO
      : [];
    if (!this.subcategoriasFiltradas.includes(this.alerta.subcategoria)) {
      this.alerta.subcategoria = '';
    }

    if (!autoSave) return;
    if (this.categoriaTimeout) clearTimeout(this.categoriaTimeout);
    this.categoriaTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      await updateDoc(alertaDocRef, { categoria: this.alerta.categoria || null });
    }, 500);
  }

  onSubcategoriaChange() {
    if (this.subcategoriaTimeout) clearTimeout(this.subcategoriaTimeout);
    this.subcategoriaTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      await updateDoc(alertaDocRef, {
        subcategoria: this.alerta.subcategoria || null,
      });
    }, 500);
  }

  async actualizarEstado(
    nombreCampo: 'pendiente' | 'enProceso' | 'resuelto',
    valor: boolean
  ) {
    if (!this.alerta?.id) return;
    const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
    await updateDoc(alertaDocRef, {
      [`estado.${nombreCampo}`]: valor,
    });
    this.alerta.estado[nombreCampo] = valor;

    // 🔹 Si se marca como "resuelto", liberar inspector
    if (nombreCampo === 'resuelto' && valor && this.alerta.inspectorAsignado) {
      await this.liberarInspector(this.alerta.inspectorAsignado);
    }
  }

  async liberarInspector(uidInspector: string) {
    try {
      const inspectorDocRef = doc(this.firestore, `users/${uidInspector}`);
      await updateDoc(inspectorDocRef, { alertaAsignada: null });
      console.log(`✅ Inspector ${uidInspector} liberado`);
    } catch (err) {
      console.error('❌ Error liberando inspector:', err);
    }
  }

  onDescripcionChange() {
    if (this.descripcionTimeout) clearTimeout(this.descripcionTimeout);
    this.descripcionTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      await updateDoc(alertaDocRef, {
        descripcion: this.alerta.descripcion || '',
      });
    }, 600);
  }

  onPrioridadChange() {
    this.guardarCambios('prioridad');
  }

  onVisibilidadChange() {
    this.guardarCambios('visibilidad');
  }

  guardarCambios(campo: string) {
    if (!this.alerta?.id) return;
    const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
    updateDoc(alertaDocRef, { [campo]: this.alerta[campo] });
  }

  // ============================================================
  // 🔹 Asignar reporte a inspector
  // ============================================================
  async asignarReporte(uidInspector: string) {
    if (!this.alerta?.id) return;
    const confirmar = confirm('¿Asignar esta alerta al inspector seleccionado?');
    if (!confirmar) return;

    try {
      // 1️⃣ Actualizar inspector
      const inspectorDocRef = doc(this.firestore, `users/${uidInspector}`);
      await updateDoc(inspectorDocRef, {
        alertaAsignada: this.alerta.id,
      });

      // 2️⃣ Actualizar alerta
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      await updateDoc(alertaDocRef, {
        inspectorAsignado: uidInspector,
        estado: { pendiente: false, enProceso: true, resuelto: false },
      });

      alert('✅ Inspector asignado correctamente');
    } catch (err) {
      console.error('❌ Error asignando reporte:', err);
      alert('Ocurrió un error al asignar el reporte.');
    }
  }

  // ============================================================
  // 🔹 Eliminar reporte
  // ============================================================
  async eliminarReporte(id: string) {
    if (!id) return;
    if (confirm('¿Eliminar este reporte?')) {
      try {
        const docRef = doc(this.firestore, `reportes/${id}`);
        await deleteDoc(docRef);
        alert('✅ Reporte eliminado correctamente');
        this.router.navigate(['/alertasvecinales']);
      } catch (error) {
        console.error('❌ Error al eliminar reporte:', error);
      }
    }
  }
}
