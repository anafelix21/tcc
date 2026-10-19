import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Usuario, UsuarioForm } from '../../../../core/models/usuario.model'; 

const SOLO_LETRAS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css'
})
export class UsuarioFormComponent implements OnChanges {
  @Input() usuarioEditar: Usuario | null = null;
  @Input() errorServidor: string | null = null;
  @Output() guardar = new EventEmitter<UsuarioForm>();
  @Output() cancelar = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  usuarioForm: FormGroup;
  esEdicion = false;

  constructor() {
    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.pattern(SOLO_LETRAS_REGEX)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.pattern(SOLO_LETRAS_REGEX)]],
      correo: ['', [Validators.required, Validators.email]],
      rol: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fechaNacimiento: ['', Validators.required], 
      fechaContratacion: ['', Validators.required] 
    }, { 
      validators: this.validarFechas 
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuarioEditar']) {
      this.submitted = false;
      this.esEdicion = !!this.usuarioEditar?.idUsuario;
      if (this.esEdicion && this.usuarioEditar) {
        this.usuarioForm.patchValue({
          nombre: this.usuarioEditar.nombre,
          apellido: this.usuarioEditar.apellido,
          correo: this.usuarioEditar.correo,
          rol: this.usuarioEditar.rol,
          fechaNacimiento: this.usuarioEditar.fechaNacimiento || '',
          fechaContratacion: this.usuarioEditar.fechaContratacion || '',
          password: ''
        });
        this.usuarioForm.get('password')?.setValidators([Validators.minLength(6)]);
        this.usuarioForm.get('password')?.updateValueAndValidity();
      } else {
        this.usuarioForm.reset();
        this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.usuarioForm.get('password')?.updateValueAndValidity();
      }
    }
  }

  validarFechas = (group: AbstractControl): ValidationErrors | null => {
    const formGroup = group as FormGroup;
    const nacCtrl = formGroup.get('fechaNacimiento');
    const contratCtrl = formGroup.get('fechaContratacion');

    if (!nacCtrl || !contratCtrl) return null;

    this.limpiarErrorEspecifico(nacCtrl, 'menorDeEdad');
    this.limpiarErrorEspecifico(contratCtrl, 'relacionInvalida');
    this.limpiarErrorEspecifico(contratCtrl, 'fechaFutura');
    this.limpiarErrorEspecifico(contratCtrl, 'rangoInvalido');

    const fechaNacVal = nacCtrl.value;
    const fechaContratVal = contratCtrl.value;

    if (!fechaNacVal || !fechaContratVal) return null;

    const nac = new Date(fechaNacVal + 'T00:00:00');
    const contrat = new Date(fechaContratVal + 'T00:00:00');
    
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(hoy.getDate() - 7);
    unaSemanaAtras.setHours(0,0,0,0);

    let edadActual = hoy.getFullYear() - nac.getFullYear();
    const mesA = hoy.getMonth() - nac.getMonth();
    if (mesA < 0 || (mesA === 0 && hoy.getDate() < nac.getDate())) {
      edadActual--;
    }
    if (edadActual < 18) {
      nacCtrl.setErrors({ ...nacCtrl.errors, menorDeEdad: true });
    }

    let edadAlContratar = contrat.getFullYear() - nac.getFullYear();
    const mesC = contrat.getMonth() - nac.getMonth();
    if (mesC < 0 || (mesC === 0 && contrat.getDate() < nac.getDate())) {
      edadAlContratar--;
    }
    if (edadAlContratar < 18) {
      contratCtrl.setErrors({ ...contratCtrl.errors, relacionInvalida: true });
    }

    if (contrat > hoy) {
      contratCtrl.setErrors({ ...contratCtrl.errors, fechaFutura: true });
    } else if (contrat < unaSemanaAtras) {
      contratCtrl.setErrors({ ...contratCtrl.errors, rangoInvalido: true });
    }

    return null;
  };

  private limpiarErrorEspecifico(control: AbstractControl, errorKey: string): void {
    if (control.errors) {
      const err = { ...control.errors };
      delete err[errorKey];
      control.setErrors(Object.keys(err).length ? err : null);
    }
  }

  submitted = false;

  onSubmit(): void {
    this.submitted = true;
    if (this.usuarioForm.valid) {
      this.guardar.emit(this.usuarioForm.value);
    } else {
      this.usuarioForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.submitted = false;
    this.usuarioForm.reset();
    this.cancelar.emit();
  }

  esInvalido(name: string): boolean {
    const c = this.usuarioForm.get(name);
    return !!c && c.invalid && (this.submitted || c.dirty || c.touched);
  }
}