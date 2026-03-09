import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// CAMBIO 1: Importamos DocentesService en lugar de SolicitudesService
import { DocentesService } from '../../../../ServiciosActivos/docentes.service'; 
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';

@Component({
  selector: 'app-modal-solicitud-correccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-solicitud-correccion.html',
  styleUrl: './modal-solicitud-correccion.scss'
})
export class ModalSolicitudCorreccion {
  @Input() dataContext: any;
  @Output() close = new EventEmitter<void>();

  // CAMBIO 2: Inyección del servicio correcto
  private docentesService = inject(DocentesService);
  private notificaciones = inject(NotificacionesService);

  calificacionNueva: number | null = null;
  motivo: string = '';
  tipoCausa: string = 'ERROR_HUMANO';
  procesando = false;

  causas = [
    { id: 'ERROR_HUMANO', label: 'Error involuntario de captura' },
    { id: 'JUSTIFICANTE_MEDICO', label: 'Justificante Médico (Salud)' },
    { id: 'TRABAJO_EXTEMPORANEO', label: 'Entrega de trabajo extemporáneo' },
    { id: 'OTRO', label: 'Otra razón (Especificar)' }
  ];

  enviar() {
    // Validaciones
    if (this.calificacionNueva === null || this.calificacionNueva === undefined) {
      this.notificaciones.mostrar('info', 'Faltan datos', 'Debes ingresar la nueva calificación.');
      return;
    }
    if (this.calificacionNueva < 0 || this.calificacionNueva > 100) { // Ajusta según tu escala (10 o 100)
       this.notificaciones.mostrar('info', 'Error', 'La calificación debe ser válida.');
       return;
    }
    if (!this.motivo || this.motivo.trim().length < 5) {
      this.notificaciones.mostrar('info', 'Motivo requerido', 'Por favor explica brevemente la razón.');
      return;
    }

    this.procesando = true;

    // CAMBIO 3: Construcción del Payload para el Backend
    // Mapeamos las propiedades del frontend a lo que espera 'DocentesService.enviarSolicitudRectificacion'
    const payload = {
      uidAlumno: this.dataContext.alumno.uid,
      nombreAlumno: this.dataContext.alumno.nombre,
      
      // OJO AQUÍ: Para el backend 'idMateria' será el ID del Rubro/Evaluación que vamos a corregir
      idMateria: this.dataContext.rubro.id, 
      nombreMateria: `${this.dataContext.materiaNombre} - ${this.dataContext.rubro.nombre}`, 
      
      calificacionAnterior: Number(this.dataContext.alumno.notas[this.dataContext.rubro.id] || 0),
      calificacionNueva: this.calificacionNueva,
      
      motivo: `[${this.tipoCausa}] ${this.motivo}`, // Concatenamos la causa con la explicación
      nombreDocente: this.dataContext.docenteNombre
    };

    // CAMBIO 4: Llamada al servicio
    this.docentesService.enviarSolicitudRectificacion(payload).subscribe({
      next: (res) => {
        this.notificaciones.mostrar('exito', 'Enviado', 'La solicitud se ha enviado a Dirección.');
        this.procesando = false;
        this.close.emit(); 
      },
      error: (err) => {
        console.error('Error enviando solicitud:', err);
        this.procesando = false;
        this.notificaciones.mostrar('error', 'Error', 'No se pudo enviar la solicitud.');
      }
    });
  }

  cerrar() {
    this.close.emit();
  }
}