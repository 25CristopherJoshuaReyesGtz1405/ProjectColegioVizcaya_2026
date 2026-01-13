import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Grupo, Materia, PerfilUsuarioDTO } from '../ModelosActivos/ModelosAplicacion.model';

// INTERFAZ EXTENDIDA:
// Sirve para recibir el objeto "rico" que manda el backend con los datos unidos
export interface GrupoDetalle extends Grupo {
  materia: Materia;
  docente: PerfilUsuarioDTO | null;
}

@Injectable({
  providedIn: 'root'
})
export class GruposService {
  
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/grupos';

  // Helper para el token de seguridad
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // --- GESTIÓN BÁSICA DEL GRUPO ---

  /**
   * POST /api/grupos/
   * Crea un nuevo grupo vacío.
   */
  crearGrupo(datos: Omit<Grupo, 'id'>): Observable<Grupo> {
    return this.http.post<Grupo>(this.apiUrl, datos, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * GET /api/grupos/
   * Obtiene todos los grupos con detalles (materia y docente incluidos).
   */
  getAllGrupos(): Observable<GrupoDetalle[]> {
    return this.http.get<GrupoDetalle[]>(this.apiUrl, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * PUT /api/grupos/:id
   * Actualiza datos del grupo (ej. cambiar de docente).
   */
  actualizarGrupo(id: string, datos: Partial<Grupo>): Observable<Grupo> {
    return this.http.put<Grupo>(`${this.apiUrl}/${id}`, datos, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * DELETE (Falta agregar la ruta en backend, pero la preparamos aquí)
   * Si no la tienes en backend aún, este método dará error 404, pero lo dejamos listo.
   */
  deleteGrupo(id: string): Observable<void> {
    // Nota: Asegúrate de tener router.delete('/:id', ...) en tu Grupos.routes.ts
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // --- GESTIÓN DE ALUMNOS DENTRO DEL GRUPO ---

  /**
   * GET /api/grupos/:id/estudiantes
   * Obtiene la lista de perfiles de alumnos inscritos en el grupo.
   */
  getEstudiantesGrupo(grupoId: string): Observable<PerfilUsuarioDTO[]> {
    return this.http.get<PerfilUsuarioDTO[]>(`${this.apiUrl}/${grupoId}/estudiantes`, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * POST /api/grupos/:id/estudiantes
   * Inscribe un alumno al grupo.
   */
  agregarEstudiante(grupoId: string, estudianteUid: string): Observable<Grupo> {
    return this.http.post<Grupo>(
      `${this.apiUrl}/${grupoId}/estudiantes`, 
      { estudianteUid }, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * DELETE /api/grupos/:id/estudiantes/:uid
   * Da de baja a un alumno del grupo.
   */
  quitarEstudiante(grupoId: string, estudianteUid: string): Observable<Grupo> {
    return this.http.delete<Grupo>(
      `${this.apiUrl}/${grupoId}/estudiantes/${estudianteUid}`, 
      { headers: this.getHeaders() }
    );
  }
}