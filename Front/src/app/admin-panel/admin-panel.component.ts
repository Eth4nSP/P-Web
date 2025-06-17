import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QuestionService, Question, QuestionsData } from '../services/question.service'; 

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls:['./admin-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],

})
export class AdminPanelComponent implements OnInit, OnDestroy {
  // Formulario
  selectedDifficulty: 'facil' | 'medio' | 'dificil' = 'facil';
  newQuestion: string = '';
  newAnswer: string = '';

  // Vista
  activeTab: 'facil' | 'medio' | 'dificil' = 'facil';
  questionsData: QuestionsData = { facil: [], medio: [], dificil: [] };

  // Edición
  editingId: string | null = null;
  editQuestion: string = '';
  editAnswer: string = '';

  // Eliminación
  showDeleteConfirm: boolean = false;
  questionToDelete: Question | null = null;

  // Suscripción
  private subscription: Subscription = new Subscription();

  // Configuración de dificultades
  difficulties = [
    { key: 'facil' as const, label: 'Fácil', icon: '🟢' },
    { key: 'medio' as const, label: 'Medio', icon: '🟡' },
    { key: 'dificil' as const, label: 'Difícil', icon: '🔴' }
  ];

  constructor(private questionService: QuestionService) {}

  ngOnInit(): void {
    // Suscribirse a cambios en las preguntas
    this.subscription.add(
      this.questionService.getQuestions().subscribe(data => {
        this.questionsData = data;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Validar si se puede agregar una pregunta
  canAddQuestion(): boolean {
    return this.newQuestion.trim().length > 0 && 
           this.newAnswer.trim().length > 0 && 
           this.newQuestion.length <= 200 &&
           this.newAnswer.length <= 20;
  }

  // Agregar nueva pregunta
  addQuestion(): void {
    if (this.canAddQuestion()) {
      this.questionService.addQuestion(
        this.newQuestion.trim(),
        this.newAnswer.trim(),
        this.selectedDifficulty
      );
      this.clearForm();
    }
  }

  // Limpiar formulario
  clearForm(): void {
    this.newQuestion = '';
    this.newAnswer = '';
    this.selectedDifficulty = 'facil';
  }

  // Obtener preguntas filtradas por dificultad activa
  getFilteredQuestions(): Question[] {
    return this.questionsData[this.activeTab] || [];
  }

  // Obtener cantidad de preguntas por dificultad
  getQuestionCount(difficulty: 'facil' | 'medio' | 'dificil'): number {
    return this.questionsData[difficulty]?.length || 0;
  }

  // Obtener icono de dificultad
  getDifficultyIcon(difficulty: 'facil' | 'medio' | 'dificil'): string {
    const icons = {
      facil: '🟢',
      medio: '🟡',
      dificil: '🔴'
    };
    return icons[difficulty];
  }

  // Iniciar edición de pregunta
  startEdit(question: Question): void {
    this.editingId = question.id;
    this.editQuestion = question.question;
    this.editAnswer = question.answer;
  }

  // Guardar edición
  saveEdit(): void {
    if (this.editingId && this.editQuestion.trim() && this.editAnswer.trim()) {
      this.questionService.editQuestion(
        this.editingId,
        this.editQuestion.trim(),
        this.editAnswer.trim()
      );
      this.cancelEdit();
    }
  }

  // Cancelar edición
  cancelEdit(): void {
    this.editingId = null;
    this.editQuestion = '';
    this.editAnswer = '';
  }

  // Confirmar eliminación (mostrar modal)
  confirmDelete(question: Question): void {
    this.questionToDelete = question;
    this.showDeleteConfirm = true;
  }

  // Ejecutar eliminación
  confirmDeleteAction(): void {
    if (this.questionToDelete) {
      this.questionService.deleteQuestion(this.questionToDelete.id);
      this.cancelDelete();
    }
  }

  // Cancelar eliminación
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.questionToDelete = null;
  }

  // Exportar preguntas
  exportQuestions(): void {
    const data = this.questionService.exportQuestions();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `preguntas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Importar preguntas
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
            alert('✅ Preguntas importadas correctamente');
          } else {
            alert('❌ Error al importar preguntas. Verifica el formato del archivo.');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }

  // Limpiar todas las preguntas
  clearAllQuestions(): void {
    if (confirm('⚠️ ¿Estás seguro de que quieres eliminar TODAS las preguntas? Esta acción no se puede deshacer.')) {
      this.questionService.clearAllQuestions();
      alert('🗑️ Todas las preguntas han sido eliminadas');
    }
  }
}
