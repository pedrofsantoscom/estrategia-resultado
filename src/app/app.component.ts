import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NavComponent } from './components/nav/nav.component';
import { HeroComponent } from './components/hero/hero.component';
import { ServicesSectionComponent } from './components/services-section/services-section.component';
import { AboutComponent } from './components/about/about.component';
import { LocationComponent } from './components/location/location.component';
import { ContactsComponent } from './components/contacts/contacts.component';
import { ContactFormComponent } from './components/contact-form/contact-form.component';
import { QuickContactModalComponent } from './components/quick-contact-modal/quick-contact-modal.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NavComponent,
    HeroComponent,
    ServicesSectionComponent,
    AboutComponent,
    LocationComponent,
    ContactsComponent,
    ContactFormComponent,
    QuickContactModalComponent,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  modalOpen = signal(false);
  modalService = signal('');
  formService = signal('');

  openModal(serviceId = ''): void {
    this.modalService.set(serviceId);
    this.modalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.modalOpen.set(false);
    document.body.style.overflow = '';
  }

  onContactService(serviceId: string): void {
    this.formService.set(serviceId);
  }
}
