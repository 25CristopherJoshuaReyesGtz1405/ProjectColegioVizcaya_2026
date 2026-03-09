import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modal-acceso-padres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-acceso-padres.html',
  styleUrls: ['./modal-acceso-padres.scss']
})
export class ModalAccesoPadres {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();

  credenciales = {
    identificador: '', // Matrícula o Correo
    password: ''
  };
  loading: boolean = false;

  constructor(private router: Router) {}

  cerrarModal() {
    this.close.emit();
  }

  iniciarSesion() {
    if (!this.credenciales.identificador || !this.credenciales.password) return;

    this.loading = true;
    
    // Simulación de login (Aquí conectarías con AuthService)
    setTimeout(() => {
      this.loading = false;
      console.log('Login intentado con:', this.credenciales);
      // Redirección exitosa (ejemplo)
      // this.router.navigate(['/portal-padres']);
      this.cerrarModal();
    }, 1500);
  }
}