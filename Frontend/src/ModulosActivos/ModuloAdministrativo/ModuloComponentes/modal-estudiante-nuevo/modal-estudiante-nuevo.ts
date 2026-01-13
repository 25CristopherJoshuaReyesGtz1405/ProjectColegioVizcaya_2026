import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-estudiante-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-estudiante-nuevo.html',
  styleUrl: './modal-estudiante-nuevo.scss'
})
export class ModalEstudianteNuevo {

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<PerfilUsuarioDTO>(); // Cambié 'success' a 'save' para ser consistente con tu panel, o puedes usar success

  private estudiantesService = inject(EstudiantesService);
  private notificaciones = inject(NotificacionesService);

  // Modelos para el formulario
  nuevoEstudiante = {
    nombre: '',
    apellidos: '',
    curp: '',
    fechaNacimiento: '', 
    sexo: 'HOMBRE', 
    email: '',
    password: '',
    matricula: '',
    grado: 1,
    grupo: 'A'
  };

  guardando = false;

  guardar() {
    if (this.guardando) return;
    this.guardando = true;

    const payload = {
      email: this.nuevoEstudiante.email,
      password: this.nuevoEstudiante.password,
      tipoRol: 'ESTUDIANTE',
      datosPersona: {
        nombre: this.nuevoEstudiante.nombre,
        apellidos: this.nuevoEstudiante.apellidos,
        curp: this.nuevoEstudiante.curp,
        fechaNacimiento: new Date(this.nuevoEstudiante.fechaNacimiento),
        sexo: this.nuevoEstudiante.sexo,
        email: this.nuevoEstudiante.email,
        fotoUrl: ''
      },
      datosRol: {
        matricula: this.nuevoEstudiante.matricula,
        grado: this.nuevoEstudiante.grado,
        grupo: this.nuevoEstudiante.grupo,
        estatus: 'ACTIVO'
      }
    };

    this.estudiantesService.crearEstudiante(payload).subscribe({
      next: (res) => {
        this.guardando = false;
        // Mensaje más formal
        this.notificaciones.mostrar('exito', 'Alta Exitosa', 'El estudiante ha sido registrado en la base de datos.');
        this.save.emit(); 
        this.close.emit();   
      },
      error: (err) => {
        this.guardando = false;
        console.error(err);
        this.notificaciones.mostrar('error', 'Error de Registro', 'No se pudo completar la operación. Verifique que el correo o matrícula no existan.');
      }
    });
  }
}