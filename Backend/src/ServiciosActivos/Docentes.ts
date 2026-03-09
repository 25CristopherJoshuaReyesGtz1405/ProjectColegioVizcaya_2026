import {
  auth,
  db,
} from "../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js";
import {
  type Evaluacion,
  type Calificacion,
  type AsistenciaDia,
  type Planeacion,
  type ReporteIndisciplina,
  type Grupo,
  type Periodo,
  type PerfilUsuarioDTO,
  type ActaEvaluacion,
  type SolicitudRatificacion,
} from "../ModelosAplicacion/ModelosAplicacion.model.js";
import { registrarLog } from "./Auditoria.js";
import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { obtenerPerfilUsuario } from "./Usuarios.js";

// Referencias a Base De Datos
const docentesRef = db.collection("administrativos");
const gruposRef = db.collection("grupos");
const periodosRef = db.collection("periodos");
const planeacionesRef = db.collection("planeaciones");
const reportesRef = db.collection("reportes_indisciplina");
const actasRef = db.collection("actas_evaluacion");
const solicitudesRef = db.collection("solicitudes_cambios");
const publicacionesRef = db.collection("publicaciones_institucionales");
const alertasRef = db.collection("alertas_riesgo");

//  * Consultar a todos los docentes existentes...
export const consultarTodosDocentes = async (): Promise<PerfilUsuarioDTO[]> => {
  // 1. Consultar los roles de docentes
  const snapshotRoles = await docentesRef
    .where("estatus", "==", "ACTIVO")
    .get();

  if (snapshotRoles.empty) return [];

  const uids = snapshotRoles.docs.map((doc) => doc.data().uid);

  // 2. Obtener los perfiles completos en paralelo
  // Esta es la forma más eficiente de "unir" los datos
  const promesasPerfil = uids.map((uid) => obtenerPerfilUsuario(uid));
  const perfiles = await Promise.all(promesasPerfil);

  // 3. Filtrar perfiles nulos (aunque no debería pasar)
  return perfiles.filter((p) => p !== null) as PerfilUsuarioDTO[];
};

// Asegúrate de tener la referencia a la colección de grupos (ya la debes tener arriba en tu archivo)
// const gruposRef = db.collection("grupos");

/**
 * 1. GUARDAR ASISTENCIA
 * Guarda la lista vinculándola obligatoriamente al Periodo para las boletas.
 */
export const guardarAsistenciaInteligente = async (grupoId: string, periodoId: string, fecha: string, registro: any): Promise<any> => {
  // Usamos la fecha (YYYY-MM-DD) como ID del documento para que no se dupliquen si pasa lista 2 veces el mismo día
  const docRef = gruposRef.doc(grupoId).collection('asistencias').doc(fecha);
  
  await docRef.set({
    fecha: fecha,
    periodoId: periodoId,
    registro: registro, // Ej: { 'uid1': 'ASISTENCIA', 'uid2': 'FALTA' }
    actualizadoEn: new Date().toISOString()
  });

  return { mensaje: 'Asistencia guardada correctamente' };
};

/**
 * 2. CALCULAR ESTADÍSTICAS (Derecho a examen, Historial Térmico, Faltas Consecutivas)
 */
export const obtenerEstadisticasAsistencia = async (grupoId: string, periodoId: string): Promise<any> => {
  // Traemos TODAS las asistencias de ESE grupo en ESE periodo (ordenadas de la más reciente a la más vieja)
  const asistenciasSnap = await gruposRef.doc(grupoId).collection('asistencias')
    .where('periodoId', '==', periodoId) 
    .orderBy('fecha', 'desc')
    .get();
  
  if (asistenciasSnap.empty) return {};

  const clases = asistenciasSnap.docs.map(doc => doc.data());
  const totalClases = clases.length;
  
  const statsAlumnos: Record<string, any> = {};

  clases.forEach((clase, index) => {
    const registros = clase.registro || {};

    Object.keys(registros).forEach(uid => {
      const estado = registros[uid]; // 'ASISTENCIA', 'FALTA', 'RETARDO', 'JUSTIFICADO'
      
      if (!statsAlumnos[uid]) {
        statsAlumnos[uid] = {
          historialTermico: [],
          faltasConsecutivas: 0,
          totalAsistencias: 0,
          contandoFaltasConsecutivas: true
        };
      }

      // A) Historial Térmico: Tomamos solo las últimas 5 clases
      if (index < 5) {
        // unshift mete el dato al inicio del arreglo para que el visual se vea de Izq (viejo) a Der (nuevo)
        statsAlumnos[uid].historialTermico.unshift(estado); 
      }

      // B) Faltas Consecutivas: Contamos hacia atrás hasta que haya algo diferente a FALTA
      if (statsAlumnos[uid].contandoFaltasConsecutivas) {
        if (estado === 'FALTA') {
          statsAlumnos[uid].faltasConsecutivas++;
        } else {
          statsAlumnos[uid].contandoFaltasConsecutivas = false; // Rompió la racha
        }
      }

      // C) Para Porcentaje Global: Todo lo que NO sea FALTA cuenta a favor
      if (estado !== 'FALTA') {
        statsAlumnos[uid].totalAsistencias++;
      }
    });
  });

  // Limpieza final y cálculo del Porcentaje (Derecho a Examen)
  Object.keys(statsAlumnos).forEach(uid => {
    const asis = statsAlumnos[uid].totalAsistencias;
    // (Asistencias / Clases Totales) * 100
    statsAlumnos[uid].porcentajeGlobal = Math.round((asis / totalClases) * 100);
    
    // Borramos variables temporales
    delete statsAlumnos[uid].contandoFaltasConsecutivas; 
    delete statsAlumnos[uid].totalAsistencias;
  });

  return statsAlumnos;
};

/**
 * OBTENER EXPEDIENTE 360 DEL ESTUDIANTE
 * Recopila inasistencias en el grupo actual y su historial global de disciplina.
 */
export const obtenerExpediente360 = async (estudianteUid: string, grupoId: string) => {
  // 1. Obtener el historial de reportes de indisciplina del estudiante
  const reportesSnap = await reportesRef
    .where('estudianteUid', '==', estudianteUid)
    .orderBy('fecha', 'desc')
    .get();

  const historialDisciplina = reportesSnap.docs.map(doc => {
    const data = doc.data();
    console.log(data);
    
    return {
      id: doc.id,
      tipo: data.tipo,
      severidad: data.severidad,
      descripcion: data.descripcion,
      // Convertimos el Timestamp de Firestore a string ISO para enviarlo por JSON
      fecha: data.fecha && typeof data.fecha.toDate === 'function' ? data.fecha.toDate().toISOString() : data.fecha
    };
  });

  // 2. Calcular las inasistencias en el grupo específico
  const asistenciasSnap = await gruposRef.doc(grupoId).collection('asistencias').get();
  let inasistencias = 0;

  asistenciasSnap.forEach(doc => {
    const asistencia = doc.data();
    // Verifica cómo guardas la asistencia. Aquí cubrimos los dos métodos más comunes:
    // Método A: Un diccionario/mapa (ej. registro: { 'uid1': 'FALTA', 'uid2': 'ASISTENCIA' })
    if (asistencia.registro && asistencia.registro[estudianteUid] === 'FALTA') {
      inasistencias++;
    } 
    // Método B: Un arreglo de UIDs ausentes (ej. ausentes: ['uid1', 'uid3'])
    else if (asistencia.ausentes && Array.isArray(asistencia.ausentes) && asistencia.ausentes.includes(estudianteUid)) {
      inasistencias++;
    }
  });

  // 3. Retornar el DTO consolidado
  return {
    inasistencias,
    reportesActivos: historialDisciplina.length,
    historialDisciplina
  };
};

//  * Función de seguridad interna. -> Verifica que un docente sea el propietario de un grupo.
const verificarPropiedadGrupo = async (
  docenteUid: string,
  grupoId: string,
): Promise<Grupo> => {
  const grupoDoc = await gruposRef.doc(grupoId).get();
  if (!grupoDoc.exists) {
    throw new Error(`Grupo no encontrado (ID: ${grupoId})`);
  }
  const grupo = grupoDoc.data() as Grupo;
  if (grupo.empleadoUid !== docenteUid) {
    throw new Error(
      "Acceso denegado. El docente no es propietario de este grupo.",
    );
  }
  return grupo;
};

//  * Función de seguridad interna. -> Verifica que un periodo esté 'ABIERTO' y dentro de las fechas.
const verificarPeriodoAbierto = async (periodoId: string): Promise<void> => {
  const periodoDoc = await periodosRef.doc(periodoId).get();
  if (!periodoDoc.exists) {
    throw new Error(`Periodo no encontrado (ID: ${periodoId})`);
  }

  const periodo = periodoDoc.data() as Periodo;

  if (periodo.estatus !== "ABIERTO") {
    throw new Error(
      `El periodo "${periodo.nombre}" está CERRADO (control manual).`,
    );
  }
};

/**
 * Actualiza el nombre o porcentaje de un rubro existente.
 */
export const actualizarEvaluacion = async (
  docenteUid: string,
  grupoId: string,
  evaluacionId: string,
  datos: { nombre?: string; porcentaje?: number },
): Promise<void> => {
  await verificarPropiedadGrupo(docenteUid, grupoId);

  const evalRef = db
    .collection("grupos")
    .doc(grupoId)
    .collection("evaluaciones")
    .doc(evaluacionId);
  const doc = await evalRef.get();

  if (!doc.exists) throw new Error("El rubro de evaluación no existe.");

  // Validaciones extra opcionales (e.g. verificar periodo abierto) aquí...

  await evalRef.update(datos);

  await registrarLog(docenteUid, "ACTUALIZAR_EVALUACION", {
    grupoId,
    evaluacionId,
    cambios: datos,
  });
};

/**
 * Elimina un rubro y sus calificaciones asociadas.
 */
export const eliminarEvaluacion = async (
  docenteUid: string,
  grupoId: string,
  evaluacionId: string,
): Promise<void> => {
  await verificarPropiedadGrupo(docenteUid, grupoId);

  const batch = db.batch();

  // 1. Referencia al Rubro (Metadatos)
  const evalRef = db
    .collection("grupos")
    .doc(grupoId)
    .collection("evaluaciones")
    .doc(evaluacionId);
  batch.delete(evalRef);

  // 2. Referencia al Acta de Calificaciones (Datos)
  // Asumiendo que el ID del acta es el mismo que el de la evaluación (práctica común)
  // O buscamos por campo evaluacionId si es diferente.
  const actaRef = db.collection("actas_evaluacion").doc(evaluacionId);
  // Verificamos si existe antes de borrar o lo mandamos directo (delete no falla si no existe)
  batch.delete(actaRef);

  await batch.commit();

  await registrarLog(docenteUid, "ELIMINAR_EVALUACION", {
    grupoId,
    evaluacionId,
  });
};

// --- 1. Gestión de Evaluaciones y Calificaciones (RF 3.1, 3.2, 3.3) ---

//  * Crea un nuevo rubro de Evaluación (tarea, examen) para un grupo específico.
export const crearEvaluacion = async (
  docenteUid: string,
  grupoId: string,
  datosEvaluacion: Omit<Evaluacion, "id">,
): Promise<Evaluacion> => {
  // 1. Validaciones de Seguridad
  await verificarPropiedadGrupo(docenteUid, grupoId);
  await verificarPeriodoAbierto(datosEvaluacion.periodoId);

  // --- NUEVA LÓGICA DE PONDERACIÓN ---
  // A. Obtener evaluaciones existentes de ese grupo y periodo
  const evaluacionesExistentes = await consultarEvaluacionesGrupo(
    docenteUid,
    grupoId,
    datosEvaluacion.periodoId,
  );

  // B. Calcular porcentaje acumulado
  // Nota: Asumo que tu modelo Evaluacion tiene un campo 'porcentaje' (number).
  const totalAcumulado = evaluacionesExistentes.reduce(
    (sum, ev) => sum + (ev.porcentaje || 0),
    0,
  );

  // C. Validar
  const nuevoPorcentaje = datosEvaluacion.porcentaje || 0;

  if (totalAcumulado + nuevoPorcentaje > 100) {
    throw new Error(
      `Error: La suma de porcentajes superaría el 100%. Actual: ${totalAcumulado}%. Intentas agregar: ${nuevoPorcentaje}%.`,
    );
  }
  // ------------------------------------

  // 2. Crear la Evaluación (código existente...)
  const evalRef = gruposRef.doc(grupoId).collection("evaluaciones").doc();
  const nuevaEvaluacion: Evaluacion = {
    ...datosEvaluacion,
    id: evalRef.id,
  };
  await evalRef.set(nuevaEvaluacion);

  // 3. Registrar Log
  await registrarLog(docenteUid, "CREAR_EVALUACION", {
    grupoId,
    periodoId: datosEvaluacion.periodoId,
    nombre: datosEvaluacion.nombre,
  });

  return nuevaEvaluacion;
};

// ... (imports y funciones anteriores)

/**
 * Consulta las evaluaciones configuradas para un grupo en un periodo específico.
 */
export const consultarEvaluacionesGrupo = async (
  docenteUid: string,
  grupoId: string,
  periodoId: string,
): Promise<Evaluacion[]> => {
  // 1. Seguridad: Verificar que el grupo sea del docente
  // (Podemos reutilizar verificarPropiedadGrupo o confiar en el filtro si se prefiere velocidad,
  // pero por seguridad lo validamos).
  const grupoDoc = await gruposRef.doc(grupoId).get();
  if (
    !grupoDoc.exists ||
    (grupoDoc.data() as Grupo).empleadoUid !== docenteUid
  ) {
    throw new Error("No tienes permiso para ver este grupo.");
  }

  // 2. Consultar la subcolección de evaluaciones
  const snapshot = await gruposRef
    .doc(grupoId)
    .collection("evaluaciones")
    .where("periodoId", "==", periodoId)
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => doc.data() as Evaluacion);
};

/**
 * Obtiene la lista de asistencia de un grupo para una fecha específica.
 * @param fecha Debe estar en formato YYYY-MM-DD
 */
export const consultarAsistenciaDia = async (
  grupoId: string,
  fecha: string,
): Promise<AsistenciaDia | null> => {
  const asistenciaRef = gruposRef
    .doc(grupoId)
    .collection("asistencias")
    .doc(fecha);
  const doc = await asistenciaRef.get();

  if (!doc.exists) return null;

  return doc.data() as AsistenciaDia;
};

//  * Guarda o actualiza la calificación de un alumno para una evaluación específica.
export const guardarCalificacion = async (
  docenteUid: string,
  grupoId: string,
  evaluacionId: string,
  estudianteUid: string,
  calificacion: number,
): Promise<Calificacion> => {
  // 1. Validaciones de Seguridad (en paralelo)
  const grupo = await verificarPropiedadGrupo(docenteUid, grupoId);

  // 1b. Verificar que el alumno esté en el grupo
  if (!grupo.estudianteUids.includes(estudianteUid)) {
    throw new Error("El estudiante no pertenece a este grupo.");
  }

  // 1c. Obtener la evaluación y verificar el periodo
  const evalRef = gruposRef
    .doc(grupoId)
    .collection("evaluaciones")
    .doc(evaluacionId);
  const evalDoc = await evalRef.get();
  if (!evalDoc.exists) {
    throw new Error("La evaluación no existe.");
  }
  const evaluacion = evalDoc.data() as Evaluacion;
  await verificarPeriodoAbierto(evaluacion.periodoId);

  // 2. Preparar la Calificación
  const califRef = evalRef.collection("calificaciones").doc(estudianteUid);
  const nuevaCalificacion: Calificacion = {
    id: estudianteUid, // El ID es el UID del estudiante
    calificacion: calificacion,
    fechaCaptura: new Date(),
    docenteUid: docenteUid,
  };

  // 3. Guardar (set con merge actualiza si ya existe)
  await califRef.set(nuevaCalificacion, { merge: true });

  // 4. Registrar Log
  await registrarLog(docenteUid, "GUARDAR_CALIFICACION", {
    grupoId,
    evaluacionId,
    estudianteUid,
    calificacion,
  });

  return nuevaCalificacion;
};

/**
 * Valida si una fecha específica cae dentro del rango de un periodo.
 */
/**
 * Valida si una fecha (string) está dentro del rango de un periodo (strings).
 * @param periodoId ID del periodo para obtener fechas de inicio y fin.
 * @param fechaAsistencia Fecha enviada por el docente (formato YYYY-MM-DD).
 */
export const validarFechaEnPeriodo = async (
  periodoId: string,
  fechaAsistencia: Date,
): Promise<boolean> => {
  const periodoDoc = await periodosRef.doc(periodoId).get();

  if (!periodoDoc.exists) {
    throw new Error("El periodo especificado no existe.");
  }

  const periodo = periodoDoc.data() as any; // Usamos any para acceder a los campos string

  // Comparación directa de strings (Funciona perfectamente con formato YYYY-MM-DD)
  const inicio = periodo.fechaInicio; // Ej: "2026-01-01"
  const fin = periodo.fechaFin; // Ej: "2026-03-31"

  return fechaAsistencia >= inicio && fechaAsistencia <= fin;
};

/**
 * Tu función de captura de asistencia actualizada
 */
export const guardarAsistenciaDia = async (
  docenteUid: string,
  grupoId: string,
  asistencia: AsistenciaDia,
) => {
  // 1. Validar que la fecha sea del periodo actual
  // Asumimos que el objeto 'asistencia' trae el periodoId
  const esValida = await validarFechaEnPeriodo(
    asistencia.periodoId,
    asistencia.fecha,
  );

  if (!esValida) {
    throw new Error(
      "La fecha de asistencia está fuera del rango permitido para este periodo académico.",
    );
  }

  // 2. Si es válida, proceder con el guardado en Firestore
  const asistenciaRef = gruposRef
    .doc(grupoId)
    .collection("asistencias")
    .doc(asistencia.id);

  await asistenciaRef.set(
    {
      ...asistencia,
      ultimaModificacion: new Date(),
      docenteUid: docenteUid,
    },
    { merge: true },
  );

  await registrarLog(docenteUid, "CAPTURA_ASISTENCIA", {
    grupoId,
    fecha: asistencia.id,
  });
};

// --- 3. Gestión de Planeaciones y Reportes (RF 3.5, 7.1, 7.2) ---

// ... imports existentes
import { subirArchivoDrive } from "./GoogleDrive.js"; // <--- Importa tu nuevo servicio
import { actualizarMetricasEstudiante } from "./Estudiantes.js";

// ...

/**
 * Registra una planeación subiendo el archivo a Drive primero.
 */
export const registrarPlaneacionConArchivo = async (
  docenteUid: string,
  datos: { materiaId: string; periodoId: string; nombre: string },
  archivo: Express.Multer.File, // Recibimos el archivo
): Promise<Planeacion> => {
  // 1. Subir a Google Drive
  const resultadoDrive = await subirArchivoDrive(
    archivo.buffer,
    `${datos.nombre}_${Date.now()}_${archivo.originalname}`, // Nombre único
    archivo.mimetype,
  );

  // 2. Guardar en Firestore con el link generado
  const planeacionRef = planeacionesRef.doc();
  const nuevaPlaneacion: Planeacion = {
    id: planeacionRef.id,
    docenteUid: docenteUid,
    materiaId: datos.materiaId,
    periodoId: datos.periodoId,
    nombre: datos.nombre,
    enlaceGoogle: resultadoDrive.enlaceVer!, // <--- AQUÍ USAMOS EL LINK DE DRIVE
    estatus: "ENTREGADA",
    fechaEntrega: new Date(),
  };

  await planeacionRef.set(nuevaPlaneacion);

  await registrarLog(docenteUid, "REGISTRAR_PLANEACION_DRIVE", {
    planeacionId: nuevaPlaneacion.id,
    fileId: resultadoDrive.fileId,
  });

  return nuevaPlaneacion;
};
// --- 4. Reportes De Indisiplina---

//  * Crea un nuevo reporte de indisciplina. Recibe los datos del formulario del frontend y los guarda en Firestore.
export const crearReporteIndisciplina = async (
  docenteUid: string,
  datos: {
    estudianteUid: string;
    tipo: string; // Ej: "Conducta", "Uniforme"
    severidad: "BAJA" | "MEDIA" | "ALTA";
    descripcion: string;
    fecha: string | Date; // Aceptamos string para facilitar la conversión desde JSON
  },
): Promise<ReporteIndisciplina> => {
  // 1. Generar referencia con ID automático
  const reporteRef = reportesRef.doc();

  // 2. Asegurar que la fecha sea un objeto Date válido de JS/Firestore
  const fechaReporte = new Date(datos.fecha);

  // 3. Construir el objeto final basado en tu Modelo
  const nuevoReporte: ReporteIndisciplina = {
    id: reporteRef.id,
    docenteUid: docenteUid,
    estudianteUid: datos.estudianteUid,
    descripcion: datos.descripcion,
    tipo: datos.tipo,
    severidad: datos.severidad,
    fecha: fechaReporte,
  };

  // 4. Guardar en la base de datos
  await reporteRef.set(nuevoReporte);

  // 5. Registrar en Auditoría (Log)
  await registrarLog(docenteUid, "CREAR_REPORTE_INDISCIPLINA", {
    reporteId: nuevoReporte.id,
    estudianteUid: nuevoReporte.estudianteUid,
    tipo: nuevoReporte.tipo,
    severidad: nuevoReporte.severidad,
  });

  return nuevoReporte;
};

//  * Consulta TODOS los reportes de indisciplina (para el Dashboard). Ordenados del más reciente al más antiguo.
export const consultarTodosReportes = async (): Promise<any[]> => {
  // 1. Obtener los reportes ordenados por fecha
  const snapshot = await reportesRef.orderBy("fecha", "desc").get();

  if (snapshot.empty) return [];

  const reportes = snapshot.docs.map(
    (doc) => doc.data() as ReporteIndisciplina,
  );

  // 2. "Join" manual: Buscar el nombre del alumno para cada reporte
  const promesas = reportes.map(async (r) => {
    const perfil = await obtenerPerfilUsuario(r.estudianteUid);

    // Extraemos datos bonitos para el frontend
    const nombreAlumno = perfil
      ? `${perfil.persona.nombre} ${perfil.persona.apellidos}`
      : "Alumno Desconocido";

    // Intentamos sacar el grado/grupo de forma segura
    let gradoGrupo = "S/N";
    if (perfil && perfil.rol && "grado" in perfil.rol) {
      gradoGrupo = `${perfil.rol.grado}° "${perfil.rol.grupo}"`;
    }

    return {
      ...r,
      estudianteNombre: nombreAlumno,
      gradoGrupo: gradoGrupo,
      fotoUrl: perfil?.persona.fotoUrl || null,
    };
  });

  return Promise.all(promesas);
};

//  * Consulta los reportes de un solo estudiante (Para el perfil individual).
export const consultarReportesPorEstudiante = async (
  estudianteUid: string,
): Promise<ReporteIndisciplina[]> => {
  const snapshot = await reportesRef
    .where("estudianteUid", "==", estudianteUid)
    .orderBy("fecha", "desc")
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => doc.data() as ReporteIndisciplina);
};

//  * Elimina un reporte (Ya lo tenías pendiente de agregar).
export const eliminarReporte = async (
  usuarioUid: string,
  reporteId: string,
): Promise<void> => {
  const ref = reportesRef.doc(reporteId);
  const doc = await ref.get();

  if (!doc.exists) throw new Error("El reporte no existe.");

  await ref.delete();
  await registrarLog(usuarioUid, "ELIMINAR_REPORTE", { reporteId });
};

// --- 4. Funciones de Consulta (Para el Dashboard del Docente) ---

//  * Consulta los grupos asignados a un docente (RF 3.1). y devuelve los grupos con los detalles de la materia.
export const consultarGruposDocente = async (
  docenteUid: string,
): Promise<any[]> => {
  const gruposSnap = await gruposRef
    .where("empleadoUid", "==", docenteUid)
    .get();

  if (gruposSnap.empty) return [];

  const grupos = gruposSnap.docs.map((doc) => doc.data() as Grupo);

  // Obtener los IDs de las materias (para el "join")
  const materiaIds = [...new Set(grupos.map((g) => g.materiaId))];
  if (materiaIds.length === 0) return grupos; // No hay materias que buscar

  // Consultar las materias
  const materiasSnap = await db
    .collection("materias")
    .where(FieldPath.documentId(), "in", materiaIds)
    .get();

  const materiasMap = new Map(
    materiasSnap.docs.map((doc) => [doc.id, doc.data()]),
  );

  // Combinar los datos
  return grupos.map((grupo) => ({
    ...grupo,
    materia: materiasMap.get(grupo.materiaId) || null,
  }));
};

export const generarEstadisticasDocente = async (docenteUid: string) => {
  // 1. Ejecutar consultas en paralelo
  const [gruposSnap, reportesSnap, planeacionesSnap] = await Promise.all([
    gruposRef.where("empleadoUid", "==", docenteUid).get(),
    reportesRef.where("docenteUid", "==", docenteUid).get(),
    planeacionesRef.where("docenteUid", "==", docenteUid).get(),
  ]);

  // 2. Procesar Grupos y Alumnos
  const grupos = gruposSnap.docs.map((doc) => doc.data() as Grupo);
  const totalGrupos = grupos.length;

  // Calcular total de alumnos únicos (usando un Set para evitar duplicados si un alumno está en 2 materias del mismo profe)
  const alumnosUnicos = new Set<string>();
  grupos.forEach((g) => {
    if (g.estudianteUids && Array.isArray(g.estudianteUids)) {
      g.estudianteUids.forEach((uid) => alumnosUnicos.add(uid));
    }
  });
  const totalAlumnos = alumnosUnicos.size;

  // 3. Procesar Reportes y Planeaciones
  const totalReportes = reportesSnap.size;
  const totalPlaneaciones = planeacionesSnap.size;

  // 4. Retornar DTO
  return {
    totalGrupos,
    totalAlumnos,
    totalReportes,
    totalPlaneaciones,
    // Opcional: Agregar desglose por grupo si lo necesitas después
    desgloseGrupos: grupos.map((g) => ({
      grupoId: g.id,
      materiaId: g.materiaId,
      cantidadAlumnos: g.estudianteUids.length,
    })),
  };
};

/**
 * (NUEVO) Busca estudiantes o grupos asignados al docente.
 * Filtra por nombre de materia, grado, grupo o nombre del estudiante.
 */
export const buscarEnMisClases = async (
  docenteUid: string,
  termino: string,
) => {
  const term = termino.toLowerCase().trim();
  if (!term) return { grupos: [], estudiantes: [] };

  // 1. Obtener todos los grupos del docente
  const grupos = await consultarGruposDocente(docenteUid); // Reutilizamos tu función existente

  // 2. Filtrar GRUPOS (por materia o grado)
  const gruposEncontrados = grupos.filter((g) => {
    const nombreMateria = g.materia?.nombre?.toLowerCase() || "";
    const gradoGrupo = `${g.materia?.grado} ${g.materia?.grupo}`.toLowerCase(); // Asumiendo que materia tiene grupo o está en g
    return nombreMateria.includes(term) || gradoGrupo.includes(term);
  });

  // 3. Buscar ESTUDIANTES (dentro de esos grupos)
  // Recolectamos todos los UIDs de estudiantes de mis grupos
  const studentUids = new Set<string>();
  grupos.forEach((g) => {
    if (g.estudianteUids && Array.isArray(g.estudianteUids)) {
      g.estudianteUids.forEach((uid: string) => studentUids.add(uid));
    }
  });

  const estudiantesEncontrados: any[] = [];

  if (studentUids.size > 0) {
    // Consultamos los perfiles (Optimización: Podríamos filtrar en BD si son pocos,
    // pero aquí traemos los perfiles y filtramos por nombre)
    const promesas = Array.from(studentUids).map((uid) =>
      obtenerPerfilUsuario(uid),
    );
    const perfiles = await Promise.all(promesas);

    // Filtramos por nombre o apellido
    perfiles.forEach((p) => {
      if (p && p.persona) {
        const nombreCompleto =
          `${p.persona.nombre} ${p.persona.apellidos}`.toLowerCase();
        const matricula = (p.rol as any)?.matricula?.toLowerCase() || "";

        if (nombreCompleto.includes(term) || matricula.includes(term)) {
          estudiantesEncontrados.push({
            uid: p.persona.uid,
            nombre: p.persona.nombre,
            apellidos: p.persona.apellidos,
            fotoUrl: p.persona.fotoUrl,
            matricula: matricula,
          });
        }
      }
    });
  }

  return {
    grupos: gruposEncontrados.map((g) => ({
      id: g.id,
      materia: g.materia?.nombre,
      grado: g.materia?.grado,
      ciclo: g.cicloEscolar,
    })),
    estudiantes: estudiantesEncontrados,
  };
};

/**
 * (MODIFICADO) Guarda calificaciones. AHORA VERIFICA SI EL ACTA ESTÁ CERRADA.
 */
export const guardarCalificacionesMasivas = async (
  docenteUid: string,
  grupoId: string,
  evaluacionId: string,
  listaCalificaciones: {
    estudianteUid: string;
    valor: number;
    observaciones?: string;
  }[],
): Promise<void> => {
  await verificarPropiedadGrupo(docenteUid, grupoId);

  // Verificamos si ya existe el acta y si está cerrada
  const actaDoc = await actasRef.doc(evaluacionId).get();

  if (actaDoc.exists) {
    const acta = actaDoc.data() as ActaEvaluacion;
    if (acta.estatus === "CERRADA") {
      throw new Error(
        "CANDADO: Esta acta ya fue cerrada y enviada. No se pueden realizar modificaciones.",
      );
    }
  }

  // Validaciones estándar
  const evalRef = gruposRef
    .doc(grupoId)
    .collection("evaluaciones")
    .doc(evaluacionId);
  const evalDoc = await evalRef.get();
  if (!evalDoc.exists) throw new Error("Evaluación no encontrada.");
  const datosEvaluacion = evalDoc.data() as Evaluacion;
  await verificarPeriodoAbierto(datosEvaluacion.periodoId);

  const mapaCalificaciones: Record<string, any> = {};
  listaCalificaciones.forEach((item) => {
      actualizarMetricasEstudiante(item.estudianteUid);

    mapaCalificaciones[item.estudianteUid] = {
      valor: item.valor,
      observaciones: item.observaciones || "",
      fechaCaptura: new Date(),
    };
  });

  await actasRef.doc(evaluacionId).set(
    {
      id: evaluacionId,
      grupoId: grupoId,
      docenteUid: docenteUid,
      periodoId: datosEvaluacion.periodoId,
      fechaUltimaModificacion: new Date(),
      estatus: "ABIERTA", // Por defecto se mantiene abierta al guardar cambios parciales
      calificaciones: mapaCalificaciones,
    },
    { merge: true },
  ); // Merge es vital para no sobrescribir el estatus si ya estaba


  await registrarLog(docenteUid, "GUARDAR_CALIFICACIONES", {
    grupoId,
    evaluacionId,
  });
};

/**
 * (NUEVO) Cierra el acta definitivamente.
 */
export const cerrarActaEvaluacion = async (
  docenteUid: string,
  evaluacionId: string,
) => {
  const actaRef = actasRef.doc(evaluacionId);
  const doc = await actaRef.get();

  if (!doc.exists)
    throw new Error("No hay calificaciones guardadas para cerrar.");

  const acta = doc.data() as ActaEvaluacion;
  if (acta.docenteUid !== docenteUid) throw new Error("No tienes permiso.");

  await actaRef.update({
    estatus: "CERRADA",
    fechaCierre: new Date(),
  });

  await registrarLog(docenteUid, "CERRAR_ACTA", { evaluacionId });
};

/**
 * Obtiene el acta completa de una evaluación.
 */
export const obtenerActaEvaluacion = async (
  evaluacionId: string,
): Promise<ActaEvaluacion | null> => {
  const doc = await actasRef.doc(evaluacionId).get();
  if (!doc.exists) return null;
  return doc.data() as ActaEvaluacion;
};

/**
 * (NUEVO) Calcula y obtiene los promedios finales de los alumnos de un grupo en un periodo específico.
 * Se usa para mostrar el "Promedio Anterior".
 */
export const obtenerPromediosPeriodo = async (
  grupoId: string,
  periodoId: string,
): Promise<Record<string, number>> => {
  // 1. Obtener las evaluaciones (rubros) del periodo solicitado
  const evaluacionesSnap = await gruposRef
    .doc(grupoId)
    .collection("evaluaciones")
    .where("periodoId", "==", periodoId)
    .get();

  if (evaluacionesSnap.empty) return {};

  const evaluaciones = evaluacionesSnap.docs.map(
    (doc) => doc.data() as Evaluacion,
  );
  const actasIds = evaluaciones.map((ev) => ev.id);

  if (actasIds.length === 0) return {};

  // 2. Obtener las actas de esas evaluaciones
  // Firestore permite usar 'in' con hasta 30 IDs, ideal para actas de un periodo
  const actasSnap = await actasRef
    .where(FieldPath.documentId(), "in", actasIds)
    .get();
  const actas = actasSnap.docs.map((doc) => doc.data() as ActaEvaluacion);

  // 3. Calcular los promedios sumando (calificacion * porcentaje / 100)
  const sumasPorAlumno: Record<string, number> = {};
  const promediosFinales: Record<string, number> = {};

  evaluaciones.forEach((ev) => {
    const acta = actas.find((a) => a.id === ev.id);
    if (acta && acta.calificaciones) {
      Object.keys(acta.calificaciones).forEach((uid) => {
        const nota = acta.calificaciones[uid]?.valor || 0;
        const valorPonderado = nota * ((ev.porcentaje || 0) / 100);

        if (!sumasPorAlumno[uid]) sumasPorAlumno[uid] = 0;
        sumasPorAlumno[uid] += valorPonderado;
      });
    }
  });

  // 4. Redondear a 1 decimal
  Object.keys(sumasPorAlumno).forEach((uid) => {
    const suma = sumasPorAlumno[uid] || 0; // <--- ESTO QUITA EL ERROR ROJO
    promediosFinales[uid] = Math.round(suma * 10) / 10;
  });

  return promediosFinales;
};

/**
 * CREAR SOLICITUD DE RATIFICACIÓN (TICKET)
 * El docente crea un ticket, no modifica la calificación directamente.
 */
export const crearSolicitudRatificacion = async (
  docenteUid: string,
  solicitud: SolicitudRatificacion,
): Promise<string> => {
  // Retorna el ID del ticket

  // 1. Referencia a la colección (Usando db de Admin SDK, no this.firestore)
  const solicitudesRef = db.collection("solicitudes_cambio");

  // 2. Preparamos el objeto con metadatos del sistema
  const nuevaSolicitud = {
    ...solicitud,
    docenteUid: docenteUid, // Forzamos el UID del token por seguridad
    estatus: "PENDIENTE", // PENDIENTE | APROBADA | RECHAZADA
    fechaSolicitud: new Date().toISOString(), // Formato estándar ISO
    fechaResolucion: null,
    resolucionPor: null,
  };

  // 3. Guardar en Firestore
  const docRef = await solicitudesRef.add(nuevaSolicitud);

  // 4. AUDITORÍA (LOG)
  // Registramos que el docente pidió un cambio
  await registrarLog(docenteUid, "CREAR_SOLICITUD_RATIFICACION", {
    ticketId: docRef.id,
    alumno: solicitud.uidAlumno,
    materia: solicitud.idMateria,
    de: solicitud.calificacionAnterior,
    a: solicitud.calificacionNueva,
  });

  return docRef.id;
};

/**
 * 1. OBTENER MIS SOLICITUDES DE CORRECCIÓN (TICKETS)
 */
export const consultarMisSolicitudes = async (
  docenteUid: string,
): Promise<any[]> => {
  const snapshot = await db
    .collection("solicitudes_cambio")
    .where("docenteUid", "==", docenteUid)
    .orderBy("fechaSolicitud", "desc")
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      alumno: data.nombreAlumno || "Desconocido",
      materia: data.nombreMateria || "Materia",
      estatus: data.estatus,
      fecha: data.fechaSolicitud,
      motivoRechazo: data.notaResolucion || "", // Si fue rechazada, aquí viene el motivo
    };
  });
};

/**
 * 2. OBTENER AVISOS INSTITUCIONALES
 */
export const consultarAvisosInstitucionales = async (): Promise<any[]> => {
  const snapshot = await publicacionesRef
    .where("estatus", "==", "PUBLICADO")
    //.where('tipo', '==', 'NOTICIA') // Opcional si quieres filtrar solo noticias
    .orderBy("fechaPublicacion", "desc")
    .limit(5)
    .get();

  if (snapshot.empty) return [];

  // Mapeamos para que coincida con lo que espera tu frontend
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      titulo: data.titulo,
      mensaje: data.contenido,
      // Asumimos que Control Escolar o Dirección las publica
      autor: "Dirección Académica",
      fecha: data.fechaPublicacion,
    };
  });
};

/**
 * 3. OBTENER ALERTAS TEMPRANAS DEL DOCENTE
 * Busca alertas de los alumnos que están en los grupos del docente actual.
 */
export const consultarAlertasTempranas = async (
  docenteUid: string,
): Promise<any[]> => {
  // 1. Obtener los grupos del docente para saber qué materias imparte
  const grupos = await consultarGruposDocente(docenteUid);
  const materiaIds = [...new Set(grupos.map((g: any) => g.materiaId))];

  if (materiaIds.length === 0) return [];

  // 2. Buscar alertas que correspondan a esas materias
  // (Firestore 'in' permite hasta 10-30 elementos, para un docente es suficiente)
  const snapshot = await alertasRef
    .where("materiaId", "in", materiaIds.slice(0, 10))
    .orderBy("fecha", "desc")
    .limit(10)
    .get();

  if (snapshot.empty) return [];

  // 3. Unir los datos con el nombre del alumno y materia
  const promesas = snapshot.docs.map(async (doc) => {
    const alerta = doc.data();
    const perfil = await obtenerPerfilUsuario(alerta.estudianteUid);
    const materiaObj = grupos.find(
      (g: any) => g.materiaId === alerta.materiaId,
    );

    return {
      id: doc.id,
      alumno: perfil
        ? `${perfil.persona.nombre} ${perfil.persona.apellidos}`
        : "Desconocido",
      materia: materiaObj ? materiaObj.materia?.nombre : "Materia",
      motivo: alerta.mensaje,
      nivel: alerta.mensaje.toLowerCase().includes("reprobación")
        ? "ALTO"
        : "MEDIO",
    };
  });

  return Promise.all(promesas);
};


/**
 * Busca docentes por nombre, apellidos o RFC.
 */
export const buscarDocentesGlobal = async (termino: string): Promise<PerfilUsuarioDTO[]> => {
  const term = termino.toLowerCase().trim();
  if (!term) return [];
  
  // Reutilizamos tu función que ya une Persona + Rol
  const todos = await consultarTodosDocentes();
  
  return todos.filter(d => 
    d.persona.nombre.toLowerCase().includes(term) ||
    d.persona.apellidos.toLowerCase().includes(term) ||
    (d.rol as any)?.RFC?.toLowerCase().includes(term)
  );
};