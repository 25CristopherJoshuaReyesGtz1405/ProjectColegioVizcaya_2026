import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../ServiciosActivos/auth.service';
import { NotificacionesService } from '../../../ServiciosActivos/notificaciones.service';

// --- Importa los componentes Shared (Estandarizados) ---
import { CampoEntradaShared } from '../../../ComponentesActivos/campo-entrada-shared/campo-entrada-shared';
import { BtnShared } from '../../../ComponentesActivos/btn-shared/btn-shared';
import { NotificacionesShared } from '../../../ComponentesActivos/notificaciones-shared/notificaciones-shared';

@Component({
  selector: 'app-recuperar-acceso',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    CampoEntradaShared, 
    BtnShared,
    NotificacionesShared // Para mostrar los toasts
  ],
  templateUrl: './recuperar-acceso.html',
  styleUrls: ['./recuperar-acceso.scss'],
})
export class RecuperarAcceso {
  
  private servicioAuth = inject(AuthService);
  private notificaciones = inject(NotificacionesService);
  private enrutador = inject(Router); 

  correo: string = '';
  estaCargando = false;
  correoEnviado = false;

  async solicitarReseteo(): Promise<void> {
    if (!this.correo) {
      this.notificaciones.mostrar('error', 'Campo Requerido', 'Por favor, ingresa tu correo electrónico institucional.');
      return;
    }

    this.estaCargando = true;
    
    // Como el servicio devuelve un Observable, usamos .subscribe
    this.servicioAuth.enviarCorreoReseteo(this.correo).subscribe({
      next: () => {
        this.correoEnviado = true;
        this.notificaciones.mostrar('exito', 'Correo Enviado', 'Revisa tu bandeja de entrada.');
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.notificaciones.mostrar('error', 'Error', 'No se pudo enviar el correo. Verifica que esté escrito correctamente.');
        this.estaCargando = false;
      },
      complete: () => {
        this.estaCargando = false;
      }
    });
  }

  volverInicioSesion(): void
  {
    setTimeout(() => this.enrutador.navigate(['/auth/login']), 900);
  }
}