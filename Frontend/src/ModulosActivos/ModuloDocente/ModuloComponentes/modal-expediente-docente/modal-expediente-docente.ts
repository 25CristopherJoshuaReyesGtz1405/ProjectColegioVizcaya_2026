import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilUsuarioDTO, RolEmpleado } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';
import { GruposService } from '../../../../ServiciosActivos/grupos.service';

@Component({
  selector: 'app-modal-expediente-docente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-expediente-docente.html',
  styleUrl: './modal-expediente-docente.scss'
})
export class ModalExpedienteDocente {

  @Input() docente!: PerfilUsuarioDTO;
  @Output() close = new EventEmitter<void>();

  private impresionService = inject(ImpresionService);
  private gruposService = inject(GruposService);

  cargandoPDF = false;

  get datosRol(): RolEmpleado | null {
    return this.docente.rol as RolEmpleado;
  }

  get iniciales(): string {
    const n = this.docente.persona.nombre || '';
    const a = this.docente.persona.apellidos || '';
    return (n.charAt(0) + a.charAt(0)).toUpperCase();
  }

  cerrarModal() {
    this.close.emit();
  }

  imprimirExpediente() {
    if (this.cargandoPDF) return;
    this.cargandoPDF = true;

    this.gruposService.getAllGrupos().subscribe({
      next: (todosLosGrupos) => {
        // Filtramos los grupos del docente
        const gruposDocente = todosLosGrupos.filter(g => g.empleadoUid === this.docente.persona.uid);
        
        // Generamos el PDF
        this.impresionService.imprimirExpedienteDocente(this.docente, gruposDocente);
        
        this.cargandoPDF = false;
      },
      error: (err) => {
        console.error('Error al cargar grupos para PDF:', err);
        this.cargandoPDF = false;
      }
    });
  }
}