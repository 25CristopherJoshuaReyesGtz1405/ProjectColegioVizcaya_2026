import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-docente-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-docente-nuevo.html',
  styleUrl: './modal-docente-nuevo.scss'
})
export class ModalDocenteNuevo {

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<PerfilUsuarioDTO>(); 

  private docentesService = inject(DocentesService);
  private notificaciones = inject(NotificacionesService);

  // Variables para la vista previa de la foto
  fotoPreview: string | ArrayBuffer | null = null;
  fotoArchivo: File | null = null;

  // Modelos para el formulario del Docente
  nuevoDocente = {
    nombre: '',
    apellidos: '',
    curp: '',
    sexo: 'MUJER', 
    email: '',
    password: '',
    rfc: '',
    cedula: '',
    especialidad: '',
    telefono: '',
    fechaIngreso: ''
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

    // Estructura adaptada a tu RolEmpleado
    const payload = {
      email: this.nuevoDocente.email,
      password: this.nuevoDocente.password,
      tipoRol: 'DOCENTE',
      datosPersona: {
        nombre: this.nuevoDocente.nombre,
        apellidos: this.nuevoDocente.apellidos,
        curp: this.nuevoDocente.curp,
        sexo: this.nuevoDocente.sexo,
        email: this.nuevoDocente.email,
        fotoUrl: '' // Se actualizará si decides subir 'this.fotoArchivo' a Storage
      },
      datosRol: {
        RFC: this.nuevoDocente.rfc,
        cedulaProfesional: this.nuevoDocente.cedula,
        especialidad: this.nuevoDocente.especialidad,
        telefono: this.nuevoDocente.telefono,
        fechaIngreso: this.nuevoDocente.fechaIngreso ? new Date(this.nuevoDocente.fechaIngreso) : new Date(),
        rol: 'docente',
        estatus: 'ACTIVO'
      }
    };

    // Asumimos que tu DocentesService tiene el método crearDocente
    this.docentesService.crearDocente(payload).subscribe({
      next: (res) => {
        this.guardando = false;
        this.notificaciones.mostrar('exito', 'Alta Exitosa', 'El docente ha sido registrado en la plataforma.');
        this.save.emit(); 
        this.close.emit();   
      },
      error: (err) => {
        this.guardando = false;
        console.error(err);
        this.notificaciones.mostrar('error', 'Error de Registro', 'No se pudo completar la operación. Verifique el correo o RFC.');
      }
    });
  }
}