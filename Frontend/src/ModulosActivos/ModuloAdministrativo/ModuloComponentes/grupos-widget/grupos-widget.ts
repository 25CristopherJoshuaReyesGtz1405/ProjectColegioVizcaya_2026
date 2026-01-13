import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GruposService, GrupoDetalle } from '../../../../ServiciosActivos/grupos.service';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';
import { Grupo } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-grupos-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grupos-widget.html',
  styleUrl: './grupos-widget.scss'
})
export class GruposWidget implements OnInit {

  // Eventos para comunicar al padre qué botón se presionó
  @Output() manage = new EventEmitter<GrupoDetalle>(); // Gestionar Alumnos
  @Output() delete = new EventEmitter<GrupoDetalle>(); // Eliminar Grupo
  @Output() add = new EventEmitter<GrupoDetalle>(); 
  
  // Inyecciones de servicios
  private gruposService = inject(GruposService);
  private impresionService = inject(ImpresionService);
  
  public listaGrupos: GrupoDetalle[] = [];
  public cargando = true;
  public cargandoPrint = false; 
  

  ngOnInit() {
    this.cargarGrupos();
  }

  /**
   * Obtiene la lista de grupos desde el backend
   */
  cargarGrupos() {
    this.cargando = true;
    this.gruposService.getAllGrupos().subscribe({
      next: (data) => {
        // Ordenamos por Grado y luego por Grupo (A, B, C...)
        this.listaGrupos = data.sort((a, b) => {
          const gradoA = a.materia?.grado || 0;
          const gradoB = b.materia?.grado || 0;
          if (gradoA !== gradoB) return gradoA - gradoB;
          return (a.materia?.nombre || '').localeCompare(b.materia?.nombre || '');
        });
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando grupos:', err);
        this.cargando = false;
      }
    });
  }

  // --- ACCIONES ---

  onGestionar(g: GrupoDetalle) {
    this.manage.emit(g);
  }

  onEliminar(g: GrupoDetalle) {
    this.delete.emit(g);
  }

  onAdd()
  {
    this.add.emit(); 
  }

  /**
   * Genera el PDF de la lista del grupo
   */
  onImprimir(g: GrupoDetalle) {
    if (this.cargandoPrint) return;
    this.cargandoPrint = true;

    // 1. Obtenemos los detalles de los alumnos (Nombres, Matrículas)
    this.gruposService.getEstudiantesGrupo(g.id).subscribe({
      next: (alumnos) => {
        // 2. Llamamos al servicio de impresión (Necesitaremos agregar este método al servicio después)
        // Por ahora, si no tienes el método en ImpresionService, esto marcará error en rojo.
        // Lo agregaremos en el siguiente paso.
        if ((this.impresionService as any).imprimirListaGrupo) {
             (this.impresionService as any).imprimirListaGrupo(g, alumnos);
        } else {
            console.warn("Falta implementar imprimirListaGrupo en ImpresionService");
        }
        this.cargandoPrint = false;
      },
      error: () => {
        this.cargandoPrint = false;
      }
    });
  }

  // Helper para avatar
  getInitials(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }
}