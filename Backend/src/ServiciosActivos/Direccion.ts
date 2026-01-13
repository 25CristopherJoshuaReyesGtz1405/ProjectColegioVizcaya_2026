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
