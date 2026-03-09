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

// Definimos la interfaz del Ticket aquí o en tus modelos
export interface TicketRectificacion {
  idMateria: any;
  uidAlumno: any;
  id: string;
  nombreDocente: string;
  nombreAlumno: string;
  nombreMateria: string;
  calificacionAnterior: number;
  calificacionNueva: number;
  motivo: string;
  fechaSolicitud: string;
  estatus: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  // ... otros campos
}

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

  // --- GESTIÓN DE SOLICITUDES (TICKETS) ---

  /**
   * (NUEVO) Obtiene la lista de solicitudes pendientes
   * Conecta con: GET /api/direccion/solicitudes-pendientes
   */
  getSolicitudesPendientes(): Observable<TicketRectificacion[]> {
    return this.http.get<TicketRectificacion[]>(
      `${this.urlApi}/solicitudes-pendientes`, 
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * (NUEVO) Aprueba la solicitud y actualiza la calificación
   * Conecta con: PUT /api/direccion/rectificar
   */
  aprobarSolicitud(payload: {
    uidDirectora: string;
    evaluacionId: string;
    estudianteUid: string;
    nuevaCalificacion: number;
    motivoCambio: string; // "Aprobación de ticket"
    solicitudId: string;  // ID del ticket para cerrarlo
  }): Observable<any> {
    return this.http.put(
      `${this.urlApi}/rectificar`, 
      payload, 
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * (NUEVO) Rechaza la solicitud (solo cambia estatus del ticket)
   * Conecta con: PUT /api/direccion/solicitud/:id/rechazar
   */
  rechazarSolicitud(ticketId: string, motivoRechazo: string): Observable<any> {
    return this.http.put(
      `${this.urlApi}/solicitud/${ticketId}/rechazar`, 
      { motivoRechazo }, 
       { headers: this.getAuthHeaders() }
    );
  }
}
