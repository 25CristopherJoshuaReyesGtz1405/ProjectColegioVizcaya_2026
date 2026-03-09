import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// COMPONENTES Y MODALES
import { TarjetaStadistic } from '../../../../ComponentesActivos/tarjeta-stadistic/tarjeta-stadistic';
import { MateriaModal } from '../../ModuloComponentes/modal-materia/modal-materia';

// SERVICIOS Y MODELOS
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { AdminService } from '../../../../ServiciosActivos/admin.service';
import { Materia, EstadisticasDashboardDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { DrawerMateriaDetalle } from '../../ModuloComponentes/drawer-materia-detalle/drawer-materia-detalle';
import { FirebaseAppModule } from '@angular/fire/app';

@Component({
  selector: 'app-panel-materias',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    TarjetaStadistic, 
    MateriaModal, 
    DrawerMateriaDetalle
  ],
  templateUrl: './panel-materias.html',
  styleUrl: './panel-materias.scss',
  providers: [DatePipe, FirebaseAppModule]
})
export class PanelMaterias implements OnInit {

  // --- INYECCIÓN DE SERVICIOS ---
  private catalogosService = inject(CatalogosService);
  private adminService = inject(AdminService);
  private notificaciones = inject(NotificacionesService);
  private datePipe = inject(DatePipe);

  // --- DATOS GLOBALES ---
  public materias: Materia[] = [];
  public estadisticas: EstadisticasDashboardDTO | null = null;
  
  // --- ESTADOS DE LA VISTA ---
  public estaCargando = true;
  public today: Date = new Date();
  public terminoBusqueda: string = '';
  public filtroActivo: string = 'TODOS';
  
  // --- CONTROL DE MODALES Y PANELES ---
  public mostrarModalMateria = false;
  public materiaSeleccionada: Materia | null = null;

  ngOnInit(): void {
    this.cargarDatosDashboard();
    this.cargarMaterias();
  }

  // ==========================================
  // CARGA DE DATOS
  // ==========================================
  cargarDatosDashboard() {
    this.estaCargando = true;
    this.adminService.getEstadisticasDashboard().subscribe({
      next: (data) => {
        this.estadisticas = data;
        this.estaCargando = false;
      },
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        this.estaCargando = false;
      }
    });
  }

  cargarMaterias() {
    this.catalogosService.getAllMaterias().subscribe({
      next: (data) => {
        this.materias = data || [];
      },
      error: (err) => console.error('Error cargando materias:', err)
    });
  }

  public drawerMateriaAbierto = false;
public materiaParaExpediente: Materia | null = null;

abrirExpedienteMateria(materia: Materia) {
  this.materiaParaExpediente = materia;
  this.drawerMateriaAbierto = true;
}
cerrarExpedienteMateria() {
  this.drawerMateriaAbierto = false;
  setTimeout(() => this.materiaParaExpediente = null, 300);
}

  // ==========================================
  // LÓGICA DE FILTRADO Y BUSCADOR
  // ==========================================
  get materiasFiltradas(): Materia[] {
    let filtradas = this.materias;

    // Filtros de Semestre y Estados
    if (this.filtroActivo !== 'TODOS') {
      if (this.filtroActivo === '1_SEMESTRE') filtradas = filtradas.filter(m => m.grado === 1);
      if (this.filtroActivo === '2_SEMESTRE') filtradas = filtradas.filter(m => m.grado === 2);
      if (this.filtroActivo === '3_SEMESTRE') filtradas = filtradas.filter(m => m.grado === 3);
      if (this.filtroActivo === 'FALTAN_PLANEACIONES') filtradas = filtradas.filter(m => m.grado === 2); // Simulación temporal
    }

    // Buscador por texto
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      filtradas = filtradas.filter(m => 
        (m.nombre && m.nombre.toLowerCase().includes(termino)) ||
        (m.claveMateria && m.claveMateria.toLowerCase().includes(termino))
      );
    }

    return filtradas;
  }

  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
  }

  // ==========================================
  // ACCIONES CRUD (MODAL)
  // ==========================================
  abrirCrearMateria() {
    this.materiaSeleccionada = null;
    this.mostrarModalMateria = true;
  }

  abrirEdicionMateria(materia: Materia) {
    this.materiaSeleccionada = { ...materia };
    this.mostrarModalMateria = true;
  }

  confirmarEliminarMateria(materia: Materia) {
    this.notificaciones.confirmar(
      'Eliminar Asignatura',
      `¿Borrar del plan de estudios la materia "${materia.nombre}"?`,
      () => {
        this.catalogosService.deleteMateria(materia.id).subscribe({
          next: () => {
            this.notificaciones.mostrar('exito', 'Eliminada', 'Asignatura borrada exitosamente.');
            this.cargarMaterias();
          }
        });
      },
      'Sí, eliminar'
    );
  }

  cerrarModalMateria() {
    this.mostrarModalMateria = false;
    this.materiaSeleccionada = null;
  }

  alGuardarMateria() {
    this.cerrarModalMateria();
    this.cargarMaterias();
  }

  // ==========================================
  // RADAR OPERATIVO (BOTONES iOS)
  // ==========================================
  radarPlanEstudios() {
    this.notificaciones.mostrar('info', 'Generando Plan', 'Construyendo PDF del mapa curricular oficial...');
  }

  radarCargaMasiva() {
    this.notificaciones.mostrar('info', 'Importador CSV', 'El módulo de carga masiva de materias se abrirá pronto.');
  }

  radarAuditoria() {
    this.notificaciones.mostrar('info', 'Auditoría', 'Escaneando asignaturas sin instrumentación...');
    this.setFiltro('FALTAN_PLANEACIONES');
  }

  // ==========================================
  // SIDE-DRAWER EXPEDIENTE (Próxima Fase)
  // ==========================================

}