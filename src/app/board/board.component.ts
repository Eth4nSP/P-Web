import { Component, OnInit } from '@angular/core';
import { CommonModule }           from '@angular/common';
import { CellComponent }          from '../cell/cell.component';
import { GameService }            from '../game.service';

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
export class BoardComponent implements OnInit {
  board: string[][] = [];
  carPosition = { row: 0, col: 0 };
  targetWord = 'COMPUTER';
  foundLetters: boolean[] = [];

  constructor(private gameService: GameService) { }

  ngOnInit(): void {
    // Inicializa `board` y suscribe gameService.getCarPosition()
  }

  isCarPosition(i: number, j: number): boolean {
    return this.carPosition.row === i && this.carPosition.col === j;
  }

  isLetterFound(i: number, j: number): boolean {
    const letter = this.board[i][j];
    const idx = this.targetWord.indexOf(letter);
    return idx >= 0 && this.foundLetters[idx];
  }

  moveCar(direction: 'up'|'down'|'left'|'right'): void {
    const newPos = { ...this.carPosition };
    switch (direction) {
      case 'up':    if (newPos.row > 0)                    newPos.row--; break;
      case 'down':  if (newPos.row < this.board.length - 1) newPos.row++; break;
      case 'left':  if (newPos.col > 0)                    newPos.col--; break;
      case 'right': if (newPos.col < this.board[0].length - 1) newPos.col++; break;
    }
    this.gameService.updateCarPosition(newPos.row, newPos.col);
  }
}
