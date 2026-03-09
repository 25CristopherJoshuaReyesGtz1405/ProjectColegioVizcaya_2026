/**
 * ====================================================================
 * MODELO DE DATOS (v4) - INCLUSIÓN DE TUTORES
 * ====================================================================
 */

/**
 * COLECCIÓN: 'personas'
 * Document ID: uid (de Firebase Auth)
 */
export interface Persona {
  uid: string;
  nombre: string;
  apellidos: string;
  email: string;
  curp: string;
  fechaNacimiento: Date;
  sexo: "HOMBRE" | "MUJER";
  fotoUrl?: string;
}

/**
 * COLECCIÓN: 'roles_estudiante'
 * Document ID: uid (de Firebase Auth)
 */
export interface RolEstudiante {
  uid: string;
  matricula: string;
  grado: number;
  grupo: string;
  estatus: "ACTIVO" | "BAJA";
}

/**
 * COLECCIÓN: 'roles_empleado'
 * Document ID: uid (de Firebase Auth)
 */
export interface RolEmpleado {
  uid: string;
  RFC: string;
  cedulaProfesional?: string;
  rol: "docente" | "directora" | "control_escolar";
  estatus: "ACTIVO" | "BAJA";
  // --- NUEVOS CAMPOS AÑADIDOS PARA EL EXPEDIENTE ---
  especialidad?: string;
  telefono?: string;
  fechaIngreso?: Date | string;
}

// -------------------------------------------------------------------
// NUEVO: ROL TUTOR (Para el Portal de Padres)
// -------------------------------------------------------------------

/**
 * COLECCIÓN: 'roles_tutor'
 * Document ID: uid (de Firebase Auth)
 * RF: Permite agrupar a varios estudiantes bajo un mismo responsable legal.
 */
export interface RolTutor {
  uid: string;
  rfc?: string; // Opcional, para facturación si aplica
  telefonoContacto: string; // Dato crítico para comunicación
  direccion?: string;
  
  // Relación: Array de UIDs de los estudiantes (hijos/tutorados)
  // Esto permite una consulta rápida sin necesidad de buscar en todos los estudiantes.
  estudiantesUids: string[]; 
  
  estatus: "ACTIVO" | "BAJA";
}

// -------------------------------------------------------------------
// 2. CATÁLOGOS ACADÉMICOS
// -------------------------------------------------------------------

/**
 * COLECCIÓN: 'materias'
 */
export interface Materia {
  id: string;
  claveMateria: string;
  nombre: string;
  grado: number;
}

/**
 * COLECCIÓN: 'periodos'
 */
export interface Periodo {
  id: string;
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  estatus: "ABIERTO" | "CERRADO";
}

// -------------------------------------------------------------------
// 3. ESTRUCTURA ACADÉMICA
// -------------------------------------------------------------------

/**
 * COLECCIÓN: 'grupos'
 */
export interface Grupo {
  id: string;
  cicloEscolar: string;
  materiaId: string;
  empleadoUid: string; // Docente
  estudianteUids: string[];
}

// -------------------------------------------------------------------
// 4. EVALUACIÓN Y SEGUIMIENTO (Sub-colecciones)
// -------------------------------------------------------------------

export interface ActaEvaluacion {
  id: string; 
  grupoId: string;
  docenteUid: string;
  periodoId: string;
  fechaUltimaModificacion: Date;

  estatus: 'ABIERTA' | 'CERRADA'; // <--- NUEVO CAMPO
  
  // MAPA de calificaciones:
  // Clave: UID del estudiante -> Valor: Objeto con nota
  calificaciones: {
    [estudianteUid: string]: {
      valor: number;       
      observaciones?: string; 
      fechaCaptura: Date;
    }
  };
}

/**
 * SUB-COLECCIÓN: 'grupos/{grupoId}/evaluaciones'
 */
export interface Evaluacion {
  id: string;
  periodoId: string;
  nombre: string;
  tipo: "TAREA" | "PROYECTO" | "EXAMEN" | "PARTICIPACION";
  porcentaje: number;
}

/**
 * SUB-COLECCIÓN: 'grupos/{grupoId}/evaluaciones/{evaluacionId}/calificaciones'
 * Document ID: estudianteUid
 */
export interface Calificacion {
  id: string; // (es el estudianteUid)
  calificacion: number;
  fechaCaptura: Date;
  docenteUid: string;
}

/**
 * SUB-COLECCIÓN: 'grupos/{grupoId}/asistencias'
 * Document ID: YYYY-MM-DD
 */
export interface AsistenciaDia {
  id: string; // (YYYY-MM-DD)
  fecha: Date;
  docenteUid: string;
  estatusAlumnos: {
    [estudianteUid: string]: "PRESENTE" | "AUSENTE" | "RETARDO";
  };
  periodoId: string; 
}

// -------------------------------------------------------------------
// 5. GESTIÓN Y DIRECCIÓN (Colecciones raíz)
// -------------------------------------------------------------------

/**
 * COLECCIÓN: 'planeaciones' (RF 4.1)
 */
export interface Planeacion {
  id: string;
  docenteUid: string;
  materiaId: string;
  periodoId: string;
  nombre: string;
  enlaceGoogle: string; // (RF 7.2)
  estatus: "PENDIENTE" | "ENTREGADA" | "REVISADA" | "APROBADA";
  comentariosRevision?: string;
  fechaEntrega?: Date;
}

/**
 * COLECCIÓN: 'reportes_indisciplina' (RF 3.5)
 */
export interface ReporteIndisciplina {
  id: string;
  fecha: Date;
  docenteUid: string;
  estudianteUid: string;
  descripcion: string;
  // --- NUEVOS CAMPOS ---
  tipo: string;       // Ej: "Conducta", "Uniforme", "Asistencia"
  severidad: 'BAJA' | 'MEDIA' | 'ALTA';
}

/**
 * COLECCIÓN: 'agenda_actividades' (NUEVO - RF 4.4)
 * (Solo para la Directora)
 */
export interface AgendaActividad {
  id: string;
  directorUid: string; // Dueño de la tarea
  fecha: Date; // Día de la actividad (Formato YYYY-MM-DD)
  titulo: string;
  descripcion: string;
  estatus: "PENDIENTE" | "COMPLETADA";
}

/**
 * COLECCIÓN: 'evaluacionesDocentes' (RF 1.5)
 */
export interface EvaluacionDocente {
  id: string;
  fecha: Date;
  estudianteUid: string;
  docenteUid: string;
  grupoId: string;
  calificacion: number;
  comentarios?: string;
}

// -------------------------------------------------------------------
// 6. AUDITORÍA Y ALERTAS (Colecciones raíz)
// -------------------------------------------------------------------

/**
 * COLECCIÓN: 'logs' (RNF 2.4)
 */
export interface LogActividad {
  id: string;
  fecha: Date;
  usuarioUid: string;
  accion: string;
  detalles: any;
}

/**
 * COLECCIÓN: 'alertas_riesgo' (RF 5.2)
 */
export interface AlertaRiesgo {
  id: string;
  fecha: Date;
  estudianteUid: string;
  materiaId: string;
  mensaje: string;
  leida: boolean;
}

// -------------------------------------------------------------------
// 7. INTERFACES DE VISTA (DTOs - No son colecciones)
// -------------------------------------------------------------------

/**
 * DTO: Perfil unificado de un usuario.
 * Ahora soporta la estructura de Tutor.
 */
export interface PerfilUsuarioDTO {
  persona: Persona;
  // Unión de tipos de roles posibles
  rol: RolEstudiante | RolEmpleado | RolTutor | null;
  // Discriminador de tipo para facilitar el casting en el frontend
  tipoRol: "estudiante" | "docente" | "directora" | "control_escolar" | "tutor" | null;
}

/**
 * DTO: Para la Boleta (RF 6.1)
 */
export interface BoletaDataDTO {
  estudiante: Persona & RolEstudiante;
  cicloEscolar: string;
  periodos: Periodo[];
  resultados: ResultadoMateriaDTO[];
}

export interface ResultadoMateriaDTO {
  materia: Materia;
  calificacionesPorPeriodo: { [periodoId: string]: number | null };
  promedioFinal: number;
  // --- NUEVOS CAMPOS ---
  nombreDocente?: string;       // Para imprimir quién da la clase
  observaciones?: string;       // El comentario del último periodo
  inasistenciasTotales?: number
}

/**
 * DTO: Para el Acta de Calificaciones (NUEVO - RF 6.3)
 */
export interface ActaCalificacionesDTO {
  grupo: Grupo;
  materia: Materia;
  periodo: Periodo;
  docente: PerfilUsuarioDTO | null;
  filas: ActaFilaEstudianteDTO[];
  promedioGeneralGrupo: number;
}

export interface ActaFilaEstudianteDTO {
  estudiante: PerfilUsuarioDTO;
  // Mapea [evaluacionId] -> calificacion
  calificaciones: { [evaluacionId: string]: number | null };
  promedioPonderado: number | null;
}

/**
 * DTO: Para el Dashboard de Dirección (NUEVO - RF 4.2)
 */
export interface EstadisticasDashboardDTO {
  conteoEstudiantes: {
    activos: number;
    inactivos: number;
    total: number;
    porGrado: { [grado: string]: number };
    porGenero: { [sexo: string]: number };
  };
  conteoDocentes: {
    activos: number;
    inactivos: number;
  };
  conteoGrupos: {
    total: number;
    sinDocente: number;
    sinMateria: number;
  };
  conteoReportesIndisciplina: {
    total: number;
  };
  promedioGeneral: number;
}

// Agrega esto al final de tus modelos

export interface KardexDTO {
  estudiante: PerfilUsuarioDTO;
  promedioGlobal: number;
  totalMateriasCursadas: number;
  totalMateriasReprobadas: number;
  ciclos: CicloKardexDTO[];
}

export interface CicloKardexDTO {
  nombreCiclo: string; // Ej: "2023 - 2024"
  promedioCiclo: number;
  estatus: 'CURSANDO' | 'FINALIZADO';
  materias: MateriaKardexDTO[];
}

export interface MateriaKardexDTO {
  nombreMateria: string;
  calificacionFinal: number; // Promedio final de la materia
  estatus: 'APROBADA' | 'REPROBADA' | 'CURSANDO';
  observaciones?: string;
}

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface SolicitudRatificacion {
  id?: string;               // ID del documento en Firebase
  uidAlumno: string;         // A quién pertenece la calificación
  nombreAlumno: string;      // Para mostrarlo rápido en la lista de la directora
  idMateria: string;         // Qué materia es
  nombreMateria: string;     
  calificacionAnterior: number;
  calificacionNueva: number;
  motivo: string;            // Justificación del docente
  uidDocente: string;        // Quién pide el cambio
  nombreDocente: string;
  fechaSolicitud: Date | any; // Timestamp de Firestore
  estado: EstadoSolicitud;   // Aquí controlamos el flujo
  fechaRespuesta?: Date | any; // Cuándo respondió la directora
  comentarioDirector?: string; // Opcional: por si la directora rechaza y dice por qué
}
