import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

// COMPONENTES
import { GruposWidget } from '../../ModuloComponentes/grupos-widget/grupos-widget';
import { ModalGrupoNuevo } from '../../ModuloComponentes/modal-grupo-nuevo/modal-grupo-nuevo';
import { ModalGrupoGestion } from '../../ModuloComponentes/modal-grupo-gestion/modal-grupo-gestion';

// SERVICIOS Y MODELOS
import { GruposService, GrupoDetalle } from '../../../../ServiciosActivos/grupos.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { EstadisticasDashboardDTO, AgendaActividad } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { AdminService } from '../../../../ServiciosActivos/admin.service';
import { TarjetaStadistic } from '../../../../ComponentesActivos/tarjeta-stadistic/tarjeta-stadistic';
import { MateriaAlertsWidget } from "../../ModuloComponentes/materia-alerts-widget/materia-alerts-widget";

@Component({
  selector: 'app-panel-grupos',
  standalone: true,
  imports: [
    CommonModule,
    GruposWidget, // La Tabla
    ModalGrupoNuevo, // Modal Crear
    ModalGrupoGestion, // Modal Gestionar Alumnos
    TarjetaStadistic,
    MateriaAlertsWidget
],
  templateUrl: './panel-grupos.html',
  styleUrl: './panel-grupos.scss', 
  providers:[DatePipe]
})
export class PanelGrupos implements OnInit {

  private gruposService = inject(GruposService);
  private notificaciones = inject(NotificacionesService);

  // --- VARIABLES PARA CONTROLAR MODALES ---
  public mostrarModalNuevo = false;
  public mostrarModalGestion = false;
  
  // Aquí guardamos el grupo al que le dimos clic en la tabla
  public grupoSeleccionado: GrupoDetalle | null = null;

  // Referencia a la tabla para poder recargarla
  @ViewChild(GruposWidget) widgetGrupos!: GruposWidget;

  // ------------------------------------------------
  // 1. LÓGICA PARA CREAR NUEVO GRUPO
  // ------------------------------------------------
  abrirModalCrear(grupo: GrupoDetalle) {
    this.mostrarModalNuevo = true;
  }

  alCrearGrupo() {
    // Se ejecuta cuando el modal termina de guardar
    this.mostrarModalNuevo = false;
    this.recargarTabla();
  }

  // ------------------------------------------------
  // 2. LÓGICA PARA GESTIONAR ALUMNOS
  // ------------------------------------------------
  
  // Esta función recibe el evento (manage) del Widget
  abrirGestionAlumnos(grupo: GrupoDetalle) {
    console.log('Gestionando grupo:', grupo.materia.nombre);
    this.grupoSeleccionado = grupo; // Guardamos el grupo
    this.mostrarModalGestion = true; // Abrimos el modal
  }

  alTerminarGestion() {
    // Se ejecuta si agregaste/quitaste alumnos
    this.recargarTabla(); 
    // No cerramos el modal aquí automáticamente para permitir seguir editando, 
    // o puedes cerrarlo si prefieres.
  }

  // ------------------------------------------------
  // 3. LÓGICA PARA ELIMINAR GRUPO
  // ------------------------------------------------
  
  // Esta función recibe el evento (delete) del Widget
  confirmarEliminar(grupo: GrupoDetalle) {
    this.notificaciones.confirmar(
      'Eliminar Grupo',
      `¿Estás seguro de borrar el grupo de ${grupo.materia.nombre}? Se perderá la relación con los alumnos.`,
      () => this.eliminarGrupo(grupo.id),
      'Sí, borrar'
    );
  }

  private eliminarGrupo(id: string) {
    this.gruposService.deleteGrupo(id).subscribe({
      next: () => {
        this.notificaciones.mostrar('exito', 'Eliminado', 'El grupo ha sido borrado.');
        this.recargarTabla();
      },
      error: (err) => {
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo eliminar.');
      }
    });
  }

  // Helper para refrescar el widget
  recargarTabla() {
    if (this.widgetGrupos) {
      this.widgetGrupos.cargarGrupos();
    }
  }

  // Variable para almacenar los datos del backend
    public estadisticas: EstadisticasDashboardDTO | null = null;
  
    public estaCargando = true;
    public errorCarga = false;
    private datePipe = inject(DatePipe); // 3. Inyectar DatePipe
  
    // Variables
    today: Date = new Date(); // Inicializamos con la fecha actual
    actividades: AgendaActividad[] = []; // Array vacío para recibir datos

      private adminService = inject(AdminService);
    
  
    ngOnInit(): void {
      // 4. Formatear la fecha a 'yyyy-MM-dd' (Formato ISO que pide tu backend)
      const fechaFormateada = this.datePipe.transform(this.today, 'yyyy-MM-dd');
  
      if (fechaFormateada) {
        // 5. Llamar al servicio y SUSCRIBIRSE
        this.adminService.getAgenda(fechaFormateada).subscribe({
          next: (data) => {
            this.actividades = data;
            console.log('Actividades cargadas:', this.actividades);
          },
          error: (err) => {
            console.error('Error al cargar agenda:', err);
          },
        });
      }
  
      this.cargarDatos(); 
    }

    cargarDatos() {
    this.estaCargando = true;
    this.errorCarga = false;
    this.today = new Date();

    // Llamada al servicio del backend (RF 4.2)
    this.adminService.getEstadisticasDashboard().subscribe({
      next: (data) => {
        console.log('Estadísticas recibidas:', data);
        this.estadisticas = data;
        this.estaCargando = false;
      },
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        this.errorCarga = true;
        this.estaCargando = false;
        // Aquí podrías mostrar un Toast de error si lo deseas
      },
    });
  }

}