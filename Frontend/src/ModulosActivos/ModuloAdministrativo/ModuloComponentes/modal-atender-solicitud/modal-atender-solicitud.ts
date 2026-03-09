import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {  AdminService, TicketRectificacion } from '../../../../ServiciosActivos/admin.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';

@Component({
  selector: 'app-modal-atender-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-atender-solicitud.html',
  styleUrls: ['./modal-atender-solicitud.scss']
})
export class ModalAtenderSolicitud {
  @Input() ticket!: TicketRectificacion;
  @Output() close = new EventEmitter<void>();
  @Output() resolved = new EventEmitter<void>();

  private adminService = inject(AdminService);
  private notificaciones = inject(NotificacionesService);

  procesando = false;
  motivoRechazo = '';
  mostrarInputRechazo = false;

  aprobar() {
    this.procesando = true;
    
    // Obtenemos el UID de la directora (desde localStorage o Auth)
    // En un caso real, el backend podría sacarlo del token, pero aquí lo enviamos explícito si el servicio lo pide
    const uidDirectora = localStorage.getItem('user_uid') || ''; 

    const payload = {
      uidDirectora,
      evaluacionId: this.ticket.idMateria, // Ojo: Asegúrate que el backend mapee esto al ID de la evaluación
      estudianteUid: this.ticket.uidAlumno,
      nuevaCalificacion: this.ticket.calificacionNueva,
      motivoCambio: `Solicitud Aprobada: ${this.ticket.id}`,
      solicitudId: this.ticket.id
    };

    this.adminService.aprobarSolicitud(payload).subscribe({
      next: () => {
        this.notificaciones.mostrar('exito', 'Aprobado', 'Calificación actualizada correctamente.');
        this.procesando = false;
        this.resolved.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo aprobar la solicitud.');
        this.procesando = false;
      }
    });
  }

  prepararRechazo() {
    this.mostrarInputRechazo = true;
  }

  confirmarRechazo() {
    if (!this.motivoRechazo.trim()) {
      this.notificaciones.mostrar('info', 'Requerido', 'Indica el motivo del rechazo.');
      return;
    }

    this.procesando = true;
    this.adminService.rechazarSolicitud(this.ticket.id, this.motivoRechazo).subscribe({
      next: () => {
        this.notificaciones.mostrar('info', 'Rechazada', 'La solicitud ha sido cerrada.');
        this.procesando = false;
        this.resolved.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error(err);
        this.procesando = false;
      }
    });
  }
}