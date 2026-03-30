import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-floating-buttons',
  standalone: true,
  imports: [],
  templateUrl: './floating-buttons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingButtonsComponent {
  private platformId = inject(PLATFORM_ID);

  isOpen = signal(false);

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  scrollToForm(): void {
    this.isOpen.set(false);
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById('formulario');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
