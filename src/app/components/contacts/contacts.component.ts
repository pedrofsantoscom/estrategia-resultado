import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COMPANY } from '../../shared/company.config';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [],
  templateUrl: './contacts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsComponent {
  readonly company = COMPANY;
}
