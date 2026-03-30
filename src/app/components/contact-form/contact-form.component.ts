import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SERVICES } from '../services-section/services-section.component';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactFormComponent implements OnChanges {
  @Input() preSelectedService = '';

  services = SERVICES;
  form: FormGroup;
  submitting = signal(false);
  submitted = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      service: [''],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preSelectedService'] && this.preSelectedService) {
      this.form.patchValue({ service: this.preSelectedService });
    }
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    try {
      const response = await fetch('/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.form.value),
      });
      const data = await response.json();

      if (data.success) {
        this.submitted.set(true);
        this.form.reset();
      } else {
        this.error.set(data.error ?? 'Ocorreu um erro. Por favor tente novamente.');
      }
    } catch {
      this.error.set('Não foi possível enviar a mensagem. Verifique a sua ligação e tente novamente.');
    } finally {
      this.submitting.set(false);
    }
  }
}
