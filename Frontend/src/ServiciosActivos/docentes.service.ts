import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Grupo, Evaluacion, AsistenciaDia, Planeacion, ReporteIndisciplina, PerfilUsuarioDTO } from './../ModelosActivos/ModelosAplicacion.model';

@Injectable({
  providedIn: 'root'
})
export class DocentesService {
  crearDocente(payload: { email: string; password: string; tipoRol: string; datosPersona: { nombre: string; apellidos: string; curp: string; sexo: string; email: string; fotoUrl: string; }; datosRol: { RFC: string; cedulaProfesional: string; especialidad: string; telefono: string; fechaIngreso: Date; rol: string; estatus: string; }; }): Observable<any> {
    throw new Error('Method not implemented.');
  }
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/docentes';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Llama al backend para actualizar de forma segura y registrar logs.
   */
  actualizarEvaluacion(grupoId: string, evaluacionId: string, datos: { nombre?: string, porcentaje?: number }): Observable<any> {
    // Necesitamos el UID del usuario actual para la API
    // Asumimos que authService lo provee o lo sacamos del localStorage/State
    const docenteUid = localStorage.getItem('user_uid'); 

    return this.http.put(`${this.apiUrl}/grupos/${grupoId}/evaluaciones/${evaluacionId}`, {
      ...datos,
      headers: this.getHeaders()
    });
  }

  /**
   * Llama al backend para eliminar el rubro y el acta en cascada.
   */
  eliminarEvaluacion(grupoId: string, evaluacionId: string): Observable<any> {
    const docenteUid = localStorage.getItem('user_uid');

    // Usamos 'request' con body para enviar el UID en un DELETE (o params según tu server)
    return this.http.delete(`${this.apiUrl}/grupos/${grupoId}/evaluaciones/${evaluacionId}`, {
      headers: this.getHeaders()
    });
  }
  
  /**
   * (NUEVO) Enviar solicitud de rectificación a Dirección
   * Conecta con: POST /api/docente/solicitud-rectificacion
   */
  enviarSolicitudRectificacion(payload: {
    uidAlumno: string;
    nombreAlumno: string;
    idMateria: string;    // ID de la Evaluación (Rubro)
    nombreMateria: string; // Nombre de la Materia o del Rubro
    calificacionAnterior: number;
    calificacionNueva: number;
    motivo: string;
    nombreDocente: string;
  }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/solicitud-rectificacion`, 
      payload, 
      { headers: this.getHeaders() }
    );
  }

  getPromediosAnteriores(grupoId: string, periodoId: string): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(
      `${this.apiUrl}/grupos/${grupoId}/promedios/${periodoId}`,
      { headers: this.getHeaders() }
    );
  }
  
  // --- Gestión Académica ---

  /** (RF 3.1) Obtiene los grupos asignados al docente logueado */
  getMisGrupos(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/grupos`, { headers: this.getHeaders() });
  }

  /** (RF 3.3) Crea una nueva tarea/examen para un grupo */
  crearEvaluacion(payload: { grupoId: string, datosEvaluacion: any }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/evaluacion`, 
      payload, // Enviamos el objeto directo: { grupoId: "...", datosEvaluacion: {...} }
      { headers: this.getHeaders() }
    );
  }

  /**
   * Consulta la asistencia de una fecha específica.
   */
  consultarAsistenciaDia(grupoId: string, fecha: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/asistencia/grupo/${grupoId}/fecha/${fecha}`,
      { headers: this.getHeaders() }
    );
  }

    /** (RF 5.1) Registra asistencia del día */
  registrarAsistencia(grupoId: string, fecha: string, estatusAlumnos: any): Observable<any> {
    const payload = {
      grupoId,
      fecha,
      estatusAlumnos
    };

    return this.http.post<any>(
      `${this.apiUrl}/asistencia`, 
      payload, 
      { headers: this.getHeaders() }
    );
  }

  cerrarActa(evaluacionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/calificaciones/cerrar`, { evaluacionId }, { headers: this.getHeaders() });
  }

  /** (RF 3.1) Guarda la calificación de un alumno */
  calificarAlumno(payload: { grupoId: string, evaluacionId: string, estudianteUid: string, calificacion: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/calificacion`, payload, { headers: this.getHeaders() });
  }

  /**
   * Obtiene el historial completo de incidencias (Dashboard General).
   * Backend: GET /api/docente/reportes
   */
  getAllReportes(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/api/docentes/reportes`, { 
      headers: this.getHeaders() 
    });
  }

  // En src/app/ServiciosActivos/docentes.service.ts

  /**
   * Elimina un reporte de indisciplina.
   * Backend: DELETE /api/docente/reporte-indisciplina/:id
   */
  deleteReporte(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reporte-indisciplina/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtiene las incidencias de un alumno específico (Perfil del Alumno).
   * Backend: GET /api/docente/reportes/estudiante/:uid
   */
  getReportesPorAlumno(uid: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reportes/estudiante/${uid}`, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * (NUEVO) Obtiene el acta (sábana) de calificaciones de una evaluación
   */
  getActaEvaluacion(evaluacionId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/calificaciones/evaluacion/${evaluacionId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * (NUEVO) Guarda calificaciones masivas (Ahorro de costos)
   */
  guardarCalificacionesMasivo(payload: {
    grupoId: string;
    evaluacionId: string;
    calificaciones: { estudianteUid: string; valor: number; observaciones?: string }[];
  }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/calificaciones/masivo`, 
      payload, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtiene las evaluaciones reales desde la BD.
   */
  getEvaluacionesGrupo(grupoId: string, periodoId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/grupo/${grupoId}/evaluaciones`, 
      { 
        headers: this.getHeaders(),
        params: { periodoId } 
      }
    );
  }

  // --- Gestión Administrativa ---

  /** (RF 7.1) Sube el enlace de la planeación */
  registrarPlaneacion(datos: { materiaId: string, periodoId: string, nombre: string, enlaceGoogle: string }): Observable<Planeacion> {
    return this.http.post<Planeacion>(`${this.apiUrl}/planeacion`, datos, { headers: this.getHeaders() });
  }

  /** (RF 3.5) Crea reporte de indisciplina */
  crearReporte(ReporteEnviado: ReporteIndisciplina): Observable<ReporteIndisciplina> {
    return this.http.post<ReporteIndisciplina>(`${this.apiUrl}/reporte-indisciplina`, ReporteEnviado, { headers: this.getHeaders() });
  }

  /**
   * Sube el archivo de planeación a la nueva ruta de Drive.
   */
  subirPlaneacion(archivo: File, datos: { materiaId: string, periodoId: string, nombre: string }): Observable<Planeacion> {
    const formData = new FormData();
    formData.append('archivo', archivo); // Debe coincidir con upload.single('archivo') del backend
    formData.append('materiaId', datos.materiaId);
    formData.append('periodoId', datos.periodoId);
    formData.append('nombre', datos.nombre);

    return this.http.post<Planeacion>(
      `${this.apiUrl}/planeacion/subir`, // La nueva ruta
      formData, 
      { headers: this.getHeaders() } // El navegador añade el Content-Type multipart automáticamente
    );
  }

  /**
   * Obtiene la lista de todos los docentes activos (Admin)
   */
  getDocentes(): Observable<PerfilUsuarioDTO[]> {
    // Asumiendo que crearás/tienes esta ruta en backend similar a estudiantes
    return this.http.get<PerfilUsuarioDTO[]>('http://localhost:3000/api/docentes/', { 
      headers: this.getHeaders() 
    });
  }

  /**
   * Actualiza los datos de un docente
   */
  updateDocente(uid: string, datos: any): Observable<PerfilUsuarioDTO> {
    // Reutilizamos la ruta de usuarios o una específica de docentes
    return this.http.put<PerfilUsuarioDTO>(`http://localhost:3000/api/usuarios/perfil/${uid}`, datos, {
      headers: this.getHeaders()
    });
  }

  // ==========================================
  //  ASISTENCIA INTELIGENTE
  // ==========================================

  /**
   * Obtiene el Historial Térmico, Faltas Consecutivas y Porcentaje Global
   */
  getEstadisticasAsistencia(grupoId: string, periodoId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/grupo/${grupoId}/periodo/${periodoId}/estadisticas-asistencia`, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Guarda el pase de lista de un día en específico
   */
  guardarAsistenciaInteligente(grupoId: string, periodoId: string, fecha: string, registro: any): Observable<any> {
    const payload = {
      periodoId: periodoId,
      fecha: fecha,
      registro: registro 
    };
    return this.http.post<any>(
      `${this.apiUrl}/grupo/${grupoId}/asistencia-inteligente`, 
      payload, 
      { headers: this.getHeaders() }
    );
  }

  /** (NUEVO) Obtiene el historial de solicitudes de corrección del docente */
  getMisSolicitudes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-solicitudes`, { headers: this.getHeaders() });
  }

  getExpediente360(grupoId: string, estudianteUid: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/grupo/${grupoId}/expediente/${estudianteUid}`, { headers: this.getHeaders() });
  }

  /** (NUEVO) Obtiene el tablero de avisos institucionales */
  getAvisosInstitucionales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/avisos`, { headers: this.getHeaders() });
  }

  /** (NUEVO) Obtiene los alumnos con riesgo académico */
  getAlertasTempranas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/alertas`, { headers: this.getHeaders() });
  }

  /**
   * Da de baja lógica a un docente
   */
  darDeBajaDocente(uid: string): Observable<void> {
    return this.http.patch<void>(`http://localhost:3000/api/usuarios/${uid}/baja`, {}, {
      headers: this.getHeaders()
    });
  }

  // En DocentesService
  /**
   * Busca coincidencias en las clases del docente.
   */
  buscarGlobal(termino: string): Observable<{ grupos: any[], estudiantes: any[] }> {
    return this.http.get<{ grupos: any[], estudiantes: any[] }>(
      `${this.apiUrl}/busqueda`, 
      { 
        headers: this.getHeaders(),
        params: { q: termino }
      }
    );
  }

  getEstadisticasDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/estadisticas`, { 
      headers: this.getHeaders() 
    });
  }

  buscarDocentesGlobal(termino: string) {
  return this.http.get<PerfilUsuarioDTO[]>(`${this.apiUrl}/buscar/global?q=${termino}`);
}
}