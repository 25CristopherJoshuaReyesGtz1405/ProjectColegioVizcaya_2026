import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-analitica-grupal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-analitica-grupal.html',
  styleUrl: './modal-analitica-grupal.scss'
})
export class ModalAnaliticaGrupal implements OnInit {
  @Input() alumnos: any[] = [];
  @Input() tituloGrupo: string = '';
  @Output() close = new EventEmitter<void>();

  promedioGeneral: number = 0;
  totalAprobados: number = 0;
  totalReprobados: number = 0;
  tasaAprobacion: number = 0;

  topEstudiantes: any[] = [];

  // NUEVO: Paleta de Colores Pastel para la gráfica
  distribucion = [
    { etiqueta: '10', cantidad: 0, color: '#A7F3D0', porcentajeAlto: 0 }, // Verde menta pastel
    { etiqueta: '9', cantidad: 0, color: '#D9F99D', porcentajeAlto: 0 }, // Lima pastel
    { etiqueta: '8', cantidad: 0, color: '#FEF08A', porcentajeAlto: 0 }, // Amarillo pastel
    { etiqueta: '7', cantidad: 0, color: '#FED7AA', porcentajeAlto: 0 }, // Melocotón pastel
    { etiqueta: '6', cantidad: 0, color: '#FBCFE8', porcentajeAlto: 0 }, // Rosa pastel
    { etiqueta: '≤ 5', cantidad: 0, color: '#FECACA', porcentajeAlto: 0 } // Rojo/Salmón pastel
  ];

  maxCantidad = 0;

  ngOnInit() {
    this.calcularAnaliticas();
  }

  calcularAnaliticas() {
    if (!this.alumnos || this.alumnos.length === 0) return;

    let sumaPromedios = 0;

    this.alumnos.forEach(al => {
      const prom = al.promedioFinal;
      sumaPromedios += prom;

      if (prom >= 6) this.totalAprobados++;
      else this.totalReprobados++;

      if (prom >= 9.5) this.distribucion[0].cantidad++;
      else if (prom >= 8.5) this.distribucion[1].cantidad++;
      else if (prom >= 7.5) this.distribucion[2].cantidad++;
      else if (prom >= 6.5) this.distribucion[3].cantidad++;
      else if (prom >= 6.0) this.distribucion[4].cantidad++;
      else this.distribucion[5].cantidad++;
    });

    this.promedioGeneral = Math.round((sumaPromedios / this.alumnos.length) * 10) / 10;
    this.tasaAprobacion = Math.round((this.totalAprobados / this.alumnos.length) * 100);

    this.maxCantidad = Math.max(...this.distribucion.map(d => d.cantidad));
    
    if (this.maxCantidad > 0) {
      this.distribucion.forEach(d => {
        d.porcentajeAlto = (d.cantidad / this.maxCantidad) * 100;
      });
    }

    const alumnosOrdenados = [...this.alumnos].sort((a, b) => b.promedioFinal - a.promedioFinal);
    this.topEstudiantes = alumnosOrdenados.slice(0, 3);
  }
}