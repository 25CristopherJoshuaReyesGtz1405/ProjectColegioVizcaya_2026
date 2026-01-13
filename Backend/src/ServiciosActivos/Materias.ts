import { db } from '../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js';
import {
  type Materia
} from '../ModelosAplicacion/ModelosAplicacion.model.js';
import { registrarLog } from './Auditoria.js';

// Referencia a la colección de materias
const materiasRef = db.collection('materias');

/**
 * Crea una nueva materia en el catálogo.
 * @param adminUid UID del admin que realiza la acción (para auditoría).
 * @param datosMateria Los datos de la nueva materia.
 * @returns La materia creada con su nuevo ID.
 */ 
export const crearMateria = async (
  adminUid: string,
  datosMateria: Omit<Materia, 'id'>
): Promise<Materia> => {
  
  // 1. Añade el documento a Firestore (que genera un ID automático)
  const docRef = await materiasRef.add(datosMateria);

  // 2. Prepara el objeto 'Materia' completo
  const nuevaMateria: Materia = {
    ...datosMateria,
    id: docRef.id // Asigna el ID generado
  };

  // 3. Actualiza el documento para incluir su propio ID (buena práctica)
  await docRef.update({ id: docRef.id });

  // 4. Registrar en el Log (RNF 2.4)
  await registrarLog(adminUid, 'CREAR_MATERIA', {
    materiaId: nuevaMateria.id,
    nombre: nuevaMateria.nombre,
    grado: nuevaMateria.grado
  });

  return nuevaMateria;
};

/**
 * Consulta todas las materias del catálogo.
 * @returns Un arreglo con todas las materias, ordenadas por grado y nombre.
 */
export const consultarTodasMaterias = async (): Promise<Materia[]> => {
  const snapshot = await materiasRef
    .orderBy('grado', 'asc')
    .orderBy('nombre', 'asc')
    .get();
    
  if (snapshot.empty) return [];
  
  return snapshot.docs.map(doc => doc.data() as Materia);
};

/**
 * Consulta una materia específica por su ID.
 * @param id El ID del documento de la materia.
 * @returns La materia o null si no se encuentra.
 */
export const consultarMateriaPorId = async (
  id: string
): Promise<Materia | null> => {
  const docSnap = await materiasRef.doc(id).get();
  
  if (!docSnap.exists) {
    return null;
  }
  
  return docSnap.data() as Materia;
};

/**
 * Actualiza los datos de una materia existente.
 * @param adminUid UID del admin que realiza la acción.
 * @param id El ID de la materia a actualizar.
 * @param datos Los campos que se van a modificar.
 * @returns La materia actualizada.
 */
export const actualizarMateria = async (
  adminUid: string,
  id: string,
  datos: Partial<Omit<Materia, 'id'>>
): Promise<Materia | null> => {
  
  const ref = materiasRef.doc(id);

  // 1. Validar que la materia exista
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error('La materia no existe.');
  }

  // 2. Actualizar el documento
  await ref.update(datos);

  // 3. Registrar en el Log (RNF 2.4)
  await registrarLog(adminUid, 'ACTUALIZAR_MATERIA', {
    materiaId: id,
    cambios: datos // Registra solo los campos que cambiaron
  });

  // 4. Devolver el documento actualizado
  return await consultarMateriaPorId(id);
};

/**
 * Elimina una materia del catálogo.
 * (¡Precaución! Esta es una acción destructiva).
 * @param adminUid UID del admin que realiza la acción.
 * @param id El ID de la materia a eliminar.
 */
export const eliminarMateria = async (
  adminUid: string,
  id: string
): Promise<void> => {
  
  const ref = materiasRef.doc(id);

  // 1. Obtener los datos ANTES de borrar (para el log)
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error('La materia no existe.');
  }
  const materiaEliminada = doc.data() as Materia;

  // 2. Eliminar el documento
  await ref.delete();

  // 3. Registrar en el Log (RNF 2.4)
  await registrarLog(adminUid, 'ELIMINAR_MATERIA', {
    materiaId: id,
    nombre: materiaEliminada.nombre,
    grado: materiaEliminada.grado
  });
};       