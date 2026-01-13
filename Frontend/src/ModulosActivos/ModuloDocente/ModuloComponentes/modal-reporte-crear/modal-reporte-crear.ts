import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// SERVICIOS
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';

// MODELOS
// Importamos la interfaz ReporteIndisciplina
import { PerfilUsuarioDTO, ReporteIndisciplina } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-reporte-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-reporte-crear.html',
  styleUrl: './modal-reporte-crear.scss'
})
export class ModalReporteCrear implements OnInit {

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private docentesService = inject(DocentesService);
  private estudiantesService = inject(EstudiantesService);
  private notificaciones = inject(NotificacionesService);

  listaEstudiantes: PerfilUsuarioDTO[] = [];
  cargando = false;

  // Modelo local para el formulario (string para inputs HTML)
  reporte = {
    estudianteUid: '',
    tipo: 'Conducta',
    severidad: 'BAJA', 
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
    descripcion: ''
  };

  ngOnInit() {
    this.cargarEstudiantes();
  }

  cargarEstudiantes() {
    this.estudiantesService.getEstudiantes('persona.apellidos', 'asc').subscribe({
      next: (data) => this.listaEstudiantes = data,
      error: () => this.notificaciones.mostrar('error', 'Error', 'No se pudo cargar la lista de alumnos.')
    });
  }

  guardar() {
    if (!this.reporte.estudianteUid || !this.reporte.descripcion) {
      this.notificaciones.mostrar('error', 'Faltan Datos', 'Selecciona un alumno y describe la incidencia.');
      return;
    }

    this.cargando = true;

    // 1. Crear fecha Date real
    const fechaCompleta = new Date();

    // 2. CONSTRUIR PAYLOAD TIPADO
    const payload: ReporteIndisciplina
    = {
      docenteUid: '', 
      id:'', 
      estudianteUid: this.reporte.estudianteUid,
      tipo: this.reporte.tipo,
      severidad: this.reporte.severidad as 'BAJA' | 'MEDIA' | 'ALTA', 
      descripcion: this.reporte.descripcion,
      fecha: fechaCompleta
    };

    console.log(payload);
    

    // 3. Enviar
    this.docentesService.crearReporte(payload).subscribe({
      next: () => {
        this.cargando = false;
        this.notificaciones.mostrar('exito', 'Reporte Generado', 'La incidencia ha sido registrada.');
        this.success.emit();
        this.close.emit();
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo guardar el reporte.');
      }
    });
  }
}