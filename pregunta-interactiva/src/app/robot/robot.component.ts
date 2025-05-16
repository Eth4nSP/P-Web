import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-robot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './robot.component.html',
  styleUrls: ['./robot.component.scss']
})
export class RobotComponent {
  x = 0;
  y = 0;
  paso = 40;
  comando = '';

  procesarComando(comando: string) {
    const cmd = comando.trim().toLowerCase();

    if (cmd === 'arriba' || cmd === 'w') this.y = Math.max(0, this.y - this.paso);
    else if (cmd === 'abajo' || cmd === 's') this.y = Math.min(260, this.y + this.paso);
    else if (cmd === 'izquierda' || cmd === 'a') this.x = Math.max(0, this.x - this.paso);
    else if (cmd === 'derecha' || cmd === 'd') this.x = Math.min(460, this.x + this.paso);

    this.comando = '';
  }
}
