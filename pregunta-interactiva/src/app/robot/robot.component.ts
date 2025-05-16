import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-robot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './robot.component.html',
  styleUrls: ['./robot.component.scss']
})
export class RobotComponent {
  x = 0;
  y = 0;
  paso = 40;
  comandos: string[] = [];

  procesarComando(comando: string) {
    // Guardar el comando
    if (this.comandos.length < 20) {
    this.comandos.push(comando);
    } else {
    // Opcional: reemplazar el más antiguo (FIFO) o ignorar si ya hay 20
    this.comandos.shift(); // Elimina el primero
    this.comandos.push(comando); // Agrega el nuevo al final
    }

    // Procesar movimiento
    if (comando === 'up') this.y = Math.max(0, this.y - this.paso);
    else if (comando === 'down') this.y = Math.min(260, this.y + this.paso);
    else if (comando === 'left') this.x = Math.max(0, this.x - this.paso);
    else if (comando === 'right') this.x = Math.min(460, this.x + this.paso);
  }
}
