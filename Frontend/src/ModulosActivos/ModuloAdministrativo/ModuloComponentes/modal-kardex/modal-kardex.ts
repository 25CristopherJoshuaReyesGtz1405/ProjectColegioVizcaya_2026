import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations'; // <--- IMPORTS DE ANIMACIÓN
import { EstudiantesService } from '../../../../ServiciosActivos/estudiantes.service';
import { KardexDTO, PerfilUsuarioDTO } from '../../../../ModelosActivos/ModelosAplicacion.model';

@Component({
  selector: 'app-modal-kardex',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-kardex.html',
  styleUrl: './modal-kardex.scss',
  // --- DEFINICIÓN DE ANIMACIONES ---
  animations: [
    // Animación de entrada del modal
    trigger('modalEntrance', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px) scale(0.98)' }),
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ]),
    // Animación en cascada para la lista de ciclos
    trigger('listAnimation', [
      transition('* => *', [ // Se activa cuando cambian los datos
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger('100ms', [ // Retraso de 100ms entre cada elemento
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    // Animación suave del acordeón
    trigger('smoothCollapse', [
      state('void', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('*', style({ height: '*', opacity: 1, overflow: 'hidden' })), // Altura automática
      transition('void <=> *', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class ModalKardex implements OnInit {

  @Input() estudiante!: PerfilUsuarioDTO;
  @Output() close = new EventEmitter<void>();

  private estudiantesService = inject(EstudiantesService);
  
  public kardexData: KardexDTO | null = null;
  public loading = true;
  public cicloExpandido: number = 0;
  
  // Variable para la animación del número
  public promedioAnimado: number = 0;

  ngOnInit() {
    this.cargarKardex();
  }

  cargarKardex() {
    this.loading = true;
    this.estudiantesService.getKardex(this.estudiante.persona.uid).subscribe({
      next: (data) => {
        this.kardexData = data;
        this.loading = false;
        // Iniciar animación del contador una vez cargados los datos
        this.animarPromedio(data.promedioGlobal);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  // Función para animar el conteo de números (ej. 0.0 -> 9.5)
  animarPromedio(target: number) {
    let current = 0;
    const increment = target / 30; // Dividimos en 30 pasos para velocidad
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.promedioAnimado = target;
        clearInterval(timer);
      } else {
        this.promedioAnimado = current;
      }
    }, 20); // Actualiza cada 20ms
  }

  toggleCiclo(index: number) {
    this.cicloExpandido = this.cicloExpandido === index ? -1 : index;
  }

  getPromedioColorClass(promedio: number): string {
    if (promedio >= 9.5) return 'grade-excellent';
    if (promedio >= 8) return 'grade-good';
    if (promedio >= 6) return 'grade-regular';
    return 'grade-bad';
  }
}