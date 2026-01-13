/**
 * ====================================================================
 * PASO 4: RUTAS DE GRUPOS
 * ====================================================================
 * Endpoints para que un Administrador (Control Escolar)
 * gestione los Grupos (RF 2.3).
 * Basado en las rutas del 'grupos.routes.ts' de referencia.
 */
import { Router, type Request, type Response } from 'express';
import * as ServicioGrupos from '../ServiciosActivos/Grupos.js';
import authMiddleware from '../APIs/auth.middleware.js';

const router = Router();

// Todas las rutas aquí requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/grupos/
 * @desc    Crear un nuevo grupo (clase).
 * @access  Privado (Control Escolar)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const adminUid = (req as any).user.uid;
    const datosGrupo = req.body;
    
    const nuevoGrupo = await ServicioGrupos.crearGrupo(adminUid, datosGrupo);
    res.status(201).json(nuevoGrupo);

  } catch (error: any) {
    res.status(500).json({ message: `Error al crear grupo: ${error.message}` });
  }
});

/**
 * @route   GET /api/grupos/
 * @desc    Consultar todos los grupos con detalles (materia y docente).
 * @access  Privado
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const grupos = await ServicioGrupos.consultarTodosGruposConDetalles();
    res.status(200).json(grupos);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar grupos', error: error.message });
  }
});

/**
 * @route   GET /api/grupos/:id
 * @desc    Consultar un grupo por ID.
 * @access  Privado
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const grupo = await ServicioGrupos.consultarGrupoPorId(id as string);
    
    if (!grupo) {
      return res.status(44).json({ message: 'Grupo no encontrado' });
    }
    res.status(200).json(grupo);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al consultar grupo', error: error.message });
  }
});

/**
 * @route   PUT /api/grupos/:id
 * @desc    Actualizar un grupo (ej. cambiar docente o ciclo).
 * @access  Privado (Control Escolar)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const datos = req.body;
    const adminUid = (req as any).user.uid;

    const grupoActualizado = await ServicioGrupos.actualizarGrupo(adminUid, id as string, datos);
    res.status(200).json(grupoActualizado);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar grupo', error: error.message });
  }
});


/**
 * @route   DELETE /api/grupos/:id
 * @desc    Elimina a un grupo.
 * @access  Privado (Control Escolar)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const datos = req.body;
    const adminUid = (req as any).user.uid;

    const grupoActualizado = await ServicioGrupos.eliminarGrupo(adminUid, id as string);
    res.status(200).json(grupoActualizado);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar grupo', error: error.message });
  }
});


// --- Rutas de Gestión de Estudiantes en Grupos ---

/**
 * @route   GET /api/grupos/:id/estudiantes
 * @desc    Obtiene la lista de perfiles de alumnos en un grupo.
 * @access  Privado
 */
router.get('/:id/estudiantes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alumnos = await ServicioGrupos.obtenerAlumnosPorGrupo(id as string);
    res.status(200).json(alumnos);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener alumnos del grupo', error: error.message });
  }
});

/**
 * @route   POST /api/grupos/:id/estudiantes
 * @desc    Agrega un estudiante a un grupo.
 * @access  Privado (Control Escolar)
 */
router.post('/:id/estudiantes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estudianteUid } = req.body;
    const adminUid = (req as any).user.uid;

    if (!estudianteUid) {
      return res.status(400).json({ message: 'Falta "estudianteUid" en el body' });
    }
    
    const grupo = await ServicioGrupos.agregarEstudianteAGrupo(adminUid, id as string, estudianteUid);
    res.status(200).json(grupo);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al agregar estudiante', error: error.message });
  }
});

/**
 * @route   DELETE /api/grupos/:id/estudiantes/:estudianteUid
 * @desc    Quita a un estudiante de un grupo.
 * @access  Privado (Control Escolar)
 */
router.delete('/:id/estudiantes/:estudianteUid', async (req: Request, res: Response) => {
  try {
    const { id, estudianteUid } = req.params;
    const adminUid = (req as any).user.uid;
    
    const grupo = await ServicioGrupos.quitarEstudianteDeGrupo(adminUid, id as string, estudianteUid as string);
    res.status(200).json(grupo);

  } catch (error: any) {
    res.status(500).json({ message: 'Error al quitar estudiante', error: error.message });
  }
});

export default router;