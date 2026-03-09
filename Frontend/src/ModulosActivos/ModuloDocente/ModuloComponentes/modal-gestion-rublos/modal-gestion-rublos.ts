import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';

interface RubroEditable {
  id: string;
  nombre: string;
  porcentaje: number;
  editando?: boolean;
}

@Component({
  selector: 'app-modal-gestion-rublos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-gestion-rublos.html',
  styleUrl: './modal-gestion-rublos.scss'
})
export class ModalGestionRublos implements OnInit {
  @Input() grupoId = '';
  @Input() periodoId = '';
  @Output() close = new EventEmitter<void>();
  @Output() cambioRealizado = new EventEmitter<void>();

  private docentesService = inject(DocentesService);
  private notificaciones = inject(NotificacionesService);

  rubros: RubroEditable[] = [];
  cargando = true;
  procesando = false;
  totalPorcentaje = 0;

  ngOnInit() {
    this.cargarRubros();
  }

  cargarRubros() {
    this.cargando = true;
    this.docentesService.getEvaluacionesGrupo(this.grupoId, this.periodoId).subscribe({
      next: (data: any[]) => {
        // Ordenamos por fecha si viene, si no por nombre
        this.rubros = data.map(d => ({ 
          id: d.id, 
          nombre: d.nombre, 
          porcentaje: d.porcentaje,
          editando: false 
        }));
        this.calcularTotal();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.notificaciones.mostrar('error', 'Error', 'No se pudieron cargar los datos.');
      }
    });
  }

  calcularTotal() {
    this.totalPorcentaje = this.rubros.reduce((acc, curr) => acc + (curr.porcentaje || 0), 0);
  }

  habilitarEdicion(rubro: RubroEditable) {
    this.rubros.forEach(r => r.editando = false); // Cerrar otros
    rubro.editando = true;
  }

  cancelarEdicion(rubro: RubroEditable) {
    rubro.editando = false;
    this.cargarRubros(); // Revertir a datos originales
  }

  guardarRubro(rubro: RubroEditable) {
    if (!rubro.nombre.trim() || rubro.porcentaje <= 0) {
      this.notificaciones.mostrar('error', 'Datos Inválidos', 'Verifica nombre y porcentaje.');
      return;
    }
    
    this.procesando = true;
    this.docentesService.actualizarEvaluacion(this.grupoId, rubro.id, {
      nombre: rubro.nombre,
      porcentaje: rubro.porcentaje
    }).subscribe({
      next: () => {
        this.notificaciones.mostrar('exito', 'Actualizado', 'Criterio modificado.');
        rubro.editando = false;
        this.procesando = false;
        this.cambioRealizado.emit();
        this.calcularTotal();
      },
      error: () => {
        this.procesando = false;
        this.notificaciones.mostrar('error', 'Error', 'Fallo al guardar.');
      }
    });
  }

  eliminarRubro(rubro: RubroEditable) {
    this.notificaciones.confirmar(
      'Confirmar Baja', // Título
      `¿Eliminar criterio "${rubro.nombre}"? Esto borrará las notas asociadas.`, // Mensaje
      () => {
        this.procesando = true;
    this.docentesService.eliminarEvaluacion(this.grupoId, rubro.id).subscribe({
      next: () => {
        this.notificaciones.mostrar('exito', 'Eliminado', 'Criterio borrado.');
        this.rubros = this.rubros.filter(r => r.id !== rubro.id);
        this.calcularTotal();
        this.procesando = false;
        this.cambioRealizado.emit();
      },
      error: () => {
        this.procesando = false;
        this.notificaciones.mostrar('error', 'Error', 'No se pudo eliminar.');
      }
    });
      },
      'Sí, dar de baja' // Texto del botón rojo
    );
  }

  cerrarModal() {
    this.close.emit();
  }
}