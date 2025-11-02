import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Firestore, doc, docData, updateDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { DATA } from './categorias';

@Component({
  selector: 'app-alertadetalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './alertadetalle.html',
  styleUrls: ['./alertadetalle.css']
})
export class Alertadetalle implements OnInit {
  alerta: any = null;
  categorias = DATA;
  subcategoriasFiltradas: string[] = [];

  private categoriaTimeout: any;
  private subcategoriaTimeout: any;
  private descripcionTimeout: any; // 🟢 Nuevo: control para guardar descripción

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) {
        console.warn('⚠️ ID no encontrado en los parámetros');
        this.router.navigate(['/alertasvecinales']);
        return;
      }

      const alertaDocRef = doc(this.firestore, `reportes/${idParam}`);
      docData(alertaDocRef, { idField: 'id' }).subscribe(data => {
        if (!data) {
          console.warn('⚠️ No se encontró el reporte con ese ID');
          this.router.navigate(['/alertasvecinales']);
          return;
        }

        this.alerta = data;

        // 🔧 Convertir fecha Firestore → Date
        const fechaCampo = this.alerta.fecha || this.alerta.creadoEn;
        if (fechaCampo instanceof Timestamp) {
          this.alerta.fecha = fechaCampo.toDate();
        } else if (typeof fechaCampo === 'string') {
          const parsed = new Date(fechaCampo);
          this.alerta.fecha = !isNaN(parsed.getTime()) ? parsed : fechaCampo;
        }

        // ✅ Asegurar que el objeto estado exista correctamente
        this.alerta.estado = this.alerta.estado || {
          pendiente: false,
          enProceso: false,
          resuelto: false
        };

        // ✅ Asegurar visibilidad
        this.alerta.visibilidad = this.alerta.visibilidad ?? false;

        // ✅ Cargar subcategorías si ya tiene categoría
        if (this.alerta.categoria) {
          this.onCategoriaChange(false);
        }
      });
    });
  }

  // 🔹 Cambio de categoría
  onCategoriaChange(autoSave = true) {
    if (!this.alerta) return;

    const categoriaSeleccionada = this.categorias.find(
      c => c.FAMILIA === this.alerta.categoria
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
      try {
        await updateDoc(alertaDocRef, { categoria: this.alerta.categoria || null });
        console.log('✅ Categoría guardada automáticamente');
      } catch (err) {
        console.error('❌ Error guardando categoría automáticamente:', err);
      }
    }, 500);
  }

  // 🔹 Cambio de subcategoría
  onSubcategoriaChange() {
    if (this.subcategoriaTimeout) clearTimeout(this.subcategoriaTimeout);
    this.subcategoriaTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;
      try {
        const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
        await updateDoc(alertaDocRef, { subcategoria: this.alerta.subcategoria || null });
        console.log('✅ Subcategoría guardada automáticamente');
      } catch (err) {
        console.error('❌ Error guardando subcategoría:', err);
      }
    }, 500);
  }

  // 🔹 Actualiza el estado (pendiente, enProceso, resuelto)
  async actualizarEstado(nombreCampo: 'pendiente' | 'enProceso' | 'resuelto', valor: boolean) {
    if (!this.alerta?.id) return;

    try {
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);

      // ✅ Actualiza solo el campo dentro del mapa "estado"
      await updateDoc(alertaDocRef, {
        [`estado.${nombreCampo}`]: valor
      });

      console.log(`✅ Estado '${nombreCampo}' actualizado a ${valor}`);

      // Actualiza el valor local también
      this.alerta.estado[nombreCampo] = valor;

    } catch (err) {
      console.error('❌ Error actualizando estado dentro del mapa:', err);
    }
  }

  // 🔹 Cambio de descripción
  onDescripcionChange() {
    if (this.descripcionTimeout) clearTimeout(this.descripcionTimeout);

    this.descripcionTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;

      try {
        const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
        await updateDoc(alertaDocRef, { descripcion: this.alerta.descripcion || '' });
        console.log('✅ Descripción guardada automáticamente');
      } catch (err) {
        console.error('❌ Error al guardar la descripción:', err);
      }
    }, 600);
  }

  // 🔹 Cambio de prioridad
  onPrioridadChange() {
    this.guardarCambios('prioridad');
  }

  // 🔹 Cambio de visibilidad
  onVisibilidadChange() {
    this.guardarCambios('visibilidad');
  }

  // 🔹 Guardar cambios genéricos
  guardarCambios(campo: string) {
    if (!this.alerta?.id) return;
    const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
    updateDoc(alertaDocRef, { [campo]: this.alerta[campo] })
      .then(() => console.log(`✅ ${campo} actualizado correctamente`))
      .catch(err => console.error(`❌ Error actualizando ${campo}:`, err));
  }

  // 🔹 Eliminar reporte
  async eliminarReporte(id: string) {
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar este reporte?')) {
      try {
        const docRef = doc(this.firestore, `reportes/${id}`);
        await deleteDoc(docRef);
        alert('✅ Reporte eliminado correctamente');
        this.router.navigate(['/alertasvecinales']);
      } catch (error) {
        console.error('❌ Error al eliminar reporte:', error);
        alert('Ocurrió un error al eliminar el reporte.');
      }
    }
  }
}
