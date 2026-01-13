import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// SERVICIOS
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service'; // Para obtener periodos
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';

// MODELOS
import { Grupo, Periodo } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-planeacion-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-planeacion-crear.html',
  styleUrl: './modal-planeacion-crear.scss'
})
export class ModalPlaneacionCrear implements OnInit {

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private docentesService = inject(DocentesService);
  private catalogosService = inject(CatalogosService);
  private notificaciones = inject(NotificacionesService);

  // Listas para Selects
  misGrupos: any[] = [];
  periodos: Periodo[] = [];
  
  // Estado
  cargando = false;
  archivoSeleccionado: File | null = null;
  errorArchivo = '';

  // Formulario
  datos = {
    grupoId: '',     // Usamos el grupo para deducir la materia
    periodoId: '',
    nombre: ''
  };

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    // 1. Cargar Grupos del Docente
    this.docentesService.getMisGrupos().subscribe({
      next: (grupos) => this.misGrupos = grupos,
      error: () => this.notificaciones.mostrar('error', 'Error', 'No se cargaron los grupos.')
    });

    // 2. Cargar Periodos
    this.catalogosService.getAllPeriodos().subscribe({
      next: (periodos) => {
        // Filtramos solo los abiertos o mostramos todos según regla de negocio
        this.periodos = periodos.filter(p => p.estatus === 'ABIERTO');
      }
    });
  }

  // --- LÓGICA DE ARCHIVOS ---

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.procesarArchivo(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Aquí podrías añadir una clase CSS para iluminar la zona
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.procesarArchivo(file);
    }
  }

  procesarArchivo(file: File) {
    this.errorArchivo = '';
    
    // Validar tipo (PDF, Word)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      this.errorArchivo = 'Solo se permiten archivos PDF o Word (.doc, .docx)';
      return;
    }

    // Validar tamaño (Ej. Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.errorArchivo = 'El archivo es demasiado pesado (Máx 5MB)';
      return;
    }

    this.archivoSeleccionado = file;
    // Autocompletar nombre si está vacío
    if (!this.datos.nombre) {
      this.datos.nombre = file.name.split('.')[0];
    }
  }

  quitarArchivo() {
    this.archivoSeleccionado = null;
    this.errorArchivo = '';
  }

  // --- GUARDAR ---

  guardar() {
    if (!this.datos.grupoId || !this.datos.periodoId || !this.archivoSeleccionado) {
      this.notificaciones.mostrar('error', 'Incompleto', 'Faltan datos o el archivo.');
      return;
    }

    this.cargando = true;

    // Encontrar la materia asociada al grupo seleccionado
    const grupoSeleccionado = this.misGrupos.find(g => g.id === this.datos.grupoId);
    if (!grupoSeleccionado) return;

    // Preparar payload para el servicio
    // El servicio espera: { materiaId, periodoId, nombre } + File
    const metadata = {
      materiaId: grupoSeleccionado.materiaId,
      periodoId: this.datos.periodoId,
      nombre: this.datos.nombre
    };

    this.docentesService.subirPlaneacion(this.archivoSeleccionado, metadata).subscribe({
      next: () => {
        this.cargando = false;
        this.notificaciones.mostrar('exito', 'Subida Exitosa', 'La planeación se guardó en Drive correctamente.');
        this.success.emit();
        this.close.emit();
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'Fallo al subir el archivo.');
      }
    });
  }
}