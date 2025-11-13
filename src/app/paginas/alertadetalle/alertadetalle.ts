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
import { UsuarioService, Usuario } from '../../servicios/usuario.service';

interface EstadoAlerta {
  pendiente: boolean;
  enProceso: boolean;
  enTerreno: boolean;
  resuelto: boolean;
}

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

  inspectores$!: Observable<any[]>;
  usuario: Usuario | null = null;

  private categoriaTimeout: any;
  private subcategoriaTimeout: any;
  private descripcionTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    // 🔹 Obtener usuario actual
    this.usuario = this.usuarioService.usuario;

    // 🚫 Verificar acceso: solo admin o camaras
    if (!this.usuario || !['admin', 'camaras'].includes(this.usuario?.rango ?? '')) {
      alert('⚠️ No tienes permiso para acceder a esta sección.');
      this.router.navigate(['/menu']);
      return;
    }

    // 🔹 Obtener ID de la alerta
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

        const fechaCampo = this.alerta.fecha || this.alerta.creadoEn;
        if (fechaCampo instanceof Timestamp) {
          this.alerta.fecha = fechaCampo.toDate();
        }

        this.alerta.estado = (this.alerta.estado as EstadoAlerta) || {
          pendiente: false,
          enProceso: false,
          enTerreno: false,
          resuelto: false,
        };

        this.alerta.visibilidad = this.alerta.visibilidad ?? false;

        if (this.alerta.categoria) this.onCategoriaChange(false);
      });
    });

    // 🔹 Obtener inspectores (solo si es admin)
    if (this.usuario?.rango === 'admin') {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('rango', '==', 'inspector'));
      this.inspectores$ = collectionData(q, { idField: 'uid' });
    }
  }

  // ============================================================
  // 🔸 Categorías y subcategorías
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
      try {
        const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
        await updateDoc(alertaDocRef, {
          categoria: this.alerta.categoria || null,
        });
      } catch (err) {
        console.error('❌ Error actualizando categoría:', err);
      }
    }, 500);
  }

  onSubcategoriaChange() {
    if (this.subcategoriaTimeout) clearTimeout(this.subcategoriaTimeout);
    this.subcategoriaTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;
      try {
        const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
        await updateDoc(alertaDocRef, {
          subcategoria: this.alerta.subcategoria || null,
        });
      } catch (err) {
        console.error('❌ Error actualizando subcategoría:', err);
      }
    }, 500);
  }

  // ============================================================
  // 🔸 Estado
  // ============================================================
  async actualizarEstado(nombreCampo: keyof EstadoAlerta, valor: boolean) {
    if (!this.alerta?.id) return;
    try {
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      await updateDoc(alertaDocRef, { [`estado.${nombreCampo}`]: valor });
      this.alerta.estado[nombreCampo] = valor;

      // Liberar inspector si resuelto
      if (nombreCampo === 'resuelto' && valor && this.alerta.inspectorAsignado) {
        await this.liberarInspector(this.alerta.inspectorAsignado);
      }
    } catch (err) {
      console.error('❌ Error actualizando estado:', err);
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

  // ============================================================
  // 🔸 Campos editables
  // ============================================================
  onDescripcionChange() {
    if (this.descripcionTimeout) clearTimeout(this.descripcionTimeout);
    this.descripcionTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;
      try {
        const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
        await updateDoc(alertaDocRef, {
          descripcion: this.alerta.descripcion || '',
        });
      } catch (err) {
        console.error('❌ Error actualizando descripción:', err);
      }
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
    try {
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      updateDoc(alertaDocRef, { [campo]: this.alerta[campo] });
    } catch (err) {
      console.error(`❌ Error guardando ${campo}:`, err);
    }
  }

  // ============================================================
  // 🔸 Asignar reporte (solo admin)
  // ============================================================
  async asignarReporte(uidInspector: string) {
    if (!this.alerta?.id) return;
    if (this.usuario?.rango !== 'admin') {
      alert('Solo un administrador puede asignar reportes.');
      return;
    }

    const confirmar = confirm('¿Asignar esta alerta al inspector seleccionado?');
    if (!confirmar) return;

    try {
      const inspectorDocRef = doc(this.firestore, `users/${uidInspector}`);
      await updateDoc(inspectorDocRef, { alertaAsignada: this.alerta.id });

      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      await updateDoc(alertaDocRef, {
        inspectorAsignado: uidInspector,
        estado: {
          pendiente: false,
          enProceso: true,
          enTerreno: false,
          resuelto: false,
        } as EstadoAlerta,
      });

      alert('✅ Inspector asignado correctamente');
    } catch (err) {
      console.error('❌ Error asignando reporte:', err);
    }
  }

  // ============================================================
  // 🔸 Eliminar reporte (solo admin)
  // ============================================================
  async eliminarReporte(id: string) {
    if (!id) return;
    if (this.usuario?.rango !== 'admin') {
      alert('Solo un administrador puede eliminar reportes.');
      return;
    }

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
