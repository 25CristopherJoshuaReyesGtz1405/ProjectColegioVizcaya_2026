import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';

@Component({
  selector: 'app-modal-expediente-360',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-expediente360.html',
  styleUrl: './modal-expediente360.scss'
})
export class ModalExpediente360 implements OnInit {
  
  // Inyectamos el servicio
  private docentesService = inject(DocentesService);

  @Input() alumno: any; 
  @Input() materiaNombre: string = 'Materia Actual';
  @Input() grupoId: string = ''; // <-- NUEVO INPUT

  @Output() close = new EventEmitter<void>();

  cargando = true;

  kpis = {
    inasistencias: 0,
    reportesActivos: 0,
    nivelRiesgo: 'BAJO'
  };

  historialDisciplina: any[] = [];

  ngOnInit() {
    this.cargarExpedienteCompleto();
  }

  cargarExpedienteCompleto() {
    this.cargando = true;
    
    // LLAMADA HTTP REAL AL BACKEND
    this.docentesService.getExpediente360(this.grupoId, this.alumno.uid).subscribe({
      next: (data) => {
        
        // 1. Calculamos el nivel de riesgo en base a su promedio de la tabla
        const prom = this.alumno.promedioFinal || 0;
        let riesgo = 'BAJO';
        
        // Criterios automáticos de riesgo
        if (prom < 6 || data.inasistencias >= 5 || data.reportesActivos >= 3) {
          riesgo = 'ALTO';
        } else if (prom < 7.5 || data.inasistencias >= 3 || data.reportesActivos >= 1) {
          riesgo = 'MEDIO';
        }

        // 2. Asignamos los valores que vienen de Firebase
        this.kpis = {
          inasistencias: data.inasistencias,
          reportesActivos: data.reportesActivos,
          nivelRiesgo: riesgo
        };

        this.historialDisciplina = data.historialDisciplina;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar expediente:', err);
        this.cargando = false;
        // Opcional: Podrías usar NotificacionesService aquí para mostrar error
      }
    });
  }

  getNivelClass(nivel: string) {
    if (nivel === 'BAJO') return 'badge-success';
    if (nivel === 'MEDIO') return 'badge-warning';
    return 'badge-danger';
  }
}