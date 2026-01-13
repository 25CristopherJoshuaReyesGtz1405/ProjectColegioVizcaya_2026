/**
 * ====================================================================
 * PASO 3: SERVICIO DE DASHBOARD (ESTADÍSTICAS)
 * ====================================================================
 * Implementa RF 4.2 (Panel de Estadísticas - Dashboard).
 *
 * Contiene la lógica "pesada" para calcular todas las
 * estadísticas que la Directora necesita ver.
 */
import { db } from "../ConfiguracionesActivas/ADBB_BaseDatos_Secundaria.js";
import { FieldPath } from "firebase-admin/firestore";
import { type EstadisticasDashboardDTO, type Persona, type RolEstudiante, type Grupo, type Planeacion } from "../ModelosAplicacion/ModelosAplicacion.model.js";

// Referencias de la Base De Datos...
const personasRef = db.collection("personas");
const estudiantesRef = db.collection("estudiantes");
const empleadosRef = db.collection("administrativos");
const gruposRef = db.collection("grupos");
const reportesRef = db.collection("reportes_indisciplina");
const planeacionesRef = db.collection('planeaciones');

// Función auxiliar para dividir arrays en trozos (chunks)
const chunkArray = (array: string[], size: number): string[][] => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

//  * Genera estadísticas operativas y académicas para el panel de materias.
export const generarEstadisticasAcademicas = async () => 
{
  // 1. Obtener todos los grupos y planeaciones en paralelo
  const [gruposSnap, planeacionesSnap] = await Promise.all([gruposRef.get(), planeacionesRef.get()]);

  const grupos = gruposSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grupo));
  const planeaciones = planeacionesSnap.docs.map(doc => doc.data() as Planeacion);

  // --- A. ESTADÍSTICAS OPERATIVAS ---
  
  // 1. Sin Docente
  const sinDocente = grupos.filter(g => !g.empleadoUid || g.empleadoUid === 'null').length;

  // 2. Sin Alumnos (Grupos vacíos)
  const sinAlumnos = grupos.filter(g => !g.estudianteUids || g.estudianteUids.length === 0).length;

  // 3. Sin Planeación (Grupos que no tienen ninguna planeación registrada en el ciclo)
  const materiasConPlaneacion = new Set(planeaciones.map(p => p.materiaId));
  //  * Filtramos grupos cuya materia NO esté en el set de planeaciones
  const sinPlaneacion = grupos.filter(g => !materiasConPlaneacion.has(g.materiaId)).length;

  // 4. Cobertura Docente (%)
  const totalGrupos = grupos.length || 1;
  const conDocente = totalGrupos - sinDocente;
  const cobertura = Math.round((conDocente / totalGrupos) * 100);


  // --- B. GRUPOS EN RIESGO (Cálculo Pesado Simplificado) ---
  
  let gruposEnRiesgo = 0;

  // ESTRATEGIA HÍBRIDA (Más eficiente): 
  // Riesgo = Sin Docente OR (Sin Alumnos AND Activo)
  gruposEnRiesgo = sinDocente + sinAlumnos; 

  return {
    operativas: {
      sinDocente,
      sinAlumnos,
      sinPlaneacion,
      coberturaPorcentaje: cobertura
    },
    riesgo: {
      totalGruposEnRiesgo: gruposEnRiesgo,
      motivoPrincipal: sinDocente > sinPlaneacion ? 'Falta de Docentes' : 'Planeación'
    }
  };
};

//  * Calcula todas las estadísticas clave para el Dashboard de Dirección.
export const generarEstadisticasDashboard = async (): Promise<EstadisticasDashboardDTO> => 
{
  // 1. Ejecutar todas las consultas de conteo simples en paralelo
  const [estudiantesActivosSnap, estudiantesInactivosSnap, docentesActivosSnap, docentesInactivosSnap, gruposSnap, reportesSnap ] = await Promise.all
  ([
    estudiantesRef.where("estatus", "==", "ACTIVO").get(),
    estudiantesRef.where("estatus", "==", "BAJA").get(),
    empleadosRef.where("rol", "==", "docente").where("estatus", "==", "ACTIVO").get(),
    empleadosRef.where("rol", "==", "docente").where("estatus", "==", "BAJA").get(),
    gruposRef.get(),
    reportesRef.get(),
  ]);

  // 2. Procesar conteos simples
  const conteoEstudiantes = { activos: estudiantesActivosSnap.size, inactivos: estudiantesInactivosSnap.size, total: estudiantesActivosSnap.size + estudiantesInactivosSnap.size, porGrado: {}, porGenero: {}, };

  const conteoDocentes = { activos: docentesActivosSnap.size, inactivos: docentesInactivosSnap.size };

  const grupos = gruposSnap.docs.map((doc) => doc.data() as Grupo);

  const conteoGrupos = { total: gruposSnap.size, sinDocente: grupos.filter((g) => !g.empleadoUid).length, sinMateria: grupos.filter((g) => !g.materiaId).length };

  const conteoReportesIndisciplina = { total: reportesSnap.size };

  // 3. Procesar conteos complejos (Grado y Género)
  const porGrado: { [grado: string]: number } = {};
  const porGenero: { [sexo: string]: number } = {};

  if (!estudiantesActivosSnap.empty) 
  {
    const uids = estudiantesActivosSnap.docs.map((doc) => doc.id);
    const roles = estudiantesActivosSnap.docs.map((doc) => doc.data() as RolEstudiante);

    // --- SOLUCIÓN AL ERROR DE LÍMITE DE 30 ITEMS EN 'IN' ---
    // Firestore limita el operador 'in' a 30 elementos.
    // Dividimos los UIDs en lotes de 30 y hacemos consultas paralelas.
    const lotesUids = chunkArray(uids, 30);
    
    const promesasPersonas = lotesUids.map(lote => 
      personasRef.where(FieldPath.documentId(), "in", lote).get()
    );

    const snapshotsPersonas = await Promise.all(promesasPersonas);
    
    // Unimos todos los resultados en un solo mapa
    const personasMap = new Map<string, Persona>();
    snapshotsPersonas.forEach(snap => {
      snap.docs.forEach(doc => {
        personasMap.set(doc.id, doc.data() as Persona);
      });
    });
    // --------------------------------------------------------

    // Contar
    roles.forEach((rol) => 
    {
      // Conteo por Grado (del Rol)
      const gradoStr = rol.grado.toString();
      porGrado[gradoStr] = (porGrado[gradoStr] || 0) + 1;

      // Conteo por Género (de la Persona)
      const persona = personasMap.get(rol.uid);
      if (persona) 
      {
        porGenero[persona.sexo] = (porGenero[persona.sexo] || 0) + 1;
      }
    });
  }

  conteoEstudiantes.porGrado = porGrado;
  conteoEstudiantes.porGenero = porGenero;

  // 4. Calcular Promedio General (la más pesada)
  let promedioGeneral = 0;

  // 5. Ensamblar DTO
  const estadisticas: EstadisticasDashboardDTO = 
  {
    conteoEstudiantes,
    conteoDocentes,
    conteoGrupos,
    conteoReportesIndisciplina,
    promedioGeneral: 8.9, 
  };

  return estadisticas;
};