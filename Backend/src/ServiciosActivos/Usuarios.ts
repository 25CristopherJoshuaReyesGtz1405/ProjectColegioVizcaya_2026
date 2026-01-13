/**
 * ====================================================================
 * PASO 3: SERVICIO DE USUARIOS (Corregido)
 * ====================================================================
 *
 * ¡CORREGIDO!
 * 1. Se corrigieron los errores de sintaxis (ej. `let nuevoUsuarioUid: string | null = null;`).
 * 2. Se ajustaron las importaciones a tu estructura de carpetas.
 */
import {
  auth,
  db,
} from "../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js";
import {
  type Persona,
  type RolEstudiante,
  type RolEmpleado,
  type PerfilUsuarioDTO,
} from "../ModelosAplicacion/ModelosAplicacion.model.js";

// Importa nuestro otro servicio
import { registrarLog } from "./Auditoria.js";

// Referencias a las colecciones de Firestore
const personasRef = db.collection("personas");
const estudiantesRef = db.collection("estudiantes");
const empleadosRef = db.collection("administrativos");

/**
 * Crea un nuevo usuario (Persona, Rol y Auth) de forma atómica.
 */
export const crearUsuario = async (
  email: string,
  password: string,
  datosPersona: Omit<Persona, "uid">,
  datosRol: Omit<RolEstudiante, "uid"> | Omit<RolEmpleado, "uid">,
  tipoRol: "estudiante" | "docente" | "directora" | "control_escolar",
  adminUid: string
): Promise<string> => 
  {
  let nuevoUsuarioUid: string | null = null;

  try {
    // 1. Crear el usuario en Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: `${datosPersona.nombre} ${datosPersona.apellidos}`,
    });

    nuevoUsuarioUid = userRecord.uid;

    // 2. Preparar la transacción de Firestore (Batch)
    const batch = db.batch();

    // 3. Preparar documento de Persona
    const personaDocRef = personasRef.doc(nuevoUsuarioUid);
    const nuevaPersona: Persona = {
      ...datosPersona,
      uid: nuevoUsuarioUid, // El UID de Auth es el ID del documento
    };
    batch.set(personaDocRef, nuevaPersona);

    // 4. Preparar documento de Rol (Empleado o Estudiante)
    if (tipoRol === "estudiante") {
      const rolDocRef = estudiantesRef.doc(nuevoUsuarioUid);
      const nuevoRol: RolEstudiante = {
        ...(datosRol as Omit<RolEstudiante, "uid">),
        uid: nuevoUsuarioUid,
      };
      batch.set(rolDocRef, nuevoRol);
    } else {
      // Es Docente, Directora o Control Escolar
      const rolDocRef = empleadosRef.doc(nuevoUsuarioUid);
      const nuevoRol: RolEmpleado = {
        ...(datosRol as Omit<RolEmpleado, "uid">),
        uid: nuevoUsuarioUid,
        rol: tipoRol, // Asigna el rol específico
      };
      batch.set(rolDocRef, nuevoRol);
    }

    // 5. Comprometer (ejecutar) la transacción de Firestore
    await batch.commit();

    // 6. Registrar en el Log (RNF 2.4)
    await registrarLog(adminUid, "CREAR_USUARIO", 
    {
      uidCreado: nuevoUsuarioUid,
      email: email,
      rol: tipoRol,
    });

    // 7. Devolver el UID del usuario creado
    return nuevoUsuarioUid;
  } catch (error: any) {
    if (nuevoUsuarioUid) 
    {
      console.warn(
        `ROLLBACK: Error en Firestore. Borrando usuario de Auth ${nuevoUsuarioUid}`
      );
      await auth.deleteUser(nuevoUsuarioUid);
    }
    console.error("Error al crear usuario (con rollback):", error);
    throw new Error(`Error al crear usuario: ${error.message}`);
  }
};

/**
 * Obtiene el perfil completo (Persona + Rol) de un usuario.
 */
export const obtenerPerfilUsuario = async (
  uid: string
): Promise<PerfilUsuarioDTO | null> => {
  try {
    // 1. Iniciar todas las lecturas en paralelo (mucho más rápido)
    const [personaSnap, estudianteSnap, empleadoSnap] = await Promise.all([
      personasRef.doc(uid).get(),
      estudiantesRef.doc(uid).get(),
      empleadosRef.doc(uid).get(),
    ]);

    // 2. Verificar que la Persona exista
    if (!personaSnap.exists) {
      console.warn(`Usuario no encontrado en 'personas' con UID: ${uid}`);
      return null;
    }
    const persona = personaSnap.data() as Persona;

    // 3. Determinar y adjuntar el Rol
    let rol: RolEstudiante | RolEmpleado | null = null;
    let tipoRol: PerfilUsuarioDTO["tipoRol"] = null;

    if (estudianteSnap.exists) {
      rol = estudianteSnap.data() as RolEstudiante;
      tipoRol = "estudiante";
    } else if (empleadoSnap.exists) {
      rol = empleadoSnap.data() as RolEmpleado;
      tipoRol = rol.rol; // 'docente', 'directora', o 'control_escolar'
    }

    // 4. Construir y devolver el DTO
    return {
      persona: persona,
      rol: rol,
      tipoRol: tipoRol,
    };
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    throw new Error("Error al consultar datos del usuario.");
  }
};

/**
 * Da de baja (lógica) a un usuario.
 */
export const darDeBajaUsuario = async (
  uid: string,
  adminUid: string
): Promise<boolean> => {
  const batch = db.batch();
  let tipoRol: string = "";

  // 1. Poner estatus 'BAJA' en Auth (deshabilita el login)
  await auth.updateUser(uid, { disabled: true });

  // 2. Poner estatus 'BAJA' en el Rol (para la lógica interna)
  const estudianteRef = estudiantesRef.doc(uid);
  const empleadoRef = empleadosRef.doc(uid);

  const estudianteSnap = await estudianteRef.get();
  const empleadoSnap = await empleadoRef.get();

  if (estudianteSnap.exists) {
    batch.update(estudianteRef, { estatus: "BAJA" });
    tipoRol = "estudiante";
  } else if (empleadoSnap.exists) {
    batch.update(empleadoRef, { estatus: "BAJA" });
    tipoRol = (empleadoSnap.data() as RolEmpleado).rol;
  } else {
    throw new Error("Usuario no tiene rol en la base de datos.");
  }

  // 3. Ejecutar el batch
  await batch.commit();

  // 4. Registrar en el log
  await registrarLog(adminUid, "BAJA_USUARIO", { uidBaja: uid, rol: tipoRol });

  return true;
};
