/**
 * ====================================================================
 * RUTAS DE USUARIOS
 * ====================================================================
 * Implementa RF 1.1 (Endpoints de Gestión de Cuentas).
 *
 * Este archivo es el "Controlador". Define los endpoints de la API y llama a los servicios (la lógica de negocio) para
 * hacer el trabajo pesado.
 */
import { Router, type Request, type Response } from "express";
import * as ServicioUsuarios from "../ServiciosActivos/Usuarios.js";
import authMiddleware from "../APIs/auth.middleware.js";

const router = Router();

/**
 * @route   POST /api/usuarios/
 * @desc    (RF 1.1) Crear un nuevo usuario (Estudiante o Empleado).
 * @access  Privado (requiere token de admin/control_escolar)
 */
router.post("/", authMiddleware, async (req: Request, res: Response) => 
{
    try 
    {
        // 1. Validar la entrada (req.body)
        const { email, password, datosPersona, datosRol, tipoRol } = req.body;
        const adminUid = (req as any).user.uid; // UID del admin que hace la llamada

        if (!email || !password || !datosPersona || !datosRol || !tipoRol) 
        {
            return res.status(400).json
        ({
          message:
            "Faltan campos (email, password, datosPersona, datosRol, tipoRol)",
        });
      }

      const nuevoUid = await ServicioUsuarios.crearUsuario
      (
        email,
        password,
        datosPersona,
        datosRol,
        tipoRol,
        adminUid
      );

      res.status(201).json({
        message: "Usuarios creado exitosamente",
        uid: nuevoUid,
      });
    } catch (error: any) {
      // 4. Manejo de Errores
      console.error("Error en POST /api/usuarios:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @route   GET /api/usuarios/perfil/:uid
 * @desc    (RNF 2.3) Obtener el perfil unificado de un usuario.
 * @access  Privado
 */
router.get(
  "/perfil/:uid",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      // 1. Obtener el UID de los parámetros de la URL
      const { uid } = req.params;

      // 2. Llamar al Servicio
      const perfil = await ServicioUsuarios.obtenerPerfilUsuario(uid as string);

      // 3. Devolver la respuesta
      if (!perfil) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.status(200).json(perfil);
    } catch (error: any) {
      console.error("Error en GET /api/usuarios/perfil/:uid:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @route   PATCH /api/usuarios/:uid/baja
 * @desc    (RF 2.1) Dar de baja (lógica) a un usuario.
 * @access  Privado
 */
router.patch(
  "/:uid/baja",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      // 1. Obtener datos
      const { uid } = req.params;
      const adminUid = (req as any).user.uid;

      // 2. Llamar al Servicio
      await ServicioUsuarios.darDeBajaUsuario(uid as string, adminUid);

      // 3. Devolver respuesta
      res.status(200).json({
        message: "Usuario dado de baja (deshabilitado) exitosamente.",
      });
    } catch (error: any) {
      console.error("Error en PATCH /api/usuarios/:uid/baja:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
