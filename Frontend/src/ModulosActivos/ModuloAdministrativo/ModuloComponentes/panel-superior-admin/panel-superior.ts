import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ModalConfiguracion } from './../../ModuloComponentes/modal-configuracion/modal-configuracion'

// Servicios
import { AuthService } from '../../../../ServiciosActivos/auth.service';
import { TemaOscuro } from '../../../../ServiciosActivos/tema-oscuro';
import { PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { ModalPrivacidad } from '../modal-privacidad/modal-privacidad';

@Component({
  selector: 'app-panel-superior',
  standalone: true,
  imports: [CommonModule, RouterLink, ModalConfiguracion, ModalPrivacidad],
  templateUrl: './panel-superior.html',
  styleUrl: './panel-superior.scss',
})
export class PanelSuperior implements OnInit {
  private authService = inject(AuthService);
  private themeService = inject(TemaOscuro);
  private router = inject(Router);

  // Datos del Usuario
  usuario$: Observable<PerfilUsuarioDTO | null>;
  fotoUrl: string | null = null;

  // Estado UI
  isProfileMenuOpen = false;
  isDarkMode = false;

  constructor() {
    this.usuario$ = this.authService.getUsuario();
  }

  ngOnInit(): void {
    this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';

    // Suscripción para obtener la foto si existe
    this.usuario$.subscribe((u) => {
      if (u && u.persona.fotoUrl) {
        this.fotoUrl = u.persona.fotoUrl;
      }
    });
  }

  

  // Añade estas variables en tu clase PanelSuperior
mostrarConfiguracion: boolean = false;
mostrarPrivacidad: boolean = false;

// Y estos métodos:
abrirModalConfiguracion() {
  this.mostrarConfiguracion = true;
  this.isProfileMenuOpen = false; // Cierra el menú desplegable
}

abrirModalPrivacidad() {
  this.mostrarPrivacidad = true;
  this.isProfileMenuOpen = false; // Cierra el menú desplegable
}

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = !this.isDarkMode;
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  async logout(): Promise<void> {
    try {
      this.authService.cerrarSesion(); // Método corregido en AuthService
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
