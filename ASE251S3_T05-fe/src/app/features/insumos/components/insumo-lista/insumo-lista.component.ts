import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Insumo } from '../../../../core/models/insumo.model';

@Component({
  selector: 'app-insumo-lista',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './insumo-lista.component.html',
  styleUrl: './insumo-lista.component.css'
})
export class InsumoListaComponent {
  @Input() insumos: Insumo[] = [];
  @Input() mostrarInactivos: boolean = false;
  @Output() editar = new EventEmitter<Insumo>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() restaurar = new EventEmitter<number>();

  onEditar(insumo: Insumo): void {
    this.editar.emit(insumo);
  }

  onEliminar(id: number): void {
    if (confirm('¿Está seguro de eliminar este insumo?')) {
      this.eliminar.emit(id);
    }
  }

  onRestaurar(id: number): void {
    this.restaurar.emit(id);
  }
}
