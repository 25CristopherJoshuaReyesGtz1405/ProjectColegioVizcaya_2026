import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, user, getIdToken } from '@angular/fire/auth';
import { BehaviorSubject, Observable, from, throwError, of } from 'rxjs';
import { switchMap, catchError, tap, map, first } from 'rxjs/operators';
import { PerfilUsuarioDTO } from '../ModelosActivos/ModelosAplicacion.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService 
{
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private router = inject(Router);

  private apiUrl = 'http://localhost:3000/api';

  private usuarioActual$ = new BehaviorSubject<PerfilUsuarioDTO | null>(null);

  constructor() 
  {
    this.autoLogin().subscribe();
  }

  public getUsuario(): Observable<PerfilUsuarioDTO | null> 
  {
    return this.usuarioActual$.asObservable();
  }

  public getUsuarioSnapshot(): PerfilUsuarioDTO | null 
  {
    return this.usuarioActual$.getValue();
  }

  /**
   * CORREGIDO: Ahora pasamos el UID correctamente a la API.
   */
  iniciarSesion(email: string, pass: string): Observable<PerfilUsuarioDTO> 
  {
    return from(signInWithEmailAndPassword(this.auth, email, pass)).pipe(
      switchMap((userCredential) => 
      {
        // 1. Obtenemos el token Y el UID del usuario
        return from(userCredential.user.getIdToken()).pipe(
          map(token => ({ token, uid: userCredential.user.uid }))
        );
      }),
      tap(({ token }) => 
      {
        localStorage.setItem('authToken', token);
      }),
      switchMap(({ uid }) => 
      {
        // 2. ¡AQUÍ ESTÁ LA CORRECCIÓN!
        // Usamos el 'uid' que obtuvimos arriba para completar la URL.
        // Antes estaba vacío: .../perfil/
        // Ahora es: .../perfil/ABC123XYZ
        return this.http.get<PerfilUsuarioDTO>(`${this.apiUrl}/usuarios/perfil/${uid}`);
      }),
      tap((perfil) => 
      {
        this.usuarioActual$.next(perfil);
      }),
      catchError((err: HttpErrorResponse | any) => 
      {
        this.limpiarSesion();
        let errorMsg = 'Error desconocido';
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/user-not-found'
        ) {
          errorMsg = 'Usuario o contraseña incorrectos.';
        }
        else if (err.status === 404) 
        {
          // Si entra aquí, es porque el usuario existe en Firebase (Auth)
          // pero NO existe en tu base de datos (Firestore).
          errorMsg =
            'El usuario no tiene un perfil asignado en el sistema. Contacte a Control Escolar.';
        }
        else if (err.message.includes('net::ERR_CONNECTION_REFUSED') )
        {
          errorMsg ='No se pudo conectar al servidor. Asegúrate de que el servidor esté en funcionamiento y que tu conexión a Internet sea estable.';
        }
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  /**
   * Cierra la sesión localmente y en Firebase
   */
  cerrarSesion(): void {
    signOut(this.auth).then(() => {
      this.limpiarSesion();
      this.router.navigate(['/auth/login']);
    });
  }

  /**
   * Limpia los datos de sesión del navegador
   */
  private limpiarSesion(): void {
    localStorage.removeItem('authToken');
    this.usuarioActual$.next(null);
  }

  /**
   * Intenta iniciar sesión automáticamente si hay un usuario de Firebase
   */
  autoLogin(): Observable<PerfilUsuarioDTO | null> {
    return user(this.auth).pipe(
      first(), 
      switchMap((user) => {
        if (user) {
          return from(user.getIdToken()).pipe(
            tap((token) => localStorage.setItem('authToken', token)),
            
            // CORREGIDO TAMBIÉN AQUÍ: Usamos user.uid
            switchMap(() => this.http.get<PerfilUsuarioDTO>(`${this.apiUrl}/usuarios/perfil/${user.uid}`)),
            
            tap((perfil) => this.usuarioActual$.next(perfil)), 
            catchError(() => {
              this.limpiarSesion();
              return of(null);
            })
          );
        } else {
          this.limpiarSesion();
          return of(null);
        }
      })
    );
  }

  redirigirPorRol(tipoRol: PerfilUsuarioDTO['tipoRol']): void {
    // Asegúrate que estos strings coincidan EXACTAMENTE con lo que devuelve tu backend
    // (Tu backend devuelve mayúsculas: DOCENTE, DIRECTORA, CONTROL_ESCOLAR, estudiante)
    switch (tipoRol) {
      case 'docente':
        this.router.navigate(['/teacher']);
        break;
      case 'directora':
      case 'control_escolar':
        this.router.navigate(['/admin']); 
        break;
      case 'estudiante':
        this.router.navigate(['/estudiante']); 
        break;
      default:
        this.router.navigate(['/auth/login']);
        break;
    }
  }

  enviarCorreoReseteo(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email));
  }
}