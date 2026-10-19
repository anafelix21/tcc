import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Parcela } from '../../../../core/models/parcela.model';

@Component({
  selector: 'app-parcela-lista',
  standalone: true,
  templateUrl: './parcela-lista.component.html',
  styleUrl: './parcela-lista.component.css'
})
export class ParcelaListaComponent {
  @Input() parcelas: Parcela[] = [];
  @Input() mostrarInactivos: boolean = false;
  @Output() editar = new EventEmitter<Parcela>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() restaurar = new EventEmitter<number>();

  onEditar(parcela: Parcela): void {
    this.editar.emit(parcela);
  }

  onEliminar(id: number): void {
    if (confirm('¿Está seguro de eliminar esta parcela?')) {
      this.eliminar.emit(id);
    }
  }

  onRestaurar(id: number): void {
    this.restaurar.emit(id);
  }
}
