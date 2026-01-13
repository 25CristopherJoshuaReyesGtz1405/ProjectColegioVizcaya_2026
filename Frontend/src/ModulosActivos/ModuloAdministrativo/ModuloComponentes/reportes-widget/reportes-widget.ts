import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reportes-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reportes-widget.html',
  styleUrl: './reportes-widget.scss',
  providers:[DatePipe]
})
export class ReportesWidget implements OnInit {
  @Output() verDetalle = new EventEmitter<any>(); // Emite el reporte seleccionado

  docentesService = inject(DocentesService);
  listaReportes: any[] = [];
  cargando = true;

  ngOnInit() {
    this.cargarReportes();
  }

  cargarReportes() {
    this.cargando = true;

    // Llamada real al servicio
    this.docentesService.getAllReportes().subscribe({
      next: (data) => {
        // Mapeamos los datos del backend a la estructura que espera tu HTML
        this.listaReportes = data.map((r) => ({
          id: r.id,
          estudiante: r.estudianteNombre, // Usamos el nombre que trajimos en el "join" del backend
          grado: r.gradoGrupo,
          fecha: this.convertirFecha(r.fecha),          
          tipo: r.tipo,
          descripcion: r.descripcion,
          severidad: r.severidad,
          // Guardamos el UID por si queremos imprimir
          estudianteUid: r.estudianteUid,
        }));

        console.log("Los reportes obtenidos son los siguientes" + this.listaReportes);
        

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando reportes:', err);
        this.cargando = false;
      },
    });
  }

  // Función auxiliar para limpiar fechas de Firebase
  private convertirFecha(fechaBackend: any): Date {
    if (!fechaBackend) return new Date(); // Si es nulo, devuelve hoy

    // Caso 1: Ya es un objeto Date válido
    if (fechaBackend instanceof Date) return fechaBackend;

    // Caso 2: Es un Timestamp de Firebase (objeto con _seconds)
    if (fechaBackend._seconds) {
      return new Date(fechaBackend._seconds * 1000);
    }
    
    // Caso 3: Es un Timestamp de Firebase (objeto con seconds - sin guion bajo)
    if (fechaBackend.seconds) {
      return new Date(fechaBackend.seconds * 1000);
    }

    // Caso 4: Es un string ISO
    return new Date(fechaBackend);
  }

  abrirReporte(reporte: any) {
    this.verDetalle.emit(reporte);
  }
}
