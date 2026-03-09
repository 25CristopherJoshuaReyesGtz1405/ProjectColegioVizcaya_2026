import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth, idToken } from '@angular/fire/auth'; // Importante para el token
import { Observable, from, switchMap } from 'rxjs';

export interface SolicitudCambio {
  docenteUid: string;
  docenteNombre: string;
  grupoId: string;
  materiaNombre: string;
  estudianteUid: string;
  estudianteNombre: string;
  evaluacionId: string;
  nombreRubro: string;
  calificacionActual: number;
  calificacionNueva: number;
  motivo: string;
  tipoCausa: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {
  // Ajusta esta URL si tu backend está en otro puerto o servidor
  private apiUrl = 'http://localhost:3000/api/solicitudes';

  private http = inject(HttpClient);
  private auth = inject(Auth);

  /**
   * Envía la solicitud obteniendo primero el token de seguridad actual
   */
  enviarSolicitud(solicitud: SolicitudCambio): Observable<any> {
    // 1. Obtener el usuario actual
    const user = this.auth.currentUser;
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // 2. Obtener el token y hacer la petición
    return from(user.getIdToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        return this.http.post(this.apiUrl, solicitud, { headers });
      })
    );
  }
}