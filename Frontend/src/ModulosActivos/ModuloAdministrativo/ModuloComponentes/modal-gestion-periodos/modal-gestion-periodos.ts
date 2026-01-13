import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { Periodo } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-gestion-periodos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-gestion-periodos.html',
  styleUrl: './modal-gestion-periodos.scss'
})
export class ModalGestionPeriodos implements OnInit {

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
  @Output() update = new EventEmitter<void>(); 

  private catalogosService = inject(CatalogosService);
  private notificaciones = inject(NotificacionesService);

  // Lista para mostrar historial rápido (opcional)
  listaPeriodos: Periodo[] = [];
  
  // Modelo del formulario
  periodoForm = {
    id: '', // Si tiene ID es edición, si no es creación
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    estatus: false // false = CERRADO, true = ABIERTO
  };

  cargando = false;

  ngOnInit() {
    this.cargarUltimosPeriodos();
  }

  cargarUltimosPeriodos() {
    this.catalogosService.getAllPeriodos().subscribe({
      next: (data) => {
        this.listaPeriodos = data;
        // Opcional: Cargar automáticamente el último periodo en el formulario para editarlo
        /* if (data.length > 0) {
           this.seleccionarPeriodo(data[data.length - 1]);
        } */
      },
      error: (err) => console.error(err)
    });
  }

  // Cargar datos de un periodo existente al formulario
  seleccionarPeriodo(p: Periodo) {
    this.periodoForm = {
      id: p.id,
      nombre: p.nombre,
      // Convertir fecha Date a string YYYY-MM-DD para el input
      fechaInicio: new Date(p.fechaInicio).toISOString().split('T')[0],
      fechaFin: new Date(p.fechaFin).toISOString().split('T')[0],
      estatus: p.estatus === 'ABIERTO'
    };
  }

  limpiarFormulario() {
    this.periodoForm = { id: '', nombre: '', fechaInicio: '', fechaFin: '', estatus: false };
  }

  guardar() {
    this.cargando = true;

    // Preparar payload para el backend
    const payload: any = {
      nombre: this.periodoForm.nombre,
      fechaInicio: new Date(this.periodoForm.fechaInicio),
      fechaFin: new Date(this.periodoForm.fechaFin),
      estatus: this.periodoForm.estatus ? 'ABIERTO' : 'CERRADO'
    };

    if (this.periodoForm.id) {
      // EDITAR
      this.catalogosService.updatePeriodo(this.periodoForm.id, payload).subscribe({
        next: () => this.finalizarExito('Periodo actualizado correctamente'),
        error: () => this.finalizarError()
      });
    } else {
      // CREAR NUEVO
      this.catalogosService.crearPeriodo(payload).subscribe({
        next: () => this.finalizarExito('Nuevo periodo creado y configurado'),
        error: () => this.finalizarError()
      });
    }
  }

  private finalizarExito(msg: string) {
    this.cargando = false;
    this.notificaciones.mostrar('exito', 'Éxito', msg);
    this.updated.emit();
    this.close.emit();
  }

  private finalizarError() {
    this.cargando = false;
    this.notificaciones.mostrar('error', 'Error', 'No se pudo guardar el periodo');
  }
}