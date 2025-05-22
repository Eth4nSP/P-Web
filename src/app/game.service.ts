import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface Position {
  row: number;
  col: number;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private carPositionSubject = new BehaviorSubject<Position>({ row: 0, col: 0 });
  
  constructor() {}
  
  updateCarPosition(row: number, col: number): void {
    this.carPositionSubject.next({ row, col });
  }
  
  getCarPosition(): Observable<Position> {
    return this.carPositionSubject.asObservable();
  }
}