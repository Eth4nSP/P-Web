import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CellComponent {
  @Input() value: string = '';
  @Input() isCarPosition: boolean = false;
  @Input() isFound: boolean = false;
}