import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PerfilUsuarioDTO, RolEmpleado } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-docente-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docente-card.html',
  styleUrl: './docente-card.scss',
})
export class DocenteCard {
  @Input() docente!: PerfilUsuarioDTO;

  @Output() edit = new EventEmitter<PerfilUsuarioDTO>();
  @Output() delete = new EventEmitter<PerfilUsuarioDTO>();

  // --- GETTERS SEGUROS ---
  get datosEmpleado(): RolEmpleado | null {
    if (!this.docente || !this.docente.rol) return null;
    
    // Verificamos si tiene propiedades de empleado (como RFC o rol explícito)
    if ('RFC' in this.docente.rol || this.docente.tipoRol !== 'estudiante') {
      return this.docente.rol as RolEmpleado;
    }
    return null;
  }

  get esInactivo(): boolean {
    return this.datosEmpleado?.estatus === 'BAJA';
  }

  // --- MÉTODOS ---
  onEdit(event: Event) {
    event.stopPropagation();
    this.edit.emit(this.docente);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.delete.emit(this.docente);
  }

  getInitials(nombre: string, apellidos: string): string {
    if (!nombre || !apellidos) return 'DC';
    return (nombre.charAt(0) + apellidos.charAt(0)).toUpperCase();
  }
}