import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, EstadisticasAcademicasDTO } from '../../../../ServiciosActivos/admin.service';

@Component({
  selector: 'app-materias-alerts-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './materia-alerts-widget.html',
  styleUrl: './materia-alerts-widget.scss'
})
export class MateriaAlertsWidget implements OnInit {

  private adminService = inject(AdminService);

  // Estado inicial (esqueleto o ceros)
  public stats: EstadisticasAcademicasDTO = {
    operativas: {
      sinDocente: 0,
      sinAlumnos: 0,
      sinPlaneacion: 0,
      coberturaPorcentaje: 0
    },
    riesgo: {
      totalGruposEnRiesgo: 0,
      motivoPrincipal: '---'
    }
  };

  public cargando = true;

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.cargando = true;
    this.adminService.getEstadisticasAcademicas().subscribe({
      next: (data) => {
        this.stats = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando estadísticas académicas:', err);
        this.cargando = false;
      }
    });
  }

  // Acciones (puedes conectarlas a navegación o modales)
  verDetalles(filtro: string) {
    console.log('Navegar a lista filtrada por:', filtro);
    // Ejemplo: this.router.navigate(['/admin/grupos'], { queryParams: { filtro } });
  }
}