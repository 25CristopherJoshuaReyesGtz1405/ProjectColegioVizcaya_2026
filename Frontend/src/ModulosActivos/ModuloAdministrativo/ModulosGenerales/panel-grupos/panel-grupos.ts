import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

// COMPONENTES Y MODALES
import { ModalGrupoNuevo } from '../../ModuloComponentes/modal-grupo-nuevo/modal-grupo-nuevo';
import { ModalGrupoGestion } from '../../ModuloComponentes/modal-grupo-gestion/modal-grupo-gestion';
import { MateriaAlertsWidget } from "../../ModuloComponentes/materia-alerts-widget/materia-alerts-widget";
import { DrawerGrupoDetalle } from '../../ModuloComponentes/drawer-grupo-detalle/drawer-grupo-detalle';
import { TarjetaStadistic } from '../../ModuloComponentes/tarjeta-stadistic/tarjeta-stadistic';

// SERVICIOS Y MODELOS
import { GruposService } from '../../../../ServiciosActivos/grupos.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { EstadisticasDashboardDTO, AgendaActividad, PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { AdminService } from '../../../../ServiciosActivos/admin.service';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';

@Component({
  selector: 'app-panel-grupos',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ModalGrupoNuevo, ModalGrupoGestion,
    TarjetaStadistic, MateriaAlertsWidget, 
    DrawerGrupoDetalle
  ],
  templateUrl: './panel-grupos.html',
  styleUrl: './panel-grupos.scss', 
  providers:[DatePipe]
})
export class PanelGrupos implements OnInit {

  private gruposService = inject(GruposService);
  private adminService = inject(AdminService);
  private docentesService = inject(DocentesService);
  private estudiantesService = inject(EstudiantesService);
  private impresionService = inject(ImpresionService);
  private catalogosService = inject(CatalogosService);
  private notificaciones = inject(NotificacionesService);
  private datePipe = inject(DatePipe);

  // --- DATOS GLOBALES ---
  public grupos: any[] = [];
  public estadisticas: EstadisticasDashboardDTO | null = null;
  public actividades: AgendaActividad[] = []; 
  public periodoActivoId: string | null = null;
  
  // --- ESTADOS DE LA VISTA ---
  public estaCargando = true;
  public today: Date = new Date();
  public terminoBusqueda: string = '';
  public filtroActivo: string = 'TODOS';
  public modoAuditoria: boolean = false; 

  public mostrarModalNuevo = false;
  public drawerAbierto = false;
  public grupoSeleccionado: any | null = null;
  public estadisticasAnimadas = { activas: 0, primerG: 0, segundoG: 0, tercerG: 0 };

  // ==========================================
  // SISTEMA DE SELECCIÓN MASIVA Y ACCIONES
  // ==========================================
  public seleccionMasiva: any[] = [];
  public mostrarModalAsignacionMasiva: boolean = false;
  public docentesDisponibles: any[] = [];
  public procesandoMasivo: boolean = false;

  toggleSeleccionGrupo(grupo: any, event: Event) {
    event.stopPropagation(); 
    const index = this.seleccionMasiva.findIndex(g => g.id === grupo.id);
    if (index > -1) {
      this.seleccionMasiva.splice(index, 1); 
    } else {
      this.seleccionMasiva.push(grupo); 
    }
  }

  esGrupoSeleccionado(grupo: any): boolean {
    return this.seleccionMasiva.some(g => g.id === grupo.id);
  }

  limpiarSeleccionMasiva() {
    this.seleccionMasiva = [];
  }

  // --- EXPORTACIÓN INTELIGENTE EN CASCADA ---
  async accionMasivaExportar() {
    if (this.seleccionMasiva.length === 0) return;

    this.procesandoMasivo = true;
    this.notificaciones.mostrar('info', 'Iniciando Exportación', `Sincronizando datos de ${this.seleccionMasiva.length} grupos. No cierres la ventana.`);

    try {
      // 1. Descargamos todos los estudiantes una sola vez
      const todosEstudiantes: PerfilUsuarioDTO[] = await firstValueFrom(this.estudiantesService.getEstudiantes('persona.nombre', 'asc'));

      // 2. Procesamos cada grupo secuencialmente para no saturar el navegador ni la API
      for (let i = 0; i < this.seleccionMasiva.length; i++) {
        const grupo = this.seleccionMasiva[i];
        const uidsInscritos = grupo.estudianteUids || [];
        const estudiantesDelGrupo = todosEstudiantes.filter(est => uidsInscritos.includes(est.persona.uid));

        if (estudiantesDelGrupo.length > 0) {
          const periodoAUsar = this.periodoActivoId || grupo.periodoId || 'PERIODO_ACTUAL';
          
          // 3. Descargamos las estadísticas térmicas del backend para este grupo
          const statsBase = await firstValueFrom(
            this.docentesService.getEstadisticasAsistencia(grupo.id, periodoAUsar).pipe(catchError(() => of({})))
          );

          // 4. Hidratamos los datos (Fusión Frontend-Backend)
          const alumnosHidratados = estudiantesDelGrupo.map(est => {
            const uid = est.persona.uid;
            const statsDelAlumno = statsBase[uid] || { historialTermico: [], faltasConsecutivas: 0, porcentajeGlobal: 100 };
            return {
              ...est,
              historialTermico: statsDelAlumno.historialTermico,
              faltasConsecutivas: statsDelAlumno.faltasConsecutivas,
              porcentajeGlobal: statsDelAlumno.porcentajeGlobal
            };
          });

          // 5. Ordenamos
          alumnosHidratados.sort((a, b) => (a.persona?.apellidos || '').localeCompare(b.persona?.apellidos || ''));

          // 6. Generamos PDF con una pausa para que el navegador respire
          this.impresionService.imprimirListaAsistencia(grupo, alumnosHidratados);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa de 1 segundo
        }
      }

      this.notificaciones.mostrar('exito', 'Exportación Exitosa', 'Todas las listas oficiales han sido descargadas.');
    } catch (error) {
      console.error(error);
      this.notificaciones.mostrar('error', 'Error', 'Ocurrió un problema durante la sincronización de las listas.');
    } finally {
      this.procesandoMasivo = false;
      this.limpiarSeleccionMasiva();
    }
  }

  // --- ASIGNACIÓN DE DOCENTE MULTIGRUPO ---
  accionMasivaAsignar() {
    this.procesandoMasivo = true;
    this.docentesService.getDocentes().subscribe({
      next: (docs) => {
        // Ordenamos los maestros alfabéticamente
        this.docentesDisponibles = (docs || []).sort((a: any, b: any) => 
          (a.persona?.nombre || '').localeCompare(b.persona?.nombre || '')
        );
        this.mostrarModalAsignacionMasiva = true;
        this.procesandoMasivo = false;
      },
      error: () => this.procesandoMasivo = false
    });
  }

  confirmarAsignacionMasiva(docente: any) {
    this.procesandoMasivo = true;
    const peticiones = this.seleccionMasiva.map(g => 
      this.gruposService.actualizarGrupo(g.id, { empleadoUid: docente.persona.uid })
    );

    forkJoin(peticiones).subscribe({
      next: () => {
        this.notificaciones.mostrar('exito', 'Titular Asignado', `${docente.persona.nombre} ahora es titular de ${this.seleccionMasiva.length} materias.`);
        this.mostrarModalAsignacionMasiva = false;
        this.procesandoMasivo = false;
        this.limpiarSeleccionMasiva();
        this.cargarGrupos(); 
      },
      error: () => {
        this.notificaciones.mostrar('error', 'Error', 'Ocurrió un problema en la asignación masiva.');
        this.procesandoMasivo = false;
      }
    });
  }

  getCargaDocente(docenteUid: string): number {
    if (!docenteUid) return 0;
    return (docenteUid.charCodeAt(0) % 4) + 1; 
  }
  // ==========================================

  ngOnInit(): void {
    this.cargarDatosDashboard();
    this.cargarGrupos();
    this.cargarPeriodoInteligente();
  }

  cargarPeriodoInteligente() {
    this.catalogosService.getAllPeriodos().subscribe({
      next: (periodosBase: any[]) => {
        const periodosOrdenados = periodosBase.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
        const hoy = new Date().getTime();
        const periodoActivo = periodosOrdenados.find(per => hoy >= new Date(per.fechaInicio).getTime() && hoy <= new Date(per.fechaFin).getTime());
        if (periodoActivo) this.periodoActivoId = periodoActivo.id;
      }
    });
  }

  // (Todo tu código existente de cargarDatosDashboard, cargarGrupos, evaluarRiesgo, abirDrawer, etc. se queda igual debajo de esto)
  cargarDatosDashboard() {
    this.estaCargando = true;
    this.adminService.getEstadisticasDashboard().subscribe({
      next: (data) => { this.estadisticas = data; this.animarContadores(); this.estaCargando = false; },
      error: (err) => { console.error('Error dashboard:', err); this.estaCargando = false; }
    });
  }

  cargarGrupos() {
    this.gruposService.getAllGrupos().subscribe({
      next: (data) => this.grupos = data,
      error: (err) => console.error('Error grupos:', err)
    });
  }

  get gruposFiltrados(): any[] {
    let filtrados = this.grupos;
    if (this.modoAuditoria) filtrados = filtrados.filter(g => this.evaluarRiesgoGrupo(g) === 'CRITICO' || this.evaluarRiesgoGrupo(g) === 'ALERTA');
    if (this.filtroActivo !== 'TODOS') {
      if (this.filtroActivo === '1_SEMESTRE') filtrados = filtrados.filter(g => g.materia?.grado === 1);
      if (this.filtroActivo === '2_SEMESTRE') filtrados = filtrados.filter(g => g.materia?.grado === 2);
      if (this.filtroActivo === '3_SEMESTRE') filtrados = filtrados.filter(g => g.materia?.grado === 3);
      if (this.filtroActivo === 'SIN_DOCENTE') filtrados = filtrados.filter(g => !g.empleadoUid || g.empleadoUid === 'null');
      if (this.filtroActivo === 'VACIOS') filtrados = filtrados.filter(g => !g.estudianteUids || g.estudianteUids.length === 0);
    }
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      filtrados = filtrados.filter(g => g.materia?.nombre.toLowerCase().includes(termino) || (g.docente?.persona?.nombre + ' ' + g.docente?.persona?.apellidos).toLowerCase().includes(termino));
    }
    return filtrados;
  }

  evaluarRiesgoGrupo(grupo: any): 'SANO' | 'ALERTA' | 'CRITICO' {
    if (!grupo.empleadoUid || grupo.empleadoUid === 'null') return 'CRITICO';
    if (!grupo.estudianteUids || grupo.estudianteUids.length < 5) return 'ALERTA';
    return 'SANO';
  }

  getNivelCumplimiento(grupo: any): string {
    if (!grupo.empleadoUid || grupo.empleadoUid === 'null') return 'ring-danger';
    const random = grupo.id.charCodeAt(0) % 3;
    if (random === 0) return 'ring-warning'; 
    return 'ring-success'; 
  }

  setFiltro(filtro: string) { this.filtroActivo = filtro; }
  toggleAuditoria() { if (this.modoAuditoria) this.notificaciones.mostrar('info', 'Modo Auditoría', 'Aulas en riesgo aisladas.'); }
  get gruposCriticos(): any[] { return this.grupos.filter(g => this.evaluarRiesgoGrupo(g) === 'CRITICO'); }
  abrirDrawer(grupo: any) { this.grupoSeleccionado = grupo; this.drawerAbierto = true; }
  cerrarDrawer() { this.drawerAbierto = false; setTimeout(() => this.grupoSeleccionado = null, 300); }
  abrirModalCrear() { this.mostrarModalNuevo = true; }
  alCrearGrupo() { this.mostrarModalNuevo = false; this.cargarGrupos(); }

  confirmarEliminarGrupo(grupo: any, event: Event) {
    event.stopPropagation();
    this.notificaciones.confirmar('Eliminar Aula', `¿Borrar el grupo de ${grupo.materia?.nombre}?`, () => {
      this.gruposService.deleteGrupo(grupo.id).subscribe({
        next: () => { this.notificaciones.mostrar('exito', 'Eliminado', 'Aula borrada.'); this.cargarGrupos(); this.cerrarDrawer(); }
      });
    }, 'Sí, eliminar');
  }

  animarContadores() {
    if (!this.estadisticas) return;
    this.ejecutarAnimacion('activas', this.estadisticas.conteoGrupos?.total || 0, 1500);
    this.ejecutarAnimacion('primerG', this.estadisticas.conteoEstudiantes.porGrado['1'] || 0, 1500);
    this.ejecutarAnimacion('segundoG', this.estadisticas.conteoEstudiantes.porGrado['2'] || 0, 1500);
    this.ejecutarAnimacion('tercerG', this.estadisticas.conteoEstudiantes.porGrado['3'] || 0, 1500);
  }

  ejecutarAnimacion(propiedad: 'activas' | 'primerG' | 'segundoG' | 'tercerG', objetivo: number, duracion: number) {
    if (!objetivo || objetivo <= 0 || isNaN(objetivo)) { this.estadisticasAnimadas[propiedad] = 0; return; }
    let inicio = 0; const incremento = objetivo / (duracion / 16); 
    const timer = setInterval(() => {
      inicio += incremento;
      if (inicio >= objetivo) { this.estadisticasAnimadas[propiedad] = objetivo; clearInterval(timer); } 
      else { this.estadisticasAnimadas[propiedad] = Math.ceil(inicio); }
    }, 16);
  }

  // =========================================================
  // RADAR OPERATIVO (COLUMNA DERECHA)
  // =========================================================

  radarReasignarDocentes() {
    if (this.seleccionMasiva.length > 0) {
      // Si ya hay grupos seleccionados, abrimos el modal directo
      this.accionMasivaAsignar();
    } else {
      // Si no, educamos al usuario sobre cómo usar la herramienta
      this.notificaciones.mostrar(
        'info', 
        'Selección Requerida', 
        'Primero selecciona una o más aulas usando el círculo en la esquina de las tarjetas y luego presiona este botón.'
      );
    }
  }

  radarReporteOcupacion() {
    if (this.gruposFiltrados.length === 0) {
      this.notificaciones.mostrar('error', 'Sin Datos', 'No hay grupos en pantalla para generar el reporte.');
      return;
    }

    this.notificaciones.mostrar('info', 'Generando Reporte', 'Calculando estadísticas de ocupación...');
    
    setTimeout(() => {
      // Mandamos al impresor los grupos que el usuario esté viendo actualmente (aplica los filtros)
      this.impresionService.imprimirReporteOcupacion(this.gruposFiltrados);
      this.notificaciones.mostrar('exito', 'Reporte Listo', 'Radiografía escolar exportada en PDF.');
    }, 800);
  }

  radarHorarios() {
    this.notificaciones.mostrar(
      'info', 
      'Próximamente', 
      'El motor inteligente de creación de Horarios Generales estará disponible en la próxima actualización del sistema.'
    );
  }
}