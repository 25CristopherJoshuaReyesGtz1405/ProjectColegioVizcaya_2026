import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <--- IMPORTANTE: Importar FormsModule

/* Componentes existentes */
import { TarjetaStadistic } from '../../../../ComponentesActivos/tarjeta-stadistic/tarjeta-stadistic';
import { EstudianteCard } from '../../ModuloComponentes/estudiante-card/estudiante-card';
import { ModalEstudianteActualizar } from '../../ModuloComponentes/modal-estudiante-actualizar/modal-estudiante-actualizar';
/* ... otros imports existentes ... */
import { ReportesWidget } from '../../ModuloComponentes/reportes-widget/reportes-widget';
import { PeriodoWidget } from '../../ModuloComponentes/periodo-widget/periodo-widget';
import { ModalCargaMasiva } from '../../ModuloComponentes/modal-carga-masiva/modal-carga-masiva';

// ASUMIDO: Debes importar tu modal de creación aquí. 
// Si se llama diferente, ajusta el nombre.
import { ModalEstudianteNuevo } from '../../ModuloComponentes/modal-estudiante-nuevo/modal-estudiante-nuevo'; 

import {
  PerfilUsuarioDTO,
  EstadisticasDashboardDTO,
  AgendaActividad,
  BoletaDataDTO,
} from '../../../../ModelosActivos/ModelosAplicacion.model';
import { AdminService } from '../../../../ServiciosActivos/admin.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { ModalGestionPeriodos } from '../../ModuloComponentes/modal-gestion-periodos/modal-gestion-periodos';
import { ModalReporteDetalle } from '../../ModuloComponentes/modal-reporte-detalle/modal-reporte-detalle';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';
import { ModalCredencial } from '../../ModuloComponentes/modal-credencial/modal-credencial';
import { ModalKardex } from '../../ModuloComponentes/modal-kardex/modal-kardex';

@Component({
  selector: 'app-panel-estudiantes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // <--- Necesario para el ngModel del buscador
    TarjetaStadistic,
    EstudianteCard,
    ModalEstudianteActualizar,
    ModalEstudianteNuevo, // <--- Agregar a imports
    ModalGestionPeriodos,
    PeriodoWidget,
    ReportesWidget, 
    ModalReporteDetalle, 
    ModalCargaMasiva, 
    ModalCredencial, 
    ModalKardex
  ],
  templateUrl: './panel-estudiantes.html',
  styleUrl: './panel-estudiantes.scss',
  providers: [DatePipe],
})
export class PanelEstudiantes {
  
  // --- VARIABLES DE DATOS ---
  public listaEstudiantes: PerfilUsuarioDTO[] = [];
  public listaEstudiantesBaja: PerfilUsuarioDTO[] = [];
  public estadisticas: EstadisticasDashboardDTO | null = null;

  // --- VARIABLES DE UI Y BÚSQUEDA ---
  public terminoBusqueda: string = ''; // <--- Variable para el buscador
  public estaCargando = true;
  public today: Date = new Date();

  // --- MODALES ---
  public mostrarModalCreacion = false; // <--- Modal Nuevo Estudiante
  public mostrarModalEdicion = false;
  public mostrarModalPeriodos = false;
  public mostrarCargaMasiva = false;
  public mostrarModalReporte = false;
  
  public estudianteSeleccionado: PerfilUsuarioDTO | any;
  public reporteSeleccionado: any = null;

  // --- SERVICIOS ---
  private notificaciones = inject(NotificacionesService);
  private estudianteService = inject(EstudiantesService);
  private adminService = inject(AdminService);
  private impresionService = inject(ImpresionService); 
  
  @ViewChild(PeriodoWidget) widgetPeriodo!: PeriodoWidget;
  @ViewChild(ReportesWidget) widgetReportes!: ReportesWidget;
  docentesService = inject(DocentesService);
  Abrimodal: boolean=false;

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarEstudiantesRecientes();
    this.cargarEstudiantesBaja();
  }

  public mostrarModalKardex = false; 

  // ... (otros métodos)

  // 4. NUEVA FUNCIÓN PARA ABRIR EL KARDEX
  abrirKardex(estudiante: PerfilUsuarioDTO) {
    this.estudianteSeleccionado = estudiante;
    this.mostrarModalKardex = true;
  }

  // --- LOGICA DE FILTRADO ---
  // Este getter filtra la lista automáticamente cuando escribes en el buscador
  get estudiantesFiltrados(): PerfilUsuarioDTO[] {
    if (!this.terminoBusqueda.trim()) {
      return this.listaEstudiantes;
    }
    const termino = this.terminoBusqueda.toLowerCase();
    return this.listaEstudiantes.filter(est => 
      est.persona.nombre.toLowerCase().includes(termino) ||
      est.persona.apellidos.toLowerCase().includes(termino) ||
      (est.rol as any)?.matricula?.toLowerCase().includes(termino)
    );
  }

  // --- ACCIONES PRINCIPALES ---

  descargarBoleta(estudiante: PerfilUsuarioDTO) {
    this.notificaciones.mostrar('info', 'Generando PDF', 'Recopilando calificaciones...');

    // NOTA: Aquí deberías llamar a tu servicio real para traer las calificaciones.
    // Como ejemplo, voy a llamar a un método hipotético `getBoletaData`.
    // Si no tienes este endpoint, más abajo te dejo cómo simularlo.
    
    this.estudianteService.getBoletaData(estudiante.persona.uid).subscribe({
      next: (datosBoleta: BoletaDataDTO) => {
        // Una vez que tenemos los datos completos (materias, promedios, periodos), imprimimos
        this.impresionService.imprimirBoleta(datosBoleta);
        this.notificaciones.mostrar('exito', 'Listo', 'Boleta generada correctamente');
      },
      error: (err) => {
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudieron obtener las calificaciones');
      }
    });
  }

  public mostrarModalCredencialVar = false;

  abrirModalCredencial(estudiante: PerfilUsuarioDTO) {
    this.estudianteSeleccionado = estudiante;
    this.mostrarModalCredencialVar = true;
  }

  cargarEstudiantesRecientes() {
    // Sugerencia: Si tu backend soporta paginación o búsqueda, úsala aquí.
    // Por ahora traemos la lista para filtrar en local.
    this.estudianteService.getEstudiantes('persona.nombre', 'asc').subscribe({
      next: (estudiantes) => {
        this.listaEstudiantes = estudiantes;
      },
      error: (err) => console.error('Error cargando estudiantes:', err),
    });
  }

  cargarEstudiantesBaja() {
    this.estudianteService.getEstudiantesBaja('persona.nombre', 'asc').subscribe({
      next: (estudiantes) => this.listaEstudiantesBaja = estudiantes,
      error: (err) => console.error(err),
    });
  }

  cargarDatos() {
    this.estaCargando = true;
    this.adminService.getEstadisticasDashboard().subscribe({
      next: (data) => {
        this.estadisticas = data;
        this.estaCargando = false;
      },
      error: () => this.estaCargando = false
    });
  }

  // --- MANEJO DE MODALES ---

  abrirCreacionEstudiante() {
    this.mostrarModalCreacion = true;
  }

  guardarNuevoEstudiante(nuevoEstudiante: PerfilUsuarioDTO) {
    // Aquí recibes el evento 'save' de tu ModalEstudianteCrear
    this.mostrarModalCreacion = false;
    this.notificaciones.mostrar('exito', 'Registrado', 'Estudiante creado correctamente');
    this.cargarEstudiantesRecientes(); // Recargamos la lista
    this.cargarDatos(); // Recargamos KPIs
  }

  abrirEdicion(estudiante: PerfilUsuarioDTO) {
    this.estudianteSeleccionado = estudiante;
    this.mostrarModalEdicion = true;
  }

  // ... (El resto de funciones como guardarEdicion, confirmarBaja, etc. se mantienen igual)
  
  // Función para cerrar modales y recargar si es necesario
  recargarTrasCarga() {
    this.mostrarCargaMasiva = false;
    this.notificaciones.mostrar('exito', 'Proceso Finalizado', 'Carga masiva completada.');
    this.cargarEstudiantesRecientes();
    this.cargarDatos();
  }

  verReporte(reporte: any) {
    this.reporteSeleccionado = reporte;
    this.mostrarModalReporte = true;
  }

  recargarReportes() {
    if (this.widgetReportes) this.widgetReportes.cargarReportes();
    this.cargarDatos();
  }

  onPeriodoActualizado() {
    console.log('Actualizando widget de periodo...');
    
    // Recargamos las estadísticas generales (por si algo cambió ahí)
    this.cargarDatos();

    // ¡AQUÍ ESTÁ LA MAGIA! Forzamos al widget a buscar de nuevo
    if (this.widgetPeriodo) {
      this.widgetPeriodo.buscarPeriodoActivo();
    }
  }

  agregarActividad(nueva: AgendaActividad) {
    this.Abrimodal = false;
    this.adminService.crearActividad(nueva).subscribe({
      next: (res) => {
        console.log('Actividad creada:', res);
        this.actividades.push(nueva);
        this.actividades.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
        this.notificaciones.mostrar('exito', 'Guardado', 'Actividad registrada correctamente');
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo conectar con el servidor');
      },
    });
  }

  // Al guardar desde el modal
  guardarEdicion(estudianteActualizado: PerfilUsuarioDTO) {
    // 1. Llamar al servicio para actualizar en backend
    this.estudianteService
      .updateEstudiante(estudianteActualizado.persona.uid, {
        datosPersona: estudianteActualizado.persona,
        datosRol: estudianteActualizado.rol,
      })
      .subscribe({
        next: () => {
          // 2. Actualizar lista localmente
          const index = this.listaEstudiantes.findIndex(
            (e) => e.persona.uid === estudianteActualizado.persona.uid
          );
          if (index !== -1) {
            this.listaEstudiantes[index] = estudianteActualizado;
          }
          this.mostrarModalEdicion = false;
          this.notificaciones.mostrar('exito', 'Actualizado', 'Datos guardados correctamente');
        },
        error: () => this.notificaciones.mostrar('error', 'Error', 'No se pudo actualizar'),
      });
  }

  public errorCarga = false;
  private datePipe = inject(DatePipe); // 3. Inyectar DatePipe

  public ServicioCatalogo = inject(CatalogosService);

  // Variables
  actividades: AgendaActividad[] = []; // Array vacío para recibir datos

  cargarDatosPeriodo() {
    this.ServicioCatalogo.getAllPeriodos();
  }

  // 1. ESTA FUNCIÓN RECIBE EL EVENTO (delete) DE LA TARJETA
  confirmarBaja(estudiante: PerfilUsuarioDTO) {
    // Usamos el servicio de notificaciones para mostrar el modal de confirmación
    this.notificaciones.confirmar(
      'Confirmar Baja', // Título
      `¿Estás seguro de dar de baja a "${estudiante.persona.nombre} ${estudiante.persona.apellidos}"? El usuario perderá el acceso al sistema.`, // Mensaje
      () => {
        // Esta función se ejecuta SOLO si le dan "Confirmar"
        this.procesarBaja(estudiante);
      },
      'Sí, dar de baja' // Texto del botón rojo
    );
  }

  // 2. ESTA FUNCIÓN HACE LA LLAMADA A LA API
  procesarBaja(estudiante: PerfilUsuarioDTO) {
    this.estudianteService.darDeBaja(estudiante.persona.uid).subscribe({
      next: () => {
        // Actualizamos la lista localmente para reflejar el cambio (poniéndolo inactivo o quitándolo)

        // OPCIÓN A: Si quieres que desaparezca de la lista de "Recientes":
        // this.listaEstudiantes = this.listaEstudiantes.filter(e => e.persona.uid !== estudiante.persona.uid);

        // OPCIÓN B: Si quieres que se quede pero se vea "Rojo/Inactivo" (Recomendado):
        const index = this.listaEstudiantes.findIndex(
          (e) => e.persona.uid === estudiante.persona.uid
        );
        if (index !== -1) {
          // Actualizamos el estatus localmente para que la tarjeta cambie de color
          if (this.listaEstudiantes[index].rol) {
            // Forzamos el tipo para que TS no se queje
            (this.listaEstudiantes[index].rol as any).estatus = 'BAJA';
          }
        }

        this.notificaciones.mostrar('exito', 'Baja Exitosa', 'El estudiante ha sido dado de baja.');
      },
      error: (err) => {
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo dar de baja al estudiante.');
      },
    });
  }
}
