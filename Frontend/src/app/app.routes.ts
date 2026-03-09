import { Routes } from '@angular/router';
// Importa los guardias que acabamos de crear
import { authGuard } from '../ConfiguracionesActivas/Guardias/auth.guard';
import { rolGuard } from '../ConfiguracionesActivas/Guardias/rol.guard';
import { IniciarSesion } from '../ModulosActivos/ModuloAutenticacion/iniciar-sesion/iniciar-sesion';
import { RecuperarAcceso } from '../ModulosActivos/ModuloAutenticacion/recuperar-acceso/recuperar-acceso';
import { PanelInicio } from '../ModulosActivos/ModuloAdministrativo/ModulosGenerales/panel-inicio/panel-inicio';
import { Dashboard } from '../ModulosActivos/ModuloAdministrativo/ModulosGenerales/dashboard/dashboard';
import { PanelEstudiantes } from '../ModulosActivos/ModuloAdministrativo/ModulosGenerales/panel-estudiantes/panel-estudiantes';
import { PanelMaterias } from '../ModulosActivos/ModuloAdministrativo/ModulosGenerales/panel-materias/panel-materias';
import { PanelGrupos } from '../ModulosActivos/ModuloAdministrativo/ModulosGenerales/panel-grupos/panel-grupos';
import { DashboardDocente } from '../ModulosActivos/ModuloDocente/ModulosGenerales/dashboard-docente/dashboard-docente';
import { PanelInicioDocente } from '../ModulosActivos/ModuloDocente/ModulosGenerales/panel-inicio-docente/panel-inicio-docente';
import { PanelCalifcaciones } from '../ModulosActivos/ModuloDocente/ModulosGenerales/panel-califcaciones/panel-califcaciones';
import { PanelAsistenciaDocente } from '../ModulosActivos/ModuloDocente/ModulosGenerales/panel-asistencia-docente/panel-asistencia-docente';
import { PanelGruposDocente } from '../ModulosActivos/ModuloDocente/ModulosGenerales/panel-grupos-docente/panel-grupos-docente';
import { InicioPrincipal } from '../ModulosActivos/ModuloInicioGeneral/ModulosGenerales/inicio-principal/inicio-principal';
import { SplashScreen } from '../ModulosActivos/ModuloAutenticacion/splash-screen/splash-screen';

export const routes: Routes = [
  
  // --- Módulo de Autenticación (Público) ---
  {
    path: 'auth',
    component: IniciarSesion, 
    children: 
    [
      {
        
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        component: IniciarSesion, 
      },
      {
        path: 'recover', 
        component: RecuperarAcceso,
      }
    ]
  },

  {
    path: 'admin',
    component: Dashboard, 
    children: 
    [
      {
        
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        component: PanelInicio, 
      },
      {
        path: 'student',
        component: PanelEstudiantes, 
      },
      {
        path: 'subject',
        component: PanelMaterias, 
      },
      {
        path: 'groups',
        component: PanelGrupos, 
      },
    ]
  },

  {
    path: 'teacher',
    component: DashboardDocente, 
    canActivate: [authGuard, rolGuard],
    data: { rolRequerido: 'docente' }, // Le dice al 'rolGuard' qué rol buscar
    children: 
    [
      {
        
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        component: PanelInicioDocente, 
      },
      {
        path: 'student',
        component: PanelEstudiantes, 
      },
      {
        path: 'subject',
        component: PanelMaterias, 
      },
      {
        path: 'groups',
        component: PanelGruposDocente, 
      },
      {
        path: 'calif',
        component: PanelCalifcaciones, 
      },
      {
        path: 'asist',
        component: PanelAsistenciaDocente, 
      },
    ]
  },

  // --- Ruta de Splash (Pública) ---
  
  {
    path: 'home',
    
    children:
    [
      {
        path: '', 
        component: SplashScreen
      },
      {
        path: 'start',
        component: InicioPrincipal,
      }
    ]
  },

  
  
  /*
  // --- Rutas por Defecto ---
  {
    path: '',
    redirectTo: 'splash', // La app siempre empieza en el splash
    pathMatch: 'full'
  },
  {
    path: '**', // Cualquier otra ruta (404)
    redirectTo: 'splash'
  }*/

    {
    path: '',
    redirectTo: 'home', 
    pathMatch: 'full'
  },
];