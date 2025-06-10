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
  showTutorial = false;
  tutorialBg = '';
  tutorialImages = [
    'assets/arena_infinita_donde_variables_sin_referencia_desaparecen.jpeg',
    'assets/coche_rpg_manejando_tiene_que_ser_como.jpeg',
    'assets/ide_viviente_con_rboles_que_susurran_en.jpeg',
    'assets/mundo_antiguo_de_lexaria_un_reino_olvidado.jpeg',
    'assets/ruinas_flotantes_con_scripts_en_desuso_y.jpeg',
    'assets/compilando_proyecto_final_de_programacion_in_the.jpeg',
  ];

  constructor(private router: Router) {}

  openTutorial() {
    // Selecciona una imagen aleatoria de los assets
    const idx = Math.floor(Math.random() * this.tutorialImages.length);
    this.tutorialBg = this.tutorialImages[5];
    this.showTutorial = true;
    this.showDifficultyMenu = false;
  }

  selectDifficulty(difficulty: string) {
    localStorage.setItem('dificultad', difficulty);
    this.openTutorial();
    // El usuario debe pulsar "Continuar" para navegar, no navegamos aquí
  }

  closeCinematicAndShowDifficulty() {
    this.showTutorial = false;
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
