import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminService } from '../../../../ServiciosActivos/admin.service';
import { EstadisticasDashboardDTO } from '../../../../../../Backend/src/ModelosAplicacion/ModelosAplicacion.model';
import { TarjetaStadistic } from '../../../../ComponentesActivos/tarjeta-stadistic/tarjeta-stadistic';
import { AgendaWidget } from '../../ModuloComponentes/agenda-widget/agenda-widget';
import { ModalActividad } from '../../ModuloComponentes/modal-actividad/modal-actividad';
import {
  AgendaActividad,
  PerfilUsuarioDTO,
  RolEstudiante,
} from '../../../../ModelosActivos/ModelosAplicacion.model';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';
import { EstudianteCard } from '../../ModuloComponentes/estudiante-card/estudiante-card';
import { ModalEstudianteActualizar } from '../../ModuloComponentes/modal-estudiante-actualizar/modal-estudiante-actualizar';
import { DocenteCard } from '../../ModuloComponentes/docente-card/docente-card';
import { ModalDocenteActualizar } from '../../ModuloComponentes/modal-docente-actualizar/modal-docente-actualizar';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';

@Component({
  selector: 'app-panel-inicio',
  standalone: true,
  imports: [
    CommonModule,
    TarjetaStadistic,
    AgendaWidget,
    ModalActividad,
    EstudianteCard,
    ModalEstudianteActualizar,
    DocenteCard,
    ModalDocenteActualizar
  ],
  templateUrl: './panel-inicio.html',
  styleUrl: './panel-inicio.scss',
  providers: [DatePipe],
})
export class PanelInicio implements OnInit {
  public listaEstudiantes: PerfilUsuarioDTO[] = []; // Nueva propiedad para la lista

  public listaDocentes: PerfilUsuarioDTO[] = []; // <--- NUEVA LISTA
  public docenteSeleccionado: PerfilUsuarioDTO | null = null;
  public mostrarModalDocente = false;


  Abrimodal: boolean = false;

  notificaciones = inject(NotificacionesService);
  estudianteService = inject(EstudiantesService);

  private docentesService = inject(DocentesService); // <--- INYECTAR

  abrirModalCreacion() {
    this.Abrimodal = true;
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

  // --- LÓGICA DOCENTES ---

  cargarDocentes() {
    this.docentesService.getDocentes().subscribe({
      next: (data) => {
        // Mostramos solo los primeros 5 en el widget
        this.listaDocentes = data.slice(0, 5);
      },
      error: (err) => console.error('Error cargando docentes:', err)
    });
  }

  abrirEdicionDocente(docente: PerfilUsuarioDTO) {
    this.docenteSeleccionado = docente;
    this.mostrarModalDocente = true;
  }

  confirmarBajaDocente(docente: PerfilUsuarioDTO) {
    this.notificaciones.confirmar(
      'Baja de Docente',
      `¿Deseas dar de baja al Prof. ${docente.persona.nombre} ${docente.persona.apellidos}?`,
      () => this.procesarBajaDocente(docente),
      'Dar de Baja'
    );
  }

  procesarBajaDocente(docente: PerfilUsuarioDTO) {
    this.docentesService.darDeBajaDocente(docente.persona.uid).subscribe({
      next: () => {
        this.notificaciones.mostrar('exito', 'Baja Exitosa', 'El docente ha sido desactivado.');
        // Actualizamos visualmente
        const index = this.listaDocentes.findIndex(d => d.persona.uid === docente.persona.uid);
        if (index !== -1 && this.listaDocentes[index].rol) {
           // Forzamos el tipo "any" o "RolEmpleado" para asignar estatus
           (this.listaDocentes[index].rol as any).estatus = 'BAJA';
        }
      },
      error: () => this.notificaciones.mostrar('error', 'Error', 'No se pudo procesar la baja.')
    });
  }

  guardarEdicionDocente(docenteActualizado: PerfilUsuarioDTO) {
    this.mostrarModalDocente = false;
    this.docentesService.updateDocente(docenteActualizado.persona.uid, {
      datosPersona: docenteActualizado.persona,
      datosRol: docenteActualizado.rol
    }).subscribe({
      next: () => {
        this.notificaciones.mostrar('exito', 'Actualizado', 'Datos del docente guardados.');
        // Actualizar lista local
        const idx = this.listaDocentes.findIndex(d => d.persona.uid === docenteActualizado.persona.uid);
        if (idx !== -1) this.listaDocentes[idx] = docenteActualizado;
      },
      error: () => this.notificaciones.mostrar('error', 'Error', 'Fallo al guardar cambios.')
    });
  }

  public estudianteSeleccionado: PerfilUsuarioDTO | null = null;
  public mostrarModalEdicion = false;

  // Al dar click en editar (desde el output de estudiante-card)
  abrirEdicion(estudiante: PerfilUsuarioDTO) {
    this.estudianteSeleccionado = estudiante;
    this.mostrarModalEdicion = true;
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

  private adminService = inject(AdminService);

  // Variable para almacenar los datos del backend
  public estadisticas: EstadisticasDashboardDTO | null = null;

  public estaCargando = true;
  public errorCarga = false;
  private datePipe = inject(DatePipe); // 3. Inyectar DatePipe

  // Variables
  today: Date = new Date(); // Inicializamos con la fecha actual
  actividades: AgendaActividad[] = []; // Array vacío para recibir datos

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
    // 3. Cargar Estudiantes (¡NUEVO: Se carga al iniciar!)
    this.cargarEstudiantesRecientes();
    this.cargarDocentes(); 
  }

  cargarEstudiantesRecientes() {
    // Pedimos los estudiantes ordenados por nombre (o por fecha si tu backend lo soporta)
    this.estudianteService.getEstudiantes('persona.nombre', 'asc').subscribe({
      next: (estudiantes) => {
        console.log('Estudiantes cargados:', estudiantes);
        // Tomamos solo los primeros 5 para que no se sature el widget
        this.listaEstudiantes = estudiantes.slice(0, 5);
      },
      error: (err) => console.error('Error cargando estudiantes:', err),
    });
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
