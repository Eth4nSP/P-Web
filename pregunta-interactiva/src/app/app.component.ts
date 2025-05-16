import { Component } from '@angular/core';
import { RobotComponent } from './robot/robot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RobotComponent],
  template: `<app-robot></app-robot>`, // lo mostramos directamente
})
export class AppComponent {}
