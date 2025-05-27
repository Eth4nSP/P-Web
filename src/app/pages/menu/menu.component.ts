import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [RouterLink],
})
export class MenuComponent {

  onPlay() {
    console.log('¡A jugar se ha dicho!');
    // Aquí puedes redirigir a la página de juego o iniciar el juego
  }

  onScore() {
    console.log('Mostrando puntajes...');
    // Aquí puedes redirigir a la página de puntajes
  }

}
