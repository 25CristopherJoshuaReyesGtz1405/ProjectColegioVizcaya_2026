import { Router, type Request, type Response } from 'express';
import * as ServicioDocente from '../ServiciosActivos/Docentes.js';
import authMiddleware from '../APIs/auth.middleware.js';
import { log } from 'console';
import multer from 'multer';
import { actualizarEvaluacion, eliminarEvaluacion, crearSolicitudRatificacion } from '../ServiciosActivos/Docentes.js';

const router = Router();

// Todas las rutas en este archivo requieren autenticación
router.use(authMiddleware);

const upload = multer({ storage: multer.memoryStorage() }); // Guardar en memoria temporalmente

// --- Rutas de Consulta ---

/**
 * @route   GET /api/docente/grupo/:grupoId/evaluaciones
 * @query   periodoId (Requerido)
 * @desc    Obtiene la lista de evaluaciones (rubros) de un grupo y periodo.
 */
router.get('/grupo/:grupoId/evaluaciones', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const { grupoId } = req.params;
    const { periodoId } = req.query;

    if (!periodoId) {
      return res.status(400).json({ message: 'El parametro periodoId es obligatorio.' });
    }

    const evaluaciones = await ServicioDocente.consultarEvaluacionesGrupo(
      docenteUid, 
      grupoId as string, 
      periodoId as string
    );
    
    res.status(200).json(evaluaciones);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar evaluaciones', error: error.message });
  }
});

// ... (otras rutas)

/**
 * @route   POST /api/docente/calificaciones/masivo
 * @desc    Guarda calificaciones de todo el grupo (Optimizado).
 */
router.post('/calificaciones/masivo', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const { grupoId, evaluacionId, calificaciones } = req.body;

    if (!grupoId || !evaluacionId || !Array.isArray(calificaciones)) {
      return res.status(400).json({ message: 'Datos incompletos.' });
    }

    await ServicioDocente.guardarCalificacionesMasivas(docenteUid, grupoId, evaluacionId, calificaciones);
    res.status(200).json({ message: 'Calificaciones guardadas.' });

  } catch (error: any) {
    const status = error.message.includes('CERRADO') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
});

router.get('/asistencia/grupo/:grupoId/fecha/:fecha', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { grupoId, fecha } = req.params;
    const asistencia = await ServicioDocente.consultarAsistenciaDia(grupoId as string, fecha as string);
    res.status(200).json(asistencia || { estatusAlumnos: {} }); // Devuelve objeto vacío si no hay datos
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/docente/calificaciones/cerrar
 * @desc    Bloquea el acta de calificaciones para que ya no pueda editarse.
 */
router.post('/calificaciones/cerrar', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const { evaluacionId } = req.body;

    if (!evaluacionId) return res.status(400).json({ message: 'Falta evaluacionId' });

    await ServicioDocente.cerrarActaEvaluacion(docenteUid, evaluacionId);
    res.status(200).json({ message: 'Acta cerrada correctamente.' });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/docente/calificaciones/evaluacion/:id
 * @desc    Obtiene el acta de calificaciones.
 */
router.get('/calificaciones/evaluacion/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const acta = await ServicioDocente.obtenerActaEvaluacion(req.params.id as string);
    res.status(200).json(acta || { calificaciones: {} });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/docente/planeacion/subir
 * @desc    Sube un archivo de planeación a Drive y registra en BD.
 * @access  Privado (Docente)
 */
router.post(
  '/planeacion/subir', 
  authMiddleware, 
  upload.single('archivo'), // 'archivo' es el nombre del campo en el FormData
  async (req: Request, res: Response) => {
    try {
      const docenteUid = (req as any).user.uid;
      
      // En multipart/form-data, los datos vienen en req.body y el archivo en req.file
      const { materiaId, periodoId, nombre } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: 'No se ha adjuntado ningún archivo.' });
      }
      if (!materiaId || !periodoId || !nombre) {
        return res.status(400).json({ message: 'Faltan datos (materiaId, periodoId, nombre).' });
      }

      const planeacion = await ServicioDocente.registrarPlaneacionConArchivo(
        docenteUid, 
        { materiaId, periodoId, nombre },
        req.file
      );
      
      res.status(201).json(planeacion);

    } catch (error: any) {
      res.status(500).json({ message: `Error al subir planeación: ${error.message}` });
    }
  }
);

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const grupos = await ServicioDocente.consultarTodosDocentes();
    res.status(200).json(grupos);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar docentes', error: error.message });
  }
});

/**
 * @route   GET /api/docente/grupos
 * @desc    (RF 3.1) Obtiene los grupos (con materia) asignados al docente logueado.
 * @access  Privado (Docente)
 */
router.get('/grupos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const grupos = await ServicioDocente.consultarGruposDocente(docenteUid);
    res.status(200).json(grupos);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar grupos', error: error.message });
  }
});

// --- Rutas de Calificación y Evaluación ---

/**
 * @route   POST /api/docente/evaluacion
 * @desc    (RF 3.3) Crea un nuevo rubro (tarea, examen) para un grupo.
 * @access  Privado (Docente)
 */
router.post('/evaluacion', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const { grupoId, datosEvaluacion } = req.body; // { "periodoId": "...", "nombre": "...", ... }

    if (!grupoId || !datosEvaluacion) {
      return res.status(400).json({ message: 'Faltan grupoId o datosEvaluacion' });
    }
    
    const nuevaEval = await ServicioDocente.crearEvaluacion(docenteUid, grupoId, datosEvaluacion);
    res.status(201).json(nuevaEval);
    
  } catch (error: any) {
    // Si la seguridad falla (ej. periodo cerrado), se captura aquí
    res.status(403).json({ message: `Error al crear evaluación: ${error.message}` });
  }
});

/**
 * @route   POST /api/docente/calificacion
 * @desc    (RF 3.1) Guarda la calificación de un alumno.
 * @access  Privado (Docente)
 */
router.post('/calificacion', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const { grupoId, evaluacionId, estudianteUid, calificacion } = req.body;

    if (!grupoId || !evaluacionId || !estudianteUid || calificacion === undefined) {
      return res.status(400).json({ message: 'Faltan datos (grupoId, evaluacionId, estudianteUid, calificacion)' });
    }
    
    const nuevaCalif = await ServicioDocente.guardarCalificacion(
      docenteUid, grupoId, evaluacionId, estudianteUid, calificacion
    );
    res.status(201).json(nuevaCalif);

  } catch (error: any) {
    // Si la seguridad falla (ej. periodo cerrado, alumno no en grupo)
    res.status(403).json({ message: `Error al guardar calificación: ${error.message}` });
  }
});

// --- Rutas de Seguimiento ---

/**
 * PUT /api/docentes/grupos/:grupoId/evaluaciones/:evaluacionId
 * Actualiza el nombre o porcentaje de un criterio de evaluación.
 */
router.put('/grupos/:grupoId/evaluaciones/:evaluacionId', async (req: Request, res: Response) => {
  try {
    const { grupoId, evaluacionId } = req.params;
    const { nombre, porcentaje } = req.body;
    const docenteUid = (req as any).user.uid;

    console.log(req);
    

    // Validación básica
    if (!docenteUid) {
      return res.status(401).json({ success: false, message: 'Falta UID del docente.' });
    }
    if (!nombre && porcentaje === undefined) {
      return res.status(400).json({ success: false, message: 'No hay datos para actualizar.' });
    }

    // Llamada a la Lógica de Negocio (ServiciosActivos/Docentes.ts)
    await actualizarEvaluacion(docenteUid, grupoId as string, evaluacionId as string, { nombre, porcentaje });

    return res.status(200).json({ 
      success: true, 
      message: 'Rubro actualizado correctamente.' 
    });

  } catch (error: any) {
    console.error('Error al actualizar rubro:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error interno del servidor.' 
    });
  }
});

/**
 * DELETE /api/docentes/grupos/:grupoId/evaluaciones/:evaluacionId
 * Elimina un criterio de evaluación y su acta de calificaciones asociada.
 */
router.delete('/grupos/:grupoId/evaluaciones/:evaluacionId', async (req: Request, res: Response) => {
  try {
    const { grupoId, evaluacionId } = req.params;
    // En una app real, docenteUid vendría del middleware de autenticación (req.user.uid)
    const docenteUid = (req as any).user.uid;

    if (!docenteUid) {
      return res.status(401).json({ success: false, message: 'Falta UID del docente.' });
    }

    // Llamada a la Lógica de Negocio (Borrado en Cascada)
    await eliminarEvaluacion(docenteUid, grupoId as string, evaluacionId as string);

    return res.status(200).json({ 
      success: true, 
      message: 'Rubro y calificaciones eliminados correctamente.' 
    });

  } catch (error: any) {
    console.error('Error al eliminar rubro:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error interno del servidor.' 
    });
  }
});

/**
 * @route   POST /api/docente/asistencia
 * @desc    (RF 5.1) Registra el pase de lista de un grupo para un día.
 * @access  Privado (Docente)
 */
router.post('/asistencia', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const { grupoId, fecha, estatusAlumnos } = req.body; // fecha en "YYYY-MM-DD", estatusAlumnos: { "uid1": "PRESENTE", ... }

    if (!grupoId || !fecha || !estatusAlumnos) {
      return res.status(400).json({ message: 'Faltan datos (grupoId, fecha, estatusAlumnos)' });
    }
    
    const asistencia = await ServicioDocente.guardarAsistenciaDia(
      docenteUid, grupoId, estatusAlumnos
    );
    res.status(201).json(asistencia);
    
  } catch (error: any) {
    res.status(403).json({ message: `Error al registrar asistencia: ${error.message}` });
  }
});

// --- Rutas de Gestión Documental ---

/**
 * @route   GET /api/docente/reportes
 * @desc    Obtiene TODOS los reportes (Admin/Directora/Docente).
 */
router.get('/reportes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const reportes = await ServicioDocente.consultarTodosReportes();
    res.status(200).json(reportes);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar reportes', error: error.message });
  }
});

/**
 * @route   GET /api/docente/reportes/estudiante/:uid
 * @desc    Obtiene los reportes de un alumno específico.
 */
router.get('/reportes/estudiante/:uid', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const reportes = await ServicioDocente.consultarReportesPorEstudiante(uid as string);
    res.status(200).json(reportes);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar reportes del alumno', error: error.message });
  }
});

/**
 * @route   DELETE /api/docente/reporte-indisciplina/:id
 * @desc    Elimina un reporte de indisciplina.
 * @access  Privado (Docente/Admin)
 */
router.delete('/reporte-indisciplina/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const usuarioUid = (req as any).user.uid;
    const { id } = req.params;

    await ServicioDocente.eliminarReporte(usuarioUid, id as string);
    res.status(200).json({ message: 'Reporte eliminado correctamente' });

  } catch (error: any) {
    res.status(500).json({ message: `Error al eliminar: ${error.message}` });
  }
});

// --- Rutas de REPORTES DE INDISCIPLINA ---

/**
 * @route   POST /api/docente/reporte-indisciplina
 * @desc    (RF 3.5) Crea un reporte de indisciplina.
 * @access  Privado (Docente)
 */
router.post('/reporte-indisciplina', async (req: Request, res: Response) => {
  try {
    // El UID del docente viene del token (middleware)   
    const docenteUid = (req as any).user.uid;
    
    // Desestructuramos el body para validar
    const { estudianteUid, descripcion, tipo, severidad, fecha } = req.body;

    console.log("Estudiante " + estudianteUid);
    console.log("Descripción " + descripcion);
    console.log("Estudiante " + tipo);
    console.log("Severidad " + severidad);
    console.log("Fecha " + fecha);
    
    

    // 1. Validaciones básicas
    if (!estudianteUid || !descripcion || !tipo || !severidad || !fecha) {
      return res.status(400).json({ 
        message: 'Faltan datos obligatorios (estudiante, descripción, tipo, severidad o fecha).' 
      });
    }

    // 2. Llamar al servicio
    // Pasamos el body completo, el servicio se encarga de tiparlo
    const reporte = await ServicioDocente.crearReporteIndisciplina(docenteUid, req.body);
    
    // 3. Responder
    res.status(201).json(reporte);

  } catch (error: any) {
    console.error('Error al crear reporte:', error);
    res.status(500).json({ message: `Error interno al guardar reporte: ${error.message}` });
  }
});

/**
 * @route   GET /api/docente/reportes
 * @desc    Obtiene TODOS los reportes con detalles del alumno.
 * @access  Privado
 */
router.get('/reportes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const reportes = await ServicioDocente.consultarTodosReportes();
    res.status(200).json(reportes);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar reportes', error: error.message });
  }
});

/**
 * @route   GET /api/docente/reportes/estudiante/:uid
 * @desc    Obtiene los reportes de un alumno específico.
 * @access  Privado
 */
router.get('/reportes/estudiante/:uid', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const reportes = await ServicioDocente.consultarReportesPorEstudiante(uid as string);
    res.status(200).json(reportes);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar reportes del alumno', error: error.message });
  }
});

/**
 * @route   DELETE /api/docente/reporte-indisciplina/:id
 * @desc    Elimina un reporte.
 * @access  Privado
 */
router.delete('/reporte-indisciplina/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const usuarioUid = (req as any).user.uid;
    const { id } = req.params;
    await ServicioDocente.eliminarReporte(usuarioUid, id as string);
    res.status(200).json({ message: 'Reporte eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ message: `Error al eliminar: ${error.message}` });
  }
});


/**
 * @route   GET /api/docente/dashboard/estadisticas
 * @desc    Obtiene los contadores para el panel de inicio del docente.
 * @access  Privado (Docente)
 */
router.get('/dashboard/estadisticas', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    
    const estadisticas = await ServicioDocente.generarEstadisticasDocente(docenteUid);
    res.status(200).json(estadisticas);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al generar estadísticas del docente', error: error.message });
  }
});


/**
 * @route   GET /api/docente/busqueda
 * @desc    Busca grupos o alumnos del docente.
 * @query   q (término de búsqueda)
 */
router.get('/busqueda', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(200).json({ grupos: [], estudiantes: [] });
    }

    const resultados = await ServicioDocente.buscarEnMisClases(docenteUid, q);
    res.status(200).json(resultados);

  } catch (error: any) {
    res.status(500).json({ message: 'Error en la búsqueda', error: error.message });
  }
});

/**
 * @route   GET /api/docente/grupos/:grupoId/promedios/:periodoId
 * @desc    Obtiene el promedio final calculado de los alumnos en un periodo anterior.
 */
router.get('/grupos/:grupoId/promedios/:periodoId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { grupoId, periodoId } = req.params;
    const promedios = await ServicioDocente.obtenerPromediosPeriodo(grupoId as string, periodoId as string);
    res.status(200).json(promedios);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener promedios anteriores', error: error.message });
  }
});

/**
 * @route   POST /api/docente/solicitud-rectificacion
 * @desc    Crea un ticket para solicitar cambio de calificación.
 * @access  Privado (Docente)
 */
router.post('/solicitud-rectificacion', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    
    // Extraemos los datos del cuerpo
    const { 
      uidAlumno, nombreAlumno, 
      idMateria, nombreMateria, 
      calificacionAnterior, calificacionNueva, 
      motivo, nombreDocente 
    } = req.body;

    // Validaciones básicas
    if (!uidAlumno || !idMateria || calificacionNueva === undefined || !motivo) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para la solicitud.' });
    }

    const idTicket = await ServicioDocente.crearSolicitudRatificacion(docenteUid, {
      uidAlumno, nombreAlumno,
      idMateria, nombreMateria,
      calificacionAnterior, calificacionNueva,
      motivo, uidDocente: docenteUid, nombreDocente,
      fechaSolicitud: undefined,
      estado: 'PENDIENTE'
    });

    res.status(201).json({ 
      success: true, 
      message: 'Solicitud enviada a Dirección correctamente.',
      ticketId: idTicket
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: `Error al crear solicitud: ${error.message}` });
  }
});

/**
 * @route   GET /api/docente/mis-solicitudes
 * @desc    Obtiene el historial de tickets de corrección del docente
 */
router.get('/mis-solicitudes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const solicitudes = await ServicioDocente.consultarMisSolicitudes(docenteUid);
    res.status(200).json(solicitudes);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener solicitudes', error: error.message });
  }
});

/**
 * @route   GET /api/docente/avisos
 * @desc    Obtiene los últimos avisos institucionales
 */
router.get('/avisos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const avisos = await ServicioDocente.consultarAvisosInstitucionales();
    res.status(200).json(avisos);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener avisos', error: error.message });
  }
});

/**
 * @route   GET /api/docente/alertas
 * @desc    Obtiene las alertas tempranas (alumnos en riesgo) de los grupos del docente
 */
router.get('/alertas', authMiddleware, async (req: Request, res: Response) => {
  try {
    const docenteUid = (req as any).user.uid;
    const alertas = await ServicioDocente.consultarAlertasTempranas(docenteUid);
    res.status(200).json(alertas);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener alertas', error: error.message });
  }
});

/**
 * @route   GET /api/docente/grupo/:grupoId/expediente/:estudianteUid
 * @desc    Obtiene los KPIs y el historial del Expediente 360 de un estudiante
 */
router.get('/grupo/:grupoId/expediente/:estudianteUid', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { grupoId, estudianteUid } = req.params;
    
    // Llamamos a la función recién creada
    const expediente = await ServicioDocente.obtenerExpediente360(estudianteUid as string, grupoId as string);
    
    res.status(200).json(expediente);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener el expediente 360', error: error.message });
  }
});

// Asegúrate de importar tu ServicioDocente arriba

/**
 * @route   POST /api/docentes/grupo/:grupoId/asistencia-inteligente
 * @desc    Guarda el pase de lista con el periodo incluido
 */
router.post('/grupo/:grupoId/asistencia-inteligente', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { grupoId } = req.params;
    const { periodoId, fecha, registro } = req.body;

    const resultado = await ServicioDocente.guardarAsistenciaInteligente(grupoId as string, periodoId as string, fecha, registro);
    res.status(200).json(resultado);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al guardar asistencia', error: error.message });
  }
});

/**
 * @route   GET /api/docentes/grupo/:grupoId/periodo/:periodoId/estadisticas-asistencia
 * @desc    Obtiene las métricas de faltas y el Sparkline
 */
router.get('/grupo/:grupoId/periodo/:periodoId/estadisticas-asistencia', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { grupoId, periodoId } = req.params;
    const estadisticas = await ServicioDocente.obtenerEstadisticasAsistencia(grupoId as string, periodoId as string);
    res.status(200).json(estadisticas);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al calcular estadísticas', error: error.message });
  }
});

/**
 * @route   GET /api/docente/buscar/global
 * @desc    Buscador en tiempo real para el modal Spotlight
 */
router.get('/buscar/global', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') return res.status(200).json([]);
    
    const resultados = await ServicioDocente.buscarDocentesGlobal(q);
    res.status(200).json(resultados);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;