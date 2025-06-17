import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  error = '';
  loading = false;
  success = false;

  constructor(private http: HttpClient) {}

  register() {
    this.error = '';
    this.success = false;
    this.loading = true;
    this.http.post<any>('http://localhost:8000/api/register', {
      name: this.name,
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.success = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al registrar';
        this.loading = false;
      }
    });
  }
}
