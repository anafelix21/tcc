import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/api-response.model';

/**
 * Componente de notificación reutilizable
 * Se conecta al servicio de notificaciones para mostrar mensajes
 */
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationComponent implements OnInit {
  private notificationService = inject(NotificationService);
  notification: Notification | null = null;

  ngOnInit(): void {
    this.notificationService.notification$.subscribe(notification => {
      this.notification = notification;
    });
  }

  close(): void {
    this.notificationService.clear();
  }

  getIcon(): string {
    switch (this.notification?.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  }
}
