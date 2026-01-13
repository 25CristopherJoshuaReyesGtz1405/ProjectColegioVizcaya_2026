import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => 
{
  // 1. Obtener el token guardado del localStorage
  const token = localStorage.getItem('authToken');

  // 2. Si no hay token, o si la petición es al mismo... Firebase, dejar pasar la petición original.
  if (!token || req.url.includes('firebase')) {
    return next(req);
  }

  // 3. Si hay token, clonar la petición y añadir el Header
  const reqClonada = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });

  // 4. Enviar la petición clonada a su destino (nuestro Backend)
  return next(reqClonada);
};