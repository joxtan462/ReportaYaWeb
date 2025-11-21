import { Routes } from '@angular/router';
import { Inicio } from './paginas/inicio/inicio';
import { Login } from './paginas/login/login';
import { Menu } from './paginas/menu/menu';
import { AlertasVecinales } from './paginas/alertasvecinales/alertasvecinales';
import { CamarasSolicitadas } from './paginas/camarassolicitadas/camarassolicitadas';
import { Multas } from './paginas/multas/multas';
import { Crearusuario } from './paginas/crearusuario/crearusuario';
import { Mapa } from './paginas/mapa/mapa';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  // 🔹 Menú visible para todos los roles logueados
  { path: 'menu', component: Menu, canActivate: [AuthGuard], data: { roles: ['admin', 'camaras', 'multas'] } },

  // 🔹 Alertas y cámaras → solo admin y camaras
  { path: 'alertasvecinales', component: AlertasVecinales, canActivate: [AuthGuard], data: { roles: ['admin', 'camaras'] } },
  { path: 'camarassolicitadas', component: CamarasSolicitadas, canActivate: [AuthGuard], data: { roles: ['admin', 'camaras'] } },
  { path: 'mapa', component: Mapa, canActivate: [AuthGuard], data: { roles: ['admin', 'camaras'] } },

  // 🔹 Multas → admin y multas
  { path: 'multas', component: Multas, canActivate: [AuthGuard], data: { roles: ['admin', 'multas'] } },
  {
    path: 'partedetalle/:id',
    loadComponent: () =>
      import('./paginas/partedetalle/partedetalle').then(m => m.Partedetalle),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'multas'] }
  },

  // 🔹 Crear usuarios → solo admin
  { path: 'crearusuario', component: Crearusuario, canActivate: [AuthGuard], data: { roles: ['admin'] } },

  // 🔹 Detalle de alerta → admin y camaras
  {
    path: 'alertadetalle/:id',
    loadComponent: () =>
      import('./paginas/alertadetalle/alertadetalle').then(m => m.Alertadetalle),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'camaras'] }
  },

  // 🔹 Ruta comodín
  { path: '**', redirectTo: '' }
];
