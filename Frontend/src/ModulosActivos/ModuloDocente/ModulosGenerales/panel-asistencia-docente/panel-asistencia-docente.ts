import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { GruposService } from '../../../../ServiciosActivos/grupos.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';

@Component({
  selector: 'app-panel-asistencia-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-asistencia-docente.html',
  styleUrl: './panel-asistencia-docente.scss',
  providers: [DatePipe]
})
export class PanelAsistenciaDocente implements OnInit {

  private docentesService = inject(DocentesService);
  private gruposService = inject(GruposService);
  private notificaciones = inject(NotificacionesService);
  private catalogosService = inject(CatalogosService);

  misGrupos: any[] = [];
  periodos: any[] = [];
  alumnos: any[] = [];
  
  seleccion = { grupoId: '', periodoId: '', fecha: new Date().toISOString().split('T')[0] };

  cargando = false;
  guardando = false;

  registroAsistencia: { [uid: string]: string } = {};
  kpis = { presentes: 0, faltas: 0, retardos: 0, justificados: 0 };

  ngOnInit() {
    this.cargarCatalogosIniciales();
  }

  cargarCatalogosIniciales() {
    this.docentesService.getMisGrupos().subscribe(g => this.misGrupos = g);
    
    this.catalogosService.getAllPeriodos().subscribe(p => {
      this.periodos = p.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
      
      // INTELIGENCIA: Auto-seleccionar el periodo activo de hoy
      const hoy = new Date().getTime();
      const periodoActivo = this.periodos.find(per => hoy >= new Date(per.fechaInicio).getTime() && hoy <= new Date(per.fechaFin).getTime());
      if (periodoActivo) {
        this.seleccion.periodoId = periodoActivo.id;
      }
    });
  }

  onFiltroChange() {
    if (!this.seleccion.grupoId || !this.seleccion.periodoId || !this.seleccion.fecha) {
      this.alumnos = []; // Mostramos el Empty State si falta algo
      return;
    }
    this.cargarListaAlumnos();
  }

  cargarListaAlumnos() {
    this.cargando = true;
    this.alumnos = [];
    this.registroAsistencia = {};

    // Descargamos a los alumnos y sus estadísticas históricas al mismo tiempo
    forkJoin({
      estudiantes: this.gruposService.getEstudiantesGrupo(this.seleccion.grupoId),
      estadisticas: this.docentesService.getEstadisticasAsistencia(this.seleccion.grupoId, this.seleccion.periodoId).pipe(catchError(() => of({})))
    }).subscribe({
      next: (respuestas) => {
        const estOrdenados = respuestas.estudiantes.sort((a, b) => a.persona.apellidos.localeCompare(b.persona.apellidos));
        const statsBase = respuestas.estadisticas;

        this.alumnos = estOrdenados.map(est => {
          const uid = est.persona.uid;
          this.registroAsistencia[uid] = ''; // Limpiamos el pase de hoy
          
          // Extraemos los datos calculados por el backend
          const statsDelAlumno = statsBase[uid] || { historialTermico: [], faltasConsecutivas: 0, porcentajeGlobal: 100 };

          return {
            ...est,
            historialTermico: statsDelAlumno.historialTermico,
            faltasConsecutivas: statsDelAlumno.faltasConsecutivas,
            porcentajeGlobal: statsDelAlumno.porcentajeGlobal,
            justificanteUrl: null
          };
        });

        this.calcularKpis();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.notificaciones.mostrar('error', 'Error', 'No se pudieron cargar los datos del grupo.');
      }
    });
  }

  marcarTodos(estado: string) {
    this.alumnos.forEach(al => this.registroAsistencia[al.persona.uid] = estado);
    this.calcularKpis();
  }

  marcarAlumno(alumno: any, estado: string) {
    const uid = alumno.persona.uid;

    // 1. SI ES JUSTIFICANTE: Interceptamos y preguntamos primero
    if (estado === 'JUSTIFICADO') {
      this.notificaciones.confirmar(
        'Aprobar Justificante',
        `¿Confirmas que ${alumno.persona.nombre} tiene un justificante médico o permiso válido para ausentarse hoy?`,
        () => {
          // Si el docente le da clic a "Aceptar" en el modal:
          this.registroAsistencia[uid] = estado;
          this.calcularKpis();
        }
        // Si cancela, no hacemos nada y se queda como estaba
      );
      return; // Salimos de la función aquí para no marcarlo hasta que responda
    }

    // 2. SI ES OTRO ESTADO (Asistencia, Falta, Retardo): Lo marcamos directo
    this.registroAsistencia[uid] = estado;
    this.calcularKpis();

    // 3. ALERTA DE RIESGO (3 Faltas Consecutivas)
    if (estado === 'FALTA' && alumno.faltasConsecutivas >= 2) {
      this.notificaciones.mostrar('error', 'Alerta de Inasistencia', 
        `${alumno.persona.nombre} ha acumulado su 3ra falta consecutiva. Se notificará a Dirección.`);
    }
  }

  calcularKpis() {
    this.kpis = { presentes: 0, faltas: 0, retardos: 0, justificados: 0 };
    Object.values(this.registroAsistencia).forEach(estado => {
      if (estado === 'ASISTENCIA') this.kpis.presentes++;
      if (estado === 'FALTA') this.kpis.faltas++;
      if (estado === 'RETARDO') this.kpis.retardos++;
      if (estado === 'JUSTIFICADO') this.kpis.justificados++;
    });
  }

  guardarAsistencia() {
    const faltanPorMarcar = this.alumnos.some(al => !this.registroAsistencia[al.persona.uid]);
    if (faltanPorMarcar) {
      this.notificaciones.mostrar('error', 'Pase Incompleto', 'Faltan estudiantes por evaluar.');
      return;
    }

    this.guardando = true;
    
    // Llamamos al nuevo método inteligente que guarda con el Periodo
    this.docentesService.guardarAsistenciaInteligente(this.seleccion.grupoId, this.seleccion.periodoId, this.seleccion.fecha, this.registroAsistencia)
      .subscribe({
        next: () => {
          this.guardando = false;
          this.notificaciones.mostrar('exito', 'Guardado', 'Pase de lista registrado.');
        },
        error: () => {
          this.guardando = false;
          this.notificaciones.mostrar('error', 'Error', 'Problema de conexión.');
        }
      });
  }
}