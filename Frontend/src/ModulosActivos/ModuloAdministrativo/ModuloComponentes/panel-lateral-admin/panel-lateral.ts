import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-panel-lateral',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './panel-lateral.html',
  styleUrl: './panel-lateral.scss',
})
export class PanelLateral {
estaColapsado: boolean = false;
  alternarSidebar(): void {
    this.estaColapsado = !this.estaColapsado;
  }
}
