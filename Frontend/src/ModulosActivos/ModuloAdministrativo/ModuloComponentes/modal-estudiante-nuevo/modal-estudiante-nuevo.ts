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
  @Output() save = new EventEmitter<PerfilUsuarioDTO>(); 

  private estudiantesService = inject(EstudiantesService);
  private notificaciones = inject(NotificacionesService);

  // Variables para la vista previa de la foto
  fotoPreview: string | ArrayBuffer | null = null;
  fotoArchivo: File | null = null;

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

  cerrarModal() {
    this.close.emit();
  } 

  // Genera el recorte circular visual de la foto antes de guardar
  onFotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fotoArchivo = file;
      const reader = new FileReader();
      reader.onload = e => this.fotoPreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

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
        fotoUrl: '' // Se actualizará si decides subir 'this.fotoArchivo' a Storage posteriormente
      },
      datosRol: {
        matricula: this.nuevoEstudiante.matricula,
        grado: Number(this.nuevoEstudiante.grado),
        grupo: this.nuevoEstudiante.grupo,
        estatus: 'ACTIVO'
      }
    };

    this.estudiantesService.crearEstudiante(payload).subscribe({
      next: (res) => {
        this.guardando = false;
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