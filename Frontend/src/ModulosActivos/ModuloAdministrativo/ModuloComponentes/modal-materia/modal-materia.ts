import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { Materia } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-materia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-materia.html',
  styleUrl: './modal-materia.scss'
})
export class MateriaModal {

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private catalogosService = inject(CatalogosService);
  private notificaciones = inject(NotificacionesService);

  cargando = false;
  esEdicion = false; // Bandera para saber el modo

  // Modelo del formulario
  materia: Partial<Materia> = {
    claveMateria: '',
    nombre: '',
    grado: undefined
  };

  // --- INPUT PARA RECIBIR DATOS EN EDICIÓN ---
  @Input()
  set materiaEditar(datos: Materia | null) {
    if (datos) {
      this.esEdicion = true;
      this.materia = { ...datos }; // Copiamos los datos al formulario
    } else {
      this.esEdicion = false;
      this.limpiarFormulario();
    }
  }

  guardar() {
    if (!this.materia.claveMateria || !this.materia.nombre || !this.materia.grado) return;

    this.cargando = true;

    if (this.esEdicion && this.materia.id) {
      // MODO EDICIÓN: PUT
      this.catalogosService.updateMateria(this.materia.id, this.materia).subscribe({
        next: () => this.finalizar('Materia actualizada correctamente'),
        error: () => this.manejarError()
      });
    } else {
      // MODO CREACIÓN: POST
      this.catalogosService.crearMateria(this.materia).subscribe({
        next: () => this.finalizar('Materia creada correctamente'),
        error: () => this.manejarError()
      });
    }
  }

  private finalizar(mensaje: string) {
    this.cargando = false;
    this.notificaciones.mostrar('exito', 'Éxito', mensaje);
    this.success.emit();
    this.close.emit();
  }

  private manejarError() {
    this.cargando = false;
    this.notificaciones.mostrar('error', 'Error', 'No se pudo guardar la información.');
  }

  private limpiarFormulario() {
    this.materia = { claveMateria: '', nombre: '', grado: undefined };
  }
}