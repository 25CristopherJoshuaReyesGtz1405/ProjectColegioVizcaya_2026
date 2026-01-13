import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../ServiciosActivos/auth.service';

export const rolGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rolRequerido = route.data['rolRequerido'] as string;

  const usuario = authService.getUsuarioSnapshot();

  if (usuario && usuario.tipoRol === rolRequerido) {
    return true;
  } else if (usuario) {
    // Está logueado, pero no tiene el rol.
    // Lo redirigimos a su dashboard por defecto.
    authService.redirigirPorRol(usuario.tipoRol);
    return false;
  } else {
    // No está logueado, redirigir al login
    return router.createUrlTree(['/auth/login']);
  }
};
