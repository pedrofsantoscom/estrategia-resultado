import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  templateUrl: './lang-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LangSwitcherComponent {
  private platformId = inject(PLATFORM_ID);

  currentLang = 'pt';
  ptUrl = '/pt/';
  enUrl = '/en/';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const path = window.location.pathname;
      if (path.startsWith('/en')) {
        this.currentLang = 'en';
        this.enUrl = path;
        this.ptUrl = path.replace(/^\/en/, '/pt') || '/pt/';
      } else {
        this.currentLang = 'pt';
        this.ptUrl = path;
        this.enUrl = path.replace(/^\/pt/, '/en') || '/en/';
      }
      try {
        localStorage.setItem('lang', this.currentLang);
      } catch {}
    }
  }
}
