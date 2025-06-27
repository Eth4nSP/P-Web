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

  defaultPuzzles: Puzzle[] = [];
  customPuzzles: Puzzle[] = [];
  showDefaultPuzzles = false;
  showCustomPuzzles = false;

  showDifficultySelection = true; 

  tutorialImages = [
    'assets/arena_infinita_donde_variables_sin_referencia_desaparecen.jpeg',
    'assets/coche_rpg_manejando_tiene_que_ser_como.jpeg',
    'assets/ide_viviente_con_rboles_que_susurran_en.jpeg',
    'assets/mundo_antiguo_de_lexaria_un_reino_olvidado.jpeg',
    'assets/ruinas_flotantes_con_scripts_en_desuso_y.jpeg',
    'assets/compilando_proyecto_final_de_programacion_in_the.jpeg',
  ];

  systemDifficulties = [
    { id: 'facil', name: 'Fácil', icon: '🟢', description: 'Perfecto para empezar' },
    { id: 'medio', name: 'Medio', icon: '🟡', description: 'Un desafío moderado' },
    { id: 'dificil', name: 'Difícil', icon: '🔴', description: 'Para expertos' }
  ];

  constructor(
    private questionService: QuestionService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.puzzles$ = this.questionService.getPuzzles();
    
    this.questionService.getPuzzles().subscribe(puzzles => {
      this.defaultPuzzles = puzzles.filter(p => !p.isCustom);
      this.customPuzzles = puzzles.filter(p => p.isCustom);
    });
  }

  openTutorial(puzzleId?: string) {
    const idx = Math.floor(Math.random() * this.tutorialImages.length);
    this.tutorialBg = this.tutorialImages[idx];
    this.showTutorial = true;
    this.showPuzzleMenu = false;
    
    if (puzzleId) {
      this.questionService.loadGameConfig(puzzleId);
    }
  }

  selectCustomPuzzle(puzzleId: string) {
    console.log('Seleccionando puzzle personalizado:', puzzleId);
    this.questionService.loadGameConfig(puzzleId);
    this.showPuzzleMenu = false;
    this.openTutorial(puzzleId);
  }

  selectDefaultPuzzle(puzzleId: string) {
    console.log('Seleccionando puzzle predefinido:', puzzleId);
    this.questionService.loadGameConfig(puzzleId);
    this.openTutorial(puzzleId);
  }

  selectSystemDifficulty(difficulty: string) {
    console.log('Seleccionando dificultad del sistema:', difficulty);
    this.questionService.loadSystemGameConfig(difficulty);
    this.showPuzzleMenu = false;
    this.openTutorial();
  }

  closeCinematicAndShowDifficulty() {
    this.showTutorial = false;
    this.router.navigate(['/game']);
  }

  scoreboard() {
    this.router.navigate(['/puntaje']);
  }

  onPlay() {
    this.showPuzzleMenu = true;
    this.showCustomPuzzles = false;
    this.showDefaultPuzzles = false;
    this.showDifficultySelection = true; 
  }

  onScore() {
    this.router.navigate(['/puntaje']);
  }

  onAdmin() {
    this.router.navigate(['/admin-panel']);
  }

  closePuzzleMenu() {
    this.showPuzzleMenu = false;
    this.showDifficultySelection = false;
  }

  showSystemLevels() {
    this.showCustomPuzzles = false;
    this.showDefaultPuzzles = false;
    this.showDifficultySelection = true;
  }

  showSystemPuzzles() {
    this.showDefaultPuzzles = true;
    this.showCustomPuzzles = false;
    this.showDifficultySelection = false;
  }

  showCustomCreatedPuzzles() {
    this.showCustomPuzzles = true;
    this.showDefaultPuzzles = false;
    this.showDifficultySelection = false;
  }

  goToCreateCustomPuzzle() {
    this.showPuzzleMenu = false;
    this.router.navigate(['/admin'], { queryParams: { mode: 'create-puzzle' } });
  }

  getDifficultyIcon(difficulty: 'facil' | 'medio' | 'dificil'): string {
    const icons = {
      facil: '🟢',
      medio: '🟡',
      dificil: '🔴'
    };
    return icons[difficulty];
  }

  getDifficultyLabel(difficulty: 'facil' | 'medio' | 'dificil'): string {
    const labels = {
      facil: 'Fácil',
      medio: 'Medio',
      dificil: 'Difícil'
    };
    return labels[difficulty];
  }

  getPuzzleSize(puzzle: Puzzle): string {
    return `${puzzle.rows}x${puzzle.cols}`;
  }

  getQuestionCount(puzzle: Puzzle): number {
    return puzzle.questions.length;
  }

  getPuzzleTypeLabel(puzzle: Puzzle): string {
    return puzzle.isCustom ? 'Personalizado' : 'Nivel del Sistema';
  }
}