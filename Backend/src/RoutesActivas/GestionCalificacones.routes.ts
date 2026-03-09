import { Router, type Request, type Response } from 'express';
import { crearSolicitudCambio, obtenerSolicitudesPendientes } from '../ServiciosActivos/GestionCalificaciones.js';
import { log } from 'console';

const router = Router();

/**
 * POST /api/solicitudes
 * (Docente) Enviar solicitud.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const datos = req.body;
    const docenteUid = (req as any).user.uid  ;

    console.log("Docente UID "+ docenteUid); 
        console.log("Estudiante UID "+ datos.estudianteUid);
        console.log("Calificación "+ datos.calificacionNueva);  

    if (!docenteUid || !datos.estudianteUid || datos.calificacionNueva === undefined)
    {
        
        return res.status(400).json({ success: false, message: 'Datos incompletos.' });

    }

    await crearSolicitudCambio(datos);
    return res.status(201).json({ success: true, message: 'Solicitud enviada a Dirección.' });

  } catch (error: any) {
    console.log(error);
    
    return res.status(500).json({ success: false, message: 'Error al procesar solicitud.' });
  }
});

/**
 * GET /api/solicitudes/pendientes
 * (Directora) Ver lista de pendientes.
 */
router.get('/pendientes', async (req: Request, res: Response) => {
  try {
    const lista = await obtenerSolicitudesPendientes();
    return res.status(200).json({ success: true, data: lista });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error al obtener lista.' });
  }
});

export default router;