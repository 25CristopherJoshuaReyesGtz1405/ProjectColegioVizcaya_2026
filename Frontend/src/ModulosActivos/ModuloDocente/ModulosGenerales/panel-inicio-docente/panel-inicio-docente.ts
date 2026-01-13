import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

// SERVICIOS
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';

// COMPONENTES REUTILIZABLES (Los mismos que en Admin)
import { TarjetaStadistic } from '../../../../ComponentesActivos/tarjeta-stadistic/tarjeta-stadistic';
import { AgendaWidget } from './../../../ModuloAdministrativo/ModuloComponentes/agenda-widget/agenda-widget';
import { ReportesWidget } from './../../../ModuloAdministrativo/ModuloComponentes/reportes-widget/reportes-widget';
import { ModalReporteCrear } from '../../ModuloComponentes/modal-reporte-crear/modal-reporte-crear';
import { ModalPlaneacionCrear } from '../../ModuloComponentes/modal-planeacion-crear/modal-planeacion-crear';

@Component({
  selector: 'app-panel-inicio-docente',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TarjetaStadistic, // Reutilizamos las tarjetas bonitas
    AgendaWidget,
    ReportesWidget,
    ModalReporteCrear, ModalPlaneacionCrear
  ],
  templateUrl: './panel-inicio-docente.html',
  styleUrl: './panel-inicio-docente.scss',
  providers: [DatePipe]
})
export class PanelInicioDocente implements OnInit {

  private docentesService = inject(DocentesService);
  private datePipe = inject(DatePipe);

  // Estado
  today = new Date();
  stats: any = null;
  misGrupos: any[] = [];
  actividades: any[] = []; // Aquí cargarías la agenda si el docente tuviera una personal
  mostrarModalPlaneacion = false; 
  
  cargando = true;
  mostrarModalReporte = false;

  ngOnInit() {
    this.cargarTodo();
  }

  abrirModalPlaneacion()
  {
    this.mostrarModalPlaneacion = true; 
  }

  cargarTodo() {
    this.cargando = true;
    
    // Cargar Estadísticas
    this.docentesService.getEstadisticasDashboard().subscribe({
      next: (data) => this.stats = data,
      error: (e) => console.error(e)
    });

    // Cargar Grupos (Solo los primeros 3 para el widget de resumen)
    this.docentesService.getMisGrupos().subscribe({
      next: (data) => {
        this.misGrupos = data.slice(0, 3);
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  abrirModalReporte() {
    this.mostrarModalReporte = true;
  }

  // Helper para iniciales
  getInitials(nombre: string) {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }
}