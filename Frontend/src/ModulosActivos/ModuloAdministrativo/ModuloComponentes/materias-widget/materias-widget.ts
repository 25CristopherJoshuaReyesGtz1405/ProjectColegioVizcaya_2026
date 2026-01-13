import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core'; // Importar EventEmitter
import { CommonModule } from '@angular/common';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { ImpresionService } from '../../../../ServiciosActivos/impresion.service'; // <--- IMPORTAR
import { Materia } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-materias-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './materias-widget.html',
  styleUrl: './materias-widget.scss'
})
export class MateriasWidget implements OnInit {
  
  // Emisores de eventos para el padre (PanelInicio)
  @Output() edit = new EventEmitter<Materia>();
  @Output() delete = new EventEmitter<Materia>();

  private catalogosService = inject(CatalogosService);
  private impresionService = inject(ImpresionService); // <--- INYECTAR
  
  public listaMaterias: Materia[] = [];
  public cargando = true;

  ngOnInit() {
    this.cargarMaterias();
  }

  cargarMaterias() {
    this.cargando = true;
    this.catalogosService.getAllMaterias().subscribe({
      next: (data) => {
        this.listaMaterias = data.sort((a, b) => {
          if (a.grado !== b.grado) return a.grado - b.grado;
          return a.nombre.localeCompare(b.nombre);
        });
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  // Acciones
  onImprimir(m: Materia) {
    this.impresionService.imprimirDetalleMateria(m);
  }

  onEditar(m: Materia) {
    this.edit.emit(m);
  }

  onEliminar(m: Materia) {
    this.delete.emit(m);
  }
}