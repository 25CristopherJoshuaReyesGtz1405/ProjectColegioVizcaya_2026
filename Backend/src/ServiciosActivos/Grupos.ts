/**
 * ====================================================================
 * PASO 3: SERVICIO DE GRUPOS
 * ====================================================================
 *
 * Contiene la lógica de negocio (CRUD) para que un Administrador
 * (Control Escolar) gestione los grupos (clases).
 * Traduce la lógica del 'groups.ts' de referencia al nuevo modelo.
 */
import { auth, db } from '../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import { type Grupo, type Materia, type PerfilUsuarioDTO, type RolEmpleado } from '../ModelosAplicacion/ModelosAplicacion.model.js';
import { registrarLog } from './Auditoria.js';
import { obtenerPerfilUsuario } from './Usuarios.js'; // Importante para los "joins"

// Referencias a las colecciones
const gruposRef = db.collection('grupos');
const materiasRef = db.collection('materias');

/**
 * Crea un nuevo grupo (clase).
 * @param adminUid UID del admin que realiza la acción.
 * @param datosGrupo Datos del nuevo grupo.
 * @returns El grupo creado con su ID.
 */
export const crearGrupo = async (
  adminUid: string,
  datosGrupo: Omit<Grupo, 'id'>
): Promise<Grupo> => {
  
  // Validar que el docente exista y sea docente
  const perfilDocente = await obtenerPerfilUsuario(datosGrupo.empleadoUid);
  if (!perfilDocente || perfilDocente.tipoRol !== 'docente') {
    throw new Error('El UID de empleado no corresponde a un docente válido.');
  }
  
  // Validar que la materia exista
  const materiaDoc = await materiasRef.doc(datosGrupo.materiaId).get();
  if (!materiaDoc.exists) {
    throw new Error('La materiaId no existe.');
  }

  // 1. Añadir el documento
  const docRef = await gruposRef.add(datosGrupo);
  
  // 2. Preparar el objeto completo
  const nuevoGrupo: Grupo = {
    ...datosGrupo,
    id: docRef.id
  };
  
  // 3. Actualizar con su propio ID
  await docRef.update({ id: docRef.id });

  // 4. Registrar Log
  await registrarLog(adminUid, 'CREAR_GRUPO', {
    grupoId: nuevoGrupo.id,
    ciclo: nuevoGrupo.cicloEscolar,
    materiaId: nuevoGrupo.materiaId,
    docenteUid: nuevoGrupo.empleadoUid
  });

  return nuevoGrupo;
};

/**
 * Consulta un grupo por su ID.
 * (Traduce 'consultarPorId' del 'groups.ts' de referencia)
 * @param id El ID del documento del grupo.
 * @returns El grupo o null.
 */
export const consultarGrupoPorId = async (
  id: string
): Promise<Grupo | null> => {
  const docSnap = await gruposRef.doc(id).get();
  if (!docSnap.exists) return null;
  return docSnap.data() as Grupo;
};

/**
 * Consulta todos los grupos y "une" la información
 * de la Materia y el Perfil (Persona+Rol) del Docente.
 * (Traduce 'consultarTodosConDetalles' del 'groups.ts' de referencia)
 * @returns Un arreglo de grupos con objetos anidados.
 */
export const consultarTodosGruposConDetalles = async (): Promise<any[]> => {
  const gruposSnap = await gruposRef.get();
  if (gruposSnap.empty) return [];
  
  const grupos = gruposSnap.docs.map(doc => doc.data() as Grupo);

  // 1. Recolectar IDs únicos (evita lecturas duplicadas)
  const materiaIds = [...new Set(grupos.map(g => g.materiaId).filter(Boolean))];
  const docenteUids = [...new Set(grupos.map(g => g.empleadoUid).filter(Boolean))];

  // 2. Consultar todos los datos necesarios en paralelo
  const [materiasSnap, promesasPerfilDocente] = await Promise.all([
    (materiaIds.length > 0) ? materiasRef.where(FieldPath.documentId(), 'in', materiaIds).get() : null,
    docenteUids.map(uid => obtenerPerfilUsuario(uid)) // Reutilizamos el servicio
  ]);
  
  const perfilesDocentes = await Promise.all(promesasPerfilDocente);

  // 3. Crear Mapas para un "join" rápido en memoria
  const materiasMap = new Map<string, Materia>();
  if (materiasSnap) {
    materiasSnap.docs.forEach(doc => materiasMap.set(doc.id, doc.data() as Materia));
  }
  
  const docentesMap = new Map<string, PerfilUsuarioDTO | null>();
  perfilesDocentes.forEach(perfil => {
    if (perfil) docentesMap.set(perfil.persona.uid, perfil);
  });

  // 4. Combinar los datos
  return grupos.map(grupo => ({
    ...grupo,
    materia: materiasMap.get(grupo.materiaId) || null,
    docente: docentesMap.get(grupo.empleadoUid) || null // Objeto { persona: ..., rol: ... }
  }));
};

/**
 * Actualiza los campos principales de un grupo (ej. cambiar docente).
 * (Traduce 'actualizarGrupo' del 'groups.ts' de referencia)
 */
export const actualizarGrupo = async (
  adminUid: string,
  id: string,
  datos: Partial<Omit<Grupo, 'id' | 'estudianteUids'>>
): Promise<Grupo | null> => {
  
  const ref = gruposRef.doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error('El grupo no existe.');
  }

  await ref.update(datos);
  
  await registrarLog(adminUid, 'ACTUALIZAR_GRUPO', {
    grupoId: id,
    cambios: datos
  });

  return await consultarGrupoPorId(id);
};

// --- Gestión de Estudiantes en Grupos ---

/**
 * Agrega un estudiante a un grupo (RF 2.3).
 * (Traduce 'agregarAlumnoAGrupo' del 'groups.ts' de referencia)
 */
export const agregarEstudianteAGrupo = async (
  adminUid: string,
  grupoId: string,
  estudianteUid: string
): Promise<Grupo | null> => {
  
  // TODO: Validar que el estudianteUid exista y sea un estudiante.
  
  const ref = gruposRef.doc(grupoId);
  await ref.update({
    estudianteUids: FieldValue.arrayUnion(estudianteUid)
  });

  await registrarLog(adminUid, 'ASIGNAR_ESTUDIANTE_GRUPO', {
    grupoId,
    estudianteUid
  });

  return await consultarGrupoPorId(grupoId);
};

/**
 * Quita a un estudiante de un grupo (RF 2.3).
 * (Traduce 'quitarAlumnoDeGrupo' del 'groups.ts' de referencia)
 */
export const quitarEstudianteDeGrupo = async (
  adminUid: string,
  grupoId: string,
  estudianteUid: string
): Promise<Grupo | null> => {
  
  const ref = gruposRef.doc(grupoId);
  await ref.update({
    estudianteUids: FieldValue.arrayRemove(estudianteUid)
  });

  await registrarLog(adminUid, 'QUITAR_ESTUDIANTE_GRUPO', {
    grupoId,
    estudianteUid
  });
  
  return await consultarGrupoPorId(grupoId);
};

/**
 * Obtiene la lista de perfiles completos de los
 * estudiantes inscritos en un grupo.
 * (Traduce 'obtenerAlumnosPorGrupo' del 'groups.ts' de referencia)
 */
export const obtenerAlumnosPorGrupo = async (
  grupoId: string
): Promise<(PerfilUsuarioDTO | null)[]> => {
  
  const grupo = await consultarGrupoPorId(grupoId);
  if (!grupo || !grupo.estudianteUids || grupo.estudianteUids.length === 0) {
    return [];
  }
  
  // Reutilizamos el servicio de usuarios para "unir" los datos
  const promesasPerfil = grupo.estudianteUids.map(uid => obtenerPerfilUsuario(uid));
  const perfiles = await Promise.all(promesasPerfil);
  
  // Filtramos solo los que son estudiantes
  return perfiles.filter(p => p && p.tipoRol === 'estudiante');
};



export const eliminarGrupo = async (
  adminUid: string,
  grupoId: string,
): Promise<Grupo | null> => {
  
  const ref = gruposRef.doc(grupoId).delete();
  await ref; 

  await registrarLog(adminUid, 'QUITAR_GRUPO', {
    grupoId,
    
  });
  
  return await consultarGrupoPorId(grupoId);
};