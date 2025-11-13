import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UsuarioService } from '../servicios/usuario.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  private mostrandoAlerta = false; // 🚫 Evita mostrar varias veces el mismo mensaje

  constructor(private usuarioService: UsuarioService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const rolesPermitidos = route.data['roles'] as string[];

    return this.usuarioService.usuario$.pipe(
      take(1),
      map(usuario => {
        if (!usuario) {
          this.router.navigate(['/login']);
          return false;
        }

        // 🔹 Si no hay restricción de roles, dejar pasar
        if (!rolesPermitidos || rolesPermitidos.length === 0) {
          return true;
        }

        // 🔹 Validar rango
        const tienePermiso = rolesPermitidos.includes(usuario.rango || '');

        if (!tienePermiso) {
          if (!this.mostrandoAlerta) {
            this.mostrandoAlerta = true;
            alert('⚠️ No tienes permiso para acceder a esta sección.');
            setTimeout(() => (this.mostrandoAlerta = false), 1000);
          }
          this.router.navigate(['/menu']);
          return false;
        }

        return true;
      })
    );
  }
}
