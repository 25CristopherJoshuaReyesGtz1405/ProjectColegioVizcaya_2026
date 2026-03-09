import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-privacidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-privacidad.html',
  styleUrl: './modal-privacidad.scss' // Compartiremos un SCSS muy similar
})
export class ModalPrivacidad {
  
  @Output() close = new EventEmitter<void>();
  @Output() accept = new EventEmitter<void>();

  terminosAceptados: boolean = false;

  cerrarModal() {
    this.close.emit();
  }

  aceptarTerminos() {
    if (this.terminosAceptados) {
      this.accept.emit();
      this.cerrarModal();
    }
  }
}