import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  scrollToServices(): void {
    const el = document.getElementById('servicos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToContacts(): void {
    const el = document.getElementById('contactos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
