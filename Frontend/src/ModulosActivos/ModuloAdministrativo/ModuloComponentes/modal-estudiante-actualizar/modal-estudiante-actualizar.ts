import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerfilUsuarioDTO, Persona, RolEstudiante } from '../../../../ModelosActivos/ModelosAplicacion.model'; // Asegura la ruta correcta

@Component({
  selector: 'app-modal-estudiante-actualizar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-estudiante-actualizar.html',
  styleUrls: ['./modal-estudiante-actualizar.scss'],
})
export class ModalEstudianteActualizar {
  
  // Usamos el mismo DTO que en el resto de la app
  public originalDTO: PerfilUsuarioDTO | null = null;

  // Modelos temporales para el formulario
  public datosPersona: Partial<Persona> = {};
  public datosRol: Partial<RolEstudiante> = {};

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<PerfilUsuarioDTO>();

  constructor() {}

  @Input()
  set student(dto: PerfilUsuarioDTO | null) {
    if (dto && dto.persona) {
      this.originalDTO = dto;

      // 1. Clocar datos de Persona (Copia superficial para no editar en vivo)
      this.datosPersona = { ...dto.persona };

      // 2. Clonar datos de Rol (Validando que sea estudiante)
      this.datosRol = { ...(dto.rol as RolEstudiante) };
     

    } else {
      this.originalDTO = null;
      this.datosPersona = {};
      this.datosRol = {};
    }
  }

  onSaveChanges(): void {
    if (!this.originalDTO) return;

    // 1. Reconstruir objeto completo
    const usuarioActualizado: PerfilUsuarioDTO = {
      ...this.originalDTO,
      persona: {
        ...this.originalDTO.persona,
        ...this.datosPersona as Persona // Sobrescribimos cambios
      },
      rol: {
        ...(this.originalDTO.rol as RolEstudiante),
        ...this.datosRol as RolEstudiante // Sobrescribimos cambios
      }
    };

    // 2. Emitir
    this.save.emit(usuarioActualizado);
    this.close.emit();
  }
}