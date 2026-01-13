/**
 * ====================================================================
 * ARCHIVO DE APLICACIÓN (app.ts)
 * ====================================================================
 * Este archivo configura la aplicación de Express.
 * Importa y "monta" todas las rutas de la API.
 */
import express from 'express';
import cors from 'cors';

// --- IMPORTACIÓN DE RUTAS ---
import usuariosRouter from './RoutesActivas/Usuarios.routes.js';
import estudiantesRouter from './RoutesActivas/Estudiantes.routes.js'; 
import docenteRouter from './RoutesActivas/Docentes.routes.js'; 
import materiasRouter from './RoutesActivas/Materias.routes.js'; 
import gruposRouter from './RoutesActivas/Grupos.routes.js' ;
import periodosRouter from './RoutesActivas/Periodos.router.js' ;
import reportesBoletasRouter from './RoutesActivas/ReportesBoletas.routes.js' ;
import direccionRoutes from './RoutesActivas/Direccion.routes.js';


const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- MONTAJE DE RUTAS ---
app.use('/api/director', direccionRoutes); 
app.use('/api/usuarios', usuariosRouter);
app.use('/api/estudiantes', estudiantesRouter); 
app.use('/api/docentes', docenteRouter);         
app.use('/api/materias', materiasRouter); 
app.use('/api/grupos', gruposRouter); 
app.use('/api/periodos', periodosRouter); 
app.use('/api/boleta', reportesBoletasRouter)

// Ruta de "Hola Mundo"
app.get('/api', (req, res) => {
  res.status(200).json({ 
    message: '¡🚀 API del Sistema de Gestión Vizcaya funcionando!' 
  });
});

export default app;