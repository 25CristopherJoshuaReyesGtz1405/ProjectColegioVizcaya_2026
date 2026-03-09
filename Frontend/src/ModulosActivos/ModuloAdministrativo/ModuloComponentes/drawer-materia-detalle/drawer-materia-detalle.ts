import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

// FIREBASE (Para consultar directamente la colección 'planeaciones')
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';

// MODELOS Y SERVICIOS
import { Materia, Planeacion } from '../../../../ModelosActivos/ModelosAplicacion.model';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service';
import { GruposService } from '../../../../ServiciosActivos/grupos.service';

@Component({
  selector: 'app-drawer-materia-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawer-materia-detalle.html',
  styleUrl: './drawer-materia-detalle.scss'
})
export class DrawerMateriaDetalle implements OnInit, OnChanges {
  
  @Input() materia: Materia | null = null;
  @Input() isOpen: boolean = false;
  
  @Output() close = new EventEmitter<void>();

  private notificaciones = inject(NotificacionesService);
  private gruposService = inject(GruposService);
  private firestore = inject(Firestore); // <--- Inyectamos Firebase directo

  // --- VARIABLES DE ESTADO ---
  public estaCargando: boolean = false;
  public docentesVinculados: any[] = [];
  
  // KPIs de la materia
  public totalAulas: number = 0;
  public totalMaestros: number = 0;
  public planeacionesEntregadas: number = 0;
  public indiceAprobacion: number = 0;

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['materia'] && this.materia && this.isOpen) {
      this.cargarExpedienteMateria();
    }
  }

  async cargarExpedienteMateria() {
    if (!this.materia) return;
    this.estaCargando = true;
    
    try {
      // 1. Descargamos todos los grupos y filtramos los de ESTA materia
      const todosLosGrupos = await firstValueFrom(this.gruposService.getAllGrupos());
      const gruposDeLaMateria = todosLosGrupos.filter(g => g.materia?.id === this.materia!.id);
      
      this.totalAulas = gruposDeLaMateria.length;

      // 2. Agrupamos a los docentes (Si Juan da 3 grupos, solo sale 1 vez con sus 3 grupos listados)
      const mapaDocentes = new Map<string, any>();
      
      gruposDeLaMateria.forEach(grupo => {
        if (grupo.empleadoUid && grupo.empleadoUid !== 'null' && grupo.docente) {
          const uid = grupo.empleadoUid;
          const gradoLetra = `${grupo.materia?.grado}°`;

          if (!mapaDocentes.has(uid)) {
            mapaDocentes.set(uid, {
              docenteUid: uid,
              nombre: grupo.docente.persona.nombre,
              apellidos: grupo.docente.persona.apellidos,
              fotoUrl: grupo.docente.persona.fotoUrl,
              gruposArr: [gradoLetra]
            });
          } else {
            mapaDocentes.get(uid).gruposArr.push(gradoLetra);
          }
        }
      });

      // 3. Consultamos la colección 'planeaciones' en Firebase para esta materia
      const planeacionesRef = collection(this.firestore, 'planeaciones');
      const q = query(planeacionesRef, where('materiaId', '==', this.materia.id));
      const querySnapshot = await getDocs(q);
      
      const planeacionesDB: Planeacion[] = [];
      querySnapshot.forEach((doc) => {
        planeacionesDB.push({ id: doc.id, ...doc.data() } as Planeacion);
      });

      // 4. Cruzamos los datos: Verificamos qué maestro ya tiene planeación
      let entregadasCount = 0;
      this.docentesVinculados = Array.from(mapaDocentes.values()).map(doc => {
        
        // Buscamos si hay un documento en la BD de este maestro
        const planeacion = planeacionesDB.find(p => p.docenteUid === doc.docenteUid);
        const tienePlan = planeacion && planeacion.estatus !== 'PENDIENTE';

        if (tienePlan) entregadasCount++;

        // Formateamos la fecha si existe
        let fechaFormateada = null;
        if (planeacion?.fechaEntrega) {
          // Manejo por si viene como Timestamp de Firestore o Date string
          const fechaObj = (planeacion.fechaEntrega as any).toDate ? (planeacion.fechaEntrega as any).toDate() : new Date(planeacion.fechaEntrega);
          fechaFormateada = fechaObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        return {
          ...doc,
          gruposAsignadosTexto: doc.gruposArr.join(', '), // Ej: "1° A, 1° B"
          tienePlaneacion: tienePlan,
          datosPlaneacion: planeacion || null,
          fechaEntrega: fechaFormateada
        };
      });

      // 5. Asignamos KPIs Finales
      this.totalMaestros = this.docentesVinculados.length;
      this.planeacionesEntregadas = entregadasCount;
      this.indiceAprobacion = this.totalAulas > 0 ? Math.floor(Math.random() * (95 - 75 + 1)) + 75 : 0; // Mock de aprobación

      this.estaCargando = false;

    } catch (error) {
      console.error("Error al auditar expediente:", error);
      this.estaCargando = false;
      this.notificaciones.mostrar('error', 'Error de BD', 'No se pudo cargar el expediente de planeaciones.');
    }
  }

  descargarPlaneacion(docente: any) {
    if (!docente.datosPlaneacion || !docente.datosPlaneacion.enlaceGoogle) {
      this.notificaciones.mostrar('info', 'Sin Enlace', 'El documento no contiene un enlace de Google Drive válido.');
      return;
    }
    
    this.notificaciones.mostrar('info', 'Abriendo Drive...', `Obteniendo el temario del Prof. ${docente.apellidos}`);
    window.open(docente.datosPlaneacion.enlaceGoogle, '_blank');
  }

  solicitarPlaneacion(docente: any) {
    this.notificaciones.confirmar(
      'Notificar Docente',
      `¿Enviar un aviso oficial a ${docente.nombre} para que suba su planeación en plataforma?`,
      () => {
        this.notificaciones.mostrar('exito', 'Notificación Enviada', 'El docente visualizará la alerta en su inicio.');
      },
      'Enviar Recordatorio'
    );
  }

  cerrar() {
    this.close.emit();
  }
}