import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-panel-lateral-docente',
  imports: [RouterLink, ],
  templateUrl: './panel-lateral-docente.html',
  styleUrl: './panel-lateral-docente.scss',
})
export class PanelLateralDocente {
estaColapsado: boolean = false;
  alternarSidebar(): void {
    this.estaColapsado = !this.estaColapsado;
  }
}
