import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private http: HttpClient) {}

  login() {
    this.error = '';
    this.loading = true;
    this.http.post<any>('http://localhost:8000/api/login', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        if (res && res.id) {
          localStorage.setItem('userId', String(res.id));
          // Aquí puedes redirigir o mostrar éxito
          window.location.href = '/'; // Redirigir a la página principal
        } else {
          this.error = 'Credenciales incorrectas';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Credenciales incorrectas';
        this.loading = false;
      }
    });
  }
}
