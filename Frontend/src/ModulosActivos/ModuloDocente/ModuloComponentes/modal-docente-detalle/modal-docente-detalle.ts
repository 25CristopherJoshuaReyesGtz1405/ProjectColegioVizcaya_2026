import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GruposService, GrupoDetalle } from '../../../../ServiciosActivos/grupos.service';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-docente-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-docente-detalle.html',
  styleUrl: './modal-docente-detalle.scss'
})
export class ModalDocenteDetalle implements OnChanges {

  @Input() data: any; // El objeto que seleccionaste en la búsqueda (Grupo o Estudiante)
  @Input() tipo: 'GRUPO' | 'ESTUDIANTE' | null = null;
  @Output() close = new EventEmitter<void>();

  private gruposService = inject(GruposService);
  private docentesService = inject(DocentesService);

  // Estado
  cargando = false;
  
  // Para vista de GRUPO
  alumnosDelGrupo: PerfilUsuarioDTO[] = [];
  alumnosFiltrados: PerfilUsuarioDTO[] = [];
  busquedaAlumno: string = '';

  // Para vista de ESTUDIANTE
  gruposCompartidos: any[] = []; // Grupos donde el docente le da clases a este alumno

  ngOnChanges(changes: SimpleChanges) {
    if (this.data && this.tipo) {
      this.cargarDetalles();
    }
  }

  cargarDetalles() {
    this.cargando = true;
    
    if (this.tipo === 'GRUPO') {
      // Si es grupo, buscamos sus alumnos
      this.gruposService.getEstudiantesGrupo(this.data.id).subscribe({
        next: (alumnos) => {
          this.alumnosDelGrupo = alumnos.sort((a,b) => a.persona.apellidos.localeCompare(b.persona.apellidos));
          this.alumnosFiltrados = this.alumnosDelGrupo;
          this.cargando = false;
        },
        error: () => this.cargando = false
      });

    } else if (this.tipo === 'ESTUDIANTE') {
      // Si es estudiante, buscamos en qué grupos míos está
      this.docentesService.getMisGrupos().subscribe({
        next: (misGrupos) => {
          // Filtramos los grupos donde este alumno esté inscrito
          this.gruposCompartidos = misGrupos.filter(g => 
            g.estudianteUids.includes(this.data.uid)
          );
          this.cargando = false;
        },
        error: () => this.cargando = false
      });
    }
  }

  // Filtro interno para la lista de alumnos del grupo
  filtrarAlumnos() {
    const term = this.busquedaAlumno.toLowerCase();
    this.alumnosFiltrados = this.alumnosDelGrupo.filter(a => 
      `${a.persona.nombre} ${a.persona.apellidos}`.toLowerCase().includes(term) ||
      (a.rol as any).matricula?.toLowerCase().includes(term)
    );
  }
}