import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  correo = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.correo || !this.password) {
      this.errorMessage.set('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.correo, this.password).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.notificationService.show({
          type: 'success',
          message: `¡Bienvenido de nuevo, ${user.nombre}!`
        });
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage.set('Correo o contraseña incorrectos.');
        } else if (err.status === 0) {
          this.errorMessage.set('No se pudo conectar con el servidor. Por favor, verifica que el backend esté encendido.');
        } else {
          this.errorMessage.set(err.error?.message || err.message || 'Error de inicio de sesión');
        }
      }
    });
  }
}
