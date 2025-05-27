import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [RouterLink, CommonModule],
})
export class MenuComponent {
  showDifficultyMenu = false;

  constructor(private router: Router) {}

  selectDifficulty(difficulty: string) {
    // Puedes guardar la dificultad en localStorage, un servicio, o pasarla como query param
    localStorage.setItem('dificultad', difficulty);
    this.router.navigate(['/game']);
  }

  onPlay() {
    console.log('¡A jugar se ha dicho!');
    // Aquí puedes redirigir a la página de juego o iniciar el juego
  }

  onScore() {
    console.log('Mostrando puntajes...');
    // Aquí puedes redirigir a la página de puntajes
  }
}
