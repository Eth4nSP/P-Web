import { Routes } from '@angular/router';
import { BoardComponent } from './board/board.component';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { MenuComponent } from './pages/menu/menu.component';


export const routes: Routes = [

  { path: '', component: MenuComponent, pathMatch: 'full' },
  { path: 'game', component: BoardComponent },
  { path: 'admin', component: AdminPanelComponent },

  { path: '**', redirectTo: '' } 
];
