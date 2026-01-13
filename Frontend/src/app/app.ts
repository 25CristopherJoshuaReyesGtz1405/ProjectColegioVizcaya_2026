import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { NotificacionesShared } from '../ComponentesActivos/notificaciones-shared/notificaciones-shared';

@Component({
  selector: 'app-root',
  standalone:true, 
  imports: [RouterOutlet, CommonModule, ReactiveFormsModule, FormsModule, NotificacionesShared],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Colegio Vizcaya - Site Learing');
}
