import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Cultivo, CultivoDTO } from '../../../../core/models/cultivo.model';
import { Parcela } from '../../../../core/models/parcela.model';
import { ParcelaService } from '../../../parcelas/services/parcela.service';

@Component({
  selector: 'app-cultivo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cultivo-form.component.html',
  styleUrl: './cultivo-form.component.css'
})
export class CultivoFormComponent implements OnInit, OnChanges {
  @Input() cultivoEditar: Cultivo | null = null;
  @Input() errorServidor: string | null = null;
  @Output() guardar = new EventEmitter<CultivoDTO>();
  @Output() cancelar = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private parcelaService = inject(ParcelaService);

  cultivoForm: FormGroup;
  esEdicion = false;
  parcelas: Parcela[] = [];

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
    this.cultivoForm = this.fb.group({
      parcelaId: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      tipoCultivo: ['', [Validators.required, Validators.minLength(2)]],
      frecuenciaRiegoDias: ['', [Validators.required, Validators.min(1), Validators.max(365)]],
      temperaturaIdeal: ['', [Validators.required, Validators.min(-10), Validators.max(60)]],
      fechaSiembra: ['', [this.validarFechaSiembra]],
      requiereSombra: [false],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.parcelaService.obtenerPorEstado(true).subscribe({
      next: (data) => this.parcelas = data,
      error: () => this.parcelas = []
    });
  }

  submitted = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cultivoEditar']) {
      this.submitted = false;
      this.esEdicion = !!this.cultivoEditar?.idCultivo;
      if (this.esEdicion && this.cultivoEditar) {
        this.cultivoForm.patchValue({
          parcelaId: this.cultivoEditar.parcela?.idParcela ?? '',
          nombre: this.cultivoEditar.nombre,
          tipoCultivo: this.cultivoEditar.tipoCultivo,
          frecuenciaRiegoDias: this.cultivoEditar.frecuenciaRiegoDias,
          temperaturaIdeal: this.cultivoEditar.temperaturaIdeal,
          fechaSiembra: this.cultivoEditar.fechaSiembra || '',
          requiereSombra: this.cultivoEditar.requiereSombra,
          observaciones: this.cultivoEditar.observaciones || ''
        });
      } else {
        this.cultivoForm.reset({ requiereSombra: false });
      }
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.cultivoForm.valid) {
      const formValue = this.cultivoForm.value;

      // El backend espera { parcela: { idParcela: X }, ... }
      // El formulario tiene { parcelaId: X, ... }
      const payload = {
        parcela: { idParcela: Number(formValue.parcelaId) },
        nombre: formValue.nombre,
        tipoCultivo: formValue.tipoCultivo,
        frecuenciaRiegoDias: Number(formValue.frecuenciaRiegoDias),
        temperaturaIdeal: Number(formValue.temperaturaIdeal),
        fechaSiembra: formValue.fechaSiembra || null,
        requiereSombra: formValue.requiereSombra,
        observaciones: formValue.observaciones || null
      };

      this.guardar.emit(payload as any);
    } else {
      this.cultivoForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.submitted = false;
    this.cultivoForm.reset({ requiereSombra: false });
    this.cancelar.emit();
  }

  esInvalido(controlName: string): boolean {
    const control = this.cultivoForm.get(controlName);
    return !!control && control.invalid && (this.submitted || control.dirty || control.touched);
  }
}
