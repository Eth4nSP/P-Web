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

export interface Puzzle {
  id: string;
  name: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  rows: number;
  cols: number;
  questions: Question[];
  isCustom?: boolean; 
}

type QuestionsData = {
  facil: Question[];
  medio: Question[];
  dificil: Question[];
};

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private puzzlesSubject = new BehaviorSubject<Puzzle[]>([]);
  private currentQuestionsSubject = new BehaviorSubject<Question[]>([]);
 
  private questionsSubject = new BehaviorSubject<QuestionsData>({ facil: [], medio: [], dificil: [] });

  constructor() {
    this.loadPuzzlesFromStorage();
    this.loadTraditionalQuestionsFromStorage();
  }


  getPuzzles(): Observable<Puzzle[]> {
    return this.puzzlesSubject.asObservable();
  }

  getDefaultPuzzles(): Puzzle[] {
    return this.puzzlesSubject.value.filter(p => !p.isCustom);
  }

  getCustomPuzzles(): Puzzle[] {
    return this.puzzlesSubject.value.filter(p => p.isCustom);
  }

  getPuzzleById(id: string): Puzzle | undefined {
    return this.puzzlesSubject.value.find(p => p.id === id);
  }

  addCustomPuzzle(name: string, difficulty: 'facil' | 'medio' | 'dificil', rows: number, cols: number): { success: boolean; error?: string; id?: string } {
    const validationResult = this.validatePuzzleSize(difficulty, rows, cols);
    if (!validationResult.isValid) {
      return { success: false, error: validationResult.error };
    }

    if (!name.trim()) {
      return { success: false, error: 'El nombre del puzzle es requerido' };
    }

    const newPuzzle: Puzzle = {
      id: this.generateId(),
      name: name.trim(),
      difficulty,
      rows,
      cols,
      questions: [],
      isCustom: true
    };

    const puzzles = this.puzzlesSubject.value;
    puzzles.push(newPuzzle);
    this.puzzlesSubject.next(puzzles);
    this.savePuzzlesToStorage();

    return { success: true, id: newPuzzle.id };
  }

  validatePuzzleSize(difficulty: 'facil' | 'medio' | 'dificil', rows: number, cols: number): { isValid: boolean; error?: string } {
    switch (difficulty) {
      case 'facil':
        if (rows < 5 || cols < 5 || rows > 8 || cols > 8) {
          return {
            isValid: false,
            error: 'Para dificultad Fácil, el tamaño debe estar entre 5x5 y 8x8'
          };
        }
        break;
      case 'medio':
        if (rows < 9 || cols < 9 || rows > 11 || cols > 11) {
          return {
            isValid: false,
            error: 'Para dificultad Medio, el tamaño debe estar entre 9x9 y 11x11'
          };
        }
        break;
      case 'dificil':
        if (rows < 12 || cols < 12 || rows > 15 || cols > 15) {
          return {
            isValid: false,
            error: 'Para dificultad Difícil, el tamaño debe estar entre 12x12 y 15x15'
          };
        }
        break;
    }
    return { isValid: true };
  }

  addSystemPuzzle(name: string, difficulty: 'facil' | 'medio' | 'dificil', rows: number, cols: number): string {
    const newPuzzle: Puzzle = {
      id: this.generateId(),
      name,
      difficulty,
      rows,
      cols,
      questions: [],
      isCustom: false
    };

    const puzzles = this.puzzlesSubject.value;
    puzzles.push(newPuzzle);
    this.puzzlesSubject.next(puzzles);
    this.savePuzzlesToStorage();

    return newPuzzle.id;
  }

  deletePuzzle(id: string): void {
    let puzzles = this.puzzlesSubject.value;
    puzzles = puzzles.filter(p => p.id !== id);
    this.puzzlesSubject.next(puzzles);
    this.savePuzzlesToStorage();
  }

  editPuzzle(id: string, name: string, difficulty: 'facil' | 'medio' | 'dificil', rows: number, cols: number): { success: boolean; error?: string } {
    const puzzles = this.puzzlesSubject.value;
    const puzzleIndex = puzzles.findIndex(p => p.id === id);
   
    if (puzzleIndex === -1) {
      return { success: false, error: 'Puzzle no encontrado' };
    }

    if (puzzles[puzzleIndex].isCustom) {
      const validationResult = this.validatePuzzleSize(difficulty, rows, cols);
      if (!validationResult.isValid) {
        return { success: false, error: validationResult.error };
      }
    }

    puzzles[puzzleIndex].name = name;
    puzzles[puzzleIndex].difficulty = difficulty;
    puzzles[puzzleIndex].rows = rows;
    puzzles[puzzleIndex].cols = cols;

    this.puzzlesSubject.next(puzzles);
    this.savePuzzlesToStorage();

    return { success: true };
  }


  addQuestionToPuzzle(puzzleId: string, question: string, answer: string): void {
    const puzzles = this.puzzlesSubject.value;
    const puzzleIndex = puzzles.findIndex(p => p.id === puzzleId);

    if (puzzleIndex === -1) return;

    const puzzle = puzzles[puzzleIndex];

    const newQuestion: Question = {
      id: this.generateId(),
      question: question.trim(),
      answer: answer.trim().toUpperCase(),
      difficulty: puzzle.difficulty,
      isFound: false,
      foundLetters: Array(answer.trim().length).fill(false)
    };

    puzzles[puzzleIndex].questions.push(newQuestion);
    this.puzzlesSubject.next(puzzles);
    this.savePuzzlesToStorage();
  }

  deleteQuestionFromPuzzle(puzzleId: string, questionId: string): void {
    const puzzles = this.puzzlesSubject.value;
    const puzzleIndex = puzzles.findIndex(p => p.id === puzzleId);

    if (puzzleIndex !== -1) {
      puzzles[puzzleIndex].questions = puzzles[puzzleIndex].questions.filter(q => q.id !== questionId);
      this.puzzlesSubject.next(puzzles);
      this.savePuzzlesToStorage();
    }
  }

  editQuestionInPuzzle(puzzleId: string, questionId: string, question: string, answer: string): void {
    const puzzles = this.puzzlesSubject.value;
    const puzzleIndex = puzzles.findIndex(p => p.id === puzzleId);

    if (puzzleIndex !== -1) {
      const questionIndex = puzzles[puzzleIndex].questions.findIndex(q => q.id === questionId);
      if (questionIndex !== -1) {
        puzzles[puzzleIndex].questions[questionIndex].question = question.trim();
        puzzles[puzzleIndex].questions[questionIndex].answer = answer.trim().toUpperCase();
        puzzles[puzzleIndex].questions[questionIndex].foundLetters = Array(answer.trim().length).fill(false);

        this.puzzlesSubject.next(puzzles);
        this.savePuzzlesToStorage();
      }
    }
  }


  getQuestions(): Observable<QuestionsData> {
    return this.questionsSubject.asObservable();
  }

  addQuestion(question: string, answer: string, difficulty: 'facil' | 'medio' | 'dificil'): void {
    const newQuestion: Question = {
      id: this.generateId(),
      question: question.trim(),
      answer: answer.trim().toUpperCase(),
      difficulty,
      isFound: false,
      foundLetters: Array(answer.trim().length).fill(false)
    };

    const currentData = this.questionsSubject.value;
    currentData[difficulty].push(newQuestion);
    this.questionsSubject.next({ ...currentData });
    this.saveTraditionalQuestionsToStorage();
  }

  editQuestion(questionId: string, question: string, answer: string): void {
    const currentData = this.questionsSubject.value;
    let found = false;

    for (const difficulty of ['facil', 'medio', 'dificil'] as const) {
      const questionIndex = currentData[difficulty].findIndex(q => q.id === questionId);
      if (questionIndex !== -1) {
        currentData[difficulty][questionIndex].question = question.trim();
        currentData[difficulty][questionIndex].answer = answer.trim().toUpperCase();
        currentData[difficulty][questionIndex].foundLetters = Array(answer.trim().length).fill(false);
        found = true;
        break;
      }
    }

    if (found) {
      this.questionsSubject.next({ ...currentData });
      this.saveTraditionalQuestionsToStorage();
    }
  }

  deleteQuestion(questionId: string): void {
    const currentData = this.questionsSubject.value;
    let found = false;

    for (const difficulty of ['facil', 'medio', 'dificil'] as const) {
      const questionIndex = currentData[difficulty].findIndex(q => q.id === questionId);
      if (questionIndex !== -1) {
        currentData[difficulty].splice(questionIndex, 1);
        found = true;
        break;
      }
    }

    if (found) {
      this.questionsSubject.next({ ...currentData });
      this.saveTraditionalQuestionsToStorage();
    }
  }

  exportQuestions(): string {
    const traditionalQuestions = this.questionsSubject.value;
    const puzzles = this.puzzlesSubject.value;

    return JSON.stringify({
      traditionalQuestions,
      puzzles
    }, null, 2);
  }

  importQuestions(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.traditionalQuestions) {
        this.questionsSubject.next(data.traditionalQuestions);
        this.saveTraditionalQuestionsToStorage();
      }

      if (data.puzzles && Array.isArray(data.puzzles)) {
        this.puzzlesSubject.next(data.puzzles);
        this.savePuzzlesToStorage();
      }

      return true;
    } catch (error) {
      console.error('Error importing questions:', error);
      return false;
    }
  }

  clearAllQuestions(): void {
    this.questionsSubject.next({ facil: [], medio: [], dificil: [] });
    this.saveTraditionalQuestionsToStorage();
  }


  loadGameConfig(puzzleId: string): void {
    const puzzle = this.getPuzzleById(puzzleId);

    if (!puzzle) {
      this.currentQuestionsSubject.next([]);
      localStorage.removeItem('gameConfig');
      return;
    }

    const gameConfig = {
      puzzleId: puzzle.id,
      puzzleName: puzzle.name,
      rows: puzzle.rows,
      cols: puzzle.cols,
      difficulty: puzzle.difficulty,
      questions: puzzle.questions.map(q => ({
        ...q,
        isFound: false,
        foundLetters: Array(q.answer.length).fill(false)
      }))
    };

    localStorage.setItem('gameConfig', JSON.stringify(gameConfig));
    this.currentQuestionsSubject.next(gameConfig.questions);
  }

  loadSystemGameConfig(difficulty: string): void {
    const difficultyTyped = difficulty as 'facil' | 'medio' | 'dificil';
    
    const systemConfigs = {
      facil: {
        rows: 8,
        cols: 8,
        questions: [
          { question: 'Lenguaje de marcado para webs', answer: 'HTML' },
          { question: 'Da estilos a la web', answer: 'CSS' },
          { question: 'Lenguaje de programación para web', answer: 'JAVASCRIPT' },
          { question: 'Sistema de control de versiones', answer: 'GIT' },
          { question: 'Base de datos relacional', answer: 'SQL' }
        ]
      },
      medio: {
        rows: 10,
        cols: 10,
        questions: [
          { question: 'Patrón de diseño para crear objetos', answer: 'FACTORY' },
          { question: 'Framework de JavaScript', answer: 'ANGULAR' },
          { question: 'Librería para interfaces', answer: 'REACT' },
          { question: 'Plataforma de desarrollo', answer: 'NODEJS' },
          { question: 'Protocolo de transferencia', answer: 'HTTP' },
          { question: 'Formato de intercambio de datos', answer: 'JSON' }
        ]
      },
      dificil: {
        rows: 12,
        cols: 12,
        questions: [
          { question: 'Patrón de arquitectura de software', answer: 'MICROSERVICIOS' },
          { question: 'Metodología de desarrollo ágil', answer: 'SCRUM' },
          { question: 'Principio de responsabilidad única', answer: 'SOLID' },
          { question: 'Patrón de diseño observador', answer: 'OBSERVER' },
          { question: 'Contenedor de aplicaciones', answer: 'DOCKER' },
          { question: 'Orquestador de contenedores', answer: 'KUBERNETES' },
          { question: 'Integración continua', answer: 'CICD' }
        ]
      }
    };

    const config = systemConfigs[difficultyTyped];
    
    if (!config) {
      console.error('Dificultad no válida:', difficulty);
      return;
    }

    const questions: Question[] = config.questions.map((q, index) => ({
      id: `system-${difficulty}-${index}`,
      question: q.question,
      answer: q.answer.toUpperCase(),
      difficulty: difficultyTyped,
      isFound: false,
      foundLetters: Array(q.answer.length).fill(false)
    }));

    const gameConfig = {
      puzzleId: `system-${difficulty}`,
      puzzleName: `Nivel ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} del Sistema`,
      rows: config.rows,
      cols: config.cols,
      difficulty: difficultyTyped,
      questions: questions
    };

    localStorage.setItem('gameConfig', JSON.stringify(gameConfig));
    this.currentQuestionsSubject.next(questions);
  }

  getCurrentGameConfig(): any {
    const saved = localStorage.getItem('gameConfig');
    return saved ? JSON.parse(saved) : null;
  }

  getCurrentQuestions(): Observable<Question[]> {
    return this.currentQuestionsSubject.asObservable();
  }

  markLetterFound(questionId: string, letterIndex: number): void {
    const currentQuestions = this.currentQuestionsSubject.value;
    const questionIndex = currentQuestions.findIndex(q => q.id === questionId);

    if (questionIndex !== -1) {
      currentQuestions[questionIndex].foundLetters[letterIndex] = true;
      const allLettersFound = currentQuestions[questionIndex].foundLetters.every(found => found);
      
      if (allLettersFound) {
        currentQuestions[questionIndex].isFound = true;
      }

      this.currentQuestionsSubject.next([...currentQuestions]);
    }
  }

  resetCurrentQuestionsProgress(): void {
    const currentQuestions = this.currentQuestionsSubject.value;
    const resetQuestions = currentQuestions.map(q => ({
      ...q,
      isFound: false,
      foundLetters: Array(q.answer.length).fill(false)
    }));

    this.currentQuestionsSubject.next(resetQuestions);
  }

  areAllQuestionsResolved(): boolean {
    const currentQuestions = this.currentQuestionsSubject.value;
    return currentQuestions.length > 0 && currentQuestions.every(q => q.isFound);
  }

  getQuestionProgress(questionId: string): { found: number; total: number } {
    const currentQuestions = this.currentQuestionsSubject.value;
    const question = currentQuestions.find(q => q.id === questionId);

    if (!question) return { found: 0, total: 0 };

    return {
      found: question.foundLetters.filter(found => found).length,
      total: question.foundLetters.length
    };
  }

  getCurrentAnswers(): string[] {
    return this.currentQuestionsSubject.value.map(q => q.answer);
  }


  private savePuzzlesToStorage(): void {
    localStorage.setItem('wordSearchPuzzles', JSON.stringify(this.puzzlesSubject.value));
  }

  private loadPuzzlesFromStorage(): void {
    const saved = localStorage.getItem('wordSearchPuzzles');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.puzzlesSubject.next(data);
      } catch (error) {
        console.error('Error loading puzzles from storage:', error);
        this.loadDefaultPuzzles();
      }
    } else {
      this.loadDefaultPuzzles();
    }
  }

  private saveTraditionalQuestionsToStorage(): void {
    localStorage.setItem('traditionalQuestions', JSON.stringify(this.questionsSubject.value));
  }

  private loadTraditionalQuestionsFromStorage(): void {
    const saved = localStorage.getItem('traditionalQuestions');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.questionsSubject.next(data);
      } catch (error) {
        console.error('Error loading traditional questions from storage:', error);
      }
    }
  }

  private loadDefaultPuzzles(): void {
    const defaultPuzzles: Puzzle[] = [
      {
        id: 'default-facil',
        name: 'Nivel Fácil - Introducción a la Web',
        difficulty: 'facil',
        rows: 8,
        cols: 8,
        isCustom: false,
        questions: [
          {
            id: 'q1',
            question: 'Lenguaje de marcado para webs',
            answer: 'HTML',
            difficulty: 'facil',
            isFound: false,
            foundLetters: Array(4).fill(false)
          },
          {
            id: 'q2',
            question: 'Da estilos a la web',
            answer: 'CSS',
            difficulty: 'facil',
            isFound: false,
            foundLetters: Array(3).fill(false)
          },
          {
            id: 'q3',
            question: 'Lenguaje de programación para web',
            answer: 'JAVASCRIPT',
            difficulty: 'facil',
            isFound: false,
            foundLetters: Array(10).fill(false)
          }
        ]
      },
      {
        id: 'default-medio',
        name: 'Nivel Medio - Programación Avanzada',
        difficulty: 'medio',
        rows: 10,
        cols: 10,
        isCustom: false,
        questions: [
          {
            id: 'q4',
            question: 'Patrón de diseño para crear objetos',
            answer: 'FACTORY',
            difficulty: 'medio',
            isFound: false,
            foundLetters: Array(7).fill(false)
          },
          {
            id: 'q5',
            question: 'Sistema de control de versiones',
            answer: 'GIT',
            difficulty: 'medio',
            isFound: false,
            foundLetters: Array(3).fill(false)
          }
        ]
      },
      {
        id: 'default-dificil',
        name: 'Nivel Difícil - Arquitectura de Software',
        difficulty: 'dificil',
        rows: 12,
        cols: 12,
        isCustom: false,
        questions: [
          {
            id: 'q6',
            question: 'Patrón de arquitectura de software',
            answer: 'MICROSERVICIOS',
            difficulty: 'dificil',
            isFound: false,
            foundLetters: Array(13).fill(false)
          }
        ]
      }
    ];

    this.puzzlesSubject.next(defaultPuzzles);
    this.savePuzzlesToStorage();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  clearAllPuzzles(): void {
    const puzzles = this.puzzlesSubject.value;
    const systemPuzzles = puzzles.filter(p => !p.isCustom);
    this.puzzlesSubject.next(systemPuzzles);
    this.savePuzzlesToStorage();
  }

  exportPuzzles(): string {
    return JSON.stringify(this.puzzlesSubject.value, null, 2);
  }

  importPuzzles(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data)) {
        this.puzzlesSubject.next(data);
        this.savePuzzlesToStorage();
        return true;
      }
    } catch (error) {
      console.error('Error importing puzzles:', error);
    }
    return false;
  }
}