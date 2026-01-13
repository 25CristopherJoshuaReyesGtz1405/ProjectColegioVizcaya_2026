import { Router, type Request, type Response } from 'express';
import * as ServicioReportes from '../ServiciosActivos/ReportesBoletas.js';
import authMiddleware from '../APIs/auth.middleware.js';
import { obtenerBoletaActual } from '../ServiciosActivos/ReportesBoletas.js';

const router = Router();

// Todas las rutas aquí requieren autenticación
// (Idealmente, rol de Admin/Directora)
router.use(authMiddleware);


router.get('/kardex/:estudianteUid', async (req: Request, res: Response) => {
  try {
    const { estudianteUid } = req.params;

    // 1. Validar entradas
    if (!estudianteUid) {
      return res.status(400).json({ message: 'Falta el :estudianteUid en la URL' });
    }

    // 2. Llamar al servicio
    const boletaDTO = await ServicioReportes.generarKardexEstudiante(estudianteUid as string);

    res.status(200).json(boletaDTO);

  } catch (error: any) {
    console.error('Error en GET /api/boletas/kardex:', error);
    res.status(500).json({ message: 'Error al generar el kardex', error: error.message });
  }
});


/**
 * @route   GET /api/reportes/boleta/:estudianteUid
 * @desc    (RF 6.1) Genera la Boleta (DTO) de un estudiante para un ciclo.
 * @access  Privado (Control Escolar / Directora)
 * @query   cicloEscolar (ej: "2024-2025")
 */
router.get('/boleta/:estudianteUid', async (req: Request, res: Response) => {
  try {
    const { estudianteUid } = req.params;
    const { cicloEscolar } = req.query;

    // 1. Validar entradas
    if (!estudianteUid) {
      return res.status(400).json({ message: 'Falta el :estudianteUid en la URL' });
    }
    if (!cicloEscolar) {
      return res.status(400).json({ message: 'Falta el query param ?cicloEscolar=' });
    }

    // 2. Llamar al servicio
    const boletaDTO = await ServicioReportes.generarBoletaEstudiante(
      estudianteUid as string,
      cicloEscolar as string
    );

    // 3. Devolver el DTO (JSON)
    // (RF 6.2 - Generación de PDF se haría en otro endpoint
    //  que reciba este JSON y lo convierta)
    res.status(200).json(boletaDTO);

  } catch (error: any) {
    console.error('Error en GET /api/reportes/boleta:', error);
    res.status(500).json({ message: 'Error al generar la boleta', error: error.message });
  }
});

export const getBoleta = async (req: Request, res: Response) => {
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
};


export default router;