import { Component, EventEmitter, Input, Output, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// --- SERVICIOS Y MODELOS ---
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';
import { GruposService } from '../../../../ServiciosActivos/grupos.service';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service'; 
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service'; 
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service'; 
import { PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-drawer-grupo-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drawer-grupo-detalle.html',
  styleUrl: './drawer-grupo-detalle.scss'
})
export class DrawerGrupoDetalle implements OnInit, OnChanges {
  
  // --- ENTRADAS Y SALIDAS ---
  @Input() grupo: any = null;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() grupoActualizado = new EventEmitter<void>();

  // --- INYECCIÓN DE SERVICIOS ---
  private estudiantesService = inject(EstudiantesService);
  private gruposService = inject(GruposService);
  private docentesService = inject(DocentesService); 
  private catalogosService = inject(CatalogosService); 
  private notificaciones = inject(NotificacionesService);
  private impresionService = inject(ImpresionService); 

  // --- VARIABLES DE ESTADO ---
  public todosLosEstudiantes: PerfilUsuarioDTO[] = [];
  public alumnosInscritosDetalle: any[] = [];
  public todosLosDocentes: any[] = []; 
  
  // Inteligencia de Tiempo
  public periodoActivoId: string | null = null; 

  // Signos Vitales
  public promedioCalculado: number = 0;
  public asistenciaCalculada: number = 0;

  // Controles de UI
  public busquedaSpotlight: string = '';
  public mostrarSpotlight: boolean = false;
  public mostrarDropdownDocentes: boolean = false; 
  public estaGuardando: boolean = false;
  public generandoPDF: boolean = false;

  ngOnInit() { 
    this.cargarTodosLosEstudiantes(); 
    this.cargarDocentes(); 
    this.cargarPeriodoInteligente(); 
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['grupo'] && this.grupo) {
      if (!this.grupo.estudianteUids) this.grupo.estudianteUids = [];
      this.hidratarAlumnosInscritos();
      this.busquedaSpotlight = '';
      this.mostrarSpotlight = false;
      this.mostrarDropdownDocentes = false;
    }
  }

  // ==========================================================================
  // CARGA DE DATOS MAESTROS Y PERIODO
  // ==========================================================================
  cargarTodosLosEstudiantes() {
    this.estudiantesService.getEstudiantes('persona.nombre', 'asc').subscribe({
      next: (data) => this.todosLosEstudiantes = data || []
    });
  }

  cargarDocentes() {
    this.docentesService.getDocentes().subscribe({
      next: (data) => this.todosLosDocentes = data || []
    });
  }

  cargarPeriodoInteligente() {
    this.catalogosService.getAllPeriodos().subscribe({
      next: (periodosBase: any[]) => {
        // Ordenamos los periodos cronológicamente
        const periodosOrdenados = periodosBase.sort((a, b) => 
          new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
        );
        
        // INTELIGENCIA: Auto-seleccionar el periodo activo de hoy
        const hoy = new Date().getTime();
        const periodoActivo = periodosOrdenados.find(per => 
          hoy >= new Date(per.fechaInicio).getTime() && hoy <= new Date(per.fechaFin).getTime()
        );
        
        if (periodoActivo) {
          this.periodoActivoId = periodoActivo.id;
          
          // Si el grupo ya estaba cargado, forzamos la descarga de estadísticas con el nuevo periodo
          if (this.grupo && this.grupo.estudianteUids && this.grupo.estudianteUids.length > 0) {
            this.hidratarAlumnosInscritos();
          }
        }
      },
      error: () => console.error("Error al detectar el periodo activo.")
    });
  }

  // ==========================================================================
  // MOTOR DE ALUMNOS E INTELIGENCIA ACADÉMICA (FORKJOIN)
  // ==========================================================================
  hidratarAlumnosInscritos() {
    const uidsInscritos = this.grupo?.estudianteUids || [];
    const estudiantesBasicos = this.todosLosEstudiantes.filter(est => uidsInscritos.includes(est.persona.uid));

    if (estudiantesBasicos.length === 0) {
      this.alumnosInscritosDetalle = [];
      this.calcularEstadisticasVitales();
      return;
    }

    // El sistema decide qué periodo usar (Prioriza el auto-detectado)
    const periodoAUsar = this.periodoActivoId || this.grupo.periodoId || 'PERIODO_ACTUAL';

    // Descargamos las estadísticas del backend de forma silenciosa
    forkJoin({
      estadisticas: this.docentesService.getEstadisticasAsistencia(this.grupo.id, periodoAUsar).pipe(catchError(() => of({})))
    }).subscribe({
      next: (respuestas) => {
        const statsBase = respuestas.estadisticas;

        this.alumnosInscritosDetalle = estudiantesBasicos.map(est => {
          const uid = est.persona.uid;
          const statsDelAlumno = statsBase[uid] || { historialTermico: [], faltasConsecutivas: 0, porcentajeGlobal: 100 };

          return {
            ...est,
            historialTermico: statsDelAlumno.historialTermico,
            faltasConsecutivas: statsDelAlumno.faltasConsecutivas,
            porcentajeGlobal: statsDelAlumno.porcentajeGlobal
          };
        });

        // Ordenamos alfabéticamente para la interfaz visual y el PDF
        this.alumnosInscritosDetalle.sort((a, b) => {
          const apellidoA = a.persona?.apellidos || '';
          const apellidoB = b.persona?.apellidos || '';
          return apellidoA.localeCompare(apellidoB);
        });

        this.calcularEstadisticasVitales();
      },
      error: () => {
        console.error("Error al cruzar datos con el backend.");
        this.alumnosInscritosDetalle = estudiantesBasicos; 
        this.calcularEstadisticasVitales();
      }
    });
  }

  calcularEstadisticasVitales() {
    if (this.alumnosInscritosDetalle.length === 0) {
      this.promedioCalculado = 0;
      this.asistenciaCalculada = 0;
      return;
    }

    let sumaPromedios = 0;
    let sumaAsistencia = 0;
    let alumnosConPromedio = 0;

    this.alumnosInscritosDetalle.forEach(est => {
      const datosRol = est.rol as any;
      if (datosRol && datosRol.promedioGlobal > 0) {
        sumaPromedios += datosRol.promedioGlobal;
        alumnosConPromedio++;
      }
      // Sumamos la asistencia real que nos entregó tu backend
      sumaAsistencia += est.porcentajeGlobal !== undefined ? est.porcentajeGlobal : 100;
    });

    this.promedioCalculado = alumnosConPromedio > 0 ? (sumaPromedios / alumnosConPromedio) : 0;
    this.asistenciaCalculada = sumaAsistencia / this.alumnosInscritosDetalle.length;
  }

  get resultadosSpotlight(): PerfilUsuarioDTO[] {
    if (!this.busquedaSpotlight.trim()) return [];
    const termino = this.busquedaSpotlight.toLowerCase();
    const uidsInscritos = this.grupo?.estudianteUids || []; 

    return this.todosLosEstudiantes.filter(est => {
      const nombre = est.persona?.nombre?.toLowerCase() || '';
      const apellidos = est.persona?.apellidos?.toLowerCase() || '';
      const matricula = (est.rol as any)?.matricula?.toLowerCase() || '';
      const coincide = nombre.includes(termino) || apellidos.includes(termino) || matricula.includes(termino);
      return coincide && !uidsInscritos.includes(est.persona.uid);
    }).slice(0, 5); 
  }

  inscribirAlumno(estudiante: PerfilUsuarioDTO) {
    this.estaGuardando = true;
    const uidsActuales = this.grupo?.estudianteUids || [];
    const nuevosUids = [...uidsActuales, estudiante.persona.uid];
    
    this.gruposService.actualizarGrupo(this.grupo.id, { estudianteUids: nuevosUids }).subscribe({
      next: () => {
        this.grupo.estudianteUids = nuevosUids;
        this.hidratarAlumnosInscritos(); 
        this.busquedaSpotlight = ''; 
        this.notificaciones.mostrar('exito', 'Inscrito', `${estudiante.persona.nombre} ha sido agregado al aula.`);
        this.grupoActualizado.emit();
        this.estaGuardando = false;
      }
    });
  }

  removerAlumno(estudiante: PerfilUsuarioDTO) {
    this.notificaciones.confirmar(
      'Dar de Baja', `¿Remover a ${estudiante.persona.nombre} de esta materia?`,
      () => {
        this.estaGuardando = true;
        const nuevosUids = (this.grupo?.estudianteUids || []).filter((uid: string) => uid !== estudiante.persona.uid);
        this.gruposService.actualizarGrupo(this.grupo.id, { estudianteUids: nuevosUids }).subscribe({
          next: () => {
            this.grupo.estudianteUids = nuevosUids;
            this.hidratarAlumnosInscritos(); 
            this.notificaciones.mostrar('info', 'Baja Exitosa', 'El alumno fue removido del aula.');
            this.grupoActualizado.emit();
            this.estaGuardando = false;
          }
        });
      }, 'Sí, remover'
    );
  }

  evaluarRiesgoAlumno(estudiante: any): boolean {
    const datos = estudiante.rol as any;
    const promedio = datos?.promedioGlobal || 0;
    const reportes = datos?.totalReportes || 0;
    const faltasConsecutivas = estudiante.faltasConsecutivas || 0;
    const porcentajeGlobal = estudiante.porcentajeGlobal !== undefined ? estudiante.porcentajeGlobal : 100;
    
    // Matriz de Choque: Riesgo si tiene bajo promedio, reportes, muchas faltas o baja asistencia
    return (promedio > 0 && promedio < 7.0) || reportes > 0 || faltasConsecutivas >= 3 || porcentajeGlobal < 85;
  }

  // ==========================================================================
  // GESTIÓN DE DOCENTES
  // ==========================================================================
  getCargaDocente(docenteUid: string): number {
    if (!docenteUid) return 0;
    return (docenteUid.charCodeAt(0) % 4) + 1; 
  }

  asignarDocente(docente: any) {
    this.estaGuardando = true;
    this.gruposService.actualizarGrupo(this.grupo.id, { empleadoUid: docente.persona.uid }).subscribe({
      next: () => {
        this.grupo.empleadoUid = docente.persona.uid;
        this.grupo.docente = docente; 
        this.mostrarDropdownDocentes = false;
        this.notificaciones.mostrar('exito', 'Docente Asignado', `${docente.persona.nombre} es el nuevo titular.`);
        this.grupoActualizado.emit(); 
        this.estaGuardando = false;
      }
    });
  }

  removerDocente() {
    if (!this.grupo.docente) return;
    this.notificaciones.confirmar('Remover Titular', `¿Dejar el grupo sin maestro titular temporalmente?`, () => {
      this.estaGuardando = true;
      this.gruposService.actualizarGrupo(this.grupo.id, { empleadoUid: 'null' }).subscribe({
        next: () => {
          this.grupo.empleadoUid = 'null';
          this.grupo.docente = null; 
          this.mostrarDropdownDocentes = false; 
          this.notificaciones.mostrar('exito', 'Docente Removido', 'El aula requiere un nuevo titular.');
          this.grupoActualizado.emit(); 
          this.estaGuardando = false;
        }
      });
    }, 'Sí, remover');
  }

  // ==========================================================================
  // EXPORTACIÓN A PDF
  // ==========================================================================
  descargarListaAsistencia() {
    if (!this.grupo || this.alumnosInscritosDetalle.length === 0) return;
    
    this.generandoPDF = true;
    this.notificaciones.mostrar('info', 'Generando Documento', 'Calculando cuadrícula y estadísticas...');

    setTimeout(() => {
      this.impresionService.imprimirListaAsistencia(this.grupo, this.alumnosInscritosDetalle);
      this.generandoPDF = false;
      this.notificaciones.mostrar('exito', 'Lista Descargada', 'El archivo PDF está listo.');
    }, 800); 
  }

  cerrar() {
    this.close.emit();
    this.mostrarSpotlight = false;
    this.mostrarDropdownDocentes = false;
  }
}