import { Routes } from '@angular/router';
import { Inicio } from './paginas/inicio/inicio';
import { Login } from './paginas/login/login';
import { Menu } from './paginas/menu/menu';
import { AlertasVecinales } from './paginas/alertasvecinales/alertasvecinales';
import { Alertadetalle } from './paginas/alertadetalle/alertadetalle';
import { CamarasSolicitadas } from './paginas/camarassolicitadas/camarassolicitadas';
import { Multas } from './paginas/multas/multas';
import { Crearusuario } from './paginas/crearusuario/crearusuario';
import { Mapa } from './paginas/mapa/mapa';

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'login', component: Login },
  { path: 'menu', component: Menu },
  { path: 'alertasvecinales', component: AlertasVecinales },
  { path: 'alertadetalle/:id', component: Alertadetalle },
  { path: 'alertadetalle', redirectTo: 'alertasvecinales', pathMatch: 'full' },
  { path: 'camarassolicitadas', component: CamarasSolicitadas },
  { path: 'multas', component: Multas },
  { path: 'crearusuario', component: Crearusuario},
  { path: 'mapa', component: Mapa},
  { path: 'alertadetalle/:id', loadComponent: () => import('./paginas/alertadetalle/alertadetalle').then(m => m.Alertadetalle) },
];
