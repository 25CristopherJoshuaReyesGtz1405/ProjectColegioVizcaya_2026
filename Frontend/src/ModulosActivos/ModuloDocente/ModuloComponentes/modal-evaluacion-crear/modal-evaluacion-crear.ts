import { Component, EventEmitter, Input, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';

@Component({
  selector: 'app-modal-evaluacion-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-evaluacion-crear.html',
  styleUrl: './modal-evaluacion-crear.scss'
})
export class ModalEvaluacionCrear {

  @Input() grupoId!: string;
  @Input() periodoId!: string;
  
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private docentesService = inject(DocentesService);
  private notificaciones = inject(NotificacionesService);

  cargando = false;

  // Modelo
  nuevaEvaluacion = {
    nombre: '',
    porcentaje: 20,
    tipo: 'TAREA'
  };

  // Tipos de actividad (Configuración visual)
  tiposActividad = [
    { id: 'EXAMEN', label: 'Examen', icon: 'bi-file-earmark-text', color: '#be123c' },
    { id: 'PROYECTO', label: 'Proyecto', icon: 'bi-kanban', color: '#0ea5e9' },
    { id: 'TAREA', label: 'Tarea / Actividad', icon: 'bi-journal-check', color: '#10b981' },
    { id: 'PARTICIPACION', label: 'Participación', icon: 'bi-chat-quote', color: '#f59e0b' }
  ];

  cerrarModal() {
    this.close.emit();
  }

  seleccionarTipo(id: string) {
    this.nuevaEvaluacion.tipo = id;
  }

  guardar() {
    if (!this.nuevaEvaluacion.nombre || this.nuevaEvaluacion.porcentaje <= 0) {
      this.notificaciones.mostrar('error', 'Datos Faltantes', 'Ingresa un nombre y porcentaje válido.');
      return;
    }

    this.cargando = true;

    // Payload para el backend
    const payload = {
      grupoId: this.grupoId,
      datosEvaluacion: {
        periodoId: this.periodoId,
        nombre: this.nuevaEvaluacion.nombre,
        porcentaje: this.nuevaEvaluacion.porcentaje,
        tipo: this.nuevaEvaluacion.tipo
      }
    };

    this.docentesService.crearEvaluacion(payload).subscribe({
      next: () => {
        this.cargando = false;
        this.notificaciones.mostrar('exito', 'Creado', 'El criterio se agregó correctamente.');
        this.success.emit();
        this.cerrarModal();
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo crear la evaluación.');
      }
    });
  }
}