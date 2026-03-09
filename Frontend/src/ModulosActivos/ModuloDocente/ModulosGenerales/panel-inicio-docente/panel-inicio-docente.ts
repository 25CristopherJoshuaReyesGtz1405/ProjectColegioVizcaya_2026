import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { TarjetaStadistic } from '../../../../ComponentesActivos/tarjeta-stadistic/tarjeta-stadistic';
// Modales y Widgets
import { ModalReporteCrear } from '../../ModuloComponentes/modal-reporte-crear/modal-reporte-crear';
import { ModalPlaneacionCrear } from '../../ModuloComponentes/modal-planeacion-crear/modal-planeacion-crear';
import { AgendaWidget } from './../../../ModuloAdministrativo/ModuloComponentes/agenda-widget/agenda-widget';
import { AgendaActividad } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { forkJoin } from 'rxjs'; // <--- Asegúrate de importar forkJoin arriba

@Component({
  selector: 'app-panel-inicio-docente',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TarjetaStadistic,
    ModalReporteCrear, 
    ModalPlaneacionCrear,
    AgendaWidget // <-- IMPORTANTE: Agregar el widget aquí
  ],
  templateUrl: './panel-inicio-docente.html',
  styleUrl: './panel-inicio-docente.scss',
  providers: [DatePipe]
})
export class PanelInicioDocente implements OnInit {

  private docentesService = inject(DocentesService);
  private datePipe = inject(DatePipe);

  today = new Date();
  stats: any = null;
  misGrupos: any[] = [];
  cargando = true;
  
  mostrarModalPlaneacion = false; 
  mostrarModalReporte = false;

  misSolicitudes: any[] = [];
  alertasTempranas: any[] = [];
  avisosInstitucionales: any[] = [];
  // (Mantenemos actividadesAgenda simulada hasta que conectes el de la directora si quieres)  
  // Adaptamos la agenda al formato que requiere tu AgendaWidget (Interfaz AgendaActividad)
  actividadesAgenda: AgendaActividad[] = [
    { id: '1', directorUid: 'sys', fecha: new Date(), titulo: 'Clase: Matemáticas I', descripcion: 'Aula 4 - Entrega de Proyectos', estatus: 'PENDIENTE' },
    { id: '2', directorUid: 'sys', fecha: new Date(), titulo: 'Junta de Academia', descripcion: 'Sala de Maestros', estatus: 'PENDIENTE' }
  ];

  ngOnInit() {
    this.cargarTodo();
  }

  cargarTodo() {
    this.cargando = true;
    
    // 2. Cargamos las KPIs y Grupos (Tus llamadas originales)
    this.docentesService.getEstadisticasDashboard().subscribe(data => 
      {
        this.stats = data; 
        console.log(data);
      }
              
    );

  
    
    this.docentesService.getMisGrupos().subscribe(data => {
      this.misGrupos = data.slice(0, 3);
    });
    
    this.docentesService.getMisSolicitudes().subscribe(data => { this.misSolicitudes = data.slice(0,3);}),

    // 3. Cargamos los NUEVOS WIDGETS en paralelo
    forkJoin({
      avisos: this.docentesService.getAvisosInstitucionales(),
      alertas: this.docentesService.getAlertasTempranas()
    }).subscribe({
      next: (respuestas) => {
        this.avisosInstitucionales = respuestas.avisos;
        this.alertasTempranas = respuestas.alertas;
        
        this.cargando = false; // Todo cargó correctamente
      },
      error: (err) => {
        console.error('Error cargando widgets:', err);
        this.cargando = false;
      }
    });
  }


  abrirModalPlaneacion() { this.mostrarModalPlaneacion = true; }
  abrirModalReporte() { this.mostrarModalReporte = true; }
}