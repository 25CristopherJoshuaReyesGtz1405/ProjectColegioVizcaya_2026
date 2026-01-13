import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom, Observable } from 'rxjs';
// Importamos la interfaz DTO que definimos en el Modelo
import {
  AgendaActividad,
  EstadisticasDashboardDTO,
  Planeacion,
} from './../ModelosActivos/ModelosAplicacion.model';

export interface EstadisticasAcademicasDTO {
  operativas: {
    sinDocente: number;
    sinAlumnos: number;
    sinPlaneacion: number;
    coberturaPorcentaje: number;
  };
  riesgo: {
    totalGruposEnRiesgo: number;
    motivoPrincipal: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  // Asumimos que montaste 'Direccion.routes.ts' en '/api/director' en tu backend.
  // Si lo montaste en '/api/admin', cambia esta URL.
  private urlApi = 'http://localhost:3000/api/director';

  constructor() {}

  getEstadisticasAcademicas(): Observable<EstadisticasAcademicasDTO> {
    const headers = this.getAuthHeaders();
    return this.http.get<EstadisticasAcademicasDTO>(`${this.urlApi}/dashboard/academicas`, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Obtiene las estadísticas en tiempo real del backend.
   * (RF 4.2)
   */
  getEstadisticasDashboard(): Observable<EstadisticasDashboardDTO> {
    const headers = this.getAuthHeaders();
    return this.http.get<EstadisticasDashboardDTO>(`${this.urlApi}/dashboard/estadisticas`, {
      headers,
    });
  }

  getPlaneacionesParaRevision(): Observable<Planeacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Planeacion[]>(`${this.urlApi}/supervision/planeaciones`, { headers });
  }

  revisarPlaneacion(
    id: string,
    estatus: 'REVISADA' | 'APROBADA',
    comentarios: string
  ): Observable<Planeacion> {
    const headers = this.getAuthHeaders();
    return this.http.put<Planeacion>(
      `${this.urlApi}/supervision/planeaciones/${id}`,
      { estatus, comentarios },
      { headers }
    );
  }

  // --- Agenda ---

  getAgenda(fecha: string): Observable<AgendaActividad[]> {
    // fecha YYYY-MM-DD
    const headers = this.getAuthHeaders();
    return this.http.get<AgendaActividad[]>(`${this.urlApi}/agenda?fecha=${fecha}`, { headers });
  }

  crearActividad(actividad: Partial<AgendaActividad>): Observable<AgendaActividad> {
    const headers = this.getAuthHeaders();
    return this.http.post<AgendaActividad>(`${this.urlApi}/agenda`, actividad, { headers });
  }

  actualizarActividad(id: string, datos: Partial<AgendaActividad>): Observable<AgendaActividad> {
    const headers = this.getAuthHeaders();
    return this.http.put<AgendaActividad>(`${this.urlApi}/agenda/${id}`, datos, { headers });
  }

  eliminarActividad(id: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.urlApi}/agenda/${id}`, { headers });
  }
}
