import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerfilUsuarioDTO, Persona, RolEmpleado } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-docente-actualizar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-docente-actualizar.html',
  styleUrls: ['./modal-docente-actualizar.scss'], // Reusa el SCSS del estudiante si quieres o crea uno nuevo
})
export class ModalDocenteActualizar {
  
  public originalDTO: PerfilUsuarioDTO | null = null;

  public datosPersona: Partial<Persona> = {};
  public datosEmpleado: Partial<RolEmpleado> = {};

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<PerfilUsuarioDTO>();

  @Input()
  set docente(dto: PerfilUsuarioDTO | null) {
    if (dto && dto.persona) {
      this.originalDTO = dto;
      this.datosPersona = { ...dto.persona };

      if (dto.rol && (dto.tipoRol === 'docente' || 'RFC' in dto.rol)) {
        this.datosEmpleado = { ...(dto.rol as RolEmpleado) };
      } else {
        this.datosEmpleado = { RFC: '', cedulaProfesional: '', estatus: 'ACTIVO' };
      }
    } else {
      this.originalDTO = null;
      this.datosPersona = {};
      this.datosEmpleado = {};
    }
  }

  onSaveChanges(): void {
    if (!this.originalDTO) return;

    const usuarioActualizado: PerfilUsuarioDTO = {
      ...this.originalDTO,
      persona: {
        ...this.originalDTO.persona,
        ...this.datosPersona as Persona
      },
      rol: {
        ...(this.originalDTO.rol as RolEmpleado),
        ...this.datosEmpleado as RolEmpleado
      }
    };

    this.save.emit(usuarioActualizado);
    this.close.emit();
  }
}