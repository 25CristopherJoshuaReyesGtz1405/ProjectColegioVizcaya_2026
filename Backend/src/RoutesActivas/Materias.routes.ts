/**
 * ====================================================================
 * PASO 4: RUTAS DE MATERIAS
 * ====================================================================
 * Endpoints para que un Administrador (Control Escolar)
 * gestione el catálogo de Materias (RF 2.1).
 */
import { Router, type Request, type Response } from 'express';
import * as ServicioMaterias from '../ServiciosActivos/Materias.js'
import authMiddleware from '../APIs/auth.middleware.js';

const router = Router();

// Todas las rutas en este archivo requieren autenticación
// (Idealmente, también un middleware que verifique ROL de admin)
router.use(authMiddleware);

/**
 * @route   POST /api/materias/
 * @desc    Crear una nueva materia.
 * @access  Privado (Control Escolar)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const adminUid = (req as any).user.uid;
    const datosMateria = req.body;

    // Validación básica
    if (!datosMateria.nombre || !datosMateria.claveMateria || !datosMateria.grado) {
      return res.status(400).json({ message: 'Faltan datos (nombre, claveMateria, grado)' });
    }
    
    const nuevaMateria = await ServicioMaterias.crearMateria(adminUid, datosMateria);
    res.status(201).json(nuevaMateria);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear la materia', error: error.message });
  }
});

/**
 * @route   GET /api/materias/
 * @desc    Consultar todas las materias.
 * @access  Privado
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const materias = await ServicioMaterias.consultarTodasMaterias();
    res.status(200).json(materias);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar materias', error: error.message });
  }
});

/**
 * @route   GET /api/materias/:id
 * @desc    Consultar una materia por ID.
 * @access  Privado
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const materia = await ServicioMaterias.consultarMateriaPorId(id as string);
    
    if (!materia) {
      return res.status(404).json({ message: 'Materia no encontrada' });
    }
    res.status(200).json(materia);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar materia', error: error.message });
  }
});

/**
 * @route   PUT /api/materias/:id
 * @desc    Actualizar una materia existente.
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
    
    const materiaActualizada = await ServicioMaterias.actualizarMateria(adminUid, id as string, datos);
    res.status(200).json(materiaActualizada);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar la materia', error: error.message });
  }
});

/**
 * @route   DELETE /api/materias/:id
 * @desc    Eliminar una materia.
 * @access  Privado (Control Escolar)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUid = (req as any).user.uid;

    await ServicioMaterias.eliminarMateria(adminUid, id as string);
    res.status(200).json({ message: 'Materia eliminada exitosamente' });

  } catch (error: any) {
    res.status(500).json({ message: 'Error al eliminar la materia', error: error.message });
  }
});

export default router;