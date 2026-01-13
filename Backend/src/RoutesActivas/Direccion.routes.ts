/**
 * ====================================================================
 * PASO 4: RUTAS DE DIRECCIÓN (Panel de Dirección)
 * ====================================================================
 * Endpoints para que la Directora gestione y supervise.
 * Implementa RF 4.1, 4.2, 4.3, 4.4, 6.3
 */
import { Router, type Request, type Response } from 'express';
import * as ServicioDashboard from '../ServiciosActivos/Estadisticas.js';
import * as ServicioDireccion from '../ServiciosActivos/Direccion.js';
import * as ServicioReportes from '../ServiciosActivos/ReportesBoletas.js';
import * as ServicioGrupos from '../ServiciosActivos/Grupos.js';
import authMiddleware from '../APIs/auth.middleware.js';
import { log } from 'console';

const router = Router();

// Todas las rutas aquí requieren autenticación
// TODO: Añadir un middleware que verifique que el rol sea 'DIRECTORA'
router.use(authMiddleware);

// --- 1. Rutas de Dashboard (Estadísticas) (RF 4.2) ---

/**
 * @route   GET /api/director/dashboard/estadisticas
 * @desc    Obtiene todos los cálculos estadísticos para el panel.
 * @access  Privado (Directora)
 */
router.get('/dashboard/estadisticas', async (req: Request, res: Response) => {
  try {
    const estadisticas = await ServicioDashboard.generarEstadisticasDashboard();
    res.status(200).json(estadisticas);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al generar estadísticas', error: error.message });
  }
});

// --- 2. Rutas de Supervisión (RF 4.1, 4.3) ---

/**
 * @route   GET /api/director/supervision/planeaciones
 * @desc    Obtiene el "checklist" de todas las planeaciones (RF 4.1).
 * @access  Privado (Directora)
 */
router.get('/supervision/planeaciones', async (req: Request, res: Response) => {
  try {
    const planeaciones = await ServicioDireccion.consultarEstadoPlaneaciones();
    res.status(200).json(planeaciones);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar planeaciones', error: error.message });
  }
});

/**
 * @route   PUT /api/director/supervision/planeaciones/:id
 * @desc    Aprueba o rechaza una planeación (RF 4.1).
 * @access  Privado (Directora)
 */
router.put('/supervision/planeaciones/:id', async (req: Request, res: Response) => {
  try {
    const directorUid = (req as any).user.uid;
    const { id } = req.params;
    const { estatus, comentarios } = req.body;

    if (!estatus || (estatus !== 'REVISADA' && estatus !== 'APROBADA')) {
      return res.status(400).json({ message: 'Estatus inválido' });
    }
    
    const planeacion = await ServicioDireccion.revisarPlaneacion(
      directorUid, id as string, estatus, comentarios
    );
    res.status(200).json(planeacion);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al revisar planeación', error: error.message });
  }
});

/**
 * @route   GET /api/director/supervision/grupo/:id
 * @desc    Obtiene los alumnos de CUALQUIER grupo (RF 4.3).
 * @access  Privado (Directora)
 */
router.get('/supervision/grupo/:id', async (req: Request, res: Response) => {
  try {
    // Reutilizamos la función de 'servicio-grupos'
    const alumnos = await ServicioGrupos.obtenerAlumnosPorGrupo(req.params.id as string);
    res.status(200).json(alumnos);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener alumnos del grupo', error: error.message });
  }
});

// --- 3. Rutas de Agenda Personal (RF 4.4) ---

/**
 * @route   GET /api/director/agenda
 * @desc    Obtiene las actividades de la agenda para una fecha.
 * @access  Privado (Directora)
 * @query   fecha (YYYY-MM-DD)
 */
router.get('/agenda', async (req: Request, res: Response) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ message: 'Falta el query param ?fecha=' });
    }
    
    // (Lógica simple de fecha, se puede expandir a rangos)
    const fechaInicio = new Date(fecha as string);
    
    const actividades = await ServicioDireccion.consultarAgenda(fechaInicio);
    res.status(200).json(actividades);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar agenda', error: error.message });
  }
});

/**
 * @route   POST /api/director/agenda
 * @desc    Crea una nueva actividad en la agenda.
 * @access  Privado (Directora)
 */
router.post('/agenda', async (req: Request, res: Response) => {
  try {    
    const actividad = await ServicioDireccion.crearActividadAgenda(req.body);
    res.status(201).json(actividad);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear actividad', error: error.message });
  }
});

/**
 * @route   PUT /api/director/agenda/:id
 * @desc    Actualiza una actividad (ej. marcar completada).
 * @access  Privado (Directora)
 */
router.put('/agenda/:id', async (req: Request, res: Response) => {
  try {
    const directorUid = (req as any).user.uid;
    const { id } = req.params;
    const actividad = await ServicioDireccion.actualizarActividadAgenda(directorUid, id as string, req.body);
    res.status(200).json(actividad);
  } catch (error: any) {
    res.status(403).json({ message: 'Error al actualizar actividad', error: error.message });
  }
});

/**
 * @route   DELETE /api/director/agenda/:id
 * @desc    Elimina una actividad de la agenda.
 * @access  Privado (Directora)
 */
router.delete('/agenda/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ServicioDireccion.eliminarActividadAgenda(id as string);
    res.status(200).json({ message: 'Actividad eliminada' });
  } catch (error: any) {
    res.status(403).json({ message: 'Error al eliminar actividad', error: error.message });
  }
});

// --- 4. Rutas de Reportes (RF 6.3) ---

/**
 * @route   GET /api/director/reportes/acta-calificaciones
 * @desc    Genera el DTO del Acta de Calificaciones (RF 6.3).
 * @access  Privado (Directora)
 * @query   grupoId, periodoId
 */
router.get('/reportes/acta-calificaciones', async (req: Request, res: Response) => {
  try {
    const { grupoId, periodoId } = req.query;

    if (!grupoId || !periodoId) {
      return res.status(400).json({ message: 'Faltan query params ?grupoId= y ?periodoId=' });
    }

    const actaDTO = await ServicioReportes.generarActaCalificacionesPorGrupo(
      grupoId as string,
      periodoId as string
    );
    
    res.status(200).json(actaDTO);

  } catch (error: any) {
    console.error('Error en GET /api/director/reportes/acta-calificaciones:', error);
    res.status(500).json({ message: 'Error al generar el acta', error: error.message });
  }
});

/**
 * @route   GET /api/director/dashboard/academicas
 * @desc    Obtiene estadísticas de materias y grupos (Riesgo, Cobertura, etc.)
 * @access  Privado (Directora)
 */
router.get('/dashboard/academicas', async (req: Request, res: Response) => {
  try {
    const stats = await ServicioDashboard.generarEstadisticasAcademicas();
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al generar estadísticas académicas', error: error.message });
  }
});

export default router;