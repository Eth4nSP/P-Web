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
  // Guarda las posiciones específicas de las letras encontradas y su índice en la palabra
  foundPositions: {row: number, col: number, letterIndex: number}[] = [];
  private subscription: Subscription | null = null;

  constructor(private gameService: GameService) { }

  ngOnInit(): void {
    // Inicializar el arreglo foundLetters
    this.foundLetters = Array(this.targetWord.length).fill(false);
    
    // Inicializar el array de posiciones encontradas
    this.foundPositions = [];
    
    // Inicializar el tablero con letras aleatorias y la palabra en forma de serpiente
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

  // Inicializa el tablero con letras aleatorias y coloca las letras de COMPUTER en forma de serpiente
  initializeBoard(): void {
    // Crear un tablero de 8x8
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
    
    // Colocar las letras de COMPUTER en forma de serpiente
    this.placeWordAsSnake();
    
    // Colocar el auto al inicio de la serpiente, pero una casilla antes
    this.carPosition = {
      row: 3,
      col: 0
    };
    this.gameService.updateCarPosition(this.carPosition.row, this.carPosition.col);
    
    // No colocar letra en la posición del auto
    this.board[this.carPosition.row][this.carPosition.col] = ' ';
  }

  // Coloca la palabra objetivo en forma de serpiente en el tablero
  placeWordAsSnake(): void {
    const word = this.targetWord;
    
    // Iniciar en una posición fija para facilitar la depuración
    let currentRow = 3;
    let currentCol = 1;
    
    // Direcciones posibles: 0=derecha, 1=abajo, 2=izquierda, 3=arriba
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let directionIndex = 0;
    
    // Posiciones ya ocupadas por la palabra
    const occupiedPositions = new Set<string>();
    
    // Colocar cada letra de la palabra
    for (let i = 0; i < word.length; i++) {
      // Colocar la letra en la posición actual
      this.board[currentRow][currentCol] = word[i];
      occupiedPositions.add(`${currentRow},${currentCol}`);
      
      if (i < word.length - 1) {
        // Determinar la próxima dirección
        let validDirectionFound = false;
        let attempts = 0;
        const maxAttempts = 4; // Probar todas las direcciones posibles
        
        while (!validDirectionFound && attempts < maxAttempts) {
          // Calcular la próxima posición
          const nextRow = currentRow + directions[directionIndex][0];
          const nextCol = currentCol + directions[directionIndex][1];
          
          // Verificar si la posición es válida (dentro del tablero y no ocupada)
          if (
            nextRow >= 0 && nextRow < this.board.length &&
            nextCol >= 0 && nextCol < this.board[0].length &&
            !occupiedPositions.has(`${nextRow},${nextCol}`)
          ) {
            // Actualizar la posición actual
            currentRow = nextRow;
            currentCol = nextCol;
            validDirectionFound = true;
          } else {
            // Cambiar la dirección
            directionIndex = (directionIndex + 1) % 4;
            attempts++;
          }
        }
        
        // Si no se encontró una dirección válida, buscar cualquier posición disponible
        if (!validDirectionFound) {
          for (let r = 0; r < this.board.length; r++) {
            for (let c = 0; c < this.board[0].length; c++) {
              if (!occupiedPositions.has(`${r},${c}`)) {
                currentRow = r;
                currentCol = c;
                validDirectionFound = true;
                break;
              }
            }
            if (validDirectionFound) break;
          }
        }
      }
    }
  }

  // Verifica si la posición actual del carro contiene una letra de la palabra objetivo
  checkLetter(): void {
    const currentRow = this.carPosition.row;
    const currentCol = this.carPosition.col;
    const currentLetter = this.board[currentRow][currentCol];
    
    // Buscar la posición de la letra en la palabra objetivo
    for (let i = 0; i < this.targetWord.length; i++) {
      if (this.targetWord[i] === currentLetter) {
        // Verificar si ya hemos encontrado esta letra específica en otra posición
        const letterPositionAlreadyFound = this.foundPositions.some(pos => pos.letterIndex === i);
        
        if (!letterPositionAlreadyFound) {
          // Marcar la letra como encontrada en la palabra
          this.foundLetters[i] = true;
          
          // Guardar la posición específica donde se encontró la letra
          this.foundPositions.push({ row: currentRow, col: currentCol, letterIndex: i });
          
          // Solo encontramos la primera ocurrencia de la letra
          break;
        }
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