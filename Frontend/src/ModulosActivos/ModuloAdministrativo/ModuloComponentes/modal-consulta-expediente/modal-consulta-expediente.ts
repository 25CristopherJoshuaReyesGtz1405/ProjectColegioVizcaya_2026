import { Component, EventEmitter, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

import { PerfilUsuarioDTO, KardexDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service'; 
import { GruposService } from '../../../../ServiciosActivos/grupos.service';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service';

@Component({
  selector: 'app-modal-consulta-expediente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-consulta-expediente.html',
  styleUrl: './modal-consulta-expediente.scss',
  providers: [DatePipe]
})
export class ModalConsultaExpediente implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  
  // Servicios inyectados
  private estudiantesService = inject(EstudiantesService);
  private docentesService = inject(DocentesService);
  private reportesService = inject(EstudiantesService);
  private gruposService = inject(GruposService);

  private impresionService = inject(ImpresionService);

  // Variables de Búsqueda
  terminoBusqueda: string = '';
  resultados: PerfilUsuarioDTO[] = [];
  buscando: boolean = false;
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  // Variables de Detalle
  expedienteSeleccionado: PerfilUsuarioDTO | null = null;
  cargandoDetalles: boolean = false;
  descargandoPDF: boolean = false;

  promedioEstudiante: number | null = null;
  materiasDocente: string[] = [];

  ngOnInit() {
    // Aquí ocurre la magia del Debounce (espera 400ms antes de buscar en el backend)
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((term) => {
        if (term.length > 2) {
          this.buscando = true;
          // Ejecuta las dos peticiones HTTP al mismo tiempo
          return forkJoin({
            estudiantes: this.estudiantesService.buscarEstudiantesGlobal(term).pipe(catchError(() => of([]))),
            docentes: this.docentesService.buscarDocentesGlobal(term).pipe(catchError(() => of([])))
          });
        } else {
          return of({ estudiantes: [], docentes: [] });
        }
      })
    ).subscribe(({ estudiantes, docentes }) => {
      this.buscando = false;
      this.resultados = [...estudiantes, ...docentes];
    });
  }

  ngOnDestroy() {
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
  }

  cerrarModal() {
    this.close.emit();
  }

  // Se activa cada vez que el usuario teclea algo en el HTML
  onInputSearch(event: any) {
    this.searchSubject.next(event.target.value);
  }

  // --- OBTENCIÓN DE DATOS REALES AL SELECCIONAR ---
  seleccionarExpediente(usuario: PerfilUsuarioDTO) {
    this.expedienteSeleccionado = usuario;
    this.terminoBusqueda = ''; 
    this.resultados = []; 
    this.cargandoDetalles = true;

    if (usuario.tipoRol === 'estudiante') {
      this.reportesService.getKardex(usuario.persona.uid).subscribe({
        next: (kardex: KardexDTO) => {
          this.promedioEstudiante = kardex.promedioGlobal;
          this.cargandoDetalles = false;
        },
        error: (err) => {
          console.error("Error al obtener Kardex:", err);
          this.promedioEstudiante = 0;
          this.cargandoDetalles = false;
        }
      });
    } 
    else if (usuario.tipoRol === 'docente') {
      this.gruposService.getAllGrupos().subscribe({
        next: (grupos: any[]) => {
          const susGrupos = grupos.filter(g => g.empleadoUid === usuario.persona.uid);
          this.materiasDocente = [...new Set(susGrupos.map(g => g.materia?.nombre || 'Materia Desconocida'))];
          this.cargandoDetalles = false;
        }
      });
    }
  }

  limpiarSeleccion() {
    this.expedienteSeleccionado = null;
    this.promedioEstudiante = null;
    this.materiasDocente = [];
  }

  descargarFichaPDF() {
    if (!this.expedienteSeleccionado) return;
    
    this.descargandoPDF = true;

    // Preparamos los detalles extra recolectados de la BD
    const detallesExtras = {
      promedioGlobal: this.promedioEstudiante,
      materiasImpartidas: this.materiasDocente
    };

    // Llamamos al servicio de impresión
    try {
      this.impresionService.imprimirFichaTecnica(this.expedienteSeleccionado, detallesExtras);
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      this.descargandoPDF = false;
    }
  }
}