/**
 * ====================================================================
 * SERVICIO DE GESTIÓN DE PADRES (TUTORES)
 * ====================================================================
 * Contiene la lógica de negocio para que un Tutor consulte a sus hijos.
 * Incluye validaciones de seguridad y registro de auditoría.
 */
import { db } from "../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js";
import { type RolTutor } from "../ModelosAplicacion/ModelosAplicacion.model.js";
import { obtenerPerfilUsuario } from "./Usuarios.js";
import { obtenerBoletaActual } from "./ReportesBoletas.js";
import { registrarLog } from "./Auditoria.js";

// Referencia a la colección de roles de tutor
const tutoresRef = db.collection("roles_tutor");

/**
 * Consulta el Dashboard del Padre: Lista de hijos con su resumen académico.
 * @param tutorUid UID del usuario logueado (Padre/Tutor)
 */
export const consultarHijosDelTutor = async (tutorUid: string) => {
  try {
    // 1. Obtener el Rol del Tutor para ver a quién tiene permiso de ver
    const tutorDoc = await tutoresRef.doc(tutorUid).get();
    
    if (!tutorDoc.exists) {
      // Registro de intento fallido de seguridad
      throw new Error("El usuario no tiene un perfil de Tutor activo.");
    }

    const datosTutor = tutorDoc.data() as RolTutor;

    // Validación de estatus administrativo
    if (datosTutor.estatus !== 'ACTIVO') {
      throw new Error("Su cuenta de tutor no está activa. Contacte a la administración.");
    }

    if (!datosTutor.estudiantesUids || datosTutor.estudiantesUids.length === 0) {
      // Log informativo: Tutor sin hijos asignados
      await registrarLog(tutorUid, 'CONSULTA_DASHBOARD_VACIO', { mensaje: 'Sin estudiantes vinculados' });
      return []; 
    }

    // 2. Iterar sobre los hijos vinculados (Parallel Fetching)
    const promesasHijos = datosTutor.estudiantesUids.map(async (hijoUid) => {
      try {
        // A. Obtener datos personales (Foto, Nombre, Grado)
        const perfilHijo = await obtenerPerfilUsuario(hijoUid);
        
        if (!perfilHijo) return null;

        // B. Obtener Boleta Actual (Resumen de calificaciones)
        let resumenBoleta = null;
        try {
          // Reutilizamos la lógica existente que detecta el ciclo automáticamente
          const boletaCompleta = await obtenerBoletaActual(hijoUid);
          
          // Cálculo de indicadores rápidos para el dashboard
          const materias = boletaCompleta.resultados;
          const suma = materias.reduce((acc, curr) => acc + (curr.promedioFinal || 0), 0);
          const promedio = materias.length > 0 ? (suma / materias.length).toFixed(1) : "N/A";
          const reprobadas = materias.filter(m => m.promedioFinal < 6).length;

          resumenBoleta = {
            ciclo: boletaCompleta.cicloEscolar,
            promedioGeneral: promedio,
            materiasReprobadas: reprobadas,
            totalMaterias: materias.length
          };

        } catch (err) {
          console.warn(`Alumno ${hijoUid} sin boleta activa para el ciclo actual.`);
          // No lanzamos error para no bloquear la carga de los otros hijos
        }

        // C. Retornar objeto compuesto
        return {
          uid: perfilHijo.persona.uid,
          nombre: perfilHijo.persona.nombre,
          apellidos: perfilHijo.persona.apellidos,
          fotoUrl: perfilHijo.persona.fotoUrl,
          detalleAcademico: (perfilHijo.rol as any), // Grado, Grupo, Matricula
          resumenCiclo: resumenBoleta
        };

      } catch (error) {
        console.error(`Error procesando datos del hijo ${hijoUid}`, error);
        return null;
      }
    });

    // 3. Resolver promesas y filtrar nulos
    const resultados = await Promise.all(promesasHijos);
    const listaFinal = resultados.filter(h => h !== null);

    // 4. REGISTRO DE LOG DE ACTIVIDAD (ÉXITO)
    // Esto cumple con el requisito de auditoría para padres
    await registrarLog(tutorUid, 'CONSULTAR_DASHBOARD_FAMILIAR', {
      cantidadHijos: listaFinal.length,
      hijosConsultados: listaFinal.map(h => h?.uid)
    });

    return listaFinal;

  } catch (error: any) {
    console.error("Error en consultarHijosDelTutor:", error);
    // Re-lanzamos el error para que lo maneje el controlador (routes)
    throw error; 
  }
};

/**
 * Valida si un tutor tiene permiso sobre un estudiante específico.
 * Útil para proteger endpoints de descarga de boletas o detalles específicos.
 */
export const validarTutoria = async (tutorUid: string, estudianteUid: string): Promise<boolean> => {
  const tutorDoc = await tutoresRef.doc(tutorUid).get();
  if (!tutorDoc.exists) return false;
  
  const datos = tutorDoc.data() as RolTutor;
  const tienePermiso = datos.estudiantesUids.includes(estudianteUid);

  if (!tienePermiso) {
    // ALERTA DE SEGURIDAD: Intento de acceso no autorizado a otro alumno
    await registrarLog(tutorUid, 'ALERTA_ACCESO_NO_AUTORIZADO', {
      objetivoUid: estudianteUid,
      mensaje: 'El tutor intentó acceder a un alumno que no es su hijo.'
    });
  }

  return tienePermiso;
};