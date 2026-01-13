import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilUsuarioDTO, RolEstudiante } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';

@Component({
  selector: 'app-modal-credencial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-credencial.html',
  styleUrl: './modal-credencial.scss'
})
export class ModalCredencial {
  
  @Input() estudiante!: PerfilUsuarioDTO;
  @Output() close = new EventEmitter<void>();

  private impresionService = inject(ImpresionService);
  
  // Controla el estado del giro 3D
  public isFlipped = false;

  get datosRol(): RolEstudiante | null {
    return this.estudiante.rol as RolEstudiante;
  }

  // Alternar cara
  voltearCredencial() {
    this.isFlipped = !this.isFlipped;
  }

  imprimir() {
    this.impresionService.imprimirCredencial(this.estudiante);
  }
}