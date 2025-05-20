import { Component } from '@angular/core';
import { BoardComponent } from './board/board.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, BoardComponent]
})
export class AppComponent {
  title = 'Juego Computer';
}