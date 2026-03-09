import { db } from '../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js';
import { registrarLog } from './../ServiciosActivos/Auditoria.js';

export interface SolicitudCambioDTO {
  docenteUid: string;
  docenteNombre: string;
  grupoId: string;
  materiaNombre: string;
  estudianteUid: string;
  estudianteNombre: string;
  evaluacionId: string; // ID del rubro
  nombreRubro: string;
  calificacionActual: number;
  calificacionNueva: number;
  motivo: string;
  tipoCausa: string;
}

/**
 * Registra una nueva solicitud.
 */
export const crearSolicitudCambio = async (datos: SolicitudCambioDTO): Promise<void> => {
  const solicitudRef = db.collection('solicitudes_cambio').doc();
  
  await solicitudRef.set({
    ...datos,
    id: solicitudRef.id,
    estatus: 'PENDIENTE',
    fechaSolicitud: new Date().toISOString(),
    fechaResolucion: null
  });

  await registrarLog(datos.docenteUid, 'CREAR_SOLICITUD_CAMBIO', {
    solicitudId: solicitudRef.id,
    alumno: datos.estudianteNombre,
    motivo: datos.tipoCausa
  });
};

/**
 * Obtiene solicitudes pendientes para la Directora.
 */
export const obtenerSolicitudesPendientes = async (): Promise<any[]> => {
  const snapshot = await db.collection('solicitudes_cambio')
    .where('estatus', '==', 'PENDIENTE')
    .orderBy('fechaSolicitud', 'desc')
    .get();
    
  return snapshot.docs.map(doc => doc.data());
};
