import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PanelSuperior } from '../../ModuloComponentes/panel-superior-admin/panel-superior';
import { PanelLateral } from '../../ModuloComponentes/panel-lateral-admin/panel-lateral';


@Component({
  selector: 'app-dashboard',
  standalone: true, 
  imports: [RouterOutlet, PanelLateral, PanelSuperior, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})

export class Dashboard 
{
}