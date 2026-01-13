import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GruposService, GrupoDetalle } from '../../../../ServiciosActivos/grupos.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-grupo-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-grupo-gestion.html',
  styleUrl: './modal-grupo-gestion.scss'
})
export class ModalGrupoGestion implements OnInit {

  @Input() grupo!: GrupoDetalle;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>(); // Avisa al padre que hubo cambios

  private gruposService = inject(GruposService);
  private estudiantesService = inject(EstudiantesService);
  private notificaciones = inject(NotificacionesService);

  // Listas
  alumnosInscritos: PerfilUsuarioDTO[] = [];
  resultadosBusqueda: PerfilUsuarioDTO[] = [];
  
  // Control
  terminoBusqueda: string = '';
  cargandoLista = false;
  procesandoAccion = false; // Para evitar doble clic al agregar/borrar

  ngOnInit() {
    if (this.grupo) {
      this.cargarAlumnosInscritos();
    }
  }

  // 1. Cargar la lista actual del grupo
  cargarAlumnosInscritos() {
    this.cargandoLista = true;
    this.gruposService.getEstudiantesGrupo(this.grupo.id).subscribe({
      next: (data) => {
        // Ordenar alfabéticamente
        this.alumnosInscritos = data.sort((a, b) => 
          a.persona.apellidos.localeCompare(b.persona.apellidos)
        );
        this.cargandoLista = false;
      },
      error: (err) => {
        console.error(err);
        this.cargandoLista = false;
      }
    });
  }

  // 2. Buscar alumnos disponibles (Buscador en tiempo real)
  buscarAlumnos() {
    if (this.terminoBusqueda.length < 3) {
      this.resultadosBusqueda = [];
      return;
    }

    // Traemos todos los estudiantes y filtramos en memoria 
    // (Idealmente tu backend tendría un endpoint de búsqueda, pero esto funciona bien)
    this.estudiantesService.getEstudiantes().subscribe(todos => {
      const term = this.terminoBusqueda.toLowerCase();
      
      this.resultadosBusqueda = todos.filter(e => {
        const nombreCompleto = `${e.persona.nombre} ${e.persona.apellidos}`.toLowerCase();
        const matricula = (e.rol as any)?.matricula?.toLowerCase() || '';
        
        // Condiciones:
        // 1. Coincide con el término
        // 2. NO está ya inscrito en este grupo
        const coincide = nombreCompleto.includes(term) || matricula.includes(term);
        const yaInscrito = this.alumnosInscritos.some(inscrito => inscrito.persona.uid === e.persona.uid);
        
        return coincide && !yaInscrito;
      }).slice(0, 5); // Limitamos a 5 resultados para no saturar
    });
  }

  // 3. Inscribir Alumno
  agregarAlumno(estudiante: PerfilUsuarioDTO) {
    if (this.procesandoAccion) return;
    this.procesandoAccion = true;

    this.gruposService.agregarEstudiante(this.grupo.id, estudiante.persona.uid).subscribe({
      next: () => {
        this.notificaciones.mostrar('exito', 'Inscrito', `${estudiante.persona.nombre} agregado al grupo.`);
        
        // Actualizamos listas localmente para que se sienta instantáneo
        this.alumnosInscritos.push(estudiante);
        this.alumnosInscritos.sort((a, b) => a.persona.apellidos.localeCompare(b.persona.apellidos));
        
        // Limpiamos búsqueda
        this.terminoBusqueda = '';
        this.resultadosBusqueda = [];
        
        this.procesandoAccion = false;
        this.updated.emit(); // Avisamos al widget principal para que actualice el contador
      },
      error: () => {
        this.notificaciones.mostrar('error', 'Error', 'No se pudo inscribir al alumno.');
        this.procesandoAccion = false;
      }
    });
  }

  // 4. Dar de Baja del Grupo
  quitarAlumno(estudiante: PerfilUsuarioDTO) {
    if (!confirm(`¿Quitar a ${estudiante.persona.nombre} de este grupo?`)) return;
    
    if (this.procesandoAccion) return;
    this.procesandoAccion = true;

    this.gruposService.quitarEstudiante(this.grupo.id, estudiante.persona.uid).subscribe({
      next: () => {
        this.notificaciones.mostrar('info', 'Removido', 'Alumno dado de baja del grupo.');
        
        // Filtramos la lista local
        this.alumnosInscritos = this.alumnosInscritos.filter(e => e.persona.uid !== estudiante.persona.uid);
        
        this.procesandoAccion = false;
        this.updated.emit();
      },
      error: () => {
        this.notificaciones.mostrar('error', 'Error', 'No se pudo quitar al alumno.');
        this.procesandoAccion = false;
      }
    });
  }
}