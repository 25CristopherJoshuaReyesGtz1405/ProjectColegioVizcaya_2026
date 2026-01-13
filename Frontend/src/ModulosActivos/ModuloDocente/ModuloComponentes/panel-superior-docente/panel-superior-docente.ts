import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CampoEntradaShared } from '../../../../ComponentesActivos/campo-entrada-shared/campo-entrada-shared';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Observable, of, Subject, switchMap } from 'rxjs';
import { PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { AuthService } from '../../../../ServiciosActivos/auth.service';
import { TemaOscuro } from '../../../../ServiciosActivos/tema-oscuro';
import { DocentesService } from '../../../../ServiciosActivos/docentes.service';
import { ModalDocenteDetalle } from '../modal-docente-detalle/modal-docente-detalle';
import { ModalExpedienteDocente } from '../modal-expediente-docente/modal-expediente-docente';

@Component({
  selector: 'app-panel-superior-docente',
  imports: [CommonModule, ReactiveFormsModule, CampoEntradaShared, FormsModule, RouterLink, ModalDocenteDetalle,ModalExpedienteDocente],
  templateUrl: './panel-superior-docente.html',
  styleUrl: './panel-superior-docente.scss',
})
export class PanelSuperiorDocente {
nombreUsuario: string = 'Usuario';
  fotoUrl: string | null = 'https://cdn-icons-png.flaticon.com/512/9684/9684441.png'; // Placeholder
  
  isProfileMenuOpen = false;
  isDarkMode = false;

  // Creamos un Observable para los datos del usuario
  usuario$: Observable<PerfilUsuarioDTO | null>;

  terminoBusqueda = '';
  resultados$!: Observable<any>;
  mostrarResultados = false;
  private searchTerms = new Subject<string>();

  private docentesService = inject(DocentesService);

  mostrarDetalleBusqueda = false;
  itemSeleccionado: any = null;
  tipoSeleccionado: 'GRUPO' | 'ESTUDIANTE' | null = null;
  mostrarModalExpediente: boolean = false;

  abrirExpediente() {
    this.mostrarModalExpediente = true;
  }

  // Acción al dar clic en un resultado de búsqueda
  abrirResultado(item: any, tipo: 'GRUPO' | 'ESTUDIANTE') {
    this.terminoBusqueda = ''; 
    this.itemSeleccionado = item;
    this.tipoSeleccionado = tipo;
    this.mostrarDetalleBusqueda = true;
    this.mostrarResultados = false; // Cerrar dropdown de búsqueda
  }

  constructor(
    public themeService: TemaOscuro, // Inyecta el servicio de tema
    private authService: AuthService,
    private router: Router
  ) {
        this.usuario$ = this.authService.getUsuario(); 

  }

  ngOnInit(): void {
    this.isDarkMode = this.themeService.getCurrentTheme() === 'dark';
    // Configurar el buscador reactivo
    this.resultados$ = this.searchTerms.pipe(
      debounceTime(300), // Espera 300ms después de escribir
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (!term.trim()) return of({ grupos: [], estudiantes: [] });
        return this.docentesService.buscarGlobal(term);
      })
    );
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = !this.isDarkMode;
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  async logout(): Promise<void> {
    try {
      //await this.authService.();
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  // Se llama desde el HTML (input event)
  buscar(termino: string): void {
    this.mostrarResultados = true;
    this.searchTerms.next(termino);
  }

  cerrarBusqueda() {
    // Pequeño delay para permitir clic en los resultados
    setTimeout(() => this.mostrarResultados = false, 200);
  }

  // Acciones al dar clic en un resultado
  irAGrupo(id: string) {
    this.router.navigate(['/docente/grupos', id]); // Ajusta a tu ruta real
  }

  irAEstudiante(id: string) {
    // Podrías abrir un modal o navegar al perfil
    console.log("Ver estudiante", id);
  }
}

