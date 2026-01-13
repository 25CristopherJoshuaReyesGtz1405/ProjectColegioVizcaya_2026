/**
 * ====================================================================
 * PASO 3: SERVICIO DE PERIODOS (ACTUALIZADO)
 * ====================================================================
 */
import { db } from '../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js';
import {
  type Periodo
} from '../ModelosAplicacion/ModelosAplicacion.model.js';
import { registrarLog } from './Auditoria.js';
import { Timestamp } from 'firebase-admin/firestore';

// Referencias a colecciones
const periodosRef = db.collection('periodos');
const actasRef = db.collection('actas_evaluacion'); // <--- NUEVA REFERENCIA

/**
 * Función interna para convertir Timestamps de Firestore a objetos Date.
 */
const convertirTimestamps = (data: any): Periodo => {
  if (data.fechaInicio instanceof Timestamp) {
    data.fechaInicio = data.fechaInicio.toDate();
  }
  if (data.fechaFin instanceof Timestamp) {
    data.fechaFin = data.fechaFin.toDate();
  }
  return data as Periodo;
}

/**
 * (NUEVO) Función auxiliar para abrir/cerrar actas masivamente
 * cuando el periodo cambia de estatus.
 */
const sincronizarActasConPeriodo = async (periodoId: string, nuevoEstatusPeriodo: string) => {
  // Mapeo de estatus: Periodo -> Acta
  // Periodo usa: 'ABIERTO' / 'CERRADO'
  // Acta usa: 'ABIERTO' / 'CERRADA' (Según tu lógica en Docentes.ts)
  
  let estatusActa = '';
  
  if (nuevoEstatusPeriodo === 'ABIERTO') {
    estatusActa = 'ABIERTO'; // Reactiva las actas para edición
  } else if (nuevoEstatusPeriodo === 'CERRADO') {
    estatusActa = 'CERRADA'; // Bloquea las actas inmediatamente
  } else {
    return; // Si es otro estatus, no hacemos nada
  }

  // Buscar todas las actas de este periodo
  const snapshot = await actasRef.where('periodoId', '==', periodoId).get();
  
  if (snapshot.empty) return;

  // Actualización por lotes (Batch) para eficiencia y seguridad
  const batch = db.batch();
  
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { 
      estatus: estatusActa,
      fechaUltimaModificacion: new Date() // Opcional: actualizar fecha
    });
  });

  await batch.commit();
  console.log(`>> Sincronización completa: ${snapshot.size} actas pasaron a estado ${estatusActa}.`);
};

/**
 * Crea un nuevo periodo de evaluación.
 */
export const crearPeriodo = async (
  adminUid: string,
  datosPeriodo: Omit<Periodo, 'id'>
): Promise<Periodo> => {
  
  const fechaInicio = new Date(datosPeriodo.fechaInicio);
  const fechaFin = new Date(datosPeriodo.fechaFin);

  const docRef = periodosRef.doc();
  const nuevoPeriodo: Periodo = {
    ...datosPeriodo,
    id: docRef.id,
    fechaInicio: fechaInicio,
    fechaFin: fechaFin,
    estatus: datosPeriodo.estatus || 'CERRADO'
  };
  
  await docRef.set(nuevoPeriodo);

  await registrarLog(adminUid, 'CREAR_PERIODO', {
    periodoId: nuevoPeriodo.id,
    nombre: nuevoPeriodo.nombre,
    fechas: `${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`
  });

  return nuevoPeriodo;
};

export const consultarTodosPeriodos = async (): Promise<Periodo[]> => {
  const snapshot = await periodosRef.orderBy('fechaInicio', 'asc').get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => convertirTimestamps(doc.data()));
};

export const consultarPeriodoPorId = async (id: string): Promise<Periodo | null> => {
  const docSnap = await periodosRef.doc(id).get();
  if (!docSnap.exists) return null;
  return convertirTimestamps(docSnap.data());
};

/**
 * Actualiza los datos de un periodo.
 * (MODIFICADO) Ahora detecta cambios de estatus y dispara la sincronización de actas.
 */
export const actualizarPeriodo = async (
  adminUid: string,
  id: string,
  datos: Partial<Omit<Periodo, 'id'>>
): Promise<Periodo | null> => {
  
  const ref = periodosRef.doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error('El periodo no existe.');
  }

  // Conversión de fechas
  if (datos.fechaInicio) datos.fechaInicio = new Date(datos.fechaInicio);
  if (datos.fechaFin) datos.fechaFin = new Date(datos.fechaFin);

  // 1. Actualizar el Periodo
  await ref.update(datos);

  // 2. (NUEVO) Verificar si cambió el estatus para sincronizar actas
  if (datos.estatus) {
    // Ejecutamos la sincronización en segundo plano (await opcional si quieres bloquear)
    await sincronizarActasConPeriodo(id, datos.estatus);
  }

  // 3. Registrar Log
  await registrarLog(adminUid, 'ACTUALIZAR_PERIODO', {
    periodoId: id,
    cambios: datos
  });

  return await consultarPeriodoPorId(id);
};

export const eliminarPeriodo = async (adminUid: string, id: string): Promise<void> => {
  const ref = periodosRef.doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('El periodo no existe.');
  
  const periodoEliminado = doc.data() as Periodo;
  await ref.delete();

  await registrarLog(adminUid, 'ELIMINAR_PERIODO', {
    periodoId: id,
    nombre: periodoEliminado.nombre
  });     
};