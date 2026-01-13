/**
 * ====================================================================
 * PASO 4: RUTAS DE PERIODOS
 * ====================================================================
 * Endpoints para que un Administrador (Control Escolar)
 * gestione el catálogo de Periodos (RF 2.1, RF 2.2, RF 3.2).
 */
import { Router, type Request, type Response } from 'express';
import * as ServicioPeriodos from '../ServiciosActivos/Periodos.js';
import authMiddleware from '../APIs/auth.middleware.js';

const router = Router();

// Todas las rutas aquí requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/periodos/
 * @desc    Crear un nuevo periodo de evaluación.
 * @access  Privado (Control Escolar)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const adminUid = (req as any).user.uid;
    const { nombre, fechaInicio, fechaFin, estatus } = req.body;

    // Validación básica
    if (!nombre || !fechaInicio || !fechaFin) {
      return res.status(400).json({ message: 'Faltan datos (nombre, fechaInicio, fechaFin)' });
    }
    
    const nuevoPeriodo = await ServicioPeriodos.crearPeriodo(adminUid, req.body);
    res.status(201).json(nuevoPeriodo);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear el periodo', error: error.message });
  }
});

/**
 * @route   GET /api/periodos/
 * @desc    Consultar todos los periodos.
 * @access  Privado
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const periodos = await ServicioPeriodos.consultarTodosPeriodos();
    res.status(200).json(periodos);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar periodos', error: error.message });
  }
});

/**
 * @route   GET /api/periodos/:id
 * @desc    Consultar un periodo por ID.
 * @access  Privado
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const periodo = await ServicioPeriodos.consultarPeriodoPorId(id as string);
    
    if (!periodo) {
      return res.status(404).json({ message: 'Periodo no encontrado' });
    }
    res.status(200).json(periodo);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar periodo', error: error.message });
  }
});

/**
 * @route   PUT /api/periodos/:id
 * @desc    Actualizar un periodo (nombre, fechas).
 * @access  Privado (Control Escolar)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const datos = req.body;
    const adminUid = (req as any).user.uid;

    if (Object.keys(datos).length === 0) {
      return res.status(400).json({ message: 'No se enviaron datos para actualizar' });
    }
    
    // Esta ruta actualiza todo el periodo (nombre, fechas, estatus)
    const periodoActualizado = await ServicioPeriodos.actualizarPeriodo(adminUid, id as string, datos);
    res.status(200).json(periodoActualizado);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar el periodo', error: error.message });
  }
});

/**
 * @route   DELETE /api/periodos/:id
 * @desc    Eliminar un periodo.
 * @access  Privado (Control Escolar)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUid = (req as any).user.uid;

    await ServicioPeriodos.eliminarPeriodo(adminUid, id as string);
    res.status(200).json({ message: 'Periodo eliminado exitosamente' });

  } catch (error: any) {
    res.status(500).json({ message: 'Error al eliminar el periodo', error: error.message });
  }
});

export default router;