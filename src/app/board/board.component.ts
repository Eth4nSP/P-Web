import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellComponent } from '../cell/cell.component';
import { GameService } from '../game.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    CellComponent
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {
  board: string[][] = [];
  carPosition = { row: 0, col: 0 };
  targetWord = 'COMPUTER';
  foundLetters: boolean[] = [];
  // Guarda las posiciones específicas de las letras encontradas
  foundPositions: {row: number, col: number}[] = [];
  private subscription: Subscription | null = null;

  constructor(private gameService: GameService) { }

  ngOnInit(): void {
    // Inicializar el arreglo foundLetters
    this.foundLetters = Array(this.targetWord.length).fill(false);
    // Inicializar el array de posiciones encontradas
    this.foundPositions = [];
    
    // Inicializar el tablero con letras aleatorias
    this.initializeBoard();
    
    // Suscribirse a los cambios de posición del carro
    this.subscription = this.gameService.getCarPosition().subscribe(position => {
      this.carPosition = position;
      
      // Verificar si la posición actual contiene una letra de la palabra objetivo
      this.checkLetter();
    });
  }

  ngOnDestroy(): void {
    // Limpiar la suscripción para evitar memory leaks
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Inicializa el tablero con letras aleatorias y coloca las letras de COMPUTER secuencialmente
  initializeBoard(): void {
    // Crear un tablero de 8x8
    const rows = 8;
    const cols = 8;
    
    // Inicializar el tablero con letras aleatorias
    for (let i = 0; i < rows; i++) {
      this.board[i] = [];
      for (let j = 0; j < cols; j++) {
        // Generar letra aleatoria (A-Z)
        const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        this.board[i][j] = randomLetter;
      }
    }
    
    // Determinar punto de inicio para colocar las letras consecutivamente
    // Elegimos empezar en una posición del borde para tener espacio
    // Por ejemplo, colocamos la primera letra en (3,1)
    let startRow = 3;
    let startCol = 1;
    
    // Colocar el auto en (3,0) - a la izquierda de la primera letra
    this.carPosition = { row: startRow, col: startCol - 1 };
    this.gameService.updateCarPosition(this.carPosition.row, this.carPosition.col);

    // Limpiamos la posición del auto para que no tenga letra
    this.board[this.carPosition.row][this.carPosition.col] = ' ';
    
    // Colocar las letras de COMPUTER consecutivamente en horizontal
    for (let i = 0; i < this.targetWord.length; i++) {
      // Si llegamos al borde del tablero, pasamos a la siguiente fila
      if (startCol + i >= cols) {
        startRow++;
        startCol = 1;
      }
      
      // Colocar la letra en el tablero
      const letterCol = (startCol + i) % cols;
      const letterRow = startRow + Math.floor((startCol + i) / cols);
      
      if (letterRow < rows) {
        this.board[letterRow][letterCol] = this.targetWord[i];
      }
    }
  }

  // Verifica si la posición actual del carro contiene una letra de la palabra objetivo
  checkLetter(): void {
    const currentRow = this.carPosition.row;
    const currentCol = this.carPosition.col;
    const currentLetter = this.board[currentRow][currentCol];
    
    // Buscar la posición exacta de la letra en la palabra objetivo
    for (let i = 0; i < this.targetWord.length; i++) {
      if (this.targetWord[i] === currentLetter) {
        // Marcar la letra como encontrada en la palabra
        this.foundLetters[i] = true;
        
        // Guardar la posición específica donde se encontró la letra
        const alreadyFound = this.foundPositions.some(
          pos => pos.row === currentRow && pos.col === currentCol
        );
        
        if (!alreadyFound) {
          this.foundPositions.push({ row: currentRow, col: currentCol });
        }
        
        break;
      }
    }
  }

  isCarPosition(i: number, j: number): boolean {
    return this.carPosition.row === i && this.carPosition.col === j;
  }

  isLetterFound(i: number, j: number): boolean {
    // Verificar si esta posición específica está en la lista de posiciones encontradas
    return this.foundPositions.some(pos => pos.row === i && pos.col === j);
  }

  moveCar(direction: 'up'|'down'|'left'|'right'): void {
    const newPos = { ...this.carPosition };
    switch (direction) {
      case 'up':    if (newPos.row > 0) newPos.row--; break;
      case 'down':  if (newPos.row < this.board.length - 1) newPos.row++; break;
      case 'left':  if (newPos.col > 0) newPos.col--; break;
      case 'right': if (newPos.col < this.board[0].length - 1) newPos.col++; break;
    }
    
    this.gameService.updateCarPosition(newPos.row, newPos.col);
  }
}