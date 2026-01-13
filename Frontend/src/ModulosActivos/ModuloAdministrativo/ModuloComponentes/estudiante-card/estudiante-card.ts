import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PerfilUsuarioDTO, RolEstudiante } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-estudiante-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estudiante-card.html',
  styleUrl: './estudiante-card.scss',
})
export class EstudianteCard {
  // Aceptamos el DTO genérico para evitar conflictos de tipos con el padre
  @Input() estudiante!: PerfilUsuarioDTO; 

  @Output() edit = new EventEmitter<PerfilUsuarioDTO>();
  @Output() delete = new EventEmitter<PerfilUsuarioDTO>();
  @Output() print = new EventEmitter<PerfilUsuarioDTO>();

  @Output() credencial = new EventEmitter<PerfilUsuarioDTO>(); // <--- NUEVO EVENTO
  @Output() kardex = new EventEmitter<PerfilUsuarioDTO>(); // <--- NUEVO EVENTO


  onCredencial(event: Event) {
    event.stopPropagation();
    this.credencial.emit(this.estudiante);
  }

  onKardex(event: Event) {
    event.stopPropagation();
    this.kardex.emit(this.estudiante);
  }

  // --- GETTERS SEGUROS (Evitan errores en el HTML) ---

  // Convierte el rol genérico a RolEstudiante de forma segura
  get datosRol(): RolEstudiante | null {
      return this.estudiante.rol as RolEstudiante;
  }

  // Verifica si está dado de baja
  get esInactivo(): boolean {
    return this.datosRol?.estatus === 'BAJA';
  }

  // Obtiene el color para el avatar basado en el grado (o 0 si no hay grado)
  get colorGrado(): number {
    return this.datosRol ? (this.datosRol.grado % 4) : 0;
  }

  // --- MÉTODOS ---

  onEdit(event: Event) {
    event.stopPropagation();
    this.edit.emit(this.estudiante);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.delete.emit(this.estudiante);
  }

  onPrint(event: Event) {
    event.stopPropagation();
    this.print.emit(this.estudiante);
  }

  getInitials(nombre: string, apellidos: string): string {
    if (!nombre || !apellidos) return '?';
    return (nombre.charAt(0) + apellidos.charAt(0)).toUpperCase();
  }
}