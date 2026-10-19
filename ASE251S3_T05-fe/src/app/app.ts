import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NotificationComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  authService = inject(AuthService);
}
