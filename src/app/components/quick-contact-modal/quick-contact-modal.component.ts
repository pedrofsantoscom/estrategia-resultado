import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SERVICES } from '../services-section/services-section.component';

@Component({
  selector: 'app-quick-contact-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './quick-contact-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickContactModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() preSelectedService = '';
  @Output() close = new EventEmitter<void>();

  services = SERVICES;
  preferredTimes = [
    'Manhã (9h – 12h)',
    'Almoço (12h – 14h)',
    'Tarde (14h – 17h)',
    'Final do dia (17h – 18h)',
  ];

  form: FormGroup;
  submitting = signal(false);
  submitted = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', Validators.required],
      preferred_time: [''],
      service: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preSelectedService'] && this.preSelectedService) {
      this.form.patchValue({ service: this.preSelectedService });
    }
    if (changes['isOpen'] && this.isOpen) {
      this.submitted.set(false);
      this.error.set('');
    }
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    try {
      const response = await fetch('/api/contact-request.php', {
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
      this.error.set('Não foi possível enviar o pedido. Verifique a sua ligação e tente novamente.');
    } finally {
      this.submitting.set(false);
    }
  }
}
