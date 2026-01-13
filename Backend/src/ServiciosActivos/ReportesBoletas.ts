/**
 * ====================================================================
 * SERVICIO DE REPORTES (Optimizado con Actas)
 * ====================================================================
 * Actualización:
 * 1. La boleta ahora lee directamente de la colección 'actas_evaluacion'.
 * 2. Se incluye 'obtenerBoletaActual' para detección automática de ciclo.
 */
import { db } from '../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js';
import { FieldPath } from 'firebase-admin/firestore';
import {
  type BoletaDataDTO,
  type ResultadoMateriaDTO,
  type Materia,
  type Grupo,
  type RolEstudiante,
  type ActaCalificacionesDTO,
  type ActaFilaEstudianteDTO,
  type PerfilUsuarioDTO,
  type Evaluacion,
  type Calificacion,
  type CicloKardexDTO,
  type KardexDTO,
  type MateriaKardexDTO
} from '../ModelosAplicacion/ModelosAplicacion.model.js';

import { obtenerPerfilUsuario } from './Usuarios.js';
import { consultarPeriodoPorId, consultarTodosPeriodos } from './Periodos.js';
import { consultarGrupoPorId } from './Grupos.js';
import { consultarMateriaPorId } from './Materias.js';

// Interfaz interna para mapear el documento de la BD (basado en tu imagen)
interface ActaEvaluacionDoc {
  id: string;
  grupoId: string;
  periodoId: string;
  docenteUid: string;
  estatus: 'ABIERTA' | 'CERRADA';
  // Mapa: [estudianteUid] -> { valor: number, observaciones: string, ... }
  calificaciones: {
    [estudianteUid: string]: {
      valor: number;
      observaciones?: string;
      fechaCaptura?: any;
    }
  };
}

/**
 * Función de ayuda para calcular un promedio simple (para promedios finales)
 */
const calcularPromedioSimple = (numeros: number[]): number => {
  if (numeros.length === 0) return 0;
  const suma = numeros.reduce((a, b) => a + b, 0);
  return Math.round((suma / numeros.length) * 10) / 10;
};

/**
 * ====================================================================
 * NUEVA FUNCIÓN: Wrapper para API (Detección Automática)
 * ====================================================================
 */
export const obtenerBoletaActual = async (estudianteUid: string): Promise<BoletaDataDTO> => {
  // 1. Buscar grupos del alumno para deducir ciclo
  const gruposRef = db.collection('grupos');
  const snapshot = await gruposRef
    .where('estudianteUids', 'array-contains', estudianteUid)
    .get();

  if (snapshot.empty) {
    throw new Error('El estudiante no tiene grupos asignados.');
  }

  // 2. Extraer ciclos
  const ciclos = new Set<string>();
  snapshot.docs.forEach(doc => {
    const d = doc.data();
    if (d.cicloEscolar) ciclos.add(d.cicloEscolar);
  });

  if (ciclos.size === 0) throw new Error('Grupos sin ciclo escolar definido.');

  // 3. Tomar el más reciente (alfabéticamente el mayor, ej: "2025-2026" > "2024-2025")
  const cicloActual = Array.from(ciclos).sort().reverse()[0];

  return await generarBoletaEstudiante(estudianteUid, cicloActual as string);
};

/**
 * ====================================================================
 * Función para generar el Acta de Calificaciones (Vista Docente/Admin)
 * (Mantenemos esta lógica para cuando se consulta el detalle de un grupo)
 * ====================================================================
 */
export const generarBoletaEstudiante = async (
  estudianteUid: string,
  cicloEscolar: string
): Promise<BoletaDataDTO> => {

  // 1. Obtener Perfil y Periodos
  const [perfil, periodos] = await Promise.all([
    obtenerPerfilUsuario(estudianteUid),
    consultarTodosPeriodos()
  ]);

  if (!perfil || perfil.tipoRol !== 'estudiante') {
    throw new Error('El UID no corresponde a un estudiante válido.');
  }
  const estudiante = { ...perfil.persona, ...(perfil.rol as RolEstudiante) };

  // ORDENAR PERIODOS CRONOLÓGICAMENTE (Importante para saber cuál es el "último")
  periodos.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());

  // 2. Encontrar Grupos
  const gruposSnap = await db.collection('grupos')
    .where('cicloEscolar', '==', cicloEscolar)
    .where('estudianteUids', 'array-contains', estudianteUid)
    .get();
  
  const grupos = gruposSnap.docs.map(doc => doc.data() as Grupo);
  
  if (grupos.length === 0) {
    return { estudiante, cicloEscolar, periodos, resultados: [] };
  }

  // 3. Obtener Materias y DOCENTES (Nuevo)
  const materiaIds = [...new Set(grupos.map(g => g.materiaId))];
  const docentesUids = [...new Set(grupos.map(g => g.empleadoUid))]; // Extraer UIDs de profes

  const [materiasSnap, docentesPerfiles] = await Promise.all([
    db.collection('materias').where(FieldPath.documentId(), 'in', materiaIds).get(),
    Promise.all(docentesUids.map(uid => obtenerPerfilUsuario(uid))) // Traer perfiles de docentes
  ]);

  const materiasMap = new Map(materiasSnap.docs.map(doc => [doc.id, doc.data() as Materia]));
  
  // Mapa de Docentes: uid -> "Nombre Apellidos"
  const docentesMap = new Map<string, string>();
  docentesPerfiles.forEach(d => {
    if (d) docentesMap.set(d.persona.uid, `${d.persona.nombre} ${d.persona.apellidos}`);
  });

  // 4. Procesar Resultados
  const resultados: ResultadoMateriaDTO[] = [];

  await Promise.all(grupos.map(async (grupo) => {
    const materia = materiasMap.get(grupo.materiaId);
    if (!materia) return;

    const calificacionesPorPeriodo: { [periodoId: string]: number | null } = {};
    const notasParaPromedio: number[] = [];
    
    // Variables para la observación del último parcial
    let ultimaObservacion = ''; 

    // 5. Buscar Actas
    const actasSnap = await db.collection('actas_evaluacion')
      .where('grupoId', '==', grupo.id)
      .get();

    const actasMap = new Map<string, any>();
    actasSnap.docs.forEach(doc => actasMap.set(doc.data().periodoId, doc.data()));

    // 6. Recorrer periodos (ya ordenados)
    for (const periodo of periodos) {
      const acta = actasMap.get(periodo.id);
      let califFinal: number | null = null;

      if (acta && acta.calificaciones && acta.calificaciones[estudianteUid]) {
        const registro = acta.calificaciones[estudianteUid];
        
        if (registro.valor !== undefined && registro.valor !== null) {
          califFinal = Number(registro.valor);
          
          // Si este periodo tiene observación, la guardamos.
          // Al ir en orden cronológico, la última que encontremos será la del "último parcial evaluado".
          if (registro.observaciones) {
            ultimaObservacion = registro.observaciones;
          }
        }
      }

      calificacionesPorPeriodo[periodo.id] = califFinal;
      if (califFinal !== null) notasParaPromedio.push(califFinal);
    }

    const promedioFinal = calcularPromedioSimple(notasParaPromedio);
    
    // Obtener nombre del docente
    const nombreDocente = docentesMap.get(grupo.empleadoUid) || 'Sin Asignar';

    resultados.push({ 
      materia,
      calificacionesPorPeriodo,
      promedioFinal,
      nombreDocente,       // <--- Enviamos el dato
      observaciones: ultimaObservacion // <--- Enviamos la observación
    });
  }));

  return { estudiante, cicloEscolar, periodos, resultados };
};

// ... imports existentes

/**
 * Genera el Kardex completo (Historial Académico)
 */
export const generarKardexEstudiante = async (estudianteUid: string): Promise<KardexDTO> => {
  
  // 1. Obtener Perfil
  const perfil = await obtenerPerfilUsuario(estudianteUid);
  if (!perfil) throw new Error('Estudiante no encontrado');

  // 2. Obtener TODOS los grupos donde ha estado el alumno (Histórico)
  const gruposSnap = await db.collection('grupos')
    .where('estudianteUids', 'array-contains', estudianteUid)
    .get();

  if (gruposSnap.empty) {
    return {
      estudiante: perfil,
      promedioGlobal: 0,
      totalMateriasCursadas: 0,
      totalMateriasReprobadas: 0,
      ciclos: []
    };
  }

  const grupos = gruposSnap.docs.map(doc => doc.data() as Grupo);

  // 3. Obtener Materias (Para tener los nombres)
  const materiaIds = [...new Set(grupos.map(g => g.materiaId))];
  const materiasSnap = await db.collection('materias')
    .where(FieldPath.documentId(), 'in', materiaIds)
    .get();
  const materiasMap = new Map(materiasSnap.docs.map(d => [d.id, d.data() as Materia]));

  // 4. Agrupar por Ciclo Escolar
  const mapaCiclos = new Map<string, Grupo[]>();
  grupos.forEach(g => {
    const lista = mapaCiclos.get(g.cicloEscolar) || [];
    lista.push(g);
    mapaCiclos.set(g.cicloEscolar, lista);
  });

  // 5. Procesar cada Ciclo
  const ciclosKardex: CicloKardexDTO[] = [];
  let sumaGlobal = 0;
  let conteoGlobal = 0;
  let reprobadasGlobal = 0;

  // Recorremos los ciclos (convertimos el mapa a array para ordenar)
  const ciclosOrdenados = Array.from(mapaCiclos.keys()).sort().reverse(); // Del más reciente al más antiguo

  for (const nombreCiclo of ciclosOrdenados) {
    const gruposCiclo = mapaCiclos.get(nombreCiclo) || [];
    const materiasDTO: MateriaKardexDTO[] = [];
    let sumaCiclo = 0;

    // Para cada materia del ciclo, calculamos su nota final
    // (Reutilizamos la lógica de lectura de actas para rapidez)
    const actasSnap = await db.collection('actas_evaluacion')
       .where('grupoId', 'in', gruposCiclo.map(g => g.id))
       .get();
    
    // Mapa: grupoId -> Acta
    const actasMap = new Map();
    actasSnap.docs.forEach(d => {
       const data = d.data();
       // Guardamos por grupo. OJO: Un grupo puede tener varias actas (periodos).
       // Para el Kardex necesitamos el PROMEDIO FINAL DE LA MATERIA.
       // Estrategia simplificada: Promediar los periodos encontrados.
       if(!actasMap.has(data.grupoId)) actasMap.set(data.grupoId, []);
       actasMap.get(data.grupoId).push(data);
    });

    for (const grupo of gruposCiclo) {
      const materia = materiasMap.get(grupo.materiaId);
      if (!materia) continue;

      const actasDelGrupo = actasMap.get(grupo.id) || [];
      let sumaPeriodos = 0;
      let periodosContados = 0;

      actasDelGrupo.forEach((acta: any) => {
        const calif = acta.calificaciones?.[estudianteUid]?.valor;
        if (calif !== undefined && calif !== null) {
          sumaPeriodos += Number(calif);
          periodosContados++;
        }
      });

      const finalMateria = periodosContados > 0 ? (sumaPeriodos / periodosContados) : 0;
      
      materiasDTO.push({
        nombreMateria: materia.nombre,
        calificacionFinal: Number(finalMateria.toFixed(1)),
        estatus: finalMateria >= 6 ? 'APROBADA' : 'REPROBADA'
      });

      if (finalMateria > 0) {
        sumaCiclo += finalMateria;
        sumaGlobal += finalMateria;
        conteoGlobal++;
        if (finalMateria < 6) reprobadasGlobal++;
      }
    }

    const promedioCiclo = materiasDTO.length > 0 ? (sumaCiclo / materiasDTO.length) : 0;
    
    ciclosKardex.push({
      nombreCiclo: nombreCiclo,
      promedioCiclo: Number(promedioCiclo.toFixed(1)),
      estatus: 'FINALIZADO', // Podrías validar fechas para ver si es CURSANDO
      materias: materiasDTO
    });
  }

  const promedioGlobal = conteoGlobal > 0 ? (sumaGlobal / conteoGlobal) : 0;

  return {
    estudiante: perfil,
    promedioGlobal: Number(promedioGlobal.toFixed(1)),
    totalMateriasCursadas: conteoGlobal,
    totalMateriasReprobadas: reprobadasGlobal,
    ciclos: ciclosKardex
  };
};