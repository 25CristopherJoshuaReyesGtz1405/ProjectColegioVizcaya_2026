import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service'; // Ajusta la ruta

@Component({
  selector: 'app-modal-carga-masiva',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-carga-masiva.html',
  styleUrl: './modal-carga-masiva.scss'
})
export class ModalCargaMasiva {

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>(); // Para recargar la tabla al terminar

  private estudiantesService = inject(EstudiantesService);

  // Estados
  archivoSeleccionado: File | null = null;
  cargando = false;
  
  // Resultados del Backend
  resultado: any = null; // { total, exitosos, fallidos, errores[] }
  mensajeError: string = '';

  // --- SELECCIÓN DE ARCHIVO ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.validarYAsignar(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validarYAsignar(file);
    }
  }

  validarYAsignar(file: File) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      this.mensajeError = 'Solo se permiten archivos con extensión .csv';
      this.archivoSeleccionado = null;
      return;
    }
    this.mensajeError = '';
    this.resultado = null;
    this.archivoSeleccionado = file;
  }

  // --- SUBIR AL SERVIDOR ---
  subirArchivo() {
    if (!this.archivoSeleccionado) return;

    this.cargando = true;
    this.estudiantesService.cargarMasiva(this.archivoSeleccionado).subscribe({
      next: (res) => {
        this.cargando = false;
        // El backend devuelve { message, reporte: { ... } }
        this.resultado = res.reporte; 
        
        if (this.resultado.exitosos > 0) {
          this.success.emit(); // Avisar al padre que recargue datos
        }
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = err.error?.message || 'Error al procesar el archivo.';
        console.error(err);
      }
    });
  }

  cerrar() {
    this.close.emit();
  }
}