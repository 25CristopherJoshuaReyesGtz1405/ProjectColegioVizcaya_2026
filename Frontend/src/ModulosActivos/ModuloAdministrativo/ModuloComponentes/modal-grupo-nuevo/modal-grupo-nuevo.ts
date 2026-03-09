import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GruposService } from '../../../../ServiciosActivos/grupos.service';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service'; 
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { Materia, PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-grupo-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-grupo-nuevo.html',
  styleUrl: './modal-grupo-nuevo.scss'
})
export class ModalGrupoNuevo implements OnInit {

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private gruposService = inject(GruposService);
  private catalogosService = inject(CatalogosService);
  private docentesService = inject(DocentesService);
  private estudiantesService = inject(EstudiantesService);
  private notificaciones = inject(NotificacionesService);

  // Catálogos
  materias: Materia[] = [];
  docentes: PerfilUsuarioDTO[] = [];
  estudiantesTotales: PerfilUsuarioDTO[] = [];

  // Modelo del formulario
  nuevoGrupo = {
    cicloEscolar: '2025-2026', 
    materiaId: '',
    empleadoUid: '',
    letraGrupo: '' // Letra de la sección (A, B, C...)
  };

  cargando = false;
  asignarAutomaticamente = true; // Estado del interruptor

  ngOnInit() {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    // Cargar Materias
    this.catalogosService.getAllMaterias().subscribe({
      next: (data) => this.materias = data,
      error: () => this.notificaciones.mostrar('error', 'Error', 'No se cargaron las materias')
    });

    // Cargar Docentes
    this.docentesService.getDocentes().subscribe({
      next: (data) => this.docentes = data,
      error: () => this.notificaciones.mostrar('error', 'Error', 'No se cargaron los docentes')
    });

    // Cargar Estudiantes para el autocompletado
    this.estudiantesService.getEstudiantes('persona.nombre', 'asc').subscribe({
      next: (data) => this.estudiantesTotales = data,
      error: () => console.error('Error al cargar la matrícula de alumnos')
    });
  }

  // Getter dinámico: Obtiene el grado de la materia que el usuario acaba de seleccionar
  get gradoSeleccionado(): number {
    const mat = this.materias.find(m => m.id === this.nuevoGrupo.materiaId);
    return mat ? mat.grado : 0;
  }

  // Getter dinámico: Filtra en vivo a los alumnos que coinciden con el grado y letra
  get alumnosCoincidentes(): PerfilUsuarioDTO[] {
    if (!this.nuevoGrupo.materiaId || !this.nuevoGrupo.letraGrupo) return [];
    
    const grado = this.gradoSeleccionado;
    return this.estudiantesTotales.filter(est => {
      // Validamos que sea estudiante y tenga rol definido
      if (est.tipoRol === 'estudiante' && est.rol) {
        const rolEst = est.rol as any;
        return rolEst.grado == grado && 
               rolEst.grupo?.toUpperCase() === this.nuevoGrupo.letraGrupo.toUpperCase();
      }
      return false;
    });
  }

  guardar() {
    if (!this.nuevoGrupo.materiaId || !this.nuevoGrupo.empleadoUid || !this.nuevoGrupo.letraGrupo) return;

    this.cargando = true;

    // MAGIA: Determinar si enviamos alumnos o no
    let uidsAsignados: string[] = [];
    if (this.asignarAutomaticamente) {
      uidsAsignados = this.alumnosCoincidentes.map(est => est.persona.uid);
    }

    // Petición al backend
    this.gruposService.crearGrupo({
      cicloEscolar: this.nuevoGrupo.cicloEscolar,
      materiaId: this.nuevoGrupo.materiaId,
      empleadoUid: this.nuevoGrupo.empleadoUid,
      estudianteUids: uidsAsignados // Va lleno si el switch estaba prendido, vacío si no
    }).subscribe({
      next: () => {
        this.cargando = false;
        
        // Mensaje dinámico según lo que haya hecho el sistema
        const msg = this.asignarAutomaticamente && uidsAsignados.length > 0
          ? `Grupo creado y ${uidsAsignados.length} alumnos vinculados automáticamente.` 
          : 'Grupo creado exitosamente (vacío).';
          
        this.notificaciones.mostrar('exito', 'Grupo Creado', msg);
        this.success.emit();
        this.close.emit();
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo crear el grupo.');
      }
    });
  }
}