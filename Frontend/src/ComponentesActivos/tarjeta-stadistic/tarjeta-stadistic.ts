import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tarjeta-stadistic',
  imports: [CommonModule],
  standalone: true, 
  templateUrl: './tarjeta-stadistic.html',
  styleUrl: './tarjeta-stadistic.scss',
})
export class TarjetaStadistic {
  @Input() titulo: string = 'Título';
  @Input() valor: string | number = 0;
  @Input() detalle: string = ''; // Texto pequeño abajo (ej: "Actualizado hoy")
  @Input() icono: string = 'bi-bar-chart-fill'; // Clase de Bootstrap Icons
  
  /**
   * Define el tema de color de la tarjeta.
   * Opciones: 'guinda' (default), 'azul', 'verde', 'naranja', 'morado', 'negro'
   */
  @Input() color: 'guinda' | 'azul' | 'verde' | 'naranja' | 'morado' | 'negro' = 'guinda';
}
