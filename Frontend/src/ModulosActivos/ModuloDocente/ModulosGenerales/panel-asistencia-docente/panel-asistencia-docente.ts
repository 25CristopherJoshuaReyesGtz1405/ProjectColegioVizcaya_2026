import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { GruposService } from '../../../../ServiciosActivos/grupos.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { TarjetaStadistic } from '../../../../ComponentesActivos/tarjeta-stadistic/tarjeta-stadistic';

interface AlumnoAsistencia {
  uid: string;
  nombre: string;
  matricula: string;
  fotoUrl?: string;
  estatus: 'PRESENTE' | 'RETARDO' | 'AUSENTE'; // Estado actual
  modificado: boolean;
}

@Component({
  selector: 'app-panel-asistencia-docente',
  standalone: true,
  imports: [CommonModule, FormsModule, TarjetaStadistic],
  templateUrl: './panel-asistencia-docente.html',
  styleUrl: './panel-asistencia-docente.scss'
})
export class PanelAsistenciaDocente implements OnInit {

  private docentesService = inject(DocentesService);
  private gruposService = inject(GruposService);
  private notificaciones = inject(NotificacionesService);
  private catalogosService = inject(CatalogosService);


  // Datos
  misGrupos: any[] = [];
  alumnos: AlumnoAsistencia[] = [];
  
  // Estado
  seleccion = { 
    grupoId: '', 
    fecha: new Date().toISOString().split('T')[0] // Hoy por defecto (YYYY-MM-DD)
  };
  
  cargandoLista = false;
  guardando = false;

  periodos: any[] = [];
  evaluaciones: any[] = [];
  stats: any = null; // Datos para las tarjetas

  cargando = true;       // Carga inicial (Stats + Catálogos)
  cargandoTabla = false; // Carga solo la lista (sin parpadeo)
  actaCerrada = false;
  mostrarModalEvaluacion = false;

  // Resumen
  resumen = { presentes: 0, retardos: 0, ausentes: 0 };

  ngOnInit() {
    this.cargarDatosIniciales(); 
    this.docentesService.getMisGrupos().subscribe(g => this.misGrupos = g);
  }

  // --- CARGA DE DATOS ---

  cargarDatosIniciales() {
    this.cargando = true;
    
    // 1. Cargar Estadísticas
    this.docentesService.getEstadisticasDashboard().subscribe({
      next: (data) => this.stats = data,
      error: () => console.warn('No se pudieron cargar estadísticas')
    });

    // 2. Cargar Catálogos
    this.catalogosService.getAllPeriodos().subscribe(p => this.periodos = p.filter(x => x.estatus === 'ABIERTO'));
    
    this.docentesService.getMisGrupos().subscribe({
      next: (g) => {
        this.misGrupos = g;
        this.cargando = false; // Finaliza la carga inicial
      },
      error: () => this.cargando = false
    });
  }

  cargarAsistencia() {
    if (!this.seleccion.grupoId || !this.seleccion.fecha) return;

    this.cargandoLista = true;

    // 1. Obtener Estudiantes
    this.gruposService.getEstudiantesGrupo(this.seleccion.grupoId).subscribe({
      next: (estudiantes) => {
        
        // 2. Obtener Asistencia Guardada (si existe)
        this.docentesService.consultarAsistenciaDia(this.seleccion.grupoId, this.seleccion.fecha).subscribe({
          next: (data) => {
            const mapaEstados = data?.estatusAlumnos || {};

            this.alumnos = estudiantes.map(e => ({
              uid: e.persona.uid,
              nombre: `${e.persona.apellidos} ${e.persona.nombre}`,
              matricula: (e.rol as any)?.matricula || '--',
              fotoUrl: e.persona.fotoUrl,
              // Si ya tiene estado lo ponemos, si no, por defecto es 'PRESENTE'
              estatus: mapaEstados[e.persona.uid] || 'PRESENTE',
              modificado: false
            }));

            this.alumnos.sort((a, b) => a.nombre.localeCompare(b.nombre));
            this.calcularResumen();
            this.cargandoLista = false;
          },
          error: () => this.cargandoLista = false
        });
      },
      error: () => {
        this.notificaciones.mostrar('error', 'Error', 'No se cargaron los alumnos.');
        this.cargandoLista = false;
      }
    });
  }

  // --- LÓGICA DE INTERACCIÓN ---

  cambiarEstado(alumno: AlumnoAsistencia, nuevoEstado: 'PRESENTE' | 'RETARDO' | 'AUSENTE') {
    if (alumno.estatus !== nuevoEstado) {
      alumno.estatus = nuevoEstado;
      alumno.modificado = true;
      this.calcularResumen();
    }
  }

  calcularResumen() {
    this.resumen = {
      presentes: this.alumnos.filter(a => a.estatus === 'PRESENTE').length,
      retardos: this.alumnos.filter(a => a.estatus === 'RETARDO').length,
      ausentes: this.alumnos.filter(a => a.estatus === 'AUSENTE').length
    };
  }

  // --- GUARDADO ---

  guardar() {
    this.guardando = true;

    // Convertir array a mapa { uid: estatus }
    const mapaEnvio: any = {};
    this.alumnos.forEach(a => mapaEnvio[a.uid] = a.estatus);

    this.docentesService.registrarAsistencia(
      this.seleccion.grupoId, 
      this.seleccion.fecha, 
      mapaEnvio
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.notificaciones.mostrar('exito', 'Asistencia Guardada', 'Se registró correctamente.');
        this.alumnos.forEach(a => a.modificado = false);
      },
      error: () => {
        this.guardando = false;
        this.notificaciones.mostrar('error', 'Error', 'No se pudo guardar.');
      }
    });
  }
}