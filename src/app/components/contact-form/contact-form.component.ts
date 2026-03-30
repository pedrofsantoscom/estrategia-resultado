import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  PLATFORM_ID,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { SERVICES } from '../services-section/services-section.component';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactFormComponent implements OnChanges {
  @Input() preSelectedService = '';

  private platformId = inject(PLATFORM_ID);
  private api = inject(ApiService);

  services = SERVICES;
  turnstileSiteKey = environment.turnstileSiteKey;
  form: FormGroup;
  submitting = signal(false);
  submitted = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      service: ['', Validators.required],
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

  private getTurnstileToken(): string {
    if (isPlatformBrowser(this.platformId)) {
      return (window as any).turnstile?.getResponse() ?? '';
    }
    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    try {
      const data = await lastValueFrom(
        this.api.submitContactForm({
          ...this.form.value,
          lang: isPlatformBrowser(this.platformId) ? (document.documentElement.lang || 'pt') : 'pt',
          turnstile_token: this.getTurnstileToken(),
        })
      );

      if (data.success) {
        this.submitted.set(true);
        this.form.reset();
      } else {
        this.error.set(data.error ?? $localize`:@@form.error.generic:Ocorreu um erro. Por favor tente novamente.`);
      }
    } catch {
      this.error.set($localize`:@@form.error.network:Não foi possível enviar a mensagem. Verifique a sua ligação e tente novamente.`);
    } finally {
      this.submitting.set(false);
    }
  }
}
