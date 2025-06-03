import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // RouterLink y RouterLinkActive para la navegación

@Component({
  selector: 'app-root',
  standalone: true,
  // Si BoardComponent se carga a través del router-outlet, no necesitas importarlo aquí.
  // Solo necesitas RouterOutlet y CommonModule (y RouterLink/RouterLinkActive si los usas en esta plantilla).
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Sopa de Letras Dinámica'; // Título actualizado
}
