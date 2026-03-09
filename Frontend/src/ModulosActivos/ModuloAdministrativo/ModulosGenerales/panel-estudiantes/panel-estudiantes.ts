import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

/* Componentes */
import { EstudianteCard } from '../../ModuloComponentes/estudiante-card/estudiante-card';
import { ModalEstudianteActualizar } from '../../ModuloComponentes/modal-estudiante-actualizar/modal-estudiante-actualizar';
import { ModalEstudianteNuevo } from '../../ModuloComponentes/modal-estudiante-nuevo/modal-estudiante-nuevo'; 
import { ReportesWidget } from '../../ModuloComponentes/reportes-widget/reportes-widget';
import { PeriodoWidget } from '../../ModuloComponentes/periodo-widget/periodo-widget';
import { ModalCargaMasiva } from '../../ModuloComponentes/modal-carga-masiva/modal-carga-masiva';
import { ModalGestionPeriodos } from '../../ModuloComponentes/modal-gestion-periodos/modal-gestion-periodos';
import { ModalReporteDetalle } from '../../ModuloComponentes/modal-reporte-detalle/modal-reporte-detalle';
import { ModalCredencial } from '../../ModuloComponentes/modal-credencial/modal-credencial';
import { ModalKardex } from '../../ModuloComponentes/modal-kardex/modal-kardex';
import { ModalAtenderSolicitud } from '../../ModuloComponentes/modal-atender-solicitud/modal-atender-solicitud';

/* Modelos y Servicios */
import { PerfilUsuarioDTO, EstadisticasDashboardDTO, AgendaActividad, BoletaDataDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { AdminService, TicketRectificacion } from '../../../../ServiciosActivos/admin.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { firstValueFrom } from 'rxjs';
import { TarjetaStadistic } from '../../ModuloComponentes/tarjeta-stadistic/tarjeta-stadistic';

@Component({
  selector: 'app-panel-estudiantes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, EstudianteCard,
    ModalEstudianteActualizar, ModalEstudianteNuevo, ModalGestionPeriodos,
    PeriodoWidget, ReportesWidget, ModalReporteDetalle, ModalCargaMasiva, 
    ModalCredencial, ModalKardex, ModalAtenderSolicitud, 
    TarjetaStadistic
  ],
  templateUrl: './panel-estudiantes.html',
  styleUrl: './panel-estudiantes.scss',
  providers: [DatePipe],
})
export class PanelEstudiantes implements OnInit {
  
  public listaEstudiantes: PerfilUsuarioDTO[] = [];
  public estadisticas: EstadisticasDashboardDTO | null = null;
  public solicitudesPendientes: TicketRectificacion[] = [];

  public listaEstudiantesBaja: PerfilUsuarioDTO[] = []; // <--- NUEVA

  public reportesDisciplinaRecientes: any[] = []; 
  
  public estaCargando = true;
  public today: Date = new Date();

  public mostrarModalReporte: boolean = false; 

  public estadisticasAnimadas = { activos: 0, inactivos: 0, reportes: 0 };

  docenteService = inject(DocentesService); 

  public terminoBusqueda: string = '';
  public filtroActivo: string = 'TODOS';
  public modoTriage: boolean = false; 

  public mostrarModalCreacion = false; 
  public mostrarModalEdicion = false;
  public mostrarModalPeriodos = false;
  public mostrarCargaMasiva = false;
  public mostrarModalCredencialVar = false;
  public mostrarModalKardex = false; 
  public mostrarModalAtender = false;

  public estudianteSeleccionado: PerfilUsuarioDTO | any = null;
  public reporteSeleccionado: any = null;
  public ticketSeleccionado: TicketRectificacion | null = null;

  private notificaciones = inject(NotificacionesService);
  private estudianteService = inject(EstudiantesService);
  private adminService = inject(AdminService);
  private impresionService = inject(ImpresionService); 
  private catalogosService = inject(CatalogosService);

  @ViewChild(PeriodoWidget) widgetPeriodo!: PeriodoWidget;
  @ViewChild(ReportesWidget) widgetReportes!: ReportesWidget;

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarEstudiantesRecientes();
    this.cargarSolicitudes(); 
    this.cargarReportesDisciplina();
  }

  exportarPadronExcel() {
    if (this.estudiantesFiltrados.length === 0) {
      this.notificaciones.mostrar('info', 'Sin datos', 'No hay alumnos para exportar.');
      return;
    }

    // 1. Mapear datos a un formato plano y bonito para Excel
    const datosPlanos = this.estudiantesFiltrados.map(e => ({
      Matricula: (e.rol as any)?.matricula || 'S/N',
      CURP: e.persona.uid,
      Nombre: e.persona.nombre,
      Apellidos: e.persona.apellidos,
      Grado: (e.rol as any)?.grado ? `${(e.rol as any).grado}°` : '-',
      Grupo: (e.rol as any)?.grupo || '-',
      Estatus: (e.rol as any)?.estatus || 'ACTIVO',
      Promedio: (e.rol as any)?.promedioGlobal || '0',
      Materias_Reprobadas: (e.rol as any)?.materiasReprobadas || '0'
    }));

    // 2. Convertir a CSV nativo
    const cabeceras = Object.keys(datosPlanos[0]).join(',') + '\r\n';
    const filas = datosPlanos.map(obj => Object.values(obj).map(val => `"${val}"`).join(',')).join('\r\n');
    const csvContent = cabeceras + filas;

    // 3. Forzar codificación UTF-8 (Para que Excel lea bien los acentos)
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 4. Descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = `Padron_Estudiantes_${this.filtroActivo}_Vizcaya.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.notificaciones.mostrar('exito', 'Exportación Exitosa', 'El archivo Excel se ha descargado.');
  }

  get estudiantesFiltrados(): PerfilUsuarioDTO[] {
    // Si el filtro es BAJAS, usamos la lista de inactivos, si no, la normal
    let baseList = this.filtroActivo === 'BAJAS' ? this.listaEstudiantesBaja : this.listaEstudiantes;
    let filtrados = baseList;

    if (this.modoTriage) {
      filtrados = filtrados.filter(e => this.evaluarRiesgoEstudiante(e) === 'ALTO');
    }

    if (this.filtroActivo !== 'TODOS' && this.filtroActivo !== 'BAJAS') {
      if (this.filtroActivo === '1_SEMESTRE') {
        filtrados = filtrados.filter(e => (e.rol as any)?.grado == 1);
      } else if (this.filtroActivo === '2_SEMESTRE') {
        filtrados = filtrados.filter(e => (e.rol as any)?.grado == 2);
      } else if (this.filtroActivo === '3_SEMESTRE') {
        filtrados = filtrados.filter(e => (e.rol as any)?.grado == 3);
      } else if (this.filtroActivo === 'EXCELENCIA') {
        filtrados = filtrados.filter(e => this.evaluarRiesgoEstudiante(e) === 'EXCELENCIA');
      }
    }

    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      filtrados = filtrados.filter(est => 
        est.persona.nombre.toLowerCase().includes(termino) ||
        est.persona.apellidos.toLowerCase().includes(termino) ||
        (est.rol as any)?.matricula?.toLowerCase().includes(termino)
      );
    }
    return filtrados;
  }

  getInitials(nombre: string, apellidos: string): string {
    if (!nombre || !apellidos) return '?';
    return (nombre.charAt(0) + apellidos.charAt(0)).toUpperCase();
  }

  // --- MOTOR DE BIOMETRÍA ACADÉMICA ---
  evaluarRiesgoEstudiante(estudiante: PerfilUsuarioDTO): 'EXCELENCIA' | 'REGULAR' | 'ALTO' {
    const datosEstudiante = estudiante.rol as any; 
    const promedio = datosEstudiante.promedioGlobal || 0;
    const reprobadas = datosEstudiante.materiasReprobadas || 0;
    const reportes = datosEstudiante.totalReportes || 0;

    if ((promedio > 0 && promedio < 7.0) || reprobadas >= 2 || reportes > 0) {
      return 'ALTO';
    }
    if (promedio >= 9.5 && reprobadas === 0 && reportes === 0) {
      return 'EXCELENCIA';
    }
    return 'REGULAR'; 
  }

  // NUEVO: Método para que la Tarjeta Triage sepa por qué el alumno está ahí
  obtenerDetallesRiesgo(estudiante: PerfilUsuarioDTO) {
    const datos = estudiante.rol as any;
    return {
      promedio: datos.promedioGlobal || 0,
      reprobadas: datos.materiasReprobadas || 0,
      reportes: datos.totalReportes || 0
    };
  }

  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
  }

  toggleTriage() {
    if (this.modoTriage) {
      this.notificaciones.mostrar('info', 'Modo Triage Activado', 'Mostrando diagnósticos de atención prioritaria.');
    }
  }

  // --- CARGAS DE DATOS ---
  cargarDatos() {
    this.estaCargando = true;
    this.adminService.getEstadisticasDashboard().subscribe({
      next: (data) => { 
        this.estadisticas = data; 
        this.estaCargando = false; 
        this.animarContadores(); 
      },
      error: () => this.estaCargando = false
    });
  }

  cargarEstudiantesRecientes() {
    this.estudianteService.getEstudiantes('persona.nombre', 'asc').subscribe({
      next: (estudiantes) => this.listaEstudiantes = estudiantes,
      error: (err) => console.error('Error cargando estudiantes activos:', err),
    });

    // Carga los inactivos (Bajas)
    this.estudianteService.getEstudiantesBaja('persona.nombre', 'asc').subscribe({
      next: (estudiantesBajas) => this.listaEstudiantesBaja = estudiantesBajas,
      error: (err) => console.error('Error cargando estudiantes dados de baja:', err)
    });
  }

  cargarSolicitudes() {
    this.adminService.getSolicitudesPendientes().subscribe({
      next: (tickets) => this.solicitudesPendientes = tickets,
      error: (err) => console.error(err)
    });
  }

  // Simulación de carga de reportes de indisciplina para la bandeja
  cargarReportesDisciplina() {
    // Si tienes un servicio para esto, conéctalo aquí. 
    // Por ahora lo simulamos para que veas el diseño en la interfaz.
    this.reportesDisciplinaRecientes = [
      { alumno: 'Carlos Ruiz', motivo: 'Falta de Respeto', fecha: new Date() }
    ];

    this.docenteService.getAllReportes().subscribe({
      next: (data) => {
        // Mapeamos los datos del backend a la estructura que espera tu HTML
        this.reportesDisciplinaRecientes = data.map((r) => ({
          id: r.id,
          estudiante: r.estudianteNombre, // Usamos el nombre que trajimos en el "join" del backend
          grado: r.gradoGrupo,
          tipo: r.tipo,
          fecha:r.fecha,
          descripcion: r.descripcion,
          severidad: r.severidad,
          // Guardamos el UID por si queremos imprimir
          estudianteUid: r.estudianteUid,
        }));
      },
      error: (err) => {
        console.error('Error cargando reportes de indisiplina', err);
        this.notificaciones.mostrar('error', "Error Carga De Reportes", "No se puduieron cargar los resportes disponibles")
      },
    });

  }

  animarContadores() {
    if (!this.estadisticas) return;
    this.ejecutarAnimacion('activos', this.estadisticas.conteoEstudiantes.activos || 0, 1500);
    this.ejecutarAnimacion('inactivos', this.estadisticas.conteoEstudiantes.inactivos || 0, 1500);
    this.ejecutarAnimacion('reportes', this.estadisticas.conteoReportesIndisciplina?.total || 0, 1500);
  }

  ejecutarAnimacion(propiedad: 'activos' | 'inactivos' | 'reportes', objetivo: number, duracion: number) {
    if (!objetivo || objetivo <= 0 || isNaN(objetivo)) {
      this.estadisticasAnimadas[propiedad] = 0;
      return;
    }
    let inicio = 0;
    const incremento = objetivo / (duracion / 16); 
    
    const timer = setInterval(() => {
      inicio += incremento;
      if (inicio >= objetivo) {
        this.estadisticasAnimadas[propiedad] = objetivo;
        clearInterval(timer);
      } else {
        this.estadisticasAnimadas[propiedad] = Math.ceil(inicio);
      }
    }, 16);
  }

  abrirKardex(estudiante: PerfilUsuarioDTO) { this.estudianteSeleccionado = estudiante; this.mostrarModalKardex = true; }
  abrirModalCredencial(estudiante: PerfilUsuarioDTO) { this.estudianteSeleccionado = estudiante; this.mostrarModalCredencialVar = true; }
  abrirEdicion(estudiante: PerfilUsuarioDTO) { this.estudianteSeleccionado = estudiante; this.mostrarModalEdicion = true; }
  
  descargarBoleta(estudiante: PerfilUsuarioDTO) {
    this.notificaciones.mostrar('info', 'Generando Documento', 'Procesando expediente...');
    this.estudianteService.getBoletaData(estudiante.persona.uid).subscribe({
      next: (datosBoleta: BoletaDataDTO) => {
        this.impresionService.imprimirBoleta(datosBoleta);
      }
    });
  }

  // --- NUEVA ACCIÓN MASIVA: IMPRIMIR TODAS LAS BOLETAS ---
  // --- ACCIÓN MASIVA: IMPRIMIR LOTE DE BOLETAS ---
  async imprimirBoletasGlobales() {
    const estudiantesAImprimir = this.estudiantesFiltrados;

    if (estudiantesAImprimir.length === 0) {
      this.notificaciones.mostrar('info', 'Sin datos', 'No hay alumnos en pantalla para imprimir.');
      return;
    }

    // Activamos el estado de carga para bloquear la pantalla sutilmente
    this.estaCargando = true;
    this.notificaciones.mostrar('info', 'Generando Lote', `Recopilando el kárdex de ${estudiantesAImprimir.length} alumnos. Esto tomará unos segundos...`);

    try {
      // 1. Convertimos cada petición de boleta en una Promesa
      const promesasBoletas = estudiantesAImprimir.map(est => 
        firstValueFrom(this.estudianteService.getBoletaData(est.persona.uid))
      );

      // 2. Esperamos a que el Backend nos devuelva la data de TODOS los alumnos
      const listaBoletasCompletas = await Promise.all(promesasBoletas);

      // 3. Mandamos el arreglo completo al servicio de PDF para crear el documento multi-página
      this.impresionService.imprimirBoletasMasivas(listaBoletasCompletas);

      this.notificaciones.mostrar('exito', 'Lote Generado', `Se ha descargado el PDF con ${listaBoletasCompletas.length} boletas.`);
      
    } catch (error) {
      console.error('Error en lote masivo:', error);
      this.notificaciones.mostrar('error', 'Error de Lote', 'Hubo un problema al procesar algunos expedientes.');
    } finally {
      this.estaCargando = false; // Quitamos el loader
    }
  }

  abrirCreacionEstudiante() { this.mostrarModalCreacion = true; }
  guardarNuevoEstudiante(nuevoEstudiante: PerfilUsuarioDTO) { this.mostrarModalCreacion = false; this.cargarEstudiantesRecientes(); this.cargarDatos(); }
  confirmarBaja(estudiante: PerfilUsuarioDTO) { this.notificaciones.confirmar('Confirmar Baja', `¿Dar de baja a "${estudiante.persona.nombre}"?`, () => this.procesarBaja(estudiante), 'Sí, dar de baja'); }
  procesarBaja(estudiante: PerfilUsuarioDTO) {
    this.estudianteService.darDeBaja(estudiante.persona.uid).subscribe({
      next: () => {
        const index = this.listaEstudiantes.findIndex(e => e.persona.uid === estudiante.persona.uid);
        if (index !== -1 && this.listaEstudiantes[index].rol) { (this.listaEstudiantes[index].rol as any).estatus = 'BAJA'; }
        this.notificaciones.mostrar('exito', 'Baja Exitosa', 'El estudiante ha sido dado de baja.');
      }
    });
  }

  guardarEdicion(est: PerfilUsuarioDTO) { this.mostrarModalEdicion = false; this.cargarEstudiantesRecientes(); }
  recargarTrasCarga() { this.mostrarCargaMasiva = false; this.cargarEstudiantesRecientes(); this.cargarDatos(); }
  verReporte(reporte: any) { this.reporteSeleccionado = reporte; this.mostrarModalReporte = true; }
  recargarReportes() { if (this.widgetReportes) this.widgetReportes.cargarReportes(); this.cargarDatos(); }
  onPeriodoActualizado() { this.cargarDatos(); if (this.widgetPeriodo) this.widgetPeriodo.buscarPeriodoActivo(); }
  atenderSolicitud(ticket: TicketRectificacion) { this.ticketSeleccionado = ticket; this.mostrarModalAtender = true; }
  onSolicitudResuelta() { this.cargarSolicitudes(); this.cargarDatos(); }

  // --- NUEVA ACCIÓN MASIVA: IMPRIMIR CUADRO DE HONOR (DIPLOMAS) ---
  imprimirCuadroDeHonor() {
    // 1. Filtramos a los alumnos que la biometría marca como 'EXCELENCIA'
    const estudiantesExcelencia = this.listaEstudiantes.filter(est => 
      this.evaluarRiesgoEstudiante(est) === 'EXCELENCIA'
    );

    if (estudiantesExcelencia.length === 0) {
      this.notificaciones.mostrar('info', 'Sin candidatos', 'Aún no hay estudiantes que cumplan los requisitos de Excelencia (Promedio 9.5+, sin reportes ni reprobadas).');
      return;
    }

    this.notificaciones.mostrar('info', 'Generando Reconocimientos', `Preparando ${estudiantesExcelencia.length} diplomas dorados. Espere un momento...`);
    
    // 2. Mandamos la lista al servicio de impresión
    this.impresionService.imprimirDiplomasMasivos(estudiantesExcelencia);
    
    setTimeout(() => {
      this.notificaciones.mostrar('exito', 'Cuadro de Honor Generado', 'Los reconocimientos se han descargado correctamente.');
    }, 1500);
  }
}