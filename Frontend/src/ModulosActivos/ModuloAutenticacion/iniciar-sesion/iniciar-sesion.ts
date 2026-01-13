import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Servicios
import { AuthService } from '../../../ServiciosActivos/auth.service';
import { NotificacionesService } from '../../../ServiciosActivos/notificaciones.service';

// Componentes UI
import { CampoEntradaShared } from '../../../ComponentesActivos/campo-entrada-shared/campo-entrada-shared';
import { BtnShared } from '../../../ComponentesActivos/btn-shared/btn-shared';
// NOTA: Ya no importamos 'NotificacionesShared' aquí porque está en app.ts

@Component({
  selector: 'app-iniciar-sesion',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    CampoEntradaShared, 
    BtnShared
  ],
  templateUrl: './iniciar-sesion.html',
  styleUrls: ['./iniciar-sesion.scss']
})
export class IniciarSesion implements OnInit {
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificaciones = inject(NotificacionesService); // Inyectamos el servicio global
  private enrutador = inject(Router); 


  loginForm!: FormGroup;
  estaCargando = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required]], // Quitamos validación de email estricta para permitir matrículas
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get f() { return this.loginForm.controls; }

  async iniciarSesion(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      // Usamos el servicio global con estilo de error
      this.notificaciones.mostrar('error', 'Datos Incompletos', 'Por favor, completa tu matrícula y contraseña.');
      return;
    }

    this.estaCargando = true;
    const { correo, contrasena } = this.loginForm.value;

     await this.authService.iniciarSesion(correo, contrasena).subscribe({
      next: (respuesta) => {
        this.estaCargando = false;
        // Toast de éxito
        this.notificaciones.mostrar('exito', '¡Bienvenido!', `Hola ${respuesta.persona.nombre}, ingresando...`);
        
        // Redirección con pequeño delay para ver el toast
        setTimeout(() => {
          this.authService.redirigirPorRol(respuesta.tipoRol);
        }, 800);
      },
      error: (error) => {
        this.estaCargando = false;
        const msg = error.message || 'Credenciales incorrectas.';
        this.notificaciones.mostrar('error', 'Error de Acceso', msg);
      },
    });
  }

  recuperarAcceso(): void {
    //this.notificaciones.mostrar('info', 'Próximamente', 'El módulo de recuperación está en mantenimiento.');
    // Redirección con pequeño delay para ver el toast
    setTimeout(() => this.enrutador.navigate(['/auth/recover']), 900);
  }
}