/**
 * ====================================================================
 * RUTAS DE GESTIÓN DE ESTUDIANTES
 * ====================================================================
 * Endpoints para que un Administrador (Control Escolar)
 * gestione a los estudiantes.
 */
import { Router, type Request, type Response } from 'express';
// Asegúrate que el nombre del archivo coincida
import * as ServicioEstudiantes from '../ServiciosActivos/Estudiantes.js'; 
import authMiddleware from '../APIs/auth.middleware.js';
import multer from 'multer'; // <-- ¡NUEVO!
import { generarKardexEstudiante, obtenerBoletaActual } from '../ServiciosActivos/ReportesBoletas.js';

// Configuración de Multer para guardar el archivo en memoria
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
router.use(authMiddleware);

/**
 * ====================================================================
 * ¡NUEVA RUTA! (RF 1.4)
 * @route   POST /api/estudiantes/masivo
 * @desc    Sube un archivo .csv para el registro masivo de estudiantes.
 * @access  Privado (Admin)
 * ====================================================================
 */
router.post(
  '/masivo',
  upload.single('archivoCsv'), // 'archivoCsv' debe ser el 'name' del input en el frontend
  async (req: Request, res: Response) => {
    try {
      const adminUid = (req as any).user.uid;

      // 1. Validar que el archivo exista
      if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo.' });
      }

      // 2. Obtener el buffer del archivo (el contenido)
      const buffer = req.file.buffer;

      // 3. Llamar al servicio para procesar el buffer
      const reporte = await ServicioEstudiantes.crearEstudiantesMasivo(
        buffer,
        adminUid
      );

      // 4. Devolver el reporte
      if (reporte.fallidos > 0) {
        // Si hubo errores, se considera un éxito parcial
        return res.status(207).json({
          message: `Proceso completado con errores. ${reporte.exitosos} / ${reporte.total} exitosos.`,
          reporte: reporte
        });
      } else {
        // Todo salió bien
        return res.status(201).json({
          message: `Carga masiva exitosa. ${reporte.exitosos} estudiantes creados.`,
          reporte: reporte
        });
      }

    } catch (error: any) {
      console.error('Error en ruta /masivo:', error.message);
      res.status(500).json({ message: `Error al procesar el archivo: ${error.message}`, reporte: null });
    }
  }
);
/**
 * @route   GET /api/estudiantes/
 * @desc    Consultar todos los estudiantes (con ordenamiento).
 * @access  Privado (Admin/Docente)
 * @query   sortBy (ej: 'rol.matricula'), order ('asc' o 'desc')
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sortBy, order } = req.query;
    
    const estudiantes = await ServicioEstudiantes.consultarTodosEstudiantes(
      sortBy as string | undefined,
      order as 'asc' | 'desc' | undefined
    );
    
    res.status(200).json(estudiantes);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/baja', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sortBy, order } = req.query;
    
    const estudiantes = await ServicioEstudiantes.consultarTodosEstudiantesBaja(
      sortBy as string | undefined,
      order as 'asc' | 'desc' | undefined
    );
    
    res.status(200).json(estudiantes);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/estudiantes/matricula/:matricula
 * @desc    Consultar un estudiante por matrícula.
 * @access  Privado (Admin/Docente)
 */
router.get('/matricula/:matricula', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { matricula } = req.params;
    const perfil = await ServicioEstudiantes.consultarEstudiantePorMatricula(matricula as string);
    
    if (!perfil) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    res.status(200).json(perfil);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/uid/:matricula', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { matricula } = req.params;
    const perfil = await ServicioEstudiantes.consultarEstudiantePorUID(matricula as string);
    
    if (!perfil) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    res.status(200).json(perfil);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   PUT /api/estudiantes/:uid
 * @desc    Actualizar los datos de un estudiante.
 * @access  Privado (Admin)
 */
router.put('/:uid', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { datosPersona, datosRol } = req.body;
    const adminUid = (req as any).user.uid;

    if (!datosPersona && !datosRol) {
      return res.status(400).json({ 
        message: 'Se requieren "datosPersona" o "datosRol" en el body.' 
      });
    }

    const perfilActualizado = await ServicioEstudiantes.actualizarEstudiante(
      uid as string,
      adminUid,
      datosPersona,
      datosRol
    );
    
    res.status(200).json(perfilActualizado);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:uid/boleta', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params; // El UID viene en la URL
    
    // Llamamos a la nueva función que detecta el ciclo sola
    const dataBoleta = await obtenerBoletaActual(uid as string);
    
    // Respondemos con el JSON exactv o que espera tu ImpresionService
    res.status(200).json(dataBoleta);

  } catch (error:any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Error al generar la boleta' });
  }
});

router.get('/:estudianteUid/kardex', async (req: Request, res: Response) => {
  try {
    const { estudianteUid } = req.params;

    // 1. Validar entradas
    if (!estudianteUid) {
      return res.status(400).json({ message: 'Falta el :estudianteUid en la URL' });
    }

    // 2. Llamar al servicio
    const boletaDTO = await generarKardexEstudiante(estudianteUid as string);

    res.status(200).json(boletaDTO);

  } catch (error: any) {
    console.error('Error en GET /api/boletas/kardex:', error);
    res.status(500).json({ message: 'Error al generar el kardex', error: error.message });
  }
});


export default router;