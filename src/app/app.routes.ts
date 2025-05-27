import { Routes } from '@angular/router';
import { BoardComponent } from './board/board.component';
import { MenuComponent } from './pages/menu/menu.component';
import { PuntajeComponent } from './pages/puntaje/puntaje.component';

export const routes: Routes = [
  { path: 'game', component: BoardComponent },
  { path: '', component: MenuComponent },
  { path: 'score', component: PuntajeComponent },
  // otras rutas...
];