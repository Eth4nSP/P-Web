import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { QuestionService, Puzzle } from '../../services/question.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class MenuComponent implements OnInit {
  showPuzzleMenu = false;
  showTutorial = false;
  tutorialBg = '';
  puzzles$!: Observable<Puzzle[]>;
  
  // Nuevas propiedades para manejar diferentes tipos de puzzles
  defaultPuzzles: Puzzle[] = [];
  customPuzzles: Puzzle[] = [];
  showDefaultPuzzles = true;
  showCustomPuzzles = false;

  tutorialImages = [
    'assets/arena_infinita_donde_variables_sin_referencia_desaparecen.jpeg',
    'assets/coche_rpg_manejando_tiene_que_ser_como.jpeg',
    'assets/ide_viviente_con_rboles_que_susurran_en.jpeg',
    'assets/mundo_antiguo_de_lexaria_un_reino_olvidado.jpeg',
    'assets/ruinas_flotantes_con_scripts_en_desuso_y.jpeg',
    'assets/compilando_proyecto_final_de_programacion_in_the.jpeg',
  ];

  constructor(
    private questionService: QuestionService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.puzzles$ = this.questionService.getPuzzles();
    
    // Suscribirse a los cambios en los puzzles para separar por tipo
    this.questionService.getPuzzles().subscribe(puzzles => {
      this.defaultPuzzles = puzzles.filter(p => !p.isCustom);
      this.customPuzzles = puzzles.filter(p => p.isCustom);
    });
  }

  openTutorial(puzzleId?: string) {
    // Selecciona una imagen aleatoria de los assets
    const idx = Math.floor(Math.random() * this.tutorialImages.length);
    this.tutorialBg = this.tutorialImages[idx];
    this.showTutorial = true;
    this.showPuzzleMenu = false;

    // Si se seleccionó un puzzle, guardamos su ID para usarlo después
    if (puzzleId) {
      this.questionService.loadGameConfig(puzzleId);
    }
  }

  selectPuzzle(puzzleId: string) {
    // El servicio se encarga de guardar la configuración
    this.questionService.loadGameConfig(puzzleId);
    this.openTutorial(puzzleId);
  }

  closeCinematicAndShowDifficulty() {
    this.showTutorial = false;
    this.router.navigate(['/board']);
  }

  scoreboard() {
    this.router.navigate(['/puntaje']);
  }

  onPlay() {
    this.showPuzzleMenu = true;
    // Por defecto mostrar niveles del sistema
    this.showDefaultPuzzles = true;
    this.showCustomPuzzles = false;
  }

  onScore() {
    this.router.navigate(['/puntaje']);
  }

  onAdmin() {
    this.router.navigate(['/admin-panel']);
  }

  // Método para cerrar el menú de puzzles
  closePuzzleMenu() {
    this.showPuzzleMenu = false;
  }

  // Métodos para cambiar entre vistas de puzzles
  showSystemLevels() {
    this.showDefaultPuzzles = true;
    this.showCustomPuzzles = false;
  }

  showCustomCreatedPuzzles() {
    this.showDefaultPuzzles = false;
    this.showCustomPuzzles = true;
  }

  // Método para ir al admin para crear puzzle personalizado
  goToCreateCustomPuzzle() {
    this.showPuzzleMenu = false;
    this.router.navigate(['/admin'], { queryParams: { mode: 'create-puzzle' } });
  }

  // Método para obtener el icono de dificultad
  getDifficultyIcon(difficulty: 'facil' | 'medio' | 'dificil'): string {
    const icons = {
      facil: '🟢',
      medio: '🟡',
      dificil: '🔴'
    };
    return icons[difficulty];
  }

  // Método para obtener el label de dificultad
  getDifficultyLabel(difficulty: 'facil' | 'medio' | 'dificil'): string {
    const labels = {
      facil: 'Fácil',
      medio: 'Medio',
      dificil: 'Difícil'
    };
    return labels[difficulty];
  }

  // Método para obtener el tamaño del puzzle como string
  getPuzzleSize(puzzle: Puzzle): string {
    return `${puzzle.rows}x${puzzle.cols}`;
  }

  // Método para obtener la cantidad de preguntas
  getQuestionCount(puzzle: Puzzle): number {
    return puzzle.questions.length;
  }

  // Método para obtener información adicional del puzzle
  getPuzzleTypeLabel(puzzle: Puzzle): string {
    return puzzle.isCustom ? 'Personalizado' : 'Nivel del Sistema';
  }
}