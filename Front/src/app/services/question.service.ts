import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Question {
  id: string;
  question: string;
  answer: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  isFound: boolean;
  foundLetters: boolean[];
}

export interface QuestionsData {
  facil: Question[];
  medio: Question[];
  dificil: Question[];
}

@Injectable({
  providedIn: 'root' 
})
export class QuestionService {
  private questionsSubject = new BehaviorSubject<QuestionsData>({
    facil: [],
    medio: [],
    dificil: []
  });

  private currentQuestionsSubject = new BehaviorSubject<Question[]>([]);

  constructor() {
    this.loadQuestionsFromStorage();
  }

  // Observables para suscribirse a cambios
  getQuestions(): Observable<QuestionsData> {
    return this.questionsSubject.asObservable();
  }

  getCurrentQuestions(): Observable<Question[]> {
    return this.currentQuestionsSubject.asObservable();
  }

  // Agregar nueva pregunta
  addQuestion(question: string, answer: string, difficulty: 'facil' | 'medio' | 'dificil'): void {
    const currentData = this.questionsSubject.value;
    const newQuestion: Question = {
      id: this.generateId(),
      question: question.trim(),
      answer: answer.trim().toUpperCase(),
      difficulty,
      isFound: false,
      foundLetters: Array(answer.trim().length).fill(false)
    };

    currentData[difficulty].push(newQuestion);
    this.questionsSubject.next(currentData);
    this.saveQuestionsToStorage();
  }

  // Eliminar pregunta
  deleteQuestion(id: string): void {
    const currentData = this.questionsSubject.value;
    
    for (const difficulty of ['facil', 'medio', 'dificil'] as const) {
      currentData[difficulty] = currentData[difficulty].filter(q => q.id !== id);
    }
    
    this.questionsSubject.next(currentData);
    this.saveQuestionsToStorage();
  }

  // Editar pregunta
  editQuestion(id: string, question: string, answer: string): void {
    const currentData = this.questionsSubject.value;
    
    for (const difficulty of ['facil', 'medio', 'dificil'] as const) {
      const questionIndex = currentData[difficulty].findIndex(q => q.id === id);
      if (questionIndex !== -1) {
        currentData[difficulty][questionIndex].question = question.trim();
        currentData[difficulty][questionIndex].answer = answer.trim().toUpperCase();
        currentData[difficulty][questionIndex].foundLetters = Array(answer.trim().length).fill(false);
        break;
      }
    }
    
    this.questionsSubject.next(currentData);
    this.saveQuestionsToStorage();
  }

  // Obtener preguntas por dificultad
  getQuestionsByDifficulty(difficulty: 'facil' | 'medio' | 'dificil'): Question[] {
    return this.questionsSubject.value[difficulty];
  }

  // Cargar preguntas para el juego actual
  loadGameQuestions(difficulty: 'facil' | 'medio' | 'dificil'): void {
    const questions = this.getQuestionsByDifficulty(difficulty);
    // Resetear estado de preguntas encontradas
    const resetQuestions = questions.map(q => ({
      ...q,
      isFound: false,
      foundLetters: Array(q.answer.length).fill(false)
    }));
    
    this.currentQuestionsSubject.next(resetQuestions);
  }

  // Marcar letra como encontrada
  markLetterFound(questionId: string, letterIndex: number): void {
    const currentQuestions = this.currentQuestionsSubject.value;
    const questionIndex = currentQuestions.findIndex(q => q.id === questionId);
    
    if (questionIndex !== -1) {
      currentQuestions[questionIndex].foundLetters[letterIndex] = true;
      
      // Verificar si toda la palabra está encontrada
      const allLettersFound = currentQuestions[questionIndex].foundLetters.every(found => found);
      if (allLettersFound) {
        currentQuestions[questionIndex].isFound = true;
      }
      
      this.currentQuestionsSubject.next([...currentQuestions]);
    }
  }

  // Resetear progreso de preguntas actuales
  resetCurrentQuestionsProgress(): void {
    const currentQuestions = this.currentQuestionsSubject.value;
    const resetQuestions = currentQuestions.map(q => ({
      ...q,
      isFound: false,
      foundLetters: Array(q.answer.length).fill(false)
    }));
    
    this.currentQuestionsSubject.next(resetQuestions);
  }

  // Verificar si todas las preguntas están resueltas
  areAllQuestionsResolved(): boolean {
    const currentQuestions = this.currentQuestionsSubject.value;
    return currentQuestions.length > 0 && currentQuestions.every(q => q.isFound);
  }

  // Obtener progreso de una pregunta
  getQuestionProgress(questionId: string): number {
    const currentQuestions = this.currentQuestionsSubject.value;
    const question = currentQuestions.find(q => q.id === questionId);
    
    if (!question) return 0;
    
    return question.foundLetters.filter(found => found).length;
  }

  // Obtener respuestas para colocar en el tablero
  getCurrentAnswers(): string[] {
    return this.currentQuestionsSubject.value.map(q => q.answer);
  }

  // Verificar si una letra pertenece a alguna respuesta
  isLetterInAnswers(letter: string, row: number, col: number): { questionId: string; letterIndex: number } | null {
    return null;
  }

  // Guardar en localStorage
  private saveQuestionsToStorage(): void {
    const data = this.questionsSubject.value;
    localStorage.setItem('gameQuestions', JSON.stringify(data));
  }

  // Cargar desde localStorage
  private loadQuestionsFromStorage(): void {
    const saved = localStorage.getItem('gameQuestions');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.questionsSubject.next(data);
      } catch (error) {
        console.error('Error loading questions from storage:', error);
        this.loadDefaultQuestions();
      }
    } else {
      this.loadDefaultQuestions();
    }
  }

  // Cargar preguntas por defecto
  private loadDefaultQuestions(): void {
    const defaultQuestions: QuestionsData = {
      facil: [
        {
          id: this.generateId(),
          question: '¿Qué lenguaje de programación es popular para desarrollo web?',
          answer: 'JAVASCRIPT',
          difficulty: 'facil',
          isFound: false,
          foundLetters: Array(10).fill(false)
        },
        {
          id: this.generateId(),
          question: '¿Qué significa HTML?',
          answer: 'HTML',
          difficulty: 'facil',
          isFound: false,
          foundLetters: Array(4).fill(false)
        }
      ],
      medio: [
        {
          id: this.generateId(),
          question: '¿Qué patrón de diseño permite crear objetos sin especificar su clase?',
          answer: 'FACTORY',
          difficulty: 'medio',
          isFound: false,
          foundLetters: Array(7).fill(false)
        }
      ],
      dificil: [
        {
          id: this.generateId(),
          question: '¿Qué algoritmo de ordenamiento tiene complejidad O(n log n) en el caso promedio?',
          answer: 'QUICKSORT',
          difficulty: 'dificil',
          isFound: false,
          foundLetters: Array(9).fill(false)
        }
      ]
    };

    this.questionsSubject.next(defaultQuestions);
    this.saveQuestionsToStorage();
  }

  // Generar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Limpiar todas las preguntas (útil para testing)
  clearAllQuestions(): void {
    this.questionsSubject.next({
      facil: [],
      medio: [],
      dificil: []
    });
    this.saveQuestionsToStorage();
  }

  // Exportar preguntas (para backup)
  exportQuestions(): string {
    return JSON.stringify(this.questionsSubject.value, null, 2);
  }

  // Importar preguntas (desde backup)
  importQuestions(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      // Validar estructura básica
      if (data.facil && data.medio && data.dificil) {
        this.questionsSubject.next(data);
        this.saveQuestionsToStorage();
        return true;
      }
    } catch (error) {
      console.error('Error importing questions:', error);
    }
    return false;
  }
}
