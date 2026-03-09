import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { GruposService } from '../../../../ServiciosActivos/grupos.service';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { AuthService } from '../../../../ServiciosActivos/auth.service';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';

// IMPORTAR LOS MODALES
import { ModalEvaluacionCrear } from '../../ModuloComponentes/modal-evaluacion-crear/modal-evaluacion-crear';
import { ModalGestionRublos } from '../../ModuloComponentes/modal-gestion-rublos/modal-gestion-rublos';
import { ModalSolicitudCorreccion } from '../../ModuloComponentes/modal-solicitud-correccion/modal-solicitud-correccion';

import { TarjetaStadistic } from '../../../../ComponentesActivos/tarjeta-stadistic/tarjeta-stadistic';

import { ModalAnaliticaGrupal } from '../../ModuloComponentes/modal-analitica-grupal/modal-analitica-grupal';
import { ModalExpediente360 } from '../../ModuloComponentes/modal-expediente360/modal-expediente360';

interface AlumnoMatriz {
  uid: string;
  nombre: string;
  matricula: string;
  fotoUrl?: string;
  promedioAnterior: number | null;
  notas: { [evaluacionId: string]: number | null };
  observacionGeneral: string;
  calificacionPeriodo: number;
  promedioFinal: number;
  modificado: boolean;
  estatus?: string;
}

@Component({
  selector: 'app-panel-califcaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalEvaluacionCrear,
    ModalGestionRublos,
    ModalSolicitudCorreccion,
    TarjetaStadistic,
    ModalAnaliticaGrupal,
    ModalExpediente360
  ],
  templateUrl: './panel-califcaciones.html',
  styleUrl: './panel-califcaciones.scss',
})
export class PanelCalifcaciones implements OnInit {
  private docentesService = inject(DocentesService);
  private gruposService = inject(GruposService);
  private catalogosService = inject(CatalogosService);
  private notificaciones = inject(NotificacionesService);
  private authService = inject(AuthService);
  private impresionService = inject(ImpresionService);

  misGrupos: any[] = [];
  periodos: any[] = [];
  columnasEvaluacion: any[] = [];
  alumnos: AlumnoMatriz[] = [];
  stats: any = null;

  seleccion = { grupoId: '', periodoId: '' };
  nombreDocente = '';
  docenteUid = ''; // Guardamos el UID para la solicitud

  cargando = true;
  cargandoTabla = false;
  guardando = false;
  actaCerrada = false;

  // ESTADOS DE MODALES
  mostrarModalEvaluacion = false;
  mostrarModalGestion = false;
  mostrarModalSolicitud = false; // Estado para el nuevo modal

  // DATOS PARA EL MODAL DE SOLICITUD
  dataSolicitud: any = null;

  //  * Estados Modal Expediente
  mostrarExpediente = false;
  alumnoExpediente: any = null;
  materiaActualNombre = '';

  //  * ESTADOS DE MODAL DE ANALITICA GRUPAL
  mostrarModalAnalitica = false;
  tituloGrupoAnalitica = '';

  // UX Highlighting
  hoveredRowIndex: number = -1;
  activeInputColId: string | null = null;
  actaCerradaBoolean!: boolean;

  ngOnInit() {
    this.cargarDatosIniciales();
    this.authService.getUsuario().subscribe((u) => {
      if (u) {
        this.nombreDocente = `${u.persona.nombre} ${u.persona.apellidos}`;
        this.docentesUid = u.persona.uid; // Guardar UID
        this.docentesService.getEstadisticasDashboard().subscribe((s) => (this.stats = s));
      }
    });
  }

  abrirExpediente(alumno: any) {
    const grupo = this.misGrupos.find((g) => g.id === this.seleccion.grupoId);
    this.materiaActualNombre = grupo?.materia?.nombre || 'Clase';
    this.alumnoExpediente = alumno;
    this.mostrarExpediente = true;
  }

  abrirAnalitica() {
    const g = this.misGrupos.find((x) => x.id === this.seleccion.grupoId);
    this.tituloGrupoAnalitica = `${g?.materia?.nombre} (${g?.materia?.grado}°)`;
    this.mostrarModalAnalitica = true;
  }

  // --- NUEVAS VARIABLES PARA AUTO-GUARDADO ---
  hayBorradorLocal = false;
  fechaBorrador: Date | null = null;

  // --- 1. FUNCIÓN PARA CREAR EL BORRADOR (Se llama cada que teclean) ---
  guardarBorradorLocal() {
    if (this.actaCerrada || this.alumnos.length === 0) return;

    // Creamos una llave única: ej. "borrador_calif_GRUPOA_PARCIAL1"
    const key = `borrador_calif_${this.seleccion.grupoId}_${this.seleccion.periodoId}`;

    const datosBorrador = {
      fecha: new Date().toISOString(),
      alumnos: this.alumnos.map((al) => ({
        uid: al.uid,
        notas: al.notas,
        observacionGeneral: al.observacionGeneral,
      })),
    };

    // Guardamos en el navegador
    localStorage.setItem(key, JSON.stringify(datosBorrador));
    this.hayBorradorLocal = true;
    this.fechaBorrador = new Date();
  }

  // --- 2. FUNCIÓN PARA VERIFICAR SI HAY UN BORRADOR AL CARGAR LA TABLA ---
  verificarBorrador() {
    const key = `borrador_calif_${this.seleccion.grupoId}_${this.seleccion.periodoId}`;
    const borradorStr = localStorage.getItem(key);

    if (borradorStr) {
      const borrador = JSON.parse(borradorStr);
      this.hayBorradorLocal = true;
      this.fechaBorrador = new Date(borrador.fecha);

      // Formateamos la hora para que se vea amigable (Ej: "14:30")
      const horaBorrador = this.fechaBorrador.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Invocamos tu servicio de confirmación modal
      this.notificaciones.confirmar(
        'Borrador Recuperado',
        `El sistema se cerró inesperadamente. Tienes calificaciones sin guardar en la nube de las ${horaBorrador}. ¿Deseas restaurar estos datos a la tabla?`,
        () => {
          // Esta función se ejecuta si el usuario le da clic a "Aceptar/Confirmar" en tu modal
          this.restaurarBorrador();
        },
      );
    } else {
      this.hayBorradorLocal = false;
      this.fechaBorrador = null;
    }
  }

  // --- 3. FUNCIÓN PARA RESTAURAR EL BORRADOR ---
  restaurarBorrador() {
    const key = `borrador_calif_${this.seleccion.grupoId}_${this.seleccion.periodoId}`;
    const borradorStr = localStorage.getItem(key);

    if (borradorStr) {
      const borrador = JSON.parse(borradorStr);

      // Mapeamos los datos guardados de vuelta a nuestros alumnos
      borrador.alumnos.forEach((alGuardado: any) => {
        const alumnoReal = this.alumnos.find((a) => a.uid === alGuardado.uid);
        if (alumnoReal) {
          alumnoReal.notas = alGuardado.notas;
          alumnoReal.observacionGeneral = alGuardado.observacionGeneral;
          alumnoReal.modificado = true; // Para que se ilumine en amarillo
        }
      });

      // CORRECCIÓN: Recalculamos el promedio fila por fila
      this.alumnos.forEach((al) => this.recalcularPromedioFila(al));

      this.notificaciones.mostrar('exito', 'Restaurado', 'Borrador local recuperado con éxito.');
    }
  }

  // --- 4. FUNCIÓN PARA LIMPIAR (Llamar cuando se guarda en Firebase con éxito) ---
  limpiarBorradorLocal() {
    const key = `borrador_calif_${this.seleccion.grupoId}_${this.seleccion.periodoId}`;
    localStorage.removeItem(key);
    this.hayBorradorLocal = false;
    this.fechaBorrador = null;
  }

  // Propiedad auxiliar para corregir el error de tipado anterior si existía
  private docentesUid = '';

  cargarDatosIniciales() {
    this.cargando = true;
    this.catalogosService.getAllPeriodos().subscribe((p) => {
      this.periodos = p.sort(
        (a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime(),
      );
    });
    this.docentesService.getMisGrupos().subscribe({
      next: (g) => {
        this.misGrupos = g;
        this.cargando = false;
      },
      error: () => (this.cargando = false),
    });
  }

  onFiltroChange() {
    if (!this.seleccion.grupoId || !this.seleccion.periodoId) return;
    this.cargarMatrizCompleta();
  }

  // --- LÓGICA PARA ABRIR SOLICITUD ---
  abrirSolicitud(alumno: AlumnoMatriz, rubro: any) {
    const grupo = this.misGrupos.find((g) => g.id === this.seleccion.grupoId);

    this.dataSolicitud = {
      docentesUid: this.docentesUid,
      docenteNombre: this.nombreDocente,
      grupoId: this.seleccion.grupoId,
      materiaNombre: grupo?.materia?.nombre || 'Materia Desconocida',
      alumno: alumno,
      rubro: rubro, // { id, nombre, porcentaje }
    };

    this.mostrarModalSolicitud = true;
  }

  // --- RESTO DE LÓGICA (Carga, Cálculos, etc.) ---

  async cargarMatrizCompleta() {
    this.cargandoTabla = true;
    this.alumnos = [];
    this.columnasEvaluacion = [];

    // =========================================================
    // NUEVA LÓGICA ROBUSTA: IDENTIFICAR PERIODO ANTERIOR POR FECHAS
    // =========================================================
    const periodoActual = this.periodos.find((p) => p.id === this.seleccion.periodoId);
    let idPeriodoAnterior: string | null = null;

    if (periodoActual && periodoActual.fechaInicio) {
      // 1. Convertimos la fecha de inicio del periodo actual a milisegundos
      const inicioActualMs = new Date(periodoActual.fechaInicio).getTime();

      // 2. Filtramos solo los periodos que terminaron ANTES (o el mismo día) que empezó el actual
      const periodosPasados = this.periodos.filter((p) => {
        if (!p.fechaFin || p.id === periodoActual.id) return false;
        const finPasadoMs = new Date(p.fechaFin).getTime();
        return finPasadoMs <= inicioActualMs;
      });

      // 3. Ordenamos esos periodos pasados desde el más reciente al más antiguo
      periodosPasados.sort((a, b) => {
        return new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime();
      });

      // 4. El periodo inmediato anterior será el primero de esa lista ya ordenada
      if (periodosPasados.length > 0) {
        idPeriodoAnterior = periodosPasados[0].id;
        console.log(
          `Periodo actual: ${periodoActual.nombre}. Periodo anterior detectado: ${periodosPasados[0].nombre}`,
        );
      }
    }
    try {
      const peticionesPrincipales: any[] = [
        this.docentesService.getEvaluacionesGrupo(this.seleccion.grupoId, this.seleccion.periodoId),
        this.gruposService.getEstudiantesGrupo(this.seleccion.grupoId),
      ];

      // Si detectamos un periodo anterior por fecha, pedimos los promedios
      if (idPeriodoAnterior) {
        peticionesPrincipales.push(
          this.docentesService.getPromediosAnteriores(this.seleccion.grupoId, idPeriodoAnterior),
        );
      }

      // Ejecutamos en paralelo
      const response = (await firstValueFrom(forkJoin(peticionesPrincipales))) as any[];

      const evaluaciones = response[0] || [];
      const estudiantes = response[1] || [];

      let mapaPromediosAnteriores: any = {};
      if (idPeriodoAnterior && response[2]) {
        mapaPromediosAnteriores = response[2];
      }

      this.columnasEvaluacion = evaluaciones;

      const peticionesActas = this.columnasEvaluacion.map((ev) =>
        this.docentesService.getActaEvaluacion(ev.id).pipe(catchError(() => of(null))),
      );

      const actasActuales = await firstValueFrom(forkJoin(peticionesActas));

      if (estudiantes.length > 0) {
      }

      this.construirTabla(estudiantes, actasActuales as any[], mapaPromediosAnteriores);
    } catch (error) {
      console.error(error);
      this.notificaciones.mostrar('error', 'Error', 'No se pudieron cargar los datos.');
    } finally {
      this.cargandoTabla = false;
    }
  }

  private construirTabla(estudiantes: any[], actas: any[], promediosAnteriores: any[]) {
    this.actaCerrada = actas.some((a) => a && a.estatus === 'CERRADA');
    this.actaCerradaBoolean = true;

    this.alumnos = estudiantes.map((est) => {
      const uid = est.persona.uid;
      const notasMap: any = {};
      let obsGral = '';

      this.columnasEvaluacion.forEach((ev, index) => {
        const acta = actas[index];
        if (acta && acta.calificaciones && acta.calificaciones[uid]) {
          notasMap[ev.id] = acta.calificaciones[uid].valor;
          if (acta.calificaciones[uid].observaciones)
            obsGral = acta.calificaciones[uid].observaciones;
        } else {
          notasMap[ev.id] = null;
        }
      });

      console.log(promediosAnteriores);

      const alumnoObj: AlumnoMatriz = {
        uid,
        nombre: `${est.persona.apellidos} ${est.persona.nombre}`,
        matricula: (est.rol as any)?.matricula || '--',
        fotoUrl: est.persona.fotoUrl,
        promedioAnterior: promediosAnteriores[uid],
        notas: notasMap,
        observacionGeneral: obsGral,
        calificacionPeriodo: 0,
        promedioFinal: 0,
        modificado: false,
        estatus: '-',
      };
      this.recalcularPromedioFila(alumnoObj);
      return alumnoObj;
    });
    this.alumnos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.verificarBorrador();
  }

  recalcularPromedioFila(alumno: AlumnoMatriz) {
    let sumaPeriodo = 0;
    this.columnasEvaluacion.forEach((ev) => {
      const nota = alumno.notas[ev.id];
      if (nota !== null && nota !== undefined && nota.toString() !== '') {
        sumaPeriodo += parseFloat(nota.toString()) * (ev.porcentaje / 100);
      }
    });
    alumno.calificacionPeriodo = Math.round(sumaPeriodo * 10) / 10;

    if (alumno.promedioAnterior !== null && alumno.promedioAnterior !== undefined) {
      const promedio = (alumno.promedioAnterior + alumno.calificacionPeriodo) / 2;
      alumno.promedioFinal = Math.round(promedio * 10) / 10;
    } else {
      alumno.promedioFinal = alumno.calificacionPeriodo;
    }

    // Cálculo Estatus
    alumno.estatus = alumno.promedioFinal >= 6 ? 'APROBADO' : 'REPROBADO';
    alumno.modificado = true;
  }

  // UX
  onInputFocus(rowIndex: number, colId: string) {
    this.hoveredRowIndex = rowIndex;
    this.activeInputColId = colId;
  }
  onInputBlur() {
    this.hoveredRowIndex = -1;
    this.activeInputColId = null;
  }

  exportarExcel() {
    if (!this.seleccion.grupoId) return;
    const g = this.misGrupos.find((x) => x.id === this.seleccion.grupoId);
    const p = this.periodos.find((x) => x.id === this.seleccion.periodoId);

    this.impresionService.exportarSabanaExcel({
      docente: this.nombreDocente,
      materia: g?.materia?.nombre,
      grupo: `${g?.materia?.grado}°`,
      periodo: p?.nombre,
      columnas: this.columnasEvaluacion.map((c) => ({
        nombre: c.nombre,
        porcentaje: c.porcentaje,
      })),
      alumnos: this.alumnos.map((al) => ({
        matricula: al.matricula,
        nombre: al.nombre,
        promedioAnterior: al.promedioAnterior,
        calificacionesRubros: this.columnasEvaluacion.map((c) => al.notas[c.id]),
        calificacionPeriodo: al.calificacionPeriodo,
        promedioFinal: al.promedioFinal,
        observaciones: al.observacionGeneral,
      })),
    });
  }

  imprimirSabana() {
    if (!this.seleccion.grupoId) return;
    const g = this.misGrupos.find((x) => x.id === this.seleccion.grupoId);
    const p = this.periodos.find((x) => x.id === this.seleccion.periodoId);
    this.impresionService.imprimirSabanaHorizontal({
      docente: this.nombreDocente,
      materia: g?.materia?.nombre,
      grupo: `${g?.materia?.grado}°`,
      periodo: p?.nombre,
      columnas: this.columnasEvaluacion.map((c) => ({
        nombre: c.nombre,
        porcentaje: c.porcentaje,
      })),
      alumnos: this.alumnos.map((al) => ({
        matricula: al.matricula,
        nombre: al.nombre,
        promedioAnterior: al.promedioAnterior,
        calificacionesRubros: this.columnasEvaluacion.map((c) => al.notas[c.id]),
        calificacionPeriodo: al.calificacionPeriodo,
        promedioFinal: al.promedioFinal,
        observaciones: al.observacionGeneral,
      })),
    });
  }

  imprimirActa() {
    if (!this.seleccion.grupoId) return;
    const g = this.misGrupos.find((x) => x.id === this.seleccion.grupoId);
    const p = this.periodos.find((x) => x.id === this.seleccion.periodoId);
    this.impresionService.imprimirActaFinal({
      docente: this.nombreDocente,
      materia: g?.materia?.nombre,
      grupo: `${g?.materia?.grado}°`,
      periodo: p?.nombre,
      alumnos: this.alumnos.map((al) => ({
        matricula: al.matricula,
        nombre: al.nombre,
        calificacion: al.calificacionPeriodo,
        observaciones: al.observacionGeneral,
      })),
    });
  }

  guardarTodo() {
    if (this.actaCerrada || this.columnasEvaluacion.length === 0) return;
    this.guardando = true;
    const peticiones = this.columnasEvaluacion.map((ev) => {
      return this.docentesService.guardarCalificacionesMasivo({
        grupoId: this.seleccion.grupoId,
        evaluacionId: ev.id,
        calificaciones: this.alumnos.map((al) => ({
          estudianteUid: al.uid,
          valor: Number(al.notas[ev.id] || 0),
          observaciones: al.observacionGeneral,
        })),
      });
    });
    forkJoin(peticiones).subscribe({
      next: () => {
        this.guardando = false;
        this.notificaciones.mostrar('exito', 'Guardado', 'Datos actualizados.');
        this.alumnos.forEach((a) => (a.modificado = false));
        this.limpiarBorradorLocal();
      },
      error: () => {
        this.guardando = false;
        this.notificaciones.mostrar('error', 'Error', 'Fallo al guardar.');
      },
    });
  }

  getNotaClass(valor: number | null): string {
    if (valor === null || valor === undefined || valor.toString() === '') return '';
    if (valor < 6) return 'nota-reprobatoria';
    if (valor >= 9) return 'nota-excelente';
    return '';
  }
}
