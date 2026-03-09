import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service'; 
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';

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
  private estudiantesService = inject(EstudiantesService); 

  cargandoPDF = false;

  // --- TRADUCTOR DE FECHAS (Solución al bug visual) ---
  get reporteFecha(): Date | null {
    if (!this.reporte || !this.reporte.fecha) return null;
    
    const f = this.reporte.fecha;
    
    // Si viene como Timestamp de Firebase Admin (_seconds) o Client (seconds)
    if (f._seconds) return new Date(f._seconds * 1000);
    if (f.seconds) return new Date(f.seconds * 1000);
    
    // Si viene como String ISO o número
    if (typeof f === 'string' || typeof f === 'number') return new Date(f);
    
    // Si ya es un objeto Date
    if (f instanceof Date) return f;

    return null;
  }

  imprimir() {
    if (!this.reporte || this.cargandoPDF) return;

    this.cargandoPDF = true;
    this.notificaciones.mostrar('info', 'Generando PDF', 'Obteniendo datos del estudiante...');

    this.estudiantesService.getPorUID(this.reporte.estudianteUid).subscribe({
      next: (estudianteFull) => {
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
      () => this.eliminar(),
      'Sí, eliminar'
    );
  }

  private eliminar() {
    this.docentesService.deleteReporte(this.reporte.id).subscribe({
      next: () => {
        this.notificaciones.mostrar('exito', 'Eliminado', 'El reporte ha sido borrado.');
        this.deleted.emit(); 
        this.close.emit();   
      },
      error: (err) => {
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo eliminar el reporte.');
      }
    });
  }
}