import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PanelLateral } from '../../../ModuloAdministrativo/ModuloComponentes/panel-lateral-admin/panel-lateral';
import { PanelSuperior } from '../../../ModuloAdministrativo/ModuloComponentes/panel-superior-admin/panel-superior';
import { PanelSuperiorDocente } from "../../ModuloComponentes/panel-superior-docente/panel-superior-docente";
import { PanelLateralDocente } from "../../ModuloComponentes/panel-lateral-docente/panel-lateral-docente";

@Component({
  selector: 'app-dashboard-docente',
  imports: [RouterOutlet, PanelLateral, PanelSuperior, CommonModule, PanelSuperiorDocente, PanelLateralDocente],
  standalone: true, 
  templateUrl: './dashboard-docente.html',
  styleUrl: './dashboard-docente.scss',
})
export class DashboardDocente {

}
