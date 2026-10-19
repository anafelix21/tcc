import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Parcela, ParcelaForm } from '../../../../core/models/parcela.model';

@Component({
  selector: 'app-parcela-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './parcela-form.component.html',
  styleUrl: './parcela-form.component.css'
})
export class ParcelaFormComponent implements OnChanges {
  @Input() parcelaEditar: Parcela | null = null;
  @Input() errorServidor: string | null = null;
  @Output() guardar = new EventEmitter<ParcelaForm>();
  @Output() cancelar = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  parcelaForm: FormGroup;
  esEdicion = false;

  validarFechaSiembra = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const fecha = new Date(control.value + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fecha > hoy) {
      return { fechaFutura: true };
    }
    return null;
  };

  constructor() {
    this.parcelaForm = this.fb.group({
      nombre:             ['', [Validators.required, Validators.minLength(3)]],
      ubicacion:          ['', [Validators.required, Validators.minLength(3)]],
      areaHectareas:      ['', [Validators.required, Validators.min(0.01)]],
      tipoSuelo:          ['', [Validators.required, Validators.minLength(2)]],
      responsable:        ['', [Validators.required, Validators.minLength(2)]],
      estadoRiego:        ['', [Validators.required, Validators.minLength(2)]],
      fechaUltimaSiembra: ['', [this.validarFechaSiembra]],
      produccionEstimada: ['', [Validators.required, Validators.minLength(2)]],
      observaciones:      ['']
    });
  }

  submitted = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['parcelaEditar']) {
      this.submitted = false;
      this.esEdicion = !!this.parcelaEditar?.idParcela;
      if (this.esEdicion && this.parcelaEditar) {
        this.parcelaForm.patchValue(this.parcelaEditar);
      } else {
        this.parcelaForm.reset();
      }
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.parcelaForm.valid) {
      const formValue = this.parcelaForm.value;
      
      const payload = {
        nombre: formValue.nombre,
        ubicacion: formValue.ubicacion,
        areaHectareas: Number(formValue.areaHectareas),
        tipoSuelo: formValue.tipoSuelo,
        responsable: formValue.responsable,
        estadoRiego: formValue.estadoRiego,
        fechaUltimaSiembra: formValue.fechaUltimaSiembra || null,
        produccionEstimada: String(formValue.produccionEstimada),
        observaciones: formValue.observaciones || "",
        cultivoActual: "", // Campo obligatorio en el DTO del backend
        enUso: false,
        estado: true
      };
      
      this.guardar.emit(payload as any);
    } else {
      this.parcelaForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.submitted = false;
    this.parcelaForm.reset();
    this.cancelar.emit();
  }

  esInvalido(name: string): boolean {
    const c = this.parcelaForm.get(name);
    return !!c && c.invalid && (this.submitted || c.dirty || c.touched);
  }
}
