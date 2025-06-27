import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Score {
  id: number;
  user_name: string;
  score: number;
  posicion: number; 
}

@Component({
  selector: 'app-puntaje',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './puntaje.component.html',
  styleUrls: ['./puntaje.component.scss']
})
export class PuntajeComponent {
  scores: Score[] = [];
  filteredScores: Score[] = [];
  search: string = '';
  loading = true;

  constructor(private http: HttpClient) {
    this.fetchScores();
  }

  fetchScores() {
    this.loading = true;
    this.http.get<Score[]>(`http://localhost:8000/index`).subscribe(scores => {
      this.scores = scores.map((s, i) => ({
        ...s,
        posicion: s.posicion ?? i + 1,
      }));
      this.filteredScores = this.scores;
      this.loading = false;
    });
  }

  onSearch() {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      this.filteredScores = this.scores;
    } else {
      this.filteredScores = this.scores.filter(s => s.user_name?.toLowerCase().includes(term));
    }
  }
}

