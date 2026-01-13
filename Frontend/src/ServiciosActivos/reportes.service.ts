import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BoletaDataDTO, ActaCalificacionesDTO } from './../ModelosActivos/ModelosAplicacion.model';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api'; // Base API

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * (RF 6.1) Obtiene los datos para pintar la boleta del alumno.
   */
  getBoleta(estudianteUid: string, cicloEscolar: string): Observable<BoletaDataDTO> {
    const params = new HttpParams().set('cicloEscolar', cicloEscolar);
    return this.http.get<BoletaDataDTO>(`${this.apiUrl}/reportes/boleta/${estudianteUid}`, { 
      headers: this.getHeaders(),
      params
    });
  }

  /**
   * (RF 6.3) Obtiene los datos para el Acta de Calificaciones (Vista Director/Admin).
   */
  getActaCalificaciones(grupoId: string, periodoId: string): Observable<ActaCalificacionesDTO> {
    const params = new HttpParams()
      .set('grupoId', grupoId)
      .set('periodoId', periodoId);

    // Nota: Esta ruta está definida en Direccion.routes.ts
    return this.http.get<ActaCalificacionesDTO>(`${this.apiUrl}/director/reportes/acta-calificaciones`, {
      headers: this.getHeaders(),
      params
    });
  }
}