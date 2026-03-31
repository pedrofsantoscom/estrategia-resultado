import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COMPANY } from '../../shared/company.config';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly company = COMPANY;
  year = new Date().getFullYear();
}
