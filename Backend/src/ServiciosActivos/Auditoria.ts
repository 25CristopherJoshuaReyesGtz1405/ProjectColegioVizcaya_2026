/**
 * ====================================================================
 * PASO 3: SERVICIO DE AUDITORÍA (LOGS)
 * ====================================================================
 * Implementa RNF 2.4 (Auditoría).
 *
 * Este servicio es un ejemplo de un servicio de "utilidad".
 * Su única responsabilidad es crear registros de LogActividad.
 */
import { db } from '../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js'; // Importa la BD
import type { LogActividad } from '../ModelosAplicacion/ModelosAplicacion.model.js';

const logsRef = db.collection('logActividad');

//  * Registra una nueva acción de auditoría en la base de datos.
export const registrarLog = async (usuarioUid: string, accion: string, detalles: any): Promise<string> => 
{
  try 
  {
    // 1. Define el objeto Log con la info
    const nuevoLog: Omit<LogActividad, 'id'> = 
    {
      fecha: new Date(), 
      usuarioUid: usuarioUid,
      accion: accion,
      detalles: detalles,
    }; 

    // 2. Añade el documento a Firestore
    const docRef = await logsRef.add(nuevoLog);

    // 3. Devuelve el ID del log creado
    return docRef.id;

  } 
  catch (error) 
  {
    console.error('Error al registrar log:', error);
    throw new Error('No se pudo registrar la actividad de auditoría.');
  }
};