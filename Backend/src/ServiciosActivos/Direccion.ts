/**
 * ====================================================================
 * PASO 3: SERVICIO DE DIRECCIÓN
 * ====================================================================
 * Implementa RF 4.1 (Checklist Planeaciones) y RF 4.4 (Agenda).
 *
 * Contiene la lógica de académica para las tareas específicas de la Directora (supervisión y gestión personal).
 */
import { db } from "../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js";
import { type AgendaActividad, type Planeacion } from "../ModelosAplicacion/ModelosAplicacion.model.js";
import { registrarLog } from "./Auditoria.js";
import { Timestamp } from "firebase-admin/firestore";

// Referencias a la Base Datos...
const planeacionesRef = db.collection("planeaciones");
const agendaRef = db.collection("agenda_actividades");

interface DatosRectificacion {
  evaluacionId: string;
  estudianteUid: string;
  nuevaCalificacion: number;
  observaciones?: string;
  motivoCambio: string;
  solicitudId?: string; // NUEVO: Para vincular con el ticket
}

/**
 * RECTIFICACIÓN DE ACTAS (DIRECTORA/ADMIN)
 * Permite cambiar una calificación fuera de tiempo y cerrar la solicitud asociada.
 */
export const rectificarCalificacion = async (
  uidDirectora: string,
  datos: DatosRectificacion
): Promise<void> => {

  const batch = db.batch();

  // 1. Obtener referencia al Acta
  const actaRef = db.collection('actas_evaluacion').doc(datos.evaluacionId);
  const actaSnap = await actaRef.get();

  if (!actaSnap.exists) {
    throw new Error('El acta de evaluación no existe.');
  }

  // 2. Actualizar la calificación en el Acta
  // Usamos notación de punto para actualizar solo el campo del estudiante
  const campoCalificacion = `calificaciones.${datos.estudianteUid}`;
  
  batch.update(actaRef, {
    [campoCalificacion]: {
      valor: datos.nuevaCalificacion,
      observaciones: datos.observaciones || 'Rectificación Administrativa',
      modificadoPorAdmin: true,
      fechaModificacionAdmin: new Date().toISOString(),
      motivoAdmin: datos.motivoCambio,
      aprobadoPor: uidDirectora
    }
  });

  // 3. CERRAR LA SOLICITUD (Si existe)
  if (datos.solicitudId) {
    const solicitudRef = db.collection('solicitudes_cambio').doc(datos.solicitudId);
    batch.update(solicitudRef, {
      estatus: 'APROBADA',
      fechaResolucion: new Date().toISOString(),
      resolucionPor: uidDirectora,
      notaResolucion: 'Cambio aplicado automáticamente desde Panel de Dirección.'
    });
  }

  // 4. Ejecutar cambios
  await batch.commit();

  // 5. Auditoría
  await registrarLog(uidDirectora, 'RECTIFICACION_ACTA', {
    evaluacionId: datos.evaluacionId,
    estudianteUid: datos.estudianteUid,
    nuevaNota: datos.nuevaCalificacion,
    origen: datos.solicitudId ? `SOLICITUD_${datos.solicitudId}` : 'DIRECTA'
  });
};

/**
 * Consulta todas las solicitudes pendientes de aprobar/rechazar.
 */
export const consultarSolicitudesPendientes = async (): Promise<any[]> => {
  const snapshot = await db.collection('solicitudes_cambio')
    .where('estatus', '==', 'PENDIENTE')
    .orderBy('fechaSolicitud', 'desc') // Las más recientes primero
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/**
 * RECHAZAR SOLICITUD
 * Solo actualiza el estatus del ticket y deja un log. No toca calificaciones.
 */
export const rechazarSolicitudCambio = async (
  uidDirectora: string, 
  ticketId: string, 
  motivoRechazo: string
): Promise<void> => {
  
  const ticketRef = db.collection('solicitudes_cambio').doc(ticketId);
  const doc = await ticketRef.get();

  if (!doc.exists) throw new Error('La solicitud no existe.');

  // Actualizamos el ticket
  await ticketRef.update({
    estatus: 'RECHAZADA',
    fechaResolucion: new Date().toISOString(),
    resolucionPor: uidDirectora,
    notaResolucion: motivoRechazo
  });

  // AUDITORÍA (LOG)
  await registrarLog(uidDirectora, 'RECHAZAR_SOLICITUD_RATIFICACION', {
    ticketId,
    motivo: motivoRechazo
  });
};

// --- 1. Gestión de Planeaciones (RF 4.1) ---

//  * Consulta todas las planeaciones para el checklist.
export const consultarEstadoPlaneaciones = async (): Promise<Planeacion[]> => 
{
  const snapshot = await planeacionesRef.orderBy("fechaEntrega", "desc").get();

  if (snapshot.empty) return [];
  return snapshot.docs.map((doc) => doc.data() as Planeacion);
};

//  * Permite a la Directora aprobar o rechazar una planeación.
export const revisarPlaneacion = async (directorUid: string, planeacionId: string, estatus: "REVISADA" | "APROBADA", comentarios: string): Promise<Planeacion | null> => 
{
  const ref = planeacionesRef.doc(planeacionId);
  const doc = await ref.get();
  if (!doc.exists) 
  {
    throw new Error("La planeación no existe.");
  }

  const datosUpdate = 
  {
    estatus: estatus,
    comentariosRevision: comentarios,
  };

  await ref.update(datosUpdate);

  await registrarLog(directorUid, "REVISAR_PLANEACION", 
  {
    planeacionId,
    estatus,
    comentarios,
  });

  return (await ref.get()).data() as Planeacion;
};

// --- 2. Gestión de Agenda (RF 4.4) ---

//  * Crea una nueva actividad en la agenda de la Directora.
export const crearActividadAgenda = async (datosActividad: Omit<AgendaActividad, "id" | "directorUid" | "estatus">): Promise<AgendaActividad> =>
{
  const ref = agendaRef.doc();
  const nuevaActividad: AgendaActividad = 
  {
    ...datosActividad,
    id: ref.id,
    directorUid: "null",
    estatus: "PENDIENTE",
    fecha: new Date(datosActividad.fecha), 
  };

  await ref.set(nuevaActividad);
  console.log("Asignando a la agenda");
  
  return nuevaActividad;
};

//  * Consulta la agenda de la Directora para un día o rango.
export const consultarAgenda = async (fechaInicio: Date, fechaFin?: Date): Promise<AgendaActividad[]> => 
{
  let q = agendaRef.where("fecha", ">=", fechaInicio);

  if (fechaFin) 
  {
    q = q.where("fecha", "<=", fechaFin);
  }

  const snapshot = await q.orderBy("fecha", "asc").get();
  if (snapshot.empty) return [];
  return snapshot.docs.map((doc) => doc.data() as AgendaActividad);
};

//  * Actualiza una actividad de la agenda (ej. marcar como completada).
export const actualizarActividadAgenda = async (directorUid: string, id: string, datos: Partial<Omit<AgendaActividad, "id" | "directorUid">>): Promise<AgendaActividad | null> =>
{
  const ref = agendaRef.doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.directorUid !== directorUid) 
  {
    throw new Error("Actividad no encontrada o no pertenece a la directora.");
  }

  await ref.update(datos);
  return (await ref.get()).data() as AgendaActividad;
};

//  * Elimina una actividad de la agenda.
export const eliminarActividadAgenda = async (id: string): Promise<void> => 
{
  const ref = agendaRef.doc(id);
  const doc = await ref.get();
  if (!doc.exists) 
  {
    throw new Error("Actividad no encontrada o no pertenece a la directora.");
  }

  await ref.delete();
};
