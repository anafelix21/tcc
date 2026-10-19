import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle-filter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="filter-container">
      <button 
        class="filter-btn filter-btn--active"
        [class.filter-btn--selected]="isActive"
        (click)="onSelect(true)"
        type="button"
      >
        <span class="filter-icon">✓</span>
        <span class="filter-text">Ver Activos</span>
      </button>
      <button 
        class="filter-btn filter-btn--inactive"
        [class.filter-btn--selected]="!isActive"
        (click)="onSelect(false)"
        type="button"
      >
        <span class="filter-icon">↻</span>
        <span class="filter-text">Ver Inactivos</span>
      </button>
    </div>
  `,
  styleUrl: './toggle-filter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleFilterComponent {
  @Input() isActive = true;
  @Output() onChange = new EventEmitter<boolean>();

  onSelect(value: boolean): void {
    if (this.isActive !== value) {
      this.onChange.emit(value);
    }
  }
}

