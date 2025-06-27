import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellComponent } from '../cell/cell.component';
import { GameService } from '../game.service';
import { QuestionService, Question } from '../services/question.service';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

interface FoundPosition {
  row: number;
  col: number;
  answerId: string;
  letterIndex: number;
  color: string;
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    CellComponent,
    RouterLink
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {
  steps: number = 100;
  maxSteps: number = 100;
  board: string[][] = [];
  carPosition = { row: 0, col: 0 };
  currentQuestions: Question[] = [];
  foundPositions: FoundPosition[] = [];
  answerColors: { [key: string]: string } = {};
  private isGameInitialized: boolean = false;
  private subscriptions: Subscription = new Subscription();
  isMobileDevice: boolean = false;
  timeLeft: number = 0;
  timerInterval: any = null;
  isGameOver: boolean = false;
  keyboardLocked: boolean = false;
  showWinMenu: boolean = false;
  finalScore: number = 0;
  puzzleName: string = '';
  isMarkingVisual: boolean = false;

  // NUEVAS PROPIEDADES PARA EL SISTEMA DE MARCADO
  moveSequence: Array<'up' | 'down' | 'left' | 'right' | 'mark' | 'finish'> = [];
  isMarking: boolean = false;
  markedPath: { row: number; col: number }[] = [];
  errorPath: { row: number; col: number }[] = [];

  // Configuración del juego
  gameConfig: any = null;

  constructor(
    private gameService: GameService,
    private questionService: QuestionService,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.keyboardLocked || this.isGameOver) {
      event.preventDefault();
      return;
    }
    switch (event.key) {
      case 'ArrowUp':
        this.addMove('up');
        break;
      case 'ArrowDown':
        this.addMove('down');
        break;
      case 'ArrowLeft':
        this.addMove('left');
        break;
      case 'ArrowRight':
        this.addMove('right');
        break;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkDeviceType();
  }

  checkDeviceType() {
    this.isMobileDevice = window.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.checkDeviceType();
    // Obtener el nombre del puzzle desde la configuración del juego
    const gameConfig = this.questionService.getCurrentGameConfig();
    if (gameConfig) {
      this.puzzleName = gameConfig.puzzleName || 'Sopa de Letras';
    }
   
    // Lee toda la configuración del juego desde localStorage
    const gameConfigString = localStorage.getItem('gameConfig');
    if (gameConfigString) {
      this.gameConfig = JSON.parse(gameConfigString);
      this.currentQuestions = this.gameConfig.questions;
     
      if (this.currentQuestions.length > 0 && !this.isGameInitialized) {
        this.initializeGame(this.gameConfig);
        this.isGameInitialized = true;
      }
    } else {
      console.warn("No se encontró configuración de juego. Volviendo al menú.");
      // Opcional: Redirigir al menú si no hay configuración
    }
    this.cdr.detectChanges();

    // Suscripción a la posición del carro
    const carPosSub = this.gameService.getCarPosition().subscribe(position => {
      this.carPosition = position;
    });
    this.subscriptions.add(carPosSub);
  }

  // Método para manejar el estado de marcado visual
  private updateMarkingVisualState(): void {
    // Actualizar isMarkingVisual basado en si hay un 'mark' sin su correspondiente 'finish'
    const lastMarkIndex = this.moveSequence.lastIndexOf('mark');
    const lastFinishIndex = this.moveSequence.lastIndexOf('finish');
    
    // Si hay un 'mark' más reciente que el último 'finish', entonces está marcando
    this.isMarkingVisual = lastMarkIndex > lastFinishIndex || (lastMarkIndex !== -1 && lastFinishIndex === -1);
  }

  // initializeGame ahora recibe la configuración completa del puzzle
  initializeGame(config: any): void {
    this.foundPositions = [];
    this.isMarking = false;
    this.markedPath = [];
    this.errorPath = [];
    this.isMarkingVisual = false;
    this.assignAnswerColors();
   
    // Usa el tamaño del puzzle, no de la dificultad
    this.initializeBoard(config.rows, config.cols);
    this.resetTimer(config.difficulty);
   
    this.isGameOver = false;
    this.showWinMenu = false;
    this.finalScore = 0;
   
    // Límite de pasos según la dificultad del puzzle
    switch (config.difficulty) {
      case 'facil':
        this.steps = 100;
        this.maxSteps = 100;
        break;
      case 'medio':
        this.steps = 200;
        this.maxSteps = 200;
        break;
      case 'dificil':
        this.steps = 300;
        this.maxSteps = 300;
        break;
      default:
        this.steps = 100;
        this.maxSteps = 100;
    }
   
    this.unlockKeyboard();
    this.startTimer();
  }

  resetTimer(difficulty?: string): void {
    const diff = difficulty || 'facil';
    switch (diff) {
      case 'facil': this.timeLeft = 240; break;
      case 'medio': this.timeLeft = 180; break;
      case 'dificil': this.timeLeft = 120; break;
      default: this.timeLeft = 240;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  assignAnswerColors(): void {
    const colors = ['#16a085', '#f39c12', '#e67e22', '#2980b9', '#c0392b', '#27ae60', '#8e44ad', '#d35400', '#2ecc71', '#9b59b6', '#34495e', '#e74c3c'];
    this.currentQuestions.forEach((question, index) => {
      this.answerColors[question.id] = colors[index % colors.length];
    });
  }

  // initializeBoard ahora recibe el tamaño como argumento
  initializeBoard(rows: number, cols: number): void {
    const answers = this.currentQuestions.map(q => q.answer.toUpperCase());
    if (answers.length === 0) {
      this.board = [];
      console.warn("No hay respuestas para colocar en el tablero.");
      return;
    }
    this.board = Array(rows).fill(null).map(() => Array(cols).fill(''));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        this.board[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
    this.placeAnswersRandomly(answers);
    this.placeCarRandomly();
  }

  placeAnswersRandomly(answers: string[]): void {
    const occupiedPositions = new Set<string>();
    for (const answer of answers) {
      if (!answer) continue;
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;
      while (!placed && attempts < maxAttempts) {
        attempts++;
        const orientation = Math.floor(Math.random() * 3); // 0:H, 1:V, 2:Escalera
        placed = this.tryPlaceAnswer(answer, orientation, occupiedPositions);
      }
      if (!placed) {
        console.warn(`No se pudo colocar la respuesta: ${answer}`);
      }
    }
  }

  tryPlaceAnswer(answer: string, orientation: number, occupiedPositions: Set<string>): boolean {
    const rows = this.board.length;
    const cols = this.board[0].length;
    let startRowLimit = rows;
    let startColLimit = cols;

    // 0: Horizontal, 1: Vertical, 2: Escalera (nuevo patrón)
    switch (orientation) {
      case 0: // Horizontal
        startColLimit = cols - answer.length;
        break;
      case 1: // Vertical
        startRowLimit = rows - answer.length;
        break;
      case 2: // Escalera (derecha-abajo)
        // Necesita la mitad de la longitud de la palabra en filas y columnas
        startRowLimit = rows - Math.ceil(answer.length / 2);
        startColLimit = cols - Math.ceil(answer.length / 2);
        break;
    }

    if (startRowLimit <= 0 || startColLimit <= 0) return false;

    const startRow = Math.floor(Math.random() * startRowLimit);
    const startCol = Math.floor(Math.random() * startColLimit);
    const positions: [number, number][] = [];
    let possible = true;

    for (let i = 0; i < answer.length; i++) {
      let r = startRow, c = startCol;
     
      if (orientation === 0) { // Horizontal
        c += i;
      } else if (orientation === 1) { // Vertical
        r += i;
      } else { // Escalera: alterna entre mover a la derecha y hacia abajo
        r += Math.floor(i / 2);
        c += Math.ceil(i / 2);
      }

      if (r < 0 || r >= rows || c < 0 || c >= cols) {
        possible = false;
        break;
      }
     
      const posKey = `${r},${c}`;
      if (occupiedPositions.has(posKey) && this.board[r][c] !== answer[i]) {
        possible = false;
        break;
      }
      positions.push([r, c]);
    }

    if (possible) {
      positions.forEach(([r, c], i) => {
        this.board[r][c] = answer[i];
        occupiedPositions.add(`${r},${c}`);
      });
      return true;
    }
    return false;
  }

  placeCarRandomly(): void {
    const rows = this.board.length;
    const cols = this.board[0].length;
    if (rows === 0 || cols === 0) return;

    // Siempre coloca el carro en la esquina superior izquierda
    const r = 0, c = 0;
    this.carPosition = { row: r, col: c };
    this.gameService.updateCarPosition(r, c);
  }

  calculateScore(): number {
    const difficulty = this.gameConfig?.difficulty || 'facil';
    const factor = difficulty === 'facil' ? 0.7
                 : difficulty === 'medio' ? 0.5
                 : 0.3;
    return Math.max(0, Math.floor((this.timeLeft * factor) + this.steps));
  }

  isCarPosition(i: number, j: number): boolean {
    return this.carPosition.row === i && this.carPosition.col === j;
  }

  getPositionColor(i: number, j: number): string | undefined {
    const foundPosition = this.foundPositions.find(pos => pos.row === i && pos.col === j);
    return foundPosition ? foundPosition.color : undefined;
  }

  isPositionFound(i: number, j: number): boolean {
    return this.foundPositions.some(pos => pos.row === i && pos.col === j);
  }

  // NUEVAS FUNCIONES PARA EL FEEDBACK VISUAL
  isPositionInErrorPath(row: number, col: number): boolean {
    return this.errorPath.some(p => p.row === row && p.col === col);
  }

  isPositionMarked(row: number, col: number): boolean {
    return this.markedPath.some(p => p.row === row && p.col === col);
  }

  getQuestionProgress(questionId: string): { found: number, total: number } {
    const question = this.currentQuestions.find(q => q.id === questionId);
    if (!question || !question.answer) return { found: 0, total: 0 };
    const foundCount = question.foundLetters?.filter((f: boolean) => f).length || 0;
    return { found: foundCount, total: question.answer.length };
  }

  isQuestionLetterFound(questionId: string, letterIndex: number): boolean {
    const question = this.currentQuestions.find(q => q.id === questionId);
    return question && question.foundLetters && question.foundLetters.length > letterIndex ? question.foundLetters[letterIndex] : false;
  }

  moveCar(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.isGameOver || !this.board.length) return;

    const newPos = { ...this.carPosition };
    switch (direction) {
      case 'up': if (newPos.row > 0) newPos.row--; break;
      case 'down': if (newPos.row < this.board.length - 1) newPos.row++; break;
      case 'left': if (newPos.col > 0) newPos.col--; break;
      case 'right': if (newPos.col < this.board[0].length - 1) newPos.col++; break;
    }

    if (newPos.row !== this.carPosition.row || newPos.col !== this.carPosition.col) {
      this.gameService.updateCarPosition(newPos.row, newPos.col);
    }
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0 && !this.isGameOver) {
        this.timeLeft--;
      } else if (this.timeLeft === 0 && !this.isGameOver) {
        this.isGameOver = true;
        this.lockKeyboard();
        clearInterval(this.timerInterval);
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  resetGame(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isGameInitialized = false;
   
    if (this.gameConfig) {
      // Resetear el progreso de las preguntas
      this.currentQuestions.forEach(q => {
        q.isFound = false;
        q.foundLetters = new Array(q.answer.length).fill(false);
      });
      this.initializeGame(this.gameConfig);
    }
  }

  lockKeyboard() { this.keyboardLocked = true; }
  unlockKeyboard() { this.keyboardLocked = false; }

  // NUEVA FUNCIÓN PARA OBTENER LA ETIQUETA DEL MOVIMIENTO
  getMoveLabel(move: string): string {
    const labels: { [key: string]: string } = {
      up: 'Arriba',
      down: 'Abajo',
      left: 'Izquierda',
      right: 'Derecha',
      mark: 'MARCAR',
      finish: 'FINAL'
    };
    return labels[move] || '';
  }

  addMove(direction: 'up' | 'down' | 'left' | 'right' | 'mark' | 'finish') {
    if (this.moveSequence.length < this.steps) {
      if (direction === 'mark' && this.isMarking) return; // No marcar si ya está marcando
      if (direction === 'finish' && !this.isMarking) return; // No finalizar si no está marcando

      this.moveSequence.push(direction);
     
      if (direction === 'mark') {
        this.isMarking = true;
      }
      if (direction === 'finish') {
        this.isMarking = false;
      }
      
      // Actualizar el estado visual después de cada cambio
      this.updateMarkingVisualState();
    }
  }

  clearMoveSequence() {
    this.moveSequence = [];
    this.isMarking = false;
    this.isMarkingVisual = false; // Resetear también el estado visual
  }

  async sendMoveSequence() {
    this.lockKeyboard();
    let isCurrentlyMarking = false;
    let currentWordPath: {row: number, col: number}[] = [];
    let currentWord = '';
    let allWordsFound: Array<{word: string, path: {row: number, col: number}[]}> = [];

    for (const move of this.moveSequence) {
      if (this.steps <= 0) break;

      if (move === 'mark') {
        isCurrentlyMarking = true;
        // Iniciar nueva palabra
        currentWordPath = [{ ...this.carPosition }];
        currentWord = this.board[this.carPosition.row][this.carPosition.col];
        this.markedPath.push({ ...this.carPosition }); // Para feedback visual
        continue;
      }

      if (move === 'finish') {
        isCurrentlyMarking = false;
        // Finalizar palabra actual
        if (currentWord) {
          allWordsFound.push({ word: currentWord, path: [...currentWordPath] });
          currentWordPath = [];
          currentWord = '';
        }
        continue;
      }

      // Si es un movimiento normal
      this.moveCar(move);
      this.steps--;
      
      if (isCurrentlyMarking) {
        currentWordPath.push({ ...this.carPosition });
        currentWord += this.board[this.carPosition.row][this.carPosition.col];
        this.markedPath.push({ ...this.carPosition }); // Para feedback visual
      }

      await new Promise(res => setTimeout(res, 120));
      this.cdr.detectChanges();
    }

    // Si quedó una palabra sin finalizar (el usuario no puso 'finish' al final)
    if (isCurrentlyMarking && currentWord) {
      allWordsFound.push({ word: currentWord, path: [...currentWordPath] });
    }

    // Validación de todas las palabras encontradas
    let allWordsCorrect = true;
    let wordsFoundInThisSequence = 0;

    for (const wordData of allWordsFound) {
      const questionFound = this.currentQuestions.find(q => !q.isFound && q.answer === wordData.word);
      if (questionFound) {
        // Palabra correcta
        this.markAnswerAsFound(questionFound, wordData.path);
        wordsFoundInThisSequence++;
      } else {
        // Palabra incorrecta
        allWordsCorrect = false;
        this.errorPath = [...wordData.path];
        break;
      }
    }

    // Si alguna palabra fue incorrecta, terminar el juego
    if (!allWordsCorrect) {
      this.isGameOver = true;
      this.cdr.detectChanges();
      await new Promise(res => setTimeout(res, 1500)); // Espera para mostrar el error
      this.resetGame();
    }

    this.clearMoveSequence();
    this.markedPath = [];
    this.unlockKeyboard();
    this.updateMarkingVisualState(); // Actualizar estado visual al final

    if (this.steps === 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.lockKeyboard();
      this.cdr.detectChanges();
    }
  }

  // Modifica markAnswerAsFound para recibir el camino
  markAnswerAsFound(question: Question, path: {row: number, col: number}[]): void {
    const questionIndex = this.currentQuestions.findIndex(q => q.id === question.id);
    if (questionIndex === -1 || this.currentQuestions[questionIndex].isFound) return;

    this.currentQuestions[questionIndex].isFound = true;
   
    path.forEach((pos, index) => {
      this.questionService.markLetterFound(question.id, index);
     
      const alreadyInFound = this.foundPositions.some(fp => fp.row === pos.row && fp.col === pos.col);
      if (!alreadyInFound) {
        this.foundPositions.push({
          row: pos.row,
          col: pos.col,
          answerId: question.id,
          letterIndex: index,
          color: this.answerColors[question.id]
        });
      }
    });

    if (this.currentQuestions.every(q => q.isFound)) {
      this.finalScore = this.calculateScore();
      this.showWinMenu = true;
      this.lockKeyboard();
      this.isGameOver = true;
      if (this.timerInterval) clearInterval(this.timerInterval);
    }
   
    this.cdr.detectChanges();
  }

  submitScore() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Debes iniciar sesión para enviar tu puntaje.');
      return;
    }
   
    fetch('http://localhost:8000/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, score: this.finalScore })
    })
      .then(res => res.json())
      .then(() => {
        alert('¡Puntaje enviado!');
      })
      .catch(() => {
        alert('Error al enviar el puntaje');
      });
  }
}