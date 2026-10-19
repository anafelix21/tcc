import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Insumo, InsumoForm } from '../../../../core/models/insumo.model';

@Component({
  selector: 'app-insumo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './insumo-form.component.html',
  styleUrl: './insumo-form.component.css'
})
export class InsumoFormComponent implements OnChanges {
  @Input() insumoEditar: Insumo | null = null;
  @Input() errorServidor: string | null = null;
  @Output() guardar = new EventEmitter<InsumoForm>();
  @Output() cancelar = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  insumoForm: FormGroup;
  esEdicion = false;
  
  unidadesPermitidas = [
    { value: 'kg', label: 'Kilogramo (kg)' },
    { value: 'g', label: 'Gramo (g)' },
    { value: 'L', label: 'Litro (L)' },
    { value: 'ml', label: 'Mililitro (ml)' },
    { value: 'unidad', label: 'Unidad (unidad)' },
    { value: 'bolsa', label: 'Bolsa (bolsa)' },
    { value: 'saco', label: 'Saco (saco)' },
    { value: 'bidon', label: 'Bidón (bidon)' },
    { value: 'tonelada', label: 'Tonelada (tonelada)' }
  ];

  constructor() {
    this.insumoForm = this.fb.group({
      nombre:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      descripcion:  ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
      precio:       ['', [Validators.required, Validators.min(0.01), Validators.max(50000)]],
      stock:        ['', [Validators.required, Validators.min(0), Validators.max(1000000)]],
      unidadMedida: ['', Validators.required],
      tipoInsumo:   ['', Validators.required],
      proveedor:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      presentacion: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  submitted = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['insumoEditar']) {
      this.submitted = false;
      this.esEdicion = !!this.insumoEditar?.idInsumo;
      if (this.esEdicion && this.insumoEditar) {
        this.insumoForm.patchValue(this.insumoEditar);
      } else {
        this.insumoForm.reset();
      }
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.insumoForm.valid) {
      this.guardar.emit(this.insumoForm.value);
    } else {
      this.insumoForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.submitted = false;
    this.insumoForm.reset();
    this.cancelar.emit();
  }

  esInvalido(name: string): boolean {
    const c = this.insumoForm.get(name);
    return !!c && c.invalid && (this.submitted || c.dirty || c.touched);
  }
}
