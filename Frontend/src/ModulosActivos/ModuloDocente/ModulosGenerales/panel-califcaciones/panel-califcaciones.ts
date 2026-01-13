import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// SERVICIOS
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { GruposService } from '../../../../ServiciosActivos/grupos.service';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { AuthService } from '../../../../ServiciosActivos/auth.service';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';

// COMPONENTES
import { ModalEvaluacionCrear } from '../../ModuloComponentes/modal-evaluacion-crear/modal-evaluacion-crear';
import { TarjetaStadistic } from '../../../../ComponentesActivos/tarjeta-stadistic/tarjeta-stadistic';

interface AlumnoCaptura {
  uid: string;
  nombre: string;
  matricula: string;
  fotoUrl?: string;
  promedioAnterior: number;
  calificacion: number | null;
  promedioResultante: number;
  observaciones: string;
  modificado: boolean;
}

@Component({
  selector: 'app-panel-califcaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalEvaluacionCrear, TarjetaStadistic], // <--- IMPORTANTE
  templateUrl: './panel-califcaciones.html',
  styleUrl: './panel-califcaciones.scss'
})
export class PanelCalifcaciones implements OnInit {

  private docentesService = inject(DocentesService);
  private gruposService = inject(GruposService);
  private catalogosService = inject(CatalogosService);
  private notificaciones = inject(NotificacionesService);
  private authService = inject(AuthService);
  private impresionService = inject(ImpresionService);

  // DATOS
  misGrupos: any[] = [];
  periodos: any[] = [];
  evaluaciones: any[] = [];
  alumnos: AlumnoCaptura[] = [];
  stats: any = null; // Datos para las tarjetas

  // ESTADO
  seleccion = { grupoId: '', periodoId: '', evaluacionId: '' };
  nombreDocente = '';
  
  cargando = true;       // Carga inicial (Stats + Catálogos)
  cargandoTabla = false; // Carga solo la lista (sin parpadeo)
  guardando = false;
  actaCerrada = false;
  mostrarModalEvaluacion = false;

  ngOnInit() {
    this.cargarDatosIniciales();
    this.authService.getUsuario().subscribe(u => {
      if (u) this.nombreDocente = `${u.persona.nombre} ${u.persona.apellidos}`;
    });
  }

  cargarDatosIniciales() {
    this.cargando = true;
    
    // 1. Cargar Estadísticas
    this.docentesService.getEstadisticasDashboard().subscribe({
      next: (data) => this.stats = data,
      error: () => console.warn('No se pudieron cargar estadísticas')
    });

    // 2. Cargar Catálogos
    this.catalogosService.getAllPeriodos().subscribe(p => this.periodos = p.filter(x => x.estatus === 'ABIERTO'));
    
    this.docentesService.getMisGrupos().subscribe({
      next: (g) => {
        this.misGrupos = g;
        this.cargando = false; // Finaliza la carga inicial
      },
      error: () => this.cargando = false
    });
  }

  // --- LÓGICA DE FILTROS ---
  onFiltroChange() {
    this.evaluaciones = [];
    this.alumnos = [];
    this.seleccion.evaluacionId = '';

    if (this.seleccion.grupoId && this.seleccion.periodoId) {
      this.docentesService.getEvaluacionesGrupo(this.seleccion.grupoId, this.seleccion.periodoId)
        .subscribe(data => this.evaluaciones = data);
    }
  }

  // --- LÓGICA DE CARGA BLINDADA (Corrige el error de "desaparece") ---
  cargarActa() {
    if (!this.seleccion.evaluacionId) return;

    this.cargandoTabla = true;

    this.gruposService.getEstudiantesGrupo(this.seleccion.grupoId).subscribe({
      next: (estudiantes) => {
        // Intentamos cargar calificaciones
        this.docentesService.getActaEvaluacion(this.seleccion.evaluacionId).subscribe({
          next: (acta) => this.procesarAlumnos(estudiantes, acta),
          error: () => {
            // Si falla (404), cargamos lista vacía pero NO detenemos la UI
            console.log('Iniciando acta nueva...');
            this.procesarAlumnos(estudiantes, null);
          }
        });
      },
      error: () => {
        this.notificaciones.mostrar('error', 'Error', 'No se pudieron cargar alumnos.');
        this.cargandoTabla = false;
      }
    });
  }

  private procesarAlumnos(estudiantes: any[], acta: any) {
    this.actaCerrada = acta?.estatus === 'CERRADA';

    this.alumnos = estudiantes.map((e: any) => {
      const nota = acta?.calificaciones?.[e.persona.uid];
      const calif = '' as any;
      const obs = nota ? nota.observaciones : '';
      const promAnt = nota ? nota.valor:null; // Simulado

      return {
        uid: e.persona.uid,
        nombre: `${e.persona.apellidos} ${e.persona.nombre}`,
        matricula: (e.rol as any)?.matricula || '--',
        fotoUrl: e.persona.fotoUrl,
        promedioAnterior: promAnt,
        calificacion: calif,
        promedioResultante: this.calcularPromedio(promAnt, calif),
        observaciones: obs,
        modificado: false
      };
    });

    this.alumnos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.cargandoTabla = false; // Desbloqueamos la tabla
  }

  // --- CÁLCULOS Y HELPERS ---
  actualizarPromedio(alumno: AlumnoCaptura) {
    if (this.actaCerrada) return;
    alumno.modificado = true;
    alumno.promedioResultante = this.calcularPromedio(alumno.promedioAnterior, alumno.calificacion);
  }

  private calcularPromedio(ant: number, act: number | null): number {
    if (act === null || act === undefined) return ant;

    if (ant === undefined || ant === null) return act; 
    
    return parseFloat(((ant + act) / 2).toFixed(1));
  }

  getNotaClass(valor: number | null): string {
    if (valor === null || valor === undefined) return '';
    if (valor < 6) return 'nota-reprobatoria';
    if (valor >= 9) return 'nota-excelente';
    return 'nota-regular';
  }

  getEstatusLabel(promedio: number): string {
    if (promedio >= 9) return 'EXCELENTE';
    if (promedio >= 8) return 'REGULAR';
    if (promedio >= 6) return 'SUFICIENTE';
    return 'REPROBADO';
  }

  getEstatusClass(promedio: number): string {
    if (promedio >= 9) return 'status-excelente';
    if (promedio >= 8) return 'status-regular';
    if (promedio >= 6) return 'status-suficiente';
    return 'status-reprobado';
  }

  // --- ACCIONES ---
  guardarTodo() {
    if (this.actaCerrada) return;
    this.guardando = true;

    const payload = {
      grupoId: this.seleccion.grupoId,
      evaluacionId: this.seleccion.evaluacionId,
      calificaciones: this.alumnos.map(a => ({
        estudianteUid: a.uid,
        valor: Number(a.promedioResultante) || 0,
        observaciones: a.observaciones
      }))
    };

    this.docentesService.guardarCalificacionesMasivo(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.notificaciones.mostrar('exito', 'Guardado', 'Calificaciones registradas.');
        this.alumnos.forEach(a => a.modificado = false);
      },
      error: () => {
        this.guardando = false;
        this.notificaciones.mostrar('error', 'Error', 'No se pudo guardar.');
      }
    });
  }

  confirmarCierre() {
    this.notificaciones.confirmar(
      '¿Finalizar Acta?',
      'Una vez enviada, NO podrás hacer cambios.',
      () => {
        this.cargandoTabla = true;
        this.docentesService.cerrarActa(this.seleccion.evaluacionId).subscribe({
          next: () => {
            this.notificaciones.mostrar('exito', 'Acta Cerrada', 'Oficializada correctamente.');
            this.actaCerrada = true;
            this.cargandoTabla = false;
          },
          error: () => {
            this.cargandoTabla = false;
            this.notificaciones.mostrar('error', 'Error', 'Fallo al cerrar acta.');
          }
        });
      },
      'Finalizar'
    );
  }

  imprimirActa() {
    if (!this.seleccion.evaluacionId) return;
    const g = this.misGrupos.find(x => x.id === this.seleccion.grupoId);
    const p = this.periodos.find(x => x.id === this.seleccion.periodoId);
    const e = this.evaluaciones.find(x => x.id === this.seleccion.evaluacionId);

    this.impresionService.imprimirActaEvaluacion({
      docenteNombre: this.nombreDocente,
      materia: g?.materia?.nombre || '',
      gradoGrupo: `${g?.materia?.grado}°`,
      periodo: p?.nombre || '',
      rubro: e?.nombre || '',
      alumnos: this.alumnos
    });
  }
}