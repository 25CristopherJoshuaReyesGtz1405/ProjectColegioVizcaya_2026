import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaActividad } from './../../../../ModelosActivos/ModelosAplicacion.model'; // Asegúrate de que la ruta sea correcta
import { AdminService } from '../../../../ServiciosActivos/admin.service';

@Component({
  selector: 'app-modal-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-actividad.html',
  styleUrls: ['./modal-actividad.scss']
})
export class ModalActividad {

  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<AgendaActividad>();

  // Campos temporales para el manejo de fecha/hora en strings HTML5
  tempFecha: string = '';
  tempHora: string = '';

  // Objeto del formulario (Excluimos fecha completa por ahora)
  formData: Partial<AgendaActividad> & { tipo: string } = {
    titulo: '',
    descripcion: '',
    estatus: 'PENDIENTE',
    tipo: 'reunion' // Valor por defecto
  };

  adminService = inject(AdminService); 

  constructor() {}

  cancelar() {
    
    this.close.emit();
    this.limpiarFormulario();
  }

  guardar() {
    // 1. Combinar los inputs de string en un objeto Date real
    if (this.tempFecha && this.tempHora) {
      const fechaCompleta = new Date(`${this.tempFecha}T${this.tempHora}:00`);

      // 2. Construir el objeto final respetando tu Interfaz
      const nuevaActividad: AgendaActividad = {
        id: crypto.randomUUID(), // Generar ID único temporalmente
        directorUid: 'UID_USER_123', // Esto deberías tomarlo de tu AuthService
        fecha: fechaCompleta,
        titulo: this.formData.titulo || 'Sin título',
        descripcion: this.formData.descripcion || '',
        estatus: 'PENDIENTE'
        // Nota: Si decides agregar 'tipo' a tu interfaz AgendaActividad, añádelo aquí.
        // Por ahora, el tipo se podría concatenar a la descripción o manejarse aparte.
      };
      
      // Hack para pasar el tipo si tu interfaz aún no lo tiene, 
      // o asegúrate de agregar 'tipo' a tu interface AgendaActividad.
      (nuevaActividad as any).tipo = this.formData.tipo; 

      this.save.emit(nuevaActividad);
      this.limpiarFormulario();
    }
  }

  private limpiarFormulario() {
    this.formData = {
      titulo: '',
      descripcion: '',
      estatus: 'PENDIENTE',
      tipo: 'reunion'
    };
    this.tempFecha = '';
    this.tempHora = '';
  }
}