import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tarjeta-stadistic',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta-stadistic.html',
  styleUrl: './tarjeta-stadistic.scss'
})
export class TarjetaStadistic {
  
  // Datos Principales
  @Input() titulo: string = 'Métrica';
  @Input() valor: number | string = 0;
  @Input() icono: string = 'bi-bar-chart';
  @Input() color: 'azul' | 'verde' | 'guinda' | 'morado' | 'naranja' | 'rojo' = 'azul';
  
  // Datos Premium del Nuevo Diseño
  @Input() tendenciaTexto: string = '';
  @Input() watermarkIcon: string = 'bi-graph-up'; // Marca de agua de fondo
  @Input() progreso: number = 100; // Porcentaje de la barra inferior (0 a 100)
  @Input() footerIcono: string = 'bi-info-circle';
  @Input() descripcion: string = 'Actualizado'; // Se usará para el texto inferior

  // Conversor automático de tus colores al nuevo estándar Ultra Premium
  get baseColor() {
    switch(this.color) {
      case 'azul': return 'blue';
      case 'verde': return 'teal';  // Usamos el verde elegante (teal)
      case 'morado': return 'purple';
      case 'naranja': return 'gold';
      case 'rojo': return 'red';
      default: return 'guinda'; // Guinda por defecto
    }
  }
}