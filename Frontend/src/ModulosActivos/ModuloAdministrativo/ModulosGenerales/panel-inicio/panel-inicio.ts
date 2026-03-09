import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

// SERVICIOS
import { AdminService } from '../../../../ServiciosActivos/admin.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';

import { forkJoin } from 'rxjs';

// MODELOS Y COMPONENTES
import { EstadisticasDashboardDTO } from '../../../../../../Backend/src/ModelosAplicacion/ModelosAplicacion.model';
import {
  AgendaActividad,
  PerfilUsuarioDTO,
} from '../../../../ModelosActivos/ModelosAplicacion.model';
import { AgendaWidget } from '../../ModuloComponentes/agenda-widget/agenda-widget';
import { ModalActividad } from '../../ModuloComponentes/modal-actividad/modal-actividad';
import { EstudianteCard } from '../../ModuloComponentes/estudiante-card/estudiante-card';
import { ModalEstudianteActualizar } from '../../ModuloComponentes/modal-estudiante-actualizar/modal-estudiante-actualizar';
import { DocenteCard } from '../../ModuloComponentes/docente-card/docente-card';
import { ModalDocenteActualizar } from '../../ModuloComponentes/modal-docente-actualizar/modal-docente-actualizar';
import { TarjetaStadistic } from '../../ModuloComponentes/tarjeta-stadistic/tarjeta-stadistic';

// LIBRERÍA DE GRÁFICOS (APEXCHARTS)
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexTooltip,
  ApexGrid,
} from 'ng-apexcharts';
import { ModalEstudianteNuevo } from '../../ModuloComponentes/modal-estudiante-nuevo/modal-estudiante-nuevo';
import { ModalConsultaExpediente } from '../../ModuloComponentes/modal-consulta-expediente/modal-consulta-expediente';
import { ModalDocenteNuevo } from '../../ModuloComponentes/modal-docente-nuevo/modal-docente-nuevo';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';
import { ModalGestionPeriodos } from '../../ModuloComponentes/modal-gestion-periodos/modal-gestion-periodos';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  colors: string[];
};

@Component({
  selector: 'app-panel-inicio',
  standalone: true,
  imports: [
    CommonModule,
    AgendaWidget,
    ModalActividad,
    EstudianteCard,
    ModalEstudianteActualizar,
    DocenteCard,
    ModalDocenteActualizar,
    NgApexchartsModule,
    TarjetaStadistic,
    ModalEstudianteNuevo, 
    ModalConsultaExpediente, 
    ModalDocenteNuevo, 
    ModalGestionPeriodos
  ],
  templateUrl: './panel-inicio.html',
  styleUrl: './panel-inicio.scss',
  providers: [DatePipe],
})
export class PanelInicio implements OnInit {

  private catalogosService = inject(CatalogosService);

  // Variables para el Widget de Salud
  diasRestantes: number = 0;
  porcentajeAvance: number = 0;
  colorBarra: string = 'guinda'; // 'guinda', 'warning', 'danger'
  periodoActivoNombre: string = 'Cargando...';

  private adminService = inject(AdminService);
  private estudiantesService = inject(EstudiantesService);
  private docentesService = inject(DocentesService);
  private notificaciones = inject(NotificacionesService);
  private datePipe = inject(DatePipe);
  private router = inject(Router);

  public estadisticas: any | null = null;
  public estaCargando = true;

  public mostrarModalConsulta: boolean = false
  public mostrarModalNuevoDocente: boolean = false; 

  today: Date = new Date();
  actividades: AgendaActividad[] = [];
  Abrimodal: boolean = false;

  impresionService = inject(ImpresionService)

  public listaEstudiantes: PerfilUsuarioDTO[] = [];
  public listaDocentes: PerfilUsuarioDTO[] = [];

  public estudianteSeleccionado: PerfilUsuarioDTO | null = null;
  public mostrarModalEdicion = false;
  public docenteSeleccionado: PerfilUsuarioDTO | null = null;
  public mostrarModalDocente = false;

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = {
      series: [{ name: 'Estudiantes', data: [0, 0, 0] }],
      chart: {
        type: 'bar',
        height: 320,
        toolbar: { show: false },
        fontFamily: "'Roboto', sans-serif",
        animations: { enabled: true, speed: 800 },
      },
      colors: ['#2563eb', '#d97706', '#8C1D40'],
      plotOptions: { bar: { borderRadius: 8, columnWidth: '45%', distributed: true } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: ['1° Grado', '2° Grado', '3° Grado'],
        labels: { style: { colors: '#64748b', fontWeight: 700 } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: '#64748b', fontWeight: 500 } } },
      grid: { borderColor: '#e2e8f0', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      tooltip: { theme: 'light', y: { formatter: (val) => val + ' alumnos' } },
    };
  }

  // --- IDEA BRILLANTE: SALUDO DINÁMICO ---
  get saludoDinamico(): string {
    const hora = this.today.getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  ngOnInit(): void {
    const fechaFormateada = this.datePipe.transform(this.today, 'yyyy-MM-dd');
    if (fechaFormateada) {
      this.adminService.getAgenda(fechaFormateada).subscribe({
        next: (data) => (this.actividades = data),
        error: (err) => console.error('Error al cargar agenda:', err),
      });
    }


    this.cargarDatosDashboard();
    this.cargarEstudiantesRecientes();
    this.cargarDocentes();
  }

  //  * Calcular Salud Ciclo
  calcularSaludCiclo() {
    this.catalogosService.getAllPeriodos().subscribe(periodos => {
      // Buscamos el periodo que esté marcado como ABIERTO
      const activo = periodos.find(p => p.estatus === 'ABIERTO');
      
      if (activo) {
        this.periodoActivoNombre = activo.nombre;
        const inicio = new Date(activo.fechaInicio).getTime();
        const fin = new Date(activo.fechaFin).getTime();
        const hoy = new Date().getTime();

        if (hoy < inicio) {
          // El ciclo aún no empieza
          this.porcentajeAvance = 0;
          this.diasRestantes = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
          this.colorBarra = 'guinda';
        } else if (hoy > fin) {
          // El ciclo ya terminó
          this.porcentajeAvance = 100;
          this.diasRestantes = 0;
          this.colorBarra = 'danger'; // Rojo por urgencia de cierre
        } else {
          // El ciclo está en curso
          const totalDias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
          const diasPasados = Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24));
          
          this.porcentajeAvance = Math.round((diasPasados / totalDias) * 100);
          this.diasRestantes = totalDias - diasPasados;

          // Cambio semafórico según qué tan cerca estemos del final
          if (this.porcentajeAvance > 90) this.colorBarra = 'danger'; // Quedan muy pocos días
          else if (this.porcentajeAvance > 75) this.colorBarra = 'warning'; // Acercándose al cierre
          else this.colorBarra = 'guinda'; // Todo normal
        }
      } else {
        this.periodoActivoNombre = 'Sin ciclo activo';
        this.porcentajeAvance = 0;
        this.diasRestantes = 0;
      }
    });
  }

  cargarDatosDashboard() {
    this.estaCargando = true;
    this.adminService.getEstadisticasDashboard().subscribe({
      next: (data: any) => {
        this.estadisticas = data;
        if (data.conteoEstudiantes && data.conteoEstudiantes.porGrado) {
          this.chartOptions.series = [
            {
              name: 'Estudiantes',
              data: [
                data.conteoEstudiantes.porGrado['1'] || 0,
                data.conteoEstudiantes.porGrado['2'] || 0,
                data.conteoEstudiantes.porGrado['3'] || 0,
              ],
            },
          ];
        }
        this.estaCargando = false;
            this.calcularSaludCiclo(); 

      },
      error: () => (this.estaCargando = false),
    });
  }

  cargarEstudiantesRecientes() {
    this.estudiantesService.getEstudiantes('persona.nombre', 'asc').subscribe({
      next: (estudiantes) => (this.listaEstudiantes = estudiantes.slice(0, 5)),
    });
  }

  cargarDocentes() {
    this.docentesService.getDocentes().subscribe({
      next: (data) => (this.listaDocentes = data.slice(0, 5)),
    });
  }

  irA(ruta: string) {
    switch (ruta) {
      case 'consultar':
        this.mostrarModalConsulta = true; 
        break;
      case 'grupos':
        this.router.navigate(['/admin/groups']);
        break;
      case 'reportes':
        this.router.navigate(['/admin/reportes']);
        break;
      case 'ciclo':
        this.router.navigate(['/admin/periodos']);
        break;
    }
  }

  abrirModalCreacion() {
    this.Abrimodal = true;
  }

  agregarActividad(nueva: AgendaActividad) {
    this.Abrimodal = false;
    this.adminService.crearActividad(nueva).subscribe({
      next: (res) => {
        this.actividades.push(nueva);
        this.actividades.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
        this.notificaciones.mostrar('exito', 'Guardado', 'Actividad registrada');
      },
    });
  }

  abrirEdicionDocente(docente: PerfilUsuarioDTO) {
    this.docenteSeleccionado = docente;
    this.mostrarModalDocente = true;
  }
  confirmarBajaDocente(docente: PerfilUsuarioDTO) {
    this.notificaciones.confirmar(
      'Baja',
      `¿Dar de baja?`,
      () => this.procesarBajaDocente(docente),
      'Baja',
    );
  }
  procesarBajaDocente(docente: PerfilUsuarioDTO) {
    /* Logica de baja */
  }
  guardarEdicionDocente(docente: PerfilUsuarioDTO) {
    this.mostrarModalDocente = false;
  }

  abrirEdicion(estudiante: PerfilUsuarioDTO) {
    this.estudianteSeleccionado = estudiante;
    this.mostrarModalEdicion = true;
  }
  guardarEdicion(estudiante: PerfilUsuarioDTO) {
    this.mostrarModalEdicion = false;
  }
  confirmarBaja(estudiante: PerfilUsuarioDTO) {
    this.notificaciones.confirmar(
      'Baja',
      `¿Dar de baja?`,
      () => this.procesarBaja(estudiante),
      'Baja',
    );
  }
  procesarBaja(estudiante: PerfilUsuarioDTO) {
    /* Logica de baja */
  }

  //  * Modal Registrar Nuevo Estudiante
  public mostrarModalNuevoEstudiante = false;

  // Actualiza tu función existente para que cambie la variable a true
  abrirModalNuevoEstudiante() { 
    this.mostrarModalNuevoEstudiante = true; 
  }

  // Añade esta función para manejar el guardado
  guardarNuevoEstudiante(datos: any) {
    console.log("Datos recibidos del nuevo estudiante:", datos);
    this.mostrarModalNuevoEstudiante = false;
    this.notificaciones.mostrar('exito', 'Estudiante Registrado', 'El alumno fue dado de alta correctamente.');
    this.cargarEstudiantesRecientes(); // Recarga la lista para que aparezca
  }

  //  * Modal Docente Nuevo 
  abrirModalNuevoDocente() { 
    this.mostrarModalNuevoDocente = true; 
  }

  guardarNuevoDocente(datos: any) {
    this.mostrarModalNuevoDocente = false;
    this.cargarDocentes(); // Para refrescar la lista
  }

  //  * Modal Distibución Demografica 
  async descargarReporteDemografico() {
    if (!this.estadisticas) return;

    this.notificaciones.mostrar('info', 'Generando Reporte', 'Procesando analíticas y gráficas...');

    try {
      // 1. Tomamos una "foto" a la gráfica de ApexCharts en formato Base64
      let chartImageBase64: string | undefined = undefined;
      
      if (this.chart) {
        const uri: any = await this.chart.dataURI();
        chartImageBase64 = uri.imgURI;
      }

      // 2. Mandamos la foto y las estadísticas a nuestro servicio de PDF
      this.impresionService.imprimirReporteDemografico(this.estadisticas, chartImageBase64);
      
    } catch (error) {
      console.error('Error al generar la imagen de la gráfica:', error);
      // Si falla la imagen, imprimimos el PDF de todos modos sin la gráfica
      this.impresionService.imprimirReporteDemografico(this.estadisticas);
    }
  }

  // --- EXPORTAR BASE DE DATOS (EXCEL) ---
  descargarBaseDatosExcel() {
    this.notificaciones.mostrar('info', 'Exportando Datos', 'Recopilando expedientes y preparando el archivo Excel...');
    this.estaCargando = true; // Opcional: mostrar un loader

    // Usamos forkJoin para ejecutar las dos peticiones a Firebase al mismo tiempo
    forkJoin({
      estudiantes: this.estudiantesService.getEstudiantes('persona.apellidos', 'asc'),
      docentes: this.docentesService.getDocentes()
    }).subscribe({
      next: ({ estudiantes, docentes }) => {
        // Le pasamos las listas completas al servicio de impresión
        this.impresionService.exportarPadronGlobalExcel(estudiantes, docentes);
        
        this.estaCargando = false;
        this.notificaciones.mostrar('exito', 'Exportación Exitosa', 'El archivo Excel se ha descargado correctamente.');
      },
      error: (err) => {
        console.error('Error al exportar:', err);
        this.estaCargando = false;
        this.notificaciones.mostrar('error', 'Error', 'No se pudo generar la exportación de datos.');
      }
    });
  }

  //  * Modal Gestión Periodos 
  public mostrarModalPeriodos = false;

  abrirModalPeriodos() {
    this.mostrarModalPeriodos = true;
  }
}
