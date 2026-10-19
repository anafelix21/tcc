import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Usuario } from '../../../../core/models/usuario.model';

@Component({
  selector: 'app-usuario-lista',
  standalone: true,
  templateUrl: './usuario-lista.component.html',
  styleUrl: './usuario-lista.component.css'
})
export class UsuarioListaComponent {
  @Input() usuarios: Usuario[] = [];
  @Input() mostrarInactivos: boolean = false;
  @Output() editar = new EventEmitter<Usuario>();
  @Output() eliminar = new EventEmitter<number>();
  @Output() restaurar = new EventEmitter<number>();

  onEditar(usuario: Usuario): void {
    this.editar.emit(usuario);
  }

  onEliminar(id: number): void {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      this.eliminar.emit(id);
    }
  }

  onRestaurar(id: number): void {
    this.restaurar.emit(id);
  }
}
