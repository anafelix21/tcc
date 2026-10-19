import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de tabla genérica reutilizable
 * Acepta cualquier tipo de dato y columnas configurables
 */
@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table class="generic-table">
        <thead>
          <tr>
            <th *ngFor="let column of columns">
              {{ column.label }}
            </th>
            <th *ngIf="showActions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="data.length === 0" class="no-data">
            <td [attr.colspan]="columns.length + (showActions ? 1 : 0)">
              No hay registros disponibles
            </td>
          </tr>
          <tr *ngFor="let row of data" [class.row--inactive]="!row.estado">
            <td *ngFor="let column of columns" class="table-cell">
              {{ getColumnValue(row, column.key) }}
            </td>
            <td *ngIf="showActions" class="table-actions">
              <button 
                *ngIf="showEdit" 
                class="btn btn--edit" 
                (click)="onEdit.emit(row)"
                title="Editar"
              >
                ✎
              </button>
              <button 
                *ngIf="showDelete && row.estado" 
                class="btn btn--delete" 
                (click)="onDelete.emit(row.idUsuario || row.idParcela || row.idProducto || row.idInsumo || row.idCultivo)"
                title="Eliminar"
              >
                🗑
              </button>
              <button 
                *ngIf="showRestore && !row.estado" 
                class="btn btn--restore" 
                (click)="onRestore.emit(row.idUsuario || row.idParcela || row.idProducto || row.idInsumo || row.idCultivo)"
                title="Restaurar"
              >
                ↻
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      overflow-x: auto;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .generic-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    thead {
      background-color: #f5f5f5;
      border-bottom: 2px solid #e0e0e0;
    }

    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #333;
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
      color: #666;
    }

    tbody tr:hover {
      background-color: #fafafa;
    }

    .row--inactive {
      opacity: 0.6;
      background-color: #f9f9f9;
    }

    .no-data {
      text-align: center;
      color: #999;
      font-style: italic;
      padding: 32px !important;
    }

    .table-actions {
      display: flex;
      gap: 8px;
      justify-content: center;
      white-space: nowrap;
    }

    .btn {
      border: none;
      background: none;
      cursor: pointer;
      font-size: 16px;
      padding: 4px 8px;
      border-radius: 3px;
      transition: all 0.2s;
    }

    .btn--edit {
      color: #0066cc;
      background-color: rgba(0, 102, 204, 0.1);
    }

    .btn--edit:hover {
      background-color: rgba(0, 102, 204, 0.2);
    }

    .btn--delete {
      color: #dc3545;
      background-color: rgba(220, 53, 69, 0.1);
    }

    .btn--delete:hover {
      background-color: rgba(220, 53, 69, 0.2);
    }

    .btn--restore {
      color: #28a745;
      background-color: rgba(40, 167, 69, 0.1);
    }

    .btn--restore:hover {
      background-color: rgba(40, 167, 69, 0.2);
    }

    @media (max-width: 768px) {
      th, td {
        padding: 8px 12px;
        font-size: 12px;
      }

      .generic-table {
        font-size: 12px;
      }
    }
  `]
})
export class GenericTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() showActions = true;
  @Input() showEdit = true;
  @Input() showDelete = true;
  @Input() showRestore = true;

  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<number>();
  @Output() onRestore = new EventEmitter<number>();

  getColumnValue(row: any, key: string): any {
    const keys = key.split('.');
    let value = row;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return '';
      }
    }
    
    // Formatear fechas
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(value).toLocaleDateString('es-ES');
    }
    
    return value ?? '';
  }
}

export interface TableColumn {
  key: string;
  label: string;
}
