import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// SERVICIOS
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { GruposService } from '../../../../ServiciosActivos/grupos.service';

// COMPONENTES HIJOS
import { ModalDocenteDetalle } from '../../ModuloComponentes/modal-docente-detalle/modal-docente-detalle';

@Component({
  selector: 'app-panel-grupos-docente',
  standalone: true,
  imports: [CommonModule, ModalDocenteDetalle], 
  templateUrl: './panel-grupos-docente.html',
  styleUrl: './panel-grupos-docente.scss'
})
export class PanelGruposDocente implements OnInit {

  private docentesService = inject(DocentesService);
  private router = inject(Router);

  // DATOS
  grupos: any[] = [];
  stats: any = null;

  // ESTADO
  cargando = true;
  
  // MODAL DETALLE
  mostrarModalDetalle = false;
  grupoSeleccionado: any = null; 

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard() {
    this.cargando = true;

    // 1. Cargar Estadísticas (KPIs)
    this.docentesService.getEstadisticasDashboard().subscribe({
      next: (data) => this.stats = data,
      error: () => console.warn('No se pudieron cargar estadísticas')
    });

    // 2. Cargar Grupos
    this.docentesService.getMisGrupos().subscribe({
      next: (data) => {
        // Ordenamos por grado para que se vea impecable en el grid
        this.grupos = data.sort((a: any, b: any) => (a.materia?.grado || 0) - (b.materia?.grado || 0));
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando grupos:', err);
        this.cargando = false;
      }
    });
  }

  // --- NAVEGACIÓN (Botón "Gestionar") ---
  irAGestion(grupoId: string) {
    this.router.navigate(['/teacher/calif'], { queryParams: { grupoId } });
  }

  // --- ABRIR MODAL (Botón "Ver Detalle") ---
  abrirModalDetalle(grupo: any, event: Event) {
    event.stopPropagation(); 
    this.grupoSeleccionado = {
      id: grupo.id,
      materia: grupo.materia?.nombre || 'Materia',
      grado: grupo.materia?.grado,
      ciclo: grupo.cicloEscolar
    };
    this.mostrarModalDetalle = true;
  }
}