import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification } from '../models/api-response.model';

/**
 * Servicio de notificaciones global
 * Proporciona feedback visual al usuario
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  public notification$: Observable<Notification | null> = this.notificationSubject.asObservable();

  /**
   * Mostrar notificación
   */
  show(notification: Notification): void {
    const id = this.generateId();
    const notificationWithId = { ...notification, id, duration: notification.duration || 3000 };
    
    this.notificationSubject.next(notificationWithId);

    if (notificationWithId.duration && notificationWithId.duration > 0) {
      setTimeout(() => {
        if (this.notificationSubject.value?.id === id) {
          this.notificationSubject.next(null);
        }
      }, notificationWithId.duration);
    }
  }

  /**
   * Limpiar notificación actual
   */
  clear(): void {
    this.notificationSubject.next(null);
  }

  /**
   * Generar ID único para cada notificación
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
