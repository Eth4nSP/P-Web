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
  comando_img: string []= ["⬅️","➡️","⬆️","⬇️"];
  comandos_img: string [] = [];
  ejecutando = false;

  agregarComando(comando: string) {
    if (this.comandos.length < 20 && !this.ejecutando) {
      switch (comando){
        case "up":
          this.comandos_img.push(this.comando_img[2]);
          break;
        case "down":
          this.comandos_img.push(this.comando_img[3]);
          break;
        case "left":
          this.comandos_img.push(this.comando_img[0]);
          break;
        case "right":
          this.comandos_img.push(this.comando_img[1]);
          break;
      }
      this.comandos.push(comando);
    }
  }

  ejecutarComandos() {
    if (this.ejecutando || this.comandos.length === 0) return;

    this.ejecutando = true;
    let i = 0;

    const intervalo = setInterval(() => {
      if (i >= this.comandos.length) {
        clearInterval(intervalo);
        this.ejecutando = false;
        //this.comandos.splice(0, this.comandos.length); //limpia de forma correcta
         this.comandos = []; //limpia de forma basica
        return;
      }

      this.mover(this.comandos[i]);
      i++;
      this.comandos_img.shift();
    }, 350); // cada 350ms se mueve uno
  }

  mover(comando: string) {
    if (comando === 'up') this.y = Math.max(0, this.y - this.paso);
    else if (comando === 'down') this.y = Math.min(400, this.y + this.paso);
    else if (comando === 'left') this.x = Math.max(0, this.x - this.paso);
    else if (comando === 'right') this.x = Math.min(400, this.x + this.paso);
  }
}
