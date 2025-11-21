import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, signOut } from '@angular/fire/auth';

/* 📊 Para los gráficos */
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css']
})
export class Menu implements OnInit, AfterViewInit {

  usuarioNombre: string | null = null;
  usuarioRango: string | null = null;
  cargando = true;

  // 📊 Datos para los gráficos
  alertasPorDia: any = {};
  alertasPorSector: any = {};
  alertasPorTipo: any = {};

  // Estadísticas generales
  totalUsuarios: number = 0;
  totalReportes: number = 0;
  totalMultas: number = 0;

  // Instancias de gráficos para evitar múltiples renderizados
  private graficoDiaInstance: any = null;
  private graficoSectorInstance: any = null;
  private graficoTipoInstance: any = null;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    await this.cargarEstadisticas();
    await this.cargarDatosGraficos();
    this.renderizarGraficos();
  }

  ngAfterViewInit() {
    // Renderizado ya se hace en ngOnInit
  }

  private async cargarUsuario() {
    const usuarioGuardado = localStorage.getItem('usuario');

    if (usuarioGuardado) {
      const u = JSON.parse(usuarioGuardado);
      this.usuarioNombre = u.nombre;
      this.usuarioRango = u.rango;
      this.cargando = false;
      return;
    }

    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        try {
          const usuariosRef = collection(this.firestore, 'users');
          const q = query(usuariosRef, where('correo', '==', user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const userData = doc.data();

            this.usuarioNombre = userData['nombre'];
            this.usuarioRango = userData['rango'];

            localStorage.setItem('usuario', JSON.stringify({
              nombre: this.usuarioNombre,
              correo: user.email,
              rango: this.usuarioRango,
              uid: user.uid
            }));

            console.log('✅ Usuario cargado desde Firestore:', {
              nombre: this.usuarioNombre,
              rango: this.usuarioRango,
              correo: user.email
            });

          } else {
            console.error('❌ Usuario autenticado pero no encontrado en la colección "users".');
            return;
          }

        } catch (error) {
          console.error('Error al cargar datos del usuario desde Firestore:', error);
          return;
        }
      } else {
        this.router.navigate(['/']);
      }

      this.cargando = false;
    });
  }

        private async cargarEstadisticas() {
      try {
        // Cargar usuarios
        const usuariosRef = collection(this.firestore, 'users');
        const usuariosSnapshot = await getDocs(usuariosRef);
        this.totalUsuarios = usuariosSnapshot.size;

        // Cargar reportes
        const reportesRef = collection(this.firestore, 'reportes');
        const reportesSnapshot = await getDocs(reportesRef);
        this.totalReportes = reportesSnapshot.size;

        // 🚨 CONTAR TODOS LOS DOCUMENTOS EN 'partes' COMO MULTAS
        const partesRef = collection(this.firestore, 'partes');
        const partesSnapshot = await getDocs(partesRef);
        this.totalMultas = partesSnapshot.size; // ✅ Todos los documentos = multas

        console.log('📊 Estadísticas generales cargadas:', {
          usuarios: this.totalUsuarios,
          reportes: this.totalReportes,
          multas: this.totalMultas
        });

      } catch (e) {
        console.error("❌ Error cargando estadísticas generales:", e);
      }
    }

  async cargarDatosGraficos() {
    try {
      const reportesRef = collection(this.firestore, 'reportes');
      const snapshot = await getDocs(reportesRef);

      console.log('📊 Total reportes:', snapshot.size);

      const diasTemp: Record<string, number> = {};
      const sectoresTemp: Record<string, number> = {};
      const tiposTemp: Record<string, number> = {};

      for (const doc of snapshot.docs) {
        const data = doc.data() as any;

        // Por día
        if (data.fecha) {
          let fechaStr: string;

          if (typeof data.fecha === 'string') {
            fechaStr = data.fecha.split(' ')[0];
          } else if (data.fecha && typeof data.fecha.toDate === 'function') {
            const fechaJS = data.fecha.toDate();
            fechaStr = fechaJS.toISOString().split('T')[0];
          } else {
            console.warn('Campo fecha no es string ni Timestamp, omitiendo:', data.fecha);
            continue;
          }

          diasTemp[fechaStr] = (diasTemp[fechaStr] || 0) + 1;
        }

        // Por sector
        if (data.ubicacion) {
          let sector = data.ubicacion;
          if (sector.includes(',')) {
            sector = sector.split(',').pop()?.trim() || sector;
          }
          sectoresTemp[sector] = (sectoresTemp[sector] || 0) + 1;
        }

        // Por tipo
        const tipo = data.subcategoria || data.categoria;
        if (tipo) {
          tiposTemp[tipo] = (tiposTemp[tipo] || 0) + 1;
        }
      }

      this.alertasPorDia = diasTemp;
      this.alertasPorSector = sectoresTemp;
      this.alertasPorTipo = tiposTemp;

      console.log('📊 Datos por día (FINAL):', this.alertasPorDia);
      console.log('📊 Datos por sector (FINAL):', this.alertasPorSector);
      console.log('📊 Datos por tipo (FINAL):', this.alertasPorTipo);

    } catch (e) {
      console.error("❌ Error cargando reportes para gráficos:", e);
    }
  }

  private renderizarGraficos() {
    if (Object.keys(this.alertasPorDia).length === 0 && Object.keys(this.alertasPorSector).length === 0 && Object.keys(this.alertasPorTipo).length === 0) {
      console.log('📊 No hay datos para renderizar gráficos aún.');
      return;
    }

    // Gráfico de barras: Reportes por Día
    const ctxDia = document.getElementById('graficoDia') as HTMLCanvasElement;
    if (ctxDia && Object.keys(this.alertasPorDia).length > 0) {
      if (this.graficoDiaInstance) {
        this.graficoDiaInstance.destroy();
      }
      this.graficoDiaInstance = new Chart(ctxDia, {
        type: 'bar',
        data: {
          labels: Object.keys(this.alertasPorDia),
          datasets: [{
            label: 'Reportes por Día',
            data: Object.values(this.alertasPorDia),
            backgroundColor: '#0057A3',
            borderColor: '#00417a',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // Gráfico de sectores: Reportes por Sector
    const ctxSector = document.getElementById('graficoSector') as HTMLCanvasElement;
    if (ctxSector && Object.keys(this.alertasPorSector).length > 0) {
      if (this.graficoSectorInstance) {
        this.graficoSectorInstance.destroy();
      }
      this.graficoSectorInstance = new Chart(ctxSector, {
        type: 'pie',
        data: {
          labels: Object.keys(this.alertasPorSector),
          datasets: [{
            label: 'Reportes por Sector',
            data: Object.values(this.alertasPorSector),
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }

    // Gráfico de anillo: Reportes por Tipo
    const ctxTipo = document.getElementById('graficoTipo') as HTMLCanvasElement;
    if (ctxTipo && Object.keys(this.alertasPorTipo).length > 0) {
      if (this.graficoTipoInstance) {
        this.graficoTipoInstance.destroy();
      }
      this.graficoTipoInstance = new Chart(ctxTipo, {
        type: 'doughnut',
        data: {
          labels: Object.keys(this.alertasPorTipo),
          datasets: [{
            label: 'Reportes por Tipo',
            data: Object.values(this.alertasPorTipo),
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }

  puedeVer(ruta: string): boolean {
    if (this.usuarioRango === 'admin') return true;

    const permisosPorRango: Record<string, string[]> = {
      'camaras': ['alertasvecinales', 'camarassolicitadas', 'mapa'],
      'multas': ['multas']
    };

    return permisosPorRango[this.usuarioRango!]?.includes(ruta) ?? false;
  }

  isCurrentRoute(route: string): boolean {
    return this.router.url === route;
  }

  cerrarSesion() {
    signOut(this.auth);
    localStorage.removeItem('usuario');
    this.router.navigate(['/']);
  }
}