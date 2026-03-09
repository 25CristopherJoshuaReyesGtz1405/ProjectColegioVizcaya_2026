import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.html',
  styleUrls: ['./splash-screen.scss']
})
export class SplashScreen implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Simula el tiempo de carga y redirige al login
    setTimeout(() => {
      this.router.navigate(['/home/start']);
    }, 7000);
  }
}