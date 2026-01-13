import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../ServiciosActivos/auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => 
{
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se Usa el Observable del servicio de Auth
  return authService.getUsuario().pipe
  (
    map(usuario => 
    {
        if (usuario) 
        {
            // Si hay un usuario, permitir el acceso
            return true;
        } 
        else 
        {
            // Si no, redirigir al login
            return router.createUrlTree(['/auth/login']);
        }
    })
  );
};