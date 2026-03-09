import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModalAccesoPadres } from './../../ModuloComponentes/modal-acceso-padres/modal-acceso-padres';

interface NoticiaItem {
  id: number;
  titulo: string;
  resumen: string;
  fecha: string;
  imagen: string;
  categoria: 'Académico' | 'Deportes' | 'Cultural';
  likes: number;
  liked: boolean;
}

@Component({
  selector: 'app-inicio-principal',
  standalone: true,
  imports: [CommonModule, ModalAccesoPadres],
  templateUrl: './inicio-principal.html',
  styleUrls: ['./inicio-principal.scss']
})
export class InicioPrincipal {

  showModalPadres = false;

  // Datos Simulados (Mock) para la vista previa
  noticias: NoticiaItem[] = [
    {
      id: 1,
      titulo: 'Alumnos destacan en Olimpiada Nacional de Matemáticas',
      resumen: 'Nuestra delegación obtuvo 3 medallas de oro y 2 de plata en la reciente competencia celebrada en CDMX.',
      fecha: '10 Oct 2025',
      imagen: 'https://img.freepik.com/foto-gratis/estudiantes-biblioteca-estudiando-juntos_23-2147678949.jpg',
      categoria: 'Académico',
      likes: 124,
      liked: false
    },
    {
      id: 2,
      titulo: 'Inauguración del Nuevo Laboratorio de Robótica e IA',
      resumen: 'Espacios vanguardistas equipados con la última tecnología para el desarrollo de competencias STEM.',
      fecha: '05 Oct 2025',
      imagen: 'https://img.freepik.com/foto-gratis/adolescente-robot-programable-manos_1098-18367.jpg',
      categoria: 'Académico',
      likes: 89,
      liked: false
    },
    {
      id: 3,
      titulo: 'Campeones Estatales de Baloncesto Varonil',
      resumen: 'El equipo representativo "Águilas Vizcaya" se coronó invicto en el torneo estatal intercolegial.',
      fecha: '28 Sep 2025',
      imagen: 'https://img.freepik.com/foto-gratis/grupo-hombres-jugando-baloncesto_23-2148130939.jpg',
      categoria: 'Deportes',
      likes: 210,
      liked: false
    }
  ];

  constructor(private router: Router) {}

  irAlLogin() {
    this.router.navigate(['/auth/login']);
  }

  abrirModalPadres() {
    this.showModalPadres = true;
  }

  cerrarModalPadres() {
    this.showModalPadres = false;
  }

  darLike(post: NoticiaItem) {
    if (post.liked) {
      post.likes--;
      post.liked = false;
    } else {
      post.likes++;
      post.liked = true;
    }
  }

  getBadgeClass(categoria: string): string {
    switch (categoria) {
      case 'Académico': return 'badge-academic';
      case 'Deportes': return 'badge-sports';
      case 'Cultural': return 'badge-cultural';
      default: return '';
    }
  }
}