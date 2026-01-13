import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GruposService } from '../../../../ServiciosActivos/grupos.service';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { Materia, PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-grupo-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-grupo-nuevo.html',
  styleUrl: './modal-grupo-nuevo.scss'
})
export class ModalGrupoNuevo implements OnInit {

  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private gruposService = inject(GruposService);
  private catalogosService = inject(CatalogosService);
  private docentesService = inject(DocentesService);
  private notificaciones = inject(NotificacionesService);

  // Catálogos para los <select>
  materias: Materia[] = [];
  docentes: PerfilUsuarioDTO[] = [];

  // Modelo del formulario
  nuevoGrupo = {
    cicloEscolar: '2024-2025', // Valor por defecto sugerido
    materiaId: '',
    empleadoUid: ''
  };

  cargando = false;

  ngOnInit() {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    // Cargar Materias
    this.catalogosService.getAllMaterias().subscribe({
      next: (data) => this.materias = data,
      error: () => this.notificaciones.mostrar('error', 'Error', 'No se cargaron las materias')
    });

    // Cargar Docentes
    this.docentesService.getDocentes().subscribe({
      next: (data) => this.docentes = data,
      error: () => this.notificaciones.mostrar('error', 'Error', 'No se cargaron los docentes')
    });
  }

  guardar() {
    if (!this.nuevoGrupo.materiaId || !this.nuevoGrupo.empleadoUid) return;

    this.cargando = true;

    this.gruposService.crearGrupo({
      ...this.nuevoGrupo,
      estudianteUids: [] // Empieza vacío
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.notificaciones.mostrar('exito', 'Grupo Creado', 'La clase se ha configurado correctamente.');
        this.success.emit();
        this.close.emit();
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo crear el grupo.');
      }
    });
  }
}