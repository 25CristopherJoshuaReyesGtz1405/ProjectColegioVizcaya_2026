import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service'; 
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service'; // <--- 1. IMPORTAR

@Component({
  selector: 'app-modal-reporte-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-reporte-detalle.html',
  styleUrl: './modal-reporte-detalle.scss'
})
export class ModalReporteDetalle {
  @Input() reporte: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  private impresionService = inject(ImpresionService);
  private docentesService = inject(DocentesService); 
  private notificaciones = inject(NotificacionesService);
  private estudiantesService = inject(EstudiantesService); // <--- 2. INYECTAR

  // Variable para deshabilitar el botón mientras carga
  cargandoPDF = false;

  imprimir() {
    if (!this.reporte || this.cargandoPDF) return;

    this.cargandoPDF = true;
    this.notificaciones.mostrar('info', 'Generando PDF', 'Obteniendo datos del estudiante...');

    // 3. LLAMADA AL BACKEND
    this.estudiantesService.getPorUID(this.reporte.estudianteUid).subscribe({
      next: (estudianteFull) => {
        
        // ¡ÉXITO! Ya tenemos la matrícula real, foto y grado actualizados
        this.impresionService.imprimirReporteIndisciplina(this.reporte, estudianteFull);
        
        this.cargandoPDF = false;
      },
      error: (err) => {
        console.error('Error obteniendo estudiante:', err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudieron cargar los datos del estudiante para el PDF.');
        this.cargandoPDF = false;
      }
    });
  }

  confirmarEliminar() {
    if (!this.reporte) return;

    this.notificaciones.confirmar(
      'Eliminar Reporte',
      '¿Estás seguro de eliminar este reporte de forma permanente? Esta acción no se puede deshacer.',
      () => {
        this.eliminar();
      },
      'Sí, eliminar'
    );
  }

  private eliminar() {
    this.docentesService.deleteReporte(this.reporte.id).subscribe({
      next: () => {
        this.notificaciones.mostrar('exito', 'Eliminado', 'El reporte ha sido borrado.');
        this.deleted.emit(); // Avisamos para recargar la lista
        this.close.emit();   // Cerramos el modal
      },
      error: (err) => {
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo eliminar el reporte.');
      }
    });
  }
}