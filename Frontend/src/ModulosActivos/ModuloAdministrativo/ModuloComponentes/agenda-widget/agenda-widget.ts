import { Component, Input, inject } from '@angular/core'; // Importar inject
import { CommonModule, DatePipe } from '@angular/common';
import { AgendaActividad } from './../../../../ModelosActivos/ModelosAplicacion.model';
import { NotificacionesService } from '../../../../ServiciosActivos/notificaciones.service'; // Ajusta la ruta si es necesario
import { AdminService } from '../../../../ServiciosActivos/admin.service';

@Component({
  selector: 'app-agenda-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agenda-widget.html',
  styleUrls: ['./agenda-widget.scss'], 
  providers: [DatePipe]
})
export class AgendaWidget {
  
  @Input() actividades: AgendaActividad[] = [];
  adminService=inject(AdminService); 

  // Inyectamos el servicio de notificaciones compartido
  notificaciones = inject(NotificacionesService);

  getIcono(titulo: string): string {
    const t = titulo.toLowerCase();
    if (t.includes('mitin') || t.includes('discurso')) return 'bi-megaphone-fill text-red-600';
    if (t.includes('recorrido') || t.includes('visita')) return 'bi-geo-alt-fill text-green-600';
    if (t.includes('medios') || t.includes('entrevista')) return 'bi-mic-fill text-purple-600';
    return 'bi-calendar-event-fill text-blue-600';
  }

  // --- NUEVA LÓGICA ---

  confirmarCompletado(act: AgendaActividad) {
    // Llamamos al método 'confirmar' (o como se llame en tu servicio)
    // Basado en tu componente 'NotificacionesShared', el servicio alimenta 'modalState$'
    
    this.notificaciones.confirmar('Completar Actividad', `¿Ya realizaste la actividad "${act.titulo}"? Se eliminará de la lista de pendientes.`, () => {
        this.marcarYBorrar(act);
      });
  }

  private marcarYBorrar(act: AgendaActividad) {
    this.adminService.eliminarActividad(act.id).subscribe({
    next: (res) => {
      console.log('Actividad Elimnada:', res);
      this.actividades.pop();
      this.actividades.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
      this.notificaciones.mostrar('exito', 'Eliminado', 'Actividad eliminada correctamente');
    },
    error: (err) => {
      console.error('Error al eliminar:', err);
      this.notificaciones.mostrar('error', 'Error', 'No se pudo conectar con el servidor');
    }
  });
    // this.onStatusChange.emit(act);
  }
}