import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { QuestionService, Question, Puzzle } from '../services/question.service';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class AdminPanelComponent implements OnInit {
  // Control de vistas
  activeView: 'puzzles' | 'traditional' = 'puzzles';
  
  // Observables
  puzzles$!: Observable<Puzzle[]>;
  questions$!: Observable<{facil: Question[], medio: Question[], dificil: Question[]}>;
  
  // Variables para puzzles
  isCreatingPuzzle = false;
  editingPuzzle: Puzzle | null = null;
  newPuzzleName = '';
  newPuzzleDifficulty: 'facil' | 'medio' | 'dificil' = 'facil';
  newPuzzleRows = 5;
  newPuzzleCols = 5;
  
  // Variables para preguntas de puzzles
  puzzleQuestion = '';
  puzzleAnswer = '';
  
  // Variables para preguntas tradicionales
  selectedDifficulty: 'facil' | 'medio' | 'dificil' = 'facil';
  newQuestion = '';
  newAnswer = '';
  
  // Variables para edición de preguntas tradicionales
  editingId: string | null = null;
  editQuestion = '';
  editAnswer = '';
  
  // Control de tabs y confirmaciones
  activeTab: 'facil' | 'medio' | 'dificil' = 'facil';
  showDeleteConfirm = false;
  questionToDelete: Question | null = null;
  
  // Datos de dificultades
  difficulties = [
    { key: 'facil' as const, label: 'Fácil', icon: '🟢' },
    { key: 'medio' as const, label: 'Medio', icon: '🟡' },
    { key: 'dificil' as const, label: 'Difícil', icon: '🔴' }
  ];

  constructor(private questionService: QuestionService) {}

  ngOnInit(): void {
    this.puzzles$ = this.questionService.getPuzzles();
    this.questions$ = this.questionService.getQuestions();
    this.onDifficultyChange(); // Establecer tamaños iniciales
  }

  // MÉTODOS DE CONTROL DE VISTAS
  switchView(view: 'puzzles' | 'traditional'): void {
    this.activeView = view;
    this.resetAllForms();
  }

  private resetAllForms(): void {
    // Reset puzzle forms
    this.isCreatingPuzzle = false;
    this.editingPuzzle = null;
    this.newPuzzleName = '';
    this.newPuzzleDifficulty = 'facil';
    this.newPuzzleRows = 5;
    this.newPuzzleCols = 5;
    this.puzzleQuestion = '';
    this.puzzleAnswer = '';
    
    // Reset traditional forms
    this.newQuestion = '';
    this.newAnswer = '';
    this.editingId = null;
    this.editQuestion = '';
    this.editAnswer = '';
    this.showDeleteConfirm = false;
    this.questionToDelete = null;
  }

  // MÉTODOS PARA GESTIÓN DE PUZZLES
  startCreatingPuzzle(): void {
    this.isCreatingPuzzle = true;
    this.editingPuzzle = null;
    this.newPuzzleName = '';
    this.newPuzzleDifficulty = 'facil';
    this.newPuzzleRows = 5;
    this.newPuzzleCols = 5;
  }

  cancelCreatingPuzzle(): void {
    this.isCreatingPuzzle = false;
    this.editingPuzzle = null;
    this.resetPuzzleForm();
  }

  private resetPuzzleForm(): void {
    this.newPuzzleName = '';
    this.newPuzzleDifficulty = 'facil';
    this.newPuzzleRows = 5;
    this.newPuzzleCols = 5;
    this.puzzleQuestion = '';
    this.puzzleAnswer = '';
  }

  createPuzzle(): void {
    if (!this.canCreatePuzzle()) return;

    if (this.isCreatingPuzzle) {
      // Crear nuevo puzzle
      const result = this.questionService.addCustomPuzzle(
        this.newPuzzleName,
        this.newPuzzleDifficulty,
        this.newPuzzleRows,
        this.newPuzzleCols
      );

      if (result.success && result.id) {
        // Cargar el puzzle recién creado para editarlo
        const newPuzzle = this.questionService.getPuzzleById(result.id);
        if (newPuzzle) {
          this.editingPuzzle = newPuzzle;
          this.isCreatingPuzzle = false;
        }
      } else {
        alert('Error al crear el puzzle: ' + (result.error || 'Error desconocido'));
      }
    } else if (this.editingPuzzle) {
      // Actualizar puzzle existente
      const result = this.questionService.editPuzzle(
        this.editingPuzzle.id,
        this.newPuzzleName,
        this.newPuzzleDifficulty,
        this.newPuzzleRows,
        this.newPuzzleCols
      );

      if (result.success) {
        // Actualizar la referencia del puzzle editado
        const updatedPuzzle = this.questionService.getPuzzleById(this.editingPuzzle.id);
        if (updatedPuzzle) {
          this.editingPuzzle = updatedPuzzle;
        }
      } else {
        alert('Error al actualizar el puzzle: ' + (result.error || 'Error desconocido'));
      }
    }
  }

  canCreatePuzzle(): boolean {
    if (!this.newPuzzleName.trim()) return false;
    
    const validation = this.questionService.validatePuzzleSize(
      this.newPuzzleDifficulty,
      this.newPuzzleRows,
      this.newPuzzleCols
    );
    
    return validation.isValid;
  }

  startEditPuzzle(puzzle: Puzzle): void {
    this.editingPuzzle = puzzle;
    this.isCreatingPuzzle = false;
    this.newPuzzleName = puzzle.name;
    this.newPuzzleDifficulty = puzzle.difficulty;
    this.newPuzzleRows = puzzle.rows;
    this.newPuzzleCols = puzzle.cols;
  }

  stopEditingPuzzle(): void {
    this.editingPuzzle = null;
    this.resetPuzzleForm();
  }

  deletePuzzle(puzzleId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este puzzle?')) {
      this.questionService.deletePuzzle(puzzleId);
      if (this.editingPuzzle?.id === puzzleId) {
        this.editingPuzzle = null;
        this.resetPuzzleForm();
      }
    }
  }

  // MÉTODOS PARA PREGUNTAS DE PUZZLES
  addQuestionToSelectedPuzzle(): void {
    if (!this.editingPuzzle || !this.canAddQuestionToPuzzle()) return;

    this.questionService.addQuestionToPuzzle(
      this.editingPuzzle.id,
      this.puzzleQuestion,
      this.puzzleAnswer
    );

    // Actualizar la referencia del puzzle
    const updatedPuzzle = this.questionService.getPuzzleById(this.editingPuzzle.id);
    if (updatedPuzzle) {
      this.editingPuzzle = updatedPuzzle;
    }

    this.clearPuzzleQuestionForm();
  }

  canAddQuestionToPuzzle(): boolean {
    if (!this.editingPuzzle) return false;
    if (!this.puzzleQuestion.trim() || !this.puzzleAnswer.trim()) return false;
    
    const maxLength = this.getMaxAnswerLength();
    return this.puzzleAnswer.trim().length <= maxLength;
  }

  deleteQuestionFromPuzzle(questionId: string): void {
    if (!this.editingPuzzle) return;

    if (confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      this.questionService.deleteQuestionFromPuzzle(this.editingPuzzle.id, questionId);
      
      // Actualizar la referencia del puzzle
      const updatedPuzzle = this.questionService.getPuzzleById(this.editingPuzzle.id);
      if (updatedPuzzle) {
        this.editingPuzzle = updatedPuzzle;
      }
    }
  }

  clearPuzzleQuestionForm(): void {
    this.puzzleQuestion = '';
    this.puzzleAnswer = '';
  }

  getMaxAnswerLength(): number {
    if (!this.editingPuzzle) return 10;
    return Math.min(this.editingPuzzle.rows, this.editingPuzzle.cols);
  }

  // MÉTODOS PARA PREGUNTAS TRADICIONALES
  addQuestion(): void {
    if (!this.canAddQuestion()) return;

    this.questionService.addQuestion(
      this.newQuestion,
      this.newAnswer,
      this.selectedDifficulty
    );

    this.clearForm();
  }

  canAddQuestion(): boolean {
    return this.newQuestion.trim() !== '' && this.newAnswer.trim() !== '';
  }

  clearForm(): void {
    this.newQuestion = '';
    this.newAnswer = '';
  }

  startEdit(question: Question): void {
    this.editingId = question.id;
    this.editQuestion = question.question;
    this.editAnswer = question.answer;
  }

  saveEdit(): void {
    if (this.editingId && this.editQuestion.trim() && this.editAnswer.trim()) {
      this.questionService.editQuestion(this.editingId, this.editQuestion, this.editAnswer);
      this.cancelEdit();
    }
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editQuestion = '';
    this.editAnswer = '';
  }

  confirmDelete(question: Question): void {
    this.questionToDelete = question;
    this.showDeleteConfirm = true;
  }

  confirmDeleteAction(): void {
    if (this.questionToDelete) {
      this.questionService.deleteQuestion(this.questionToDelete.id);
      this.cancelDelete();
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.questionToDelete = null;
  }

  // MÉTODOS DE UTILIDAD
  onDifficultyChange(): void {
    const sizes = this.getSizeRange();
    this.newPuzzleRows = sizes.min;
    this.newPuzzleCols = sizes.min;
  }

  private getSizeRange(): { min: number, max: number } {
    switch (this.newPuzzleDifficulty) {
      case 'facil': return { min: 5, max: 8 };
      case 'medio': return { min: 9, max: 11 };
      case 'dificil': return { min: 12, max: 15 };
      default: return { min: 5, max: 8 };
    }
  }

  getMinSize(): number {
    return this.getSizeRange().min;
  }

  getMaxSize(): number {
    return this.getSizeRange().max;
  }

  getDifficultyLabel(difficulty: 'facil' | 'medio' | 'dificil'): string {
    const labels = {
      facil: 'Fácil',
      medio: 'Medio',
      dificil: 'Difícil'
    };
    return labels[difficulty];
  }

  getDifficultyIcon(difficulty: 'facil' | 'medio' | 'dificil'): string {
    const icons = {
      facil: '🟢',
      medio: '🟡',
      dificil: '🔴'
    };
    return icons[difficulty];
  }

  getFilteredQuestions(): Question[] {
    let allQuestions: Question[] = [];
    this.questions$.subscribe(data => {
      allQuestions = data[this.activeTab];
    }).unsubscribe();
    return allQuestions;
  }

  getQuestionCount(difficulty: 'facil' | 'medio' | 'dificil'): number {
    let count = 0;
    this.questions$.subscribe(data => {
      count = data[difficulty].length;
    }).unsubscribe();
    return count;
  }

  // MÉTODOS DE HERRAMIENTAS
  exportQuestions(): void {
    const data = this.questionService.exportQuestions();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'word-search-data.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  importQuestions(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const success = this.questionService.importQuestions(e.target.result);
          if (success) {
            alert('Datos importados correctamente');
          } else {
            alert('Error al importar los datos');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  clearAllQuestions(): void {
    if (confirm('¿Estás seguro de que quieres eliminar todas las preguntas tradicionales?')) {
      this.questionService.clearAllQuestions();
    }
  }
}