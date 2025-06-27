import { Routes } from '@angular/router';
import { BoardComponent } from './board/board.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { MenuComponent } from './pages/menu/menu.component';
import { PuntajeComponent } from './pages/puntaje/puntaje.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [

  { path: '', component: MenuComponent, pathMatch: 'full' },
  { path: 'game', component: BoardComponent },
  { path: 'admin', component: AdminPanelComponent },
  { path: 'puntaje', component: PuntajeComponent }, 
  { path: 'login', component: LoginComponent},
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' } 
];

