/**
 * ====================================================================
 * SERVICIO DE REPORTES (Corregido - Promedio Ponderado)
 * ====================================================================
 * Corrección:
 * 1. Implementa cálculo ponderado (Calificación * Porcentaje).
 * 2. Evita sobrescribir evaluaciones en un mismo periodo.
 * 3. Muestra el promedio real basado en los criterios configurados.
 */
import { db } from '../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js';
import { FieldPath } from 'firebase-admin/firestore';
import {
  type BoletaDataDTO,
  type ResultadoMateriaDTO,
  type Materia,
  type Grupo,
  type RolEstudiante,
  type Evaluacion, // Asegúrate de tener esto en tu modelo
  type KardexDTO,
  type CicloKardexDTO,
  type MateriaKardexDTO
} from '../ModelosAplicacion/ModelosAplicacion.model.js';

import { obtenerPerfilUsuario } from './Usuarios.js';
import { consultarTodosPeriodos } from './Periodos.js';

/**
 * Función de ayuda para redondear a 1 decimal
 */
const redondear = (valor: number): number => {
  return Math.round(valor * 10) / 10;
};

/**
 * Obtiene la boleta actual detectando el ciclo automáticamente
 */
export const obtenerBoletaActual = async (estudianteUid: string): Promise<BoletaDataDTO> => {
  const gruposRef = db.collection('grupos');
  const snapshot = await gruposRef
    .where('estudianteUids', 'array-contains', estudianteUid)
    .get();

  if (snapshot.empty) {
    throw new Error('El estudiante no tiene grupos asignados.');
  }

  const ciclos = new Set<string>();
  snapshot.docs.forEach(doc => {
    const d = doc.data();
    if (d.cicloEscolar) ciclos.add(d.cicloEscolar);
  });

  if (ciclos.size === 0) throw new Error('Grupos sin ciclo escolar definido.');

  // Tomar el más reciente
  const cicloActual = Array.from(ciclos).sort().reverse()[0];

  return await generarBoletaEstudiante(estudianteUid, cicloActual as string);
};

/**
 * ====================================================================
 * LÓGICA CORE: Generación de Boleta con Ponderación
 * ====================================================================
 */
export const generarBoletaEstudiante = async (
  estudianteUid: string,
  cicloEscolar: string
): Promise<any> => {

  // 1. Obtener Perfil y Periodos
  const [perfil, periodos] = await Promise.all([
    obtenerPerfilUsuario(estudianteUid),
    consultarTodosPeriodos()
  ]);

  if (!perfil || perfil.tipoRol !== 'estudiante') {
    throw new Error('El UID no corresponde a un estudiante válido.');
  }
  const estudiante = { ...perfil.persona, ...(perfil.rol as RolEstudiante) };

  // Ordenar periodos cronológicamente
  periodos.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());

  // 2. Encontrar Grupos del ciclo
  const gruposSnap = await db.collection('grupos')
    .where('cicloEscolar', '==', cicloEscolar)
    .where('estudianteUids', 'array-contains', estudianteUid)
    .get();
  
  const grupos = gruposSnap.docs.map(doc => doc.data() as Grupo);
  
  if (grupos.length === 0) {
    return { estudiante, cicloEscolar, periodos, resultados: [] };
  }

  // 3. Obtener Datos Maestros (Materias y Docentes)
  const materiaIds = [...new Set(grupos.map(g => g.materiaId))];
  const docentesUids = [...new Set(grupos.map(g => g.empleadoUid))];

  const [materiasSnap, docentesPerfiles] = await Promise.all([
    db.collection('materias').where(FieldPath.documentId(), 'in', materiaIds).get(),
    Promise.all(docentesUids.map(uid => obtenerPerfilUsuario(uid)))
  ]);

  const materiasMap = new Map(materiasSnap.docs.map(doc => [doc.id, doc.data() as Materia]));
  
  const docentesMap = new Map<string, string>();
  docentesPerfiles.forEach(d => {
    if (d) docentesMap.set(d.persona.uid, `${d.persona.nombre} ${d.persona.apellidos}`);
  });

  // 4. PROCESAR RESULTADOS POR MATERIA
  const resultados: any[] = [];

  // Usamos un for...of o Promise.all para iterar los grupos
  await Promise.all(grupos.map(async (grupo) => {
    const materia = materiasMap.get(grupo.materiaId);
    if (!materia) return;

    // A. OBTENER EVALUACIONES (Configuración de porcentajes: Examen 60%, Tareas 40%)
    const evaluacionesSnap = await db.collection('grupos').doc(grupo.id).collection('evaluaciones').get();
    const evaluaciones = evaluacionesSnap.docs.map(d => d.data() as Evaluacion);
    
    // Crear mapa: evaluacionId -> porcentaje (0 a 100)
    const mapaPesos = new Map<string, number>();
    const mapaPeriodoEvaluacion = new Map<string, string>(); // evaluacionId -> periodoId

    evaluaciones.forEach(ev => {
      mapaPesos.set(ev.id, ev.porcentaje || 0);
      mapaPeriodoEvaluacion.set(ev.id, ev.periodoId);
    });

    // B. OBTENER ACTAS (Las calificaciones reales)
    const actasSnap = await db.collection('actas_evaluacion')
      .where('grupoId', '==', grupo.id)
      .get();

    // Agrupamos las actas por PERIODO para sumarlas después
    const actasPorPeriodo = new Map<string, any[]>();

    actasSnap.docs.forEach(doc => {
      const acta = doc.data();
      const periodoId = mapaPeriodoEvaluacion.get(acta.id);
      
      if (periodoId) {
        if (!actasPorPeriodo.has(periodoId)) {
          actasPorPeriodo.set(periodoId, []);
        }
        actasPorPeriodo.get(periodoId)?.push(acta);
      }
    });

    // C. CALCULAR CALIFICACIONES FINALES
    const calificacionesPorPeriodo: { [periodoId: string]: number | null } = {};
    const notasParaPromedio: number[] = [];
    let ultimaObservacion = '';

    for (const periodo of periodos) {
      const actasDelPeriodo = actasPorPeriodo.get(periodo.id) || [];
      
      let sumaPonderada = 0;
      let porcentajeAcumulado = 0;
      let tieneCalificacion = false;

      for (const acta of actasDelPeriodo) {
        if (acta.calificaciones && acta.calificaciones[estudianteUid]) {
          const registro = acta.calificaciones[estudianteUid];
          const valor = Number(registro.valor); 
          
          if (!isNaN(valor)) {
            const peso = mapaPesos.get(acta.id) || 0; 
            
            sumaPonderada += (valor * (peso / 100));
            porcentajeAcumulado += peso;
            tieneCalificacion = true;

            if (registro.observaciones) ultimaObservacion = registro.observaciones;
          }
        }
      }

      if (tieneCalificacion) {
        const notaFinal = redondear(sumaPonderada);
        calificacionesPorPeriodo[periodo.id] = notaFinal;
        notasParaPromedio.push(notaFinal);
      } else {
        calificacionesPorPeriodo[periodo.id] = null;
      }
    }

    // ====================================================================
    // B) EXTRACCIÓN DE FALTAS POR PERIODO (La magia para el PDF)
    // ====================================================================
    const asistenciasSnap = await db.collection('grupos').doc(grupo.id).collection('asistencias').get();
    const faltasPorPeriodo: Record<string, number> = {};
    let inasistenciasTotales1 = 0;

    asistenciasSnap.docs.forEach(docAsis => {
      const dataAsis = docAsis.data();
      if (dataAsis.registro && dataAsis.registro[estudianteUid] === 'FALTA') {
        const pId = dataAsis.periodoId;
        if (pId) {
          faltasPorPeriodo[pId] = (faltasPorPeriodo[pId] || 0) + 1; // Suma 1 al periodo
        }
        inasistenciasTotales1++;
      }
    });

    const promedioFinal = notasParaPromedio.length > 0 
      ? redondear(notasParaPromedio.reduce((a, b) => a + b, 0) / notasParaPromedio.length) 
      : 0;
    
    const nombreDocente = docentesMap.get(grupo.empleadoUid) || 'Sin Asignar';

    resultados.push({ 
      materia,
      calificacionesPorPeriodo,
      faltasPorPeriodo,        // <--- EL DATO YA VIAJA AL FRONTEND
      promedioFinal,
      nombreDocente,
      observaciones: ultimaObservacion, 
      inasistenciasTotales: inasistenciasTotales1,
    });
  }));

  return { estudiante, cicloEscolar, periodos, resultados };
};


/**
 * GENERAR DATOS DE LA BOLETA DE EVALUACIÓN (CON FALTAS POR PERIODO)
 * Endpoint correspondiente: GET /api/estudiantes/:uid/boleta
 */
export const generarBoletaData = async (estudianteUid: string): Promise<any> => {
  const perfil = await obtenerPerfilUsuario(estudianteUid);
  if (!perfil) throw new Error('Estudiante no encontrado');

  // 1. Obtener grupos del alumno
  const gruposSnap = await db.collection('grupos')
    .where('estudianteUids', 'array-contains', estudianteUid)
    .get();

  if (gruposSnap.empty) throw new Error('El estudiante no tiene grupos asignados');
  const grupos = gruposSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
  const cicloEscolar = grupos[0].cicloEscolar || '2025-2026';

  // 2. Obtener materias
  const materiaIds = [...new Set(grupos.map(g => g.materiaId))];
  const materiasSnap = await db.collection('materias').where(FieldPath.documentId(), 'in', materiaIds).get();
  const materiasMap = new Map(materiasSnap.docs.map(d => [d.id, d.data()]));

  // 3. Obtener Periodos
  const periodosSnap = await db.collection('periodos').get();
  const periodos = periodosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 4. Armar Resultados (Iterando por materia)
  const resultados = [];

  for (const grupo of grupos) {
    const materia = materiasMap.get(grupo.materiaId);
    if (!materia) continue;

    // A) Obtener Calificaciones de este grupo
    const actasSnap = await db.collection('actas_evaluacion').where('grupoId', '==', grupo.id).get();
    const calificacionesPorPeriodo: Record<string, number> = {};
    let sumaCalif = 0;
    let countCalif = 0;

    actasSnap.docs.forEach(doc => {
      const acta = doc.data();
      const val = acta.calificaciones?.[estudianteUid]?.valor;
      if (val !== undefined && val !== null && acta.periodoId) {
        calificacionesPorPeriodo[acta.periodoId] = Number(val);
        sumaCalif += Number(val);
        countCalif++;
      }
    });
    const promedioFinal = countCalif > 0 ? (sumaCalif / countCalif) : 0;

    // ====================================================================
    // B) EXTRACCIÓN DE FALTAS POR PERIODO (La magia para el PDF)
    // ====================================================================
    const asistenciasSnap = await db.collection('grupos').doc(grupo.id).collection('asistencias').get();
    const faltasPorPeriodo: Record<string, number> = {};
    let inasistenciasTotales = 0;

    asistenciasSnap.docs.forEach(docAsis => {
      const dataAsis = docAsis.data();
      if (dataAsis.registro && dataAsis.registro[estudianteUid] === 'FALTA') {
        const pId = dataAsis.periodoId;
        if (pId) {
          faltasPorPeriodo[pId] = (faltasPorPeriodo[pId] || 0) + 1; // Suma 1 al periodo
        }
        inasistenciasTotales++;
      }
    });
    // ====================================================================

    resultados.push({
      materia: materia,
      nombreDocente: grupo.docente ? `${grupo.docente.persona?.nombre} ${grupo.docente.persona?.apellidos}` : 'Sin Asignar',
      calificacionesPorPeriodo: calificacionesPorPeriodo,
      faltasPorPeriodo: faltasPorPeriodo, // <--- Enviamos los datos ordenados al Frontend
      inasistenciasTotales: inasistenciasTotales,
      promedioFinal: Math.round(promedioFinal * 10) / 10,
      observaciones: ''
    });
  }

  return {
    estudiante: perfil,
    cicloEscolar: cicloEscolar,
    periodos: periodos,
    resultados: resultados
  };
};

/**
 * Genera el Kardex completo (Historial Académico)
 * (Mantenemos la lógica pero aseguramos que use los imports correctos)
 */
export const generarKardexEstudiante = async (estudianteUid: string): Promise<KardexDTO> => {
  const perfil = await obtenerPerfilUsuario(estudianteUid);
  if (!perfil) throw new Error('Estudiante no encontrado');

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
  const materiaIds = [...new Set(grupos.map(g => g.materiaId))];
  const materiasSnap = await db.collection('materias')
    .where(FieldPath.documentId(), 'in', materiaIds)
    .get();
  const materiasMap = new Map(materiasSnap.docs.map(d => [d.id, d.data() as Materia]));

  const mapaCiclos = new Map<string, Grupo[]>();
  grupos.forEach(g => {
    const lista = mapaCiclos.get(g.cicloEscolar) || [];
    lista.push(g);
    mapaCiclos.set(g.cicloEscolar, lista);
  });

  const ciclosKardex: CicloKardexDTO[] = [];
  let sumaGlobal = 0;
  let conteoGlobal = 0;
  let reprobadasGlobal = 0;

  const ciclosOrdenados = Array.from(mapaCiclos.keys()).sort().reverse();

  for (const nombreCiclo of ciclosOrdenados) {
    const gruposCiclo = mapaCiclos.get(nombreCiclo) || [];
    const materiasDTO: MateriaKardexDTO[] = [];
    let sumaCiclo = 0;

    // NOTA: Para el Kardex, lo ideal sería guardar la "Calificación Final" 
    // directamente en el documento del Grupo o en un documento de "Historial",
    // calcularlo al vuelo aquí es costoso si hay muchos alumnos.
    // Por ahora, simulamos un cálculo rápido promediando actas existentes.

    const actasSnap = await db.collection('actas_evaluacion')
       .where('grupoId', 'in', gruposCiclo.map(g => g.id))
       .get();
    
    // Simplificación para Kardex:
    // Agrupamos todas las notas del alumno por grupo y hacemos promedio simple de lo encontrado
    // (Para mayor precisión, deberías usar la función generarBoletaEstudiante para cada ciclo pasado)
    const notasPorGrupo = new Map<string, number[]>();
    
    actasSnap.docs.forEach(d => {
      const data = d.data();
      const val = data.calificaciones?.[estudianteUid]?.valor;
      if (val !== undefined && val !== null) {
        if (!notasPorGrupo.has(data.grupoId)) notasPorGrupo.set(data.grupoId, []);
        notasPorGrupo.get(data.grupoId)?.push(Number(val));
      }
    });

    for (const grupo of gruposCiclo) {
      const materia = materiasMap.get(grupo.materiaId);
      if (!materia) continue;

      const notas = notasPorGrupo.get(grupo.id) || [];
      // Aquí el promedio simple es un aproximado histórico
      const finalMateria = notas.length > 0 
        ? (notas.reduce((a, b) => a + b, 0) / notas.length) 
        : 0; 
      
      const califRedondeada = redondear(finalMateria);

      materiasDTO.push({
        nombreMateria: materia.nombre,
        calificacionFinal: califRedondeada,
        estatus: califRedondeada >= 6 ? 'APROBADA' : 'REPROBADA'
      });

      if (califRedondeada > 0) {
        sumaCiclo += califRedondeada;
        sumaGlobal += califRedondeada;
        conteoGlobal++;
        if (califRedondeada < 6) reprobadasGlobal++;
      }
    }

    const promedioCiclo = materiasDTO.length > 0 ? redondear(sumaCiclo / materiasDTO.length) : 0;
    
    ciclosKardex.push({
      nombreCiclo: nombreCiclo,
      promedioCiclo: promedioCiclo,
      estatus: 'FINALIZADO',
      materias: materiasDTO
    });
  }

  const promedioGlobal = conteoGlobal > 0 ? redondear(sumaGlobal / conteoGlobal) : 0;

  return {
    estudiante: perfil,
    promedioGlobal,
    totalMateriasCursadas: conteoGlobal,
    totalMateriasReprobadas: reprobadasGlobal,
    ciclos: ciclosKardex
  };
};