import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Componente de diálogo de confirmación reutilizable
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
      ])
    ])
  ]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmar';
  @Input() message = '¿Está seguro?';
  @Input() confirmButtonText = 'Confirmar';
  @Input() cancelButtonText = 'Cancelar';
  @Input() isDanger = false;

  @Output() onConfirmClick = new EventEmitter<void>();
  @Output() onCancelClick = new EventEmitter<void>();

  onConfirm(): void {
    this.onConfirmClick.emit();
  }

  onCancel(): void {
    this.onCancelClick.emit();
  }
}
