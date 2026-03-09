/**
 * ====================================================================
 * RUTA: GESTIÓN DE PADRES (TUTORES)
 * ====================================================================
 * Endpoint protegido que expone la lógica de negocio para los tutores.
 * * Dependencias:
 * - authMiddleware: Garantiza que solo usuarios logueados accedan.
 * - ServicioPadres: Contiene la lógica y el registro de Logs.
 */
import { Router, type Request, type Response } from 'express';
import * as ServicioPadres from '../ServiciosActivos/PadresFamilia.js';
import authMiddleware from '../APIs/auth.middleware.js';

const router = Router();

// 1. Candado de Seguridad: Middleware de Autenticación
// Esto asegura que 'req.user.uid' exista y sea válido.
router.use(authMiddleware);

/**
 * @route   GET /api/tutores/mis-hijos
 * @desc    Obtiene el Dashboard del Padre: Lista de hijos vinculados + Resumen académico.
 * @access  Privado (Requiere Token de Firebase)
 * @log     La auditoría se maneja internamente en ServicioPadres.consultarHijosDelTutor
 */
router.get('/mis-hijos', async (req: Request, res: Response) => {
  try {
    // Obtenemos el UID seguro desde el token decodificado
    const tutorUid = (req as any).user.uid;

    // Llamamos al servicio de negocio
    const listaHijos = await ServicioPadres.consultarHijosDelTutor(tutorUid);
    
    res.status(200).json(listaHijos);

  } catch (error: any) {
    // Manejo de Errores Profesional con códigos HTTP adecuados
    console.error("[API Padres] Error en GET /mis-hijos:", error.message);

    // Errores de Negocio (403 Forbidden)
    if (
        error.message.includes('No tiene un perfil') || 
        error.message.includes('no está activa') ||
        error.message.includes('ERROR_ACCESO_TUTOR')
    ) {
      return res.status(403).json({ 
        message: 'Acceso denegado. Verifique su perfil de tutor.',
        detalle: error.message 
      });
    }

    // Errores de Servidor (500 Internal Server Error)
    res.status(500).json({ 
      message: 'Error interno al consultar la información familiar.', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

/**
 * @route   GET /api/tutores/validar-acceso/:estudianteUid
 * @desc    Verifica si el tutor tiene permiso sobre un estudiante específico.
 * Útil antes de permitir descargas de archivos directos.
 */
router.get('/validar-acceso/:estudianteUid', async (req: Request, res: Response) => {
    try {
        const tutorUid = (req as any).user.uid;
        const { estudianteUid } = req.params;

        const tienePermiso = await ServicioPadres.validarTutoria(tutorUid, estudianteUid as string);

        if (!tienePermiso) {
            return res.status(403).json({ 
                autorizado: false, 
                message: 'No tiene permisos sobre este estudiante.' 
            });
        }

        res.status(200).json({ autorizado: true });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;