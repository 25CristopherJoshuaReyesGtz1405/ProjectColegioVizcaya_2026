import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemaOscuro } from '../../../../ServiciosActivos/tema-oscuro';

@Component({
  selector: 'app-modal-configuracion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-configuracion.html',
  styleUrl: './modal-configuracion.scss' // Reutilizamos el mismo SCSS
})
export class ModalConfiguracion {
  @Output() close = new EventEmitter<void>();
  isDarkMode: boolean = false;

  themeService = inject(TemaOscuro); 

  cerrarModal() {
    this.close.emit();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = !this.isDarkMode;
  }
}