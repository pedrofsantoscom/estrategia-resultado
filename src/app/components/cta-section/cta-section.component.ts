import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [],
  templateUrl: './cta-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaSectionComponent {
  private platformId = inject(PLATFORM_ID);

  scrollToForm(): void {
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById('formulario');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
