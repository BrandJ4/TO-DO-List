import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './login.html', // <-- CORREGIDO: apuntando a login.html
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  private ADMIN_USER = 'admin';
  private WORKER_USER = 'juan';
  private PASSWORD = '123';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;

      if (password !== this.PASSWORD) {
        this.showError('Contraseña incorrecta.');
        return;
      }

      if (username === this.ADMIN_USER) {
        // Redirigir como Administrador
        this.router.navigate(['/dashboard'], { queryParams: { role: 'admin' } });
      } else if (username === this.WORKER_USER) {
        // Redirigir como Trabajador (Juan)
        this.router.navigate(['/dashboard'], { queryParams: { role: 'worker', name: 'Juan García', area: 'INGENIERÍA' } });
      } else {
        this.showError('Usuario no encontrado.');
      }
    }
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}