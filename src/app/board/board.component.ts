import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellComponent } from '../cell/cell.component';
import { GameService } from '../game.service';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

interface FoundPosition {
  row: number;
  col: number;
  word: string;
  letterIndex: number;
  color: string;
}

interface WordSequence {
  word: string;
  positions: { row: number, col: number }[];
  isComplete: boolean;
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
  steps: number = 0;
  board: string[][] = [];
  carPosition = { row: 0, col: 0 };
  words: string[] = ['COMPUTER', 'VARIABLE', 'FUNCTION', 'CLASS', 'PYTHON', 'GO'];
  foundPositions: FoundPosition[] = [];
  activeWordSequences: WordSequence[] = [];
  
  // Colores para cada palabra encontrada
  wordColors: {[key: string]: string} = {
    'COMPUTER': '#FF5733', // Rojo anaranjado
    'VARIABLE': '#FFC300', // Amarillo dorado
    'FUNCTION': '#FF8C00', // Naranja oscuro
    'CLASS': '#FF6347',    // Tomate
    'PYTHON': '#FF4500',   // Rojo-naranja
    'GO': '#DC143C'        // Carmesí
  };

  // Objeto para rastrear las letras encontradas de cada palabra
  wordLetterStates: { [key: string]: boolean[] } = {};
  private subscription: Subscription | null = null;

  // Detectar dispositivo para adaptar el layout
  isMobileDevice: boolean = false;
  
  constructor(private gameService: GameService) { }
  
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Controlar el juego con las teclas de flecha
    switch(event.key) {
      case 'ArrowUp':
        this.moveCar('up');
        this.steps++;
        break;
      case 'ArrowDown':
        this.moveCar('down');
        this.steps++;
        break;
      case 'ArrowLeft':
        this.moveCar('left');
        this.steps++;
        break;
      case 'ArrowRight':
        this.moveCar('right');
        this.steps++;
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
    // Verificar el tipo de dispositivo
    this.checkDeviceType();
    
    // Inicializar el estado de las letras encontradas para cada palabra
    this.words.forEach(word => {
      this.wordLetterStates[word] = Array(word.length).fill(false);
    });
    
    // Inicializar el array de posiciones encontradas y secuencias de palabras
    this.foundPositions = [];
    this.activeWordSequences = [];
    
    // Inicializar el tablero con letras aleatorias y colocar las palabras
    this.initializeBoard();
    
    // Suscribirse a los cambios de posición del carro
    this.subscription = this.gameService.getCarPosition().subscribe(position => {
      this.carPosition = position;
      
      // Verificar si la posición actual puede continuar una secuencia de palabra
      this.checkForWordSequence();
    });
  }

  ngOnDestroy(): void {
    // Limpiar la suscripción para evitar memory leaks
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Inicializa el tablero con letras aleatorias y coloca las palabras
  initializeBoard(): void {
    // Crear un tablero de 10x10
    const rows = 10;
    const cols = 10;
    
    // Inicializar el tablero con letras aleatorias
    this.board = [];
    for (let i = 0; i < rows; i++) {
      this.board[i] = [];
      for (let j = 0; j < cols; j++) {
        // Generar letra aleatoria (A-Z)
        const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        this.board[i][j] = randomLetter;
      }
    }
    
    // Colocar las palabras en el tablero de forma aleatoria
    this.placeWordsRandomly();
    
    // Colocar el auto en una posición aleatoria que no contenga una letra de palabra
    this.placeCarRandomly();
  }

  // Coloca las palabras en el tablero aleatoriamente con diferentes orientaciones permitidas
  placeWordsRandomly(): void {
    // Mapa para rastrear las posiciones ocupadas
    const occupiedPositions = new Set<string>();
    
    // Colocar cada palabra
    for (const word of this.words) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100; // Límite de intentos por palabra
      
      while (!placed && attempts < maxAttempts) {
        attempts++;
        
        // Elegir una orientación aleatoria: 0=horizontal, 1=vertical, 4=diagonal (tipo grada)
        const orientation = Math.floor(Math.random() * 3);
        const actualOrientation = orientation === 2 ? 4 : orientation; // Si es 2, usamos la diagonal (4)
        
        // Intentar colocar la palabra con la orientación elegida
        placed = this.tryPlaceWord(word, actualOrientation, occupiedPositions);
      }
      
      if (!placed) {
        console.warn(`No se pudo colocar la palabra: ${word}`);
      }
    }
  }

  // Intenta colocar una palabra en el tablero con la orientación especificada
  tryPlaceWord(word: string, orientation: number, occupiedPositions: Set<string>): boolean {
    const rows = this.board.length;
    const cols = this.board[0].length;
    
    // Determinar límites para la posición inicial según la orientación
    let startRowLimit = rows;
    let startColLimit = cols;
    
    switch (orientation) {
      case 0: // Horizontal
        startColLimit = cols - word.length + 1;
        break;
      case 1: // Vertical
        startRowLimit = rows - word.length + 1;
        break;
      case 4: // Diagonal (tipo grada)
        startRowLimit = rows - Math.ceil(word.length / 2);
        startColLimit = cols - Math.ceil(word.length / 2);
        break;
    }
    
    // Si no hay espacio suficiente, regresar falso
    if (startRowLimit <= 0 || startColLimit <= 0) {
      return false;
    }
    
    // Elegir una posición inicial aleatoria
    const startRow = Math.floor(Math.random() * startRowLimit);
    const startCol = Math.floor(Math.random() * startColLimit);
    
    // Verificar si la palabra cabe en la orientación seleccionada
    const positions: [number, number][] = [];
    
    if (orientation === 4) { // Diagonal tipo grada
      return this.placeWordAsGradient(word, startRow, startCol, occupiedPositions);
    } else {
      // Direcciones para las orientaciones 0-1
      const directions = [
        [0, 1],  // Horizontal
        [1, 0],  // Vertical
      ];
      
      const [rowDir, colDir] = directions[orientation];
      
      // Verificar si la palabra cabe sin superponerse con otras
      for (let i = 0; i < word.length; i++) {
        const row = startRow + i * rowDir;
        const col = startCol + i * colDir;
        
        // Verificar si está dentro del tablero
        if (row < 0 || row >= rows || col < 0 || col >= cols) {
          return false;
        }
        
        // Verificar si la posición ya está ocupada por otra letra
        const posKey = `${row},${col}`;
        if (occupiedPositions.has(posKey) && this.board[row][col] !== word[i]) {
          return false;
        }
        
        positions.push([row, col]);
      }
      
      // Colocar la palabra en el tablero
      for (let i = 0; i < word.length; i++) {
        const [row, col] = positions[i];
        this.board[row][col] = word[i];
        occupiedPositions.add(`${row},${col}`);
      }
      
      return true;
    }
  }

  // Coloca una palabra en forma de grada - diagonal organizada
  placeWordAsGradient(word: string, startRow: number, startCol: number, occupiedPositions: Set<string>): boolean {
    const rows = this.board.length;
    const cols = this.board[0].length;
    
    // Elegir dirección de la grada: 0=diagonal↘, 1=diagonal↗
    const direction = Math.floor(Math.random() * 2);
    
    // Posiciones para esta palabra
    const wordPositions: [number, number][] = [];
    
    // Intentar colocar cada letra de la palabra
    for (let i = 0; i < word.length; i++) {
      let currentRow, currentCol;
      
      if (direction === 0) { // Diagonal hacia abajo-derecha
        currentRow = startRow + i;
        currentCol = startCol + i;
      } else { // Diagonal hacia arriba-derecha
        currentRow = startRow - i;
        currentCol = startCol + i;
      }
      
      // Verificar si la posición está fuera del tablero
      if (currentRow < 0 || currentRow >= rows || currentCol < 0 || currentCol >= cols) {
        return false;
      }
      
      // Verificar si la posición está ocupada
      const posKey = `${currentRow},${currentCol}`;
      if (occupiedPositions.has(posKey) && this.board[currentRow][currentCol] !== word[i]) {
        return false;
      }
      
      wordPositions.push([currentRow, currentCol]);
    }
    
    // Colocar la palabra en el tablero
    for (let i = 0; i < word.length; i++) {
      const [row, col] = wordPositions[i];
      this.board[row][col] = word[i];
      occupiedPositions.add(`${row},${col}`);
    }
    
    return true;
  }

  // Coloca el auto en una posición aleatoria que no contenga una letra de palabra
  placeCarRandomly(): void {
    const rows = this.board.length;
    const cols = this.board[0].length;
    
    // Crear un conjunto de posiciones ocupadas por palabras
    const wordPositions = new Set<string>();
    this.foundPositions.forEach(pos => {
      wordPositions.add(`${pos.row},${pos.col}`);
    });
    
    // Intentar encontrar una posición aleatoria no ocupada
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!placed && attempts < maxAttempts) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      // Verificar si no es parte de una palabra
      if (!wordPositions.has(`${row},${col}`)) {
        this.carPosition = { row, col };
        this.gameService.updateCarPosition(row, col);
        placed = true;
      }
      
      attempts++;
    }
    
    // Si no se encontró una posición libre, usar la posición (0,0)
    if (!placed) {
      this.carPosition = { row: 0, col: 0 };
      this.gameService.updateCarPosition(0, 0);
    }
  }

  // VERSIÓN MEJORADA: Verificar si la posición actual puede iniciar o continuar una secuencia de palabra
  checkForWordSequence(): void {
    const currentRow = this.carPosition.row;
    const currentCol = this.carPosition.col;
    const currentLetter = this.board[currentRow][currentCol];
    
    // Para cada palabra, comprobamos si se puede iniciar una nueva secuencia
    for (const word of this.words) {
      // Si la letra actual coincide con la primera letra de la palabra
      if (word[0] === currentLetter) {
        // Verificar si esta posición ya es parte de una secuencia encontrada
        const alreadyFound = this.foundPositions.some(pos => 
          pos.row === currentRow && pos.col === currentCol);
          
        if (!alreadyFound) {
          // Iniciar una nueva secuencia potencial
          this.activeWordSequences.push({
            word: word,
            positions: [{ row: currentRow, col: currentCol }],
            isComplete: false
          });
        }
      }
    }
    
    // Comprobamos si la letra actual continúa alguna secuencia activa
    this.continueWordSequences(currentRow, currentCol, currentLetter);
  }
  
  // Verificar si la posición actual continúa alguna secuencia activa
  continueWordSequences(row: number, col: number, letter: string): void {
    const newSequences: WordSequence[] = [];
    
    // Para cada secuencia activa
    for (const sequence of this.activeWordSequences) {
      if (sequence.isComplete) {
        newSequences.push(sequence);
        continue;
      }
      
      const word = sequence.word;
      const nextLetterIndex = sequence.positions.length;
      
      // Si ya hemos encontrado toda la palabra, continuamos
      if (nextLetterIndex >= word.length) {
        continue;
      }
      
      // Si la letra actual coincide con la siguiente letra esperada
      if (word[nextLetterIndex] === letter) {
        // La última posición en la secuencia
        const lastPos = sequence.positions[sequence.positions.length - 1];
        
        // Comprobar si la posición actual es adyacente a la última
        const rowDiff = Math.abs(row - lastPos.row);
        const colDiff = Math.abs(col - lastPos.col);
        
        // Si la posición actual es adyacente a la última posición
        if ((rowDiff <= 1 && colDiff <= 1) && (rowDiff + colDiff > 0)) {
          // Crear una copia de la secuencia y añadir la nueva posición
          const updatedSequence = {
            word: sequence.word,
            positions: [...sequence.positions, { row, col }],
            isComplete: nextLetterIndex + 1 === word.length
          };
          
          // Si hemos completado la palabra
          if (updatedSequence.isComplete) {
            // Marcar las letras como encontradas
            this.markWordAsFound(updatedSequence);
          }
          
          newSequences.push(updatedSequence);
        } else {
          // Si no es adyacente, mantenemos la secuencia original
          newSequences.push(sequence);
        }
      } else {
        // Si la letra no coincide, mantenemos la secuencia original
        newSequences.push(sequence);
      }
    }
    
    this.activeWordSequences = newSequences;
  }
  
  // Marcar una palabra como encontrada
  markWordAsFound(sequence: WordSequence): void {
    const word = sequence.word;
    
    // Verificar si esta palabra ya ha sido completamente encontrada
    const isAlreadyComplete = this.isWordComplete(word);
    if (isAlreadyComplete) {
      return;
    }
    
    // Marcar todas las letras de la palabra como encontradas
    for (let i = 0; i < sequence.positions.length; i++) {
      const pos = sequence.positions[i];
      
      // Actualizar el estado de las letras encontradas
      this.wordLetterStates[word][i] = true;
      
      // Añadir a las posiciones encontradas
      this.foundPositions.push({
        row: pos.row,
        col: pos.col,
        word: word,
        letterIndex: i,
        color: this.wordColors[word]
      });
    }
  }
  
  // Comprobar si una palabra está completamente encontrada
  isWordComplete(word: string): boolean {
    if (!this.wordLetterStates[word]) {
      return false;
    }
    
    return this.wordLetterStates[word].every(found => found);
  }

  isCarPosition(i: number, j: number): boolean {
    return this.carPosition.row === i && this.carPosition.col === j;
  }

  getPositionColor(i: number, j: number): string | undefined {
    const foundPosition = this.foundPositions.find(pos => pos.row === i && pos.col === j);
    return foundPosition ? foundPosition.color : undefined;
  }

  isPositionFound(i: number, j: number): boolean {
    // Verificar si esta posición específica está en la lista de posiciones encontradas
    return this.foundPositions.some(pos => pos.row === i && pos.col === j);
  }

  isLetterFound(word: string, letterIndex: number): boolean {
    return this.wordLetterStates[word][letterIndex];
  }

  getWordProgress(word: string): number {
    // Contar cuántas letras se han encontrado de esta palabra
    let count = 0;
    for (let i = 0; i < word.length; i++) {
      if (this.wordLetterStates[word][i]) {
        count++;
      }
    }
    return count;
  }

  moveCar(direction: 'up'|'down'|'left'|'right'): void {
    const newPos = { ...this.carPosition };
    
    switch (direction) {
      case 'up':    
        if (newPos.row > 0) newPos.row--;
        this.steps++;
        break;
      case 'down':  
        if (newPos.row < this.board.length - 1) newPos.row++;
        this.steps++;
        break;
      case 'left':  
        if (newPos.col > 0) newPos.col--;
        this.steps++;
        break;
      case 'right':
        if (newPos.col < this.board[0].length - 1) newPos.col++;
        this.steps++;
        break;
    }
    
    this.gameService.updateCarPosition(newPos.row, newPos.col);
  }

  resetGame(): void {
    // Reiniciar el juego
    this.initializeBoard();
    this.foundPositions = [];
    this.activeWordSequences = [];
    
    // Reiniciar el estado de las letras encontradas
    this.words.forEach(word => {
      this.wordLetterStates[word] = Array(word.length).fill(false);
    });
    
    // Colocar el auto en una nueva posición aleatoria
    this.placeCarRandomly();
    this.steps = 0;
  }

  countSteps(): number {
    // Contar los pasos desde la posición inicial del carro hasta la actual
    return Math.abs(this.carPosition.row) + Math.abs(this.carPosition.col);
  }
}