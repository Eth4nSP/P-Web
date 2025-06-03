import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QuestionService, Question, QuestionsData } from '../services/question.service'; 

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h1>🛠️ Panel de Administrador</h1>
        <div class="admin-actions">
          <a routerLink="/game" class="btn btn-game">🎮 Ir al Juego</a>
          <a routerLink="/" class="btn btn-home">🏠 Inicio</a>
        </div>
      </div>

      <!-- Formulario para agregar preguntas -->
      <div class="question-form-section">
        <h2>➕ Agregar Nueva Pregunta</h2>
        <div class="form-container">
          <div class="form-group">
            <label for="difficulty">Dificultad:</label>
            <select id="difficulty" [(ngModel)]="selectedDifficulty" class="form-select">
              <option value="facil">🟢 Fácil</option>
              <option value="medio">🟡 Medio</option>
              <option value="dificil">🔴 Difícil</option>
            </select>
          </div>

          <div class="form-group">
            <label for="question">Pregunta:</label>
            <textarea
              id="question"
              [(ngModel)]="newQuestion"
              placeholder="Escribe tu pregunta aquí..."
              class="form-textarea"
              rows="3">
            </textarea>
            <div class="char-counter">{{newQuestion.length}}/200</div>
          </div>

          <div class="form-group">
            <label for="answer">Respuesta:</label>
            <input
              id="answer"
              type="text"
              [(ngModel)]="newAnswer"
              placeholder="Respuesta (será convertida a mayúsculas)"
              class="form-input"
              maxlength="20">
            <div class="answer-preview" *ngIf="newAnswer">
              Vista previa: <strong>{{newAnswer.toUpperCase()}}</strong>
            </div>
          </div>

          <div class="form-actions">
            <button
              (click)="addQuestion()"
              [disabled]="!canAddQuestion()"
              class="btn btn-add">
              ➕ Agregar Pregunta
            </button>
            <button
              (click)="clearForm()"
              class="btn btn-clear">
              🗑️ Limpiar
            </button>
          </div>
        </div>
      </div>

      <!-- Lista de preguntas por dificultad -->
      <div class="questions-list-section">
        <h2>📋 Preguntas Registradas</h2>
        <div class="difficulty-tabs">
          <button
            *ngFor="let diff of difficulties"
            (click)="activeTab = diff.key"
            [class.active]="activeTab === diff.key"
            class="tab-button">
            {{diff.icon}} {{diff.label}} ({{getQuestionCount(diff.key)}})
          </button>
        </div>

        <div class="questions-container">
          <div class="questions-grid">
            <div
              *ngFor="let question of getFilteredQuestions(); let i = index"
              class="question-card"
              [class.editing]="editingId === question.id">
              
              <div class="question-header">
                <span class="question-number">#{{i + 1}}</span>
                <span class="difficulty-badge" [class]="question.difficulty">
                  {{getDifficultyIcon(question.difficulty)}} {{question.difficulty}}
                </span>
              </div>

              <!-- Modo vista -->
              <div *ngIf="editingId !== question.id" class="question-content">
                <div class="question-text">
                  <strong>❓ Pregunta:</strong>
                  <p>{{question.question}}</p>
                </div>
                <div class="answer-text">
                  <strong>✅ Respuesta:</strong>
                  <span class="answer-highlight">{{question.answer}}</span>
                </div>
              </div>

              <!-- Modo edición -->
              <div *ngIf="editingId === question.id" class="question-edit">
                <div class="form-group">
                  <label>Pregunta:</label>
                  <textarea
                    [(ngModel)]="editQuestion"
                    class="form-textarea edit-textarea"
                    rows="2">
                  </textarea>
                </div>
                <div class="form-group">
                  <label>Respuesta:</label>
                  <input
                    type="text"
                    [(ngModel)]="editAnswer"
                    class="form-input"
                    maxlength="20">
                </div>
              </div>

              <!-- Acciones -->
              <div class="question-actions">
                <div *ngIf="editingId !== question.id">
                  <button
                    (click)="startEdit(question)"
                    class="btn btn-edit">
                    ✏️ Editar
                  </button>
                  <button
                    (click)="confirmDelete(question)"
                    class="btn btn-delete">
                    🗑️ Eliminar
                  </button>
                </div>
                <div *ngIf="editingId === question.id">
                  <button
                    (click)="saveEdit()"
                    class="btn btn-save">
                    💾 Guardar
                  </button>
                  <button
                    (click)="cancelEdit()"
                    class="btn btn-cancel">
                    ❌ Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="getFilteredQuestions().length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <p>No hay preguntas registradas para esta dificultad.</p>
            <p>¡Agrega la primera pregunta usando el formulario de arriba!</p>
          </div>
        </div>
      </div>

      <!-- Herramientas adicionales -->
      <div class="tools-section">
        <h2>🔧 Herramientas</h2>
        <div class="tools-grid">
          <button (click)="exportQuestions()" class="tool-button">
            📤 Exportar Preguntas
          </button>
          <button (click)="importQuestions()" class="tool-button">
            📥 Importar Preguntas
          </button>
          <button (click)="clearAllQuestions()" class="tool-button danger">
            🗑️ Limpiar Todo
          </button>
        </div>
      </div>

      <!-- Modal de confirmación -->
      <div *ngIf="showDeleteConfirm" class="modal-overlay" (click)="cancelDelete()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>⚠️ Confirmar Eliminación</h3>
          <p>¿Estás seguro de que quieres eliminar esta pregunta?</p>
          <div class="modal-actions">
            <button (click)="confirmDeleteAction()" class="btn btn-delete">
              🗑️ Eliminar
            </button>
            <button (click)="cancelDelete()" class="btn btn-cancel">
              ❌ Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      color: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .admin-header h1 {
      margin: 0;
      font-size: 2rem;
    }

    .admin-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.3s ease;
    }

    .btn-game {
      background: linear-gradient(135deg, #11998e, #38ef7d);
      color: white;
    }

    .btn-home {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .question-form-section {
      background: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .question-form-section h2 {
      color: #333;
      margin-bottom: 20px;
    }

    .form-container {
      display: grid;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-weight: 600;
      color: #555;
    }

    .form-select,
    .form-input,
    .form-textarea {
      padding: 12px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .form-select:focus,
    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    .char-counter {
      font-size: 12px;
      color: #888;
      text-align: right;
    }

    .answer-preview {
      font-size: 14px;
      color: #667eea;
      padding: 8px;
      background: #f8f9ff;
      border-radius: 6px;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-start;
    }

    .btn-add {
      background: linear-gradient(135deg, #11998e, #38ef7d);
      color: white;
    }

    .btn-clear {
      background: linear-gradient(135deg, #ffeaa7, #fab1a0);
      color: #333;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .questions-list-section {
      background: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .difficulty-tabs {
      display: flex;
      gap: 5px;
      margin-bottom: 20px;
    }

    .tab-button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      background: #f1f3f4;
      color: #555;
      transition: all 0.3s ease;
    }

    .tab-button.active {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .questions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }

    .question-card {
      border: 2px solid #e1e5e9;
      border-radius: 12px;
      padding: 20px;
      background: #fafbfc;
      transition: all 0.3s ease;
    }

    .question-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }

    .question-card.editing {
      border-color: #f39c12;
      background: #fef9e7;
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .question-number {
      font-weight: bold;
      color: #667eea;
    }

    .difficulty-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .difficulty-badge.facil {
      background: #d4edda;
      color: #155724;
    }

    .difficulty-badge.medio {
      background: #fff3cd;
      color: #856404;
    }

    .difficulty-badge.dificil {
      background: #f8d7da;
      color: #721c24;
    }

    .question-content {
      margin-bottom: 15px;
    }

    .question-text,
    .answer-text {
      margin-bottom: 10px;
    }

    .question-text p {
      margin: 5px 0;
      color: #333;
      line-height: 1.4;
    }

    .answer-highlight {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: bold;
    }

    .question-edit {
      margin-bottom: 15px;
    }

    .edit-textarea {
      min-height: 60px;
      resize: vertical;
    }

    .question-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .btn-edit {
      background: linear-gradient(135deg, #f39c12, #e67e22);
      color: white;
      font-size: 12px;
      padding: 6px 12px;
    }

    .btn-delete {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      color: white;
      font-size: 12px;
      padding: 6px 12px;
    }

    .btn-save {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      color: white;
      font-size: 12px;
      padding: 6px 12px;
    }

    .btn-cancel {
      background: linear-gradient(135deg, #95a5a6, #7f8c8d);
      color: white;
      font-size: 12px;
      padding: 6px 12px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #888;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .tools-section {
      background: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }

    .tool-button {
      padding: 15px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      background: linear-gradient(135deg, #74b9ff, #0984e3);
      color: white;
      transition: all 0.3s ease;
    }

    .tool-button.danger {
      background: linear-gradient(135deg, #fd79a8, #e84393);
    }

    .tool-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 20px;
    }

    @media (max-width: 768px) {
      .admin-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .questions-grid {
        grid-template-columns: 1fr;
      }

      .difficulty-tabs {
        flex-wrap: wrap;
      }

      .tools-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
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
