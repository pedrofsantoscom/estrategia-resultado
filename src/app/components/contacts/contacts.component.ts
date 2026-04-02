import { ChangeDetectionStrategy, Component, EventEmitter, Output, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { COMPANY } from '../../shared/company.config';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [],
  templateUrl: './contacts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsComponent {
  private platformId = inject(PLATFORM_ID);
  readonly company = COMPANY;

  @Output() openModal = new EventEmitter<void>();

  scrollToForm(): void {
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById('formulario');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
