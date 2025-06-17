import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellComponent } from '../cell/cell.component'; // Asegúrate que la ruta sea correcta y CellComponent sea standalone
import { GameService } from '../game.service'; // Asumiendo que está en src/app/game.service.ts
// Corregida la ruta para QuestionService:
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

interface AnswerSequence {
  answerId: string;
  answerText: string;
  positions: { row: number, col: number }[];
  isComplete: boolean;
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    CellComponent, // CellComponent debe ser standalone o parte de un NgModule importado
    RouterLink
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'] // Usa styleUrls en plural y como array
})
export class BoardComponent implements OnInit, OnDestroy {
  steps: number = 100;
  maxSteps: number = 100;
  board: string[][] = [];
  carPosition = { row: 0, col: 0 };

  currentQuestions: Question[] = [];
  foundPositions: FoundPosition[] = [];
  activeAnswerSequences: AnswerSequence[] = [];

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
  gameDifficulty: 'facil' | 'medio' | 'dificil' = 'facil';

  moveSequence: Array<'up' | 'down' | 'left' | 'right'> = [];

  constructor(
    private gameService: GameService,
    private questionService: QuestionService, // Asegúrate que QuestionService esté bien importado y proveído (e.g. providedIn: 'root')
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
    if (this.keyboardLocked || this.isGameOver) {
        event.preventDefault();
        return;
    }
    // Cambiamos this.moveCar por this.addMove
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
    const storedDifficulty = localStorage.getItem('dificultad') as 'facil' | 'medio' | 'dificil';
    this.gameDifficulty = storedDifficulty || 'facil';

    this.questionService.loadGameQuestions(this.gameDifficulty);

    const questionsSub = this.questionService.getCurrentQuestions().subscribe((questions: Question[]) => {
    this.currentQuestions = questions;
    // Solo inicializa el juego si hay preguntas Y el juego no ha sido inicializado antes.
    if (questions.length > 0 && !this.isGameInitialized) {
        this.initializeGame();
        this.isGameInitialized = true; // Marcar como inicializado
    } else if (questions.length === 0) {
        console.warn(`No hay preguntas para la dificultad: ${this.gameDifficulty}`);
        this.board = []; // Limpiar el tablero si no hay preguntas
        this.isGameInitialized = false; // Resetear si no hay preguntas
    }
    this.cdr.detectChanges();
});
    this.subscriptions.add(questionsSub);

    // Solo suscribe a carPosition si GameService se usa activamente para la lógica del juego
    const carPosSub = this.gameService.getCarPosition().subscribe(position => {
      this.carPosition = position;
      if (this.currentQuestions.length > 0 && this.board.length > 0) { // Solo verificar si el juego está activo
          this.checkForAnswerSequence();
      }
    });
    this.subscriptions.add(carPosSub);
  }

  initializeGame(): void {
    this.foundPositions = [];
    this.activeAnswerSequences = [];
    this.assignAnswerColors();
    this.initializeBoard();
    this.resetTimer();
    this.isGameOver = false;
    this.showWinMenu = false;
    this.finalScore = 0;
    // Limite de pasos según dificultad
    switch (this.gameDifficulty) {
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

  resetTimer(): void {
    switch (this.gameDifficulty) {
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

  initializeBoard(): void {
    const answers = this.currentQuestions.map(q => q.answer.toUpperCase()); // Asegurar mayúsculas
    if (answers.length === 0) {
        this.board = []; // Tablero vacío
        console.warn("No hay respuestas para colocar en el tablero.");
        return;
    }

    const difficulty = this.gameDifficulty;
    const rows = difficulty === 'facil' ? 10 : difficulty === 'medio' ? 14 : 16;
    const cols = difficulty === 'facil' ? 10 : difficulty === 'medio' ? 14 : 16;

    this.board = Array(rows).fill(null).map(() => Array(cols).fill(''));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        this.board[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Letras A-Z
      }
    }
    this.placeAnswersRandomly(answers);
    this.placeCarRandomly();
  }

  placeAnswersRandomly(answers: string[]): void {
    const occupiedPositions = new Set<string>();
    for (const answer of answers) {
      if (!answer) continue; // Saltar si la respuesta es undefined o vacía
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;
      while (!placed && attempts < maxAttempts) {
        attempts++;
        const orientation = Math.floor(Math.random() * 3); // 0:H, 1:V, 2:D (simplificada)
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

    switch (orientation) {
      case 0: startColLimit = cols - answer.length + 1; break;
      case 1: startRowLimit = rows - answer.length + 1; break;
      case 2: // Diagonal simple (arriba-izquierda a abajo-derecha)
        startRowLimit = rows - answer.length + 1;
        startColLimit = cols - answer.length + 1;
        break;
    }

    if (startRowLimit <= 0 || startColLimit <= 0) return false;

    const startRow = Math.floor(Math.random() * startRowLimit);
    const startCol = Math.floor(Math.random() * startColLimit);

    const positions: [number, number][] = [];
    let possible = true;

    for (let i = 0; i < answer.length; i++) {
      let r = startRow, c = startCol;
      if (orientation === 0) c += i;
      else if (orientation === 1) r += i;
      else { r += i; c += i; }

      if (r < 0 || r >= rows || c < 0 || c >= cols) {
        possible = false; break;
      }
      const posKey = `${r},${c}`;
      if (occupiedPositions.has(posKey) && this.board[r][c] !== answer[i]) {
        possible = false; break;
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

    let r, c;
    let attempts = 0;
    const maxAttempts = rows * cols; // Evitar bucle infinito si el tablero está lleno
    do {
        r = Math.floor(Math.random() * rows);
        c = Math.floor(Math.random() * cols);
        attempts++;
        if (attempts > maxAttempts) { // Fallback si no se encuentra posición libre
            r = 0; c = 0;
            break;
        }
    } while (this.isPositionPartOfAnyAnswer(r,c));
    r = 0; c = 0; // Asegurarse de que el carro comienza en la esquina superior izquierda
    this.carPosition = { row: r, col: c };
    this.gameService.updateCarPosition(r, c);
  }

  isPositionPartOfAnyAnswer(row: number, col: number): boolean {
    // Esta función es una simplificación. Para ser preciso, necesitarías
    // almacenar las coordenadas exactas de cada respuesta colocada.
    // Por ahora, verifica si la letra en la celda es parte de alguna respuesta.
    if (!this.board[row] || !this.board[row][col]) return false;
    const letterInCell = this.board[row][col];
    return this.currentQuestions.some(q => q.answer.includes(letterInCell));
  }

  checkForAnswerSequence(): void {
    if (this.isGameOver || !this.board.length) return;
    const currentRow = this.carPosition.row;
    const currentCol = this.carPosition.col;
    // Asegurarse de que la posición del carro es válida
    if (currentRow < 0 || currentRow >= this.board.length || currentCol < 0 || currentCol >= this.board[0].length) {
        return;
    }
    const currentLetter = this.board[currentRow][currentCol];

    for (const question of this.currentQuestions) {
      if (question.isFound || !question.answer) continue;

      if (question.answer[0] === currentLetter) {
        const isPartOfExistingActiveSequence = this.activeAnswerSequences.some(seq =>
            seq.answerId === question.id &&
            seq.positions.some(p => p.row === currentRow && p.col === currentCol)
        );
        if (isPartOfExistingActiveSequence) continue;

        const alreadyFoundInFoundPositions = this.foundPositions.some(pos =>
          pos.row === currentRow && pos.col === currentCol && pos.answerId === question.id && pos.letterIndex === 0
        );

        if (!alreadyFoundInFoundPositions) {
          // Iniciar nueva secuencia
          this.activeAnswerSequences.push({
            answerId: question.id,
            answerText: question.answer,
            positions: [{ row: currentRow, col: currentCol }],
            isComplete: question.answer.length === 1 // Completa si la respuesta es de 1 letra
          });
          if (question.answer.length === 1) {
             this.markAnswerAsFound(this.activeAnswerSequences[this.activeAnswerSequences.length - 1]);
          }
        }
      }
    }
    this.continueAnswerSequences(currentRow, currentCol, currentLetter);
    this.activeAnswerSequences = this.activeAnswerSequences.filter(seq => !seq.isComplete);
  }

  continueAnswerSequences(row: number, col: number, letter: string): void {
    const sequencesToKeep: AnswerSequence[] = [];

    for (let i = this.activeAnswerSequences.length - 1; i >= 0; i--) {
        let sequence = this.activeAnswerSequences[i];
        if (sequence.isComplete) {
            // sequencesToKeep.push(sequence); // No es necesario mantenerla aquí si se filtra después
            continue;
        }

        const answer = sequence.answerText;
        const nextLetterIndex = sequence.positions.length;

        if (nextLetterIndex >= answer.length) continue;

        if (answer[nextLetterIndex] === letter) {
            const lastPos = sequence.positions[nextLetterIndex - 1];
            const rowDiff = Math.abs(row - lastPos.row);
            const colDiff = Math.abs(col - lastPos.col);
            const isAdjacent = (rowDiff <= 1 && colDiff <= 1) && (rowDiff + colDiff > 0);

            // Evitar añadir la misma celda dos veces seguidas o volver a una celda ya en la secuencia.
            const currentCellAlreadyInSequence = sequence.positions.some(p => p.row === row && p.col === col);

            if (isAdjacent && !currentCellAlreadyInSequence) {
                const updatedSequence: AnswerSequence = {
                    ...sequence,
                    positions: [...sequence.positions, { row, col }],
                    isComplete: nextLetterIndex + 1 === answer.length
                };

                if (updatedSequence.isComplete) {
                    this.markAnswerAsFound(updatedSequence);
                    // No la removemos de activeAnswerSequences aquí, se filtrará al final.
                } else {
                    // Actualizar la secuencia en activeAnswerSequences
                    this.activeAnswerSequences[i] = updatedSequence;
                }
            } else if (!isAdjacent && answer[0] !== letter) {
                // No es adyacente Y la letra actual no es el inicio de esta palabra, eliminar secuencia.
                 this.activeAnswerSequences.splice(i, 1);
            }
            // Si es adyacente pero currentCellAlreadyInSequence es true, o si no es adyacente pero answer[0] === letter,
            // la secuencia se mantiene como está para este ciclo (podría ser un nuevo intento o una palabra diferente).
        } else {
            // La letra no coincide con la siguiente esperada.
            // Si la letra actual NO es la primera letra de esta secuencia, entonces esta secuencia se rompe.
            if (answer[0] !== letter) {
                 this.activeAnswerSequences.splice(i, 1);
            }
            // Si es la primera letra, se mantiene (podría ser un nuevo intento o una palabra diferente).
        }
    }
    // Filtrar duplicados y completadas al final
    this.activeAnswerSequences = this.activeAnswerSequences.filter((seq, index, self) =>
        !seq.isComplete &&
        index === self.findIndex((s) => s.answerId === seq.answerId) // Mantiene la primera instancia de cada answerId
    );
  }


  markAnswerAsFound(sequence: AnswerSequence): void {
    const questionIndex = this.currentQuestions.findIndex(q => q.id === sequence.answerId);
    if (questionIndex === -1 || this.currentQuestions[questionIndex].isFound) return;

    this.currentQuestions[questionIndex].isFound = true;
    sequence.positions.forEach((pos, index) => {
      if(this.currentQuestions[questionIndex].foundLetters.length > index){
         this.currentQuestions[questionIndex].foundLetters[index] = true;
      }
      this.questionService.markLetterFound(sequence.answerId, index);

      const alreadyInFound = this.foundPositions.some(fp => fp.row === pos.row && fp.col === pos.col && fp.answerId === sequence.answerId && fp.letterIndex === index);
      if(!alreadyInFound) {
        this.foundPositions.push({
          row: pos.row,
          col: pos.col,
          answerId: sequence.answerId,
          letterIndex: index,
          color: this.answerColors[sequence.answerId]
        });
      }
    });

    this.activeAnswerSequences = this.activeAnswerSequences.filter(seq => seq.answerId !== sequence.answerId);

    if (this.currentQuestions.every(q => q.isFound)) {
      this.finalScore = this.calculateScore();
      this.showWinMenu = true;
      this.lockKeyboard();
      this.isGameOver = true;
      if (this.timerInterval) clearInterval(this.timerInterval);
    }
    this.cdr.detectChanges();
  }

  calculateScore(): number {
    const factor = this.gameDifficulty === 'facil' ? 0.7
                 : this.gameDifficulty === 'medio' ? 0.5
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

  getQuestionProgress(questionId: string): { found: number, total: number } {
    const question = this.currentQuestions.find(q => q.id === questionId);
    if (!question || !question.answer) return { found: 0, total: 0 };
    const foundCount = question.foundLetters.filter((f: boolean) => f).length;
    return { found: foundCount, total: question.answer.length };
  }

  isQuestionLetterFound(questionId: string, letterIndex: number): boolean {
    const question = this.currentQuestions.find(q => q.id === questionId);
    // Añadir chequeo para foundLetters y su longitud
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
    this.isGameInitialized = false; // <- AÑADIR ESTA LÍNEA
    this.questionService.resetCurrentQuestionsProgress();
    this.questionService.loadGameQuestions(this.gameDifficulty);}

  lockKeyboard() { this.keyboardLocked = true; }
  unlockKeyboard() { this.keyboardLocked = false; }

  addMove(direction: 'up' | 'down' | 'left' | 'right') {
    if (this.moveSequence.length < this.steps) {
      this.moveSequence.push(direction);
    }
  }

  clearMoveSequence() {
    this.moveSequence = [];
  }

  async sendMoveSequence() {
    let movesToExecute = Math.min(this.moveSequence.length, this.steps);
    for (let i = 0; i < movesToExecute; i++) {
      this.moveCar(this.moveSequence[i]);
      await new Promise(res => setTimeout(res, 120));
      this.steps--;
      if (this.steps === 0) break;
    }
    this.clearMoveSequence();
    // Si los pasos llegan a 0, bloquear teclado y movimientos
    if (this.steps === 0) {
      this.lockKeyboard();
      this.isGameOver = true;
      this.cdr.detectChanges();
    }
  }

  submitScore() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Debes iniciar sesión para enviar tu puntaje.');
      return;
    }
    // Aquí puedes usar HttpClient directamente o un servicio
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
