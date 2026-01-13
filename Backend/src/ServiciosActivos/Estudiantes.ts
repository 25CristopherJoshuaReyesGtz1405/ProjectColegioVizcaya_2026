/**
 * ====================================================================
 * SERVICIO DE GESTIÓN DE ESTUDIANTES
 * ====================================================================
 * Contiene la lógica de negocio para que un Administrador consulte y gestione a los estudiantes.
 * 
 */
import { db } from "../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js";
import { type Persona, type RolEstudiante, type PerfilUsuarioDTO } from "../ModelosAplicacion/ModelosAplicacion.model.js";
import { registrarLog } from "./Auditoria.js";
import { crearUsuario, obtenerPerfilUsuario } from "./Usuarios.js"; 

//  * Impotaciones CVS...
import csv from "csv-parser"; 
import { Readable } from "stream"; 

const personasRef = db.collection("personas");
const estudiantesRef = db.collection("estudiantes");

//  * Consulta todos los estudiantes inactivos.
export const consultarTodosEstudiantesBaja = async (p0: string | undefined, p1: string | undefined): Promise<PerfilUsuarioDTO[]> => 
{
  // 1. Consultar los roles de estudiante
  const snapshotRoles = await estudiantesRef.where("estatus", "==", "BAJA").get();

  if (snapshotRoles.empty) return [];

  const uids = snapshotRoles.docs.map((doc) => doc.data().uid);

  // 2. Obtener los perfiles completos en paralelo. Esta es la forma más eficiente de "unir" los datos
  const promesasPerfil = uids.map((uid) => obtenerPerfilUsuario(uid));
  const perfiles = await Promise.all(promesasPerfil);

  // 3. Filtrar perfiles nulos (aunque no debería pasar)
  return perfiles.filter((p) => p !== null) as PerfilUsuarioDTO[];
};

//  * Consulta todos los estudiante activos. 
export const consultarTodosEstudiantes = async (p0: string | undefined, p1: string | undefined): Promise<PerfilUsuarioDTO[]> => 
{
  // 1. Consultar los roles de estudiante
  const snapshotRoles = await estudiantesRef
    .where("estatus", "==", "ACTIVO").get();

  if (snapshotRoles.empty) return [];

  const uids = snapshotRoles.docs.map((doc) => doc.data().uid);

  // 2. Obtener los perfiles completos en paralelo
  const promesasPerfil = uids.map((uid) => obtenerPerfilUsuario(uid));
  const perfiles = await Promise.all(promesasPerfil);

  // 3. Filtrar perfiles nulos (aunque no debería pasar)
  return perfiles.filter((p) => p !== null) as PerfilUsuarioDTO[];
};

//  * Consulta a un estudiante activo en específico, por su uid. 
export const consultarEstudiantePorUID = async (uid_recibido: string): Promise<PerfilUsuarioDTO | null | undefined> => 
{
  const snapshotRol = await estudiantesRef.where("uid", "==", uid_recibido).limit(1).get();

  if (snapshotRol.empty) return null;
  const primerDoc = snapshotRol.docs[0];

  if (!primerDoc) 
  {
    return null;
  }

  const uid = primerDoc.data().uid;
  return await obtenerPerfilUsuario(uid);
};

//  * Consulta a un estudiante activo en específico, por su matrícula.
export const consultarEstudiantePorMatricula = async (matricula: string): Promise<PerfilUsuarioDTO | null | undefined> => 
{
  const snapshotRol = await estudiantesRef.where("matricula", "==", matricula).limit(1).get();

  if (snapshotRol.empty) return null;
  const primerDoc = snapshotRol.docs[0];

  if (!primerDoc) 
  {
    return null;
  }

  const uid = primerDoc.data().uid;
  return await obtenerPerfilUsuario(uid);
};

//  * Actualiza los datos de una Persona y/o RolEstudiante.
export const actualizarEstudiante = async (uid: string, adminUid: string, datosPersona?: Partial<Omit<Persona, "uid">>, datosRol?: Partial<Omit<RolEstudiante, "uid">>): Promise<PerfilUsuarioDTO | null> =>
{
  const batch = db.batch();
  const cambios: any = {};

  // 1. Preparar actualización de Persona
  if (datosPersona && Object.keys(datosPersona).length > 0) 
  {
    const personaRef = personasRef.doc(uid);
    batch.update(personaRef, datosPersona);
    cambios.persona = datosPersona;
  }

  // 2. Preparar actualización de Rol
  if (datosRol && Object.keys(datosRol).length > 0)
  {
    const rolRef = estudiantesRef.doc(uid);
    batch.update(rolRef, datosRol);
    cambios.rol = datosRol;
  }

  if (Object.keys(cambios).length === 0) 
    {
    throw new Error("No se proporcionaron datos para actualizar.");
  }

  // 3. Ejecutar la transacción
  await batch.commit();

  // 4. Registrar auditoría
  await registrarLog(adminUid, "ACTUALIZAR_USUARIO", 
  {
    uidActualizado: uid,
    cambios,
  });

  // 5. Devolver el perfil actualizado
  return await obtenerPerfilUsuario(uid);
};

//  * Procesa un archivo CSV y crea estudiantes de forma masiva.
//    * Define la estructura esperada de cada fila del CSV. ¡El CSV DEBE tener estas columnas!
interface FilaCSVEstudiante 
{
  nombre: string;
  apellidos: string;
  curp: string;
  fechaNacimiento: string; 
  matricula: string;
  grado: string;
  grupo: string;
  email_contacto: string; 
  sexo: "HOMBRE" | "MUJER";
}

//  * Procesa un buffer de un archivo CSV para crear estudiantes masivamente.
 
export const crearEstudiantesMasivo = async (csvBuffer: Buffer, adminUid: string): Promise<{ total: number; exitosos: number; fallidos: number; errores: string[];}> => 
{
  const resultados: FilaCSVEstudiante[] = [];

  // 1. Parsear el CSV (convertir el buffer en un array de objetos)
  await new Promise<void>((resolve, reject) => 
  {
    Readable.from(csvBuffer).pipe(csv()).on("data", (data) => 
    {
      // 'data' es un objeto JS por cada fila del CSV
      resultados.push(data);
    }).on("end", resolve).on("error", reject);
  });

  if (resultados.length === 0) 
  {
    throw new Error("El archivo CSV está vacío o tiene un formato incorrecto.");
  }

  // 2. Preparar las promesas de creación para cada estudiante
  const promesasCreacion = resultados.map(async (fila) => 
  {
    try 
    {
      // 3. Validar Fila (Básico)
      if (!fila.nombre || !fila.matricula || !fila.curp) 
        {
        throw new Error(`Fila inválida, falta nombre, matrícula o curp.`);
      }

      // 4. Aplicar Reglas de Negocio (RF 1.1)
      const email = `${fila.matricula}@colegiovizcaya.edu.mx`;
      const password = fila.curp.substring(0, 10); 

      // 5. Preparar los objetos (Modelo Normalizado)
      const datosPersona: Omit<Persona, "uid"> = 
      {
        nombre: fila.nombre,
        apellidos: fila.apellidos,
        curp: fila.curp,
        email: fila.email_contacto || email, // Usa email de contacto o el de auth
        fechaNacimiento: new Date(fila.fechaNacimiento), // Convierte string a Date
        fotoUrl: "", // Sin foto por defecto
        sexo: fila.sexo,
      };

      const datosRol: Omit<RolEstudiante, "uid"> = 
      {
        matricula: fila.matricula,
        grado: parseInt(fila.grado, 10), // Convierte string a number
        grupo: fila.grupo,
        estatus: "ACTIVO",
      };

      // 6. Llamar al servicio de creación de usuario
      return await crearUsuario(email, password, datosPersona, datosRol, "estudiante", adminUid );
    } catch (error: any) 
    {
      return { error: error.message, fila: fila.matricula };
    }
  });

  // 7. Ejecutar TODAS las promesas en paralelo
  const resultadosBatch = await Promise.allSettled(promesasCreacion);

  // 8. Contar éxitos y fallos
  let exitosos = 0;
  const errores: string[] = [];
  resultadosBatch.forEach((res) => 
  {
    if (res.status === "fulfilled" && !(res.value as any).error) 
    {
      exitosos++;
    } 
    else if (res.status === "rejected") 
    {
      errores.push(`Error desconocido: ${(res.reason as any).message}`);
    } 
    else if ((res.value as any).error) 
    {
      const { error, fila } = res.value as any;
      errores.push(`Matrícula ${fila}: ${error}`);
    }
  });

  // 9. Registrar Log General
  await registrarLog(adminUid, "CARGA_MASIVA_ESTUDIANTES",
  {
    totalFilas: resultados.length,
    exitosos: exitosos,
    fallidos: errores.length,
    errores: errores.slice(0, 5), // Guardar solo los primeros 5 errores
  });

  // 10. Devolver el resumen
  return {
    total: resultados.length,
    exitosos: exitosos,
    fallidos: errores.length,
    errores: errores,
  };
};
