import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogosService } from '../../../../ServiciosActivos/catalogo.service';
import { Periodo } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-periodo-widget',
  standalone: true,
  imports: [CommonModule,FormsModule, ReactiveFormsModule],
  templateUrl: './periodo-widget.html',
  styleUrl: './periodo-widget.scss'
})
export class PeriodoWidget implements OnInit {
  
  private catalogosService = inject(CatalogosService);
  
  public periodoActivo: Periodo | null = null;
  public cargando = true;

  ngOnInit() {
    this.buscarPeriodoActivo();
  }

  buscarPeriodoActivo() {
    this.cargando = true;
    this.catalogosService.getAllPeriodos().subscribe({
      next: (periodos) => {
        // Buscamos el primero que esté ABIERTO
        this.periodoActivo = periodos.find(p => p.estatus === 'ABIERTO') || null;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }
}