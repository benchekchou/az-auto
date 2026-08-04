import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GARAGE_CONFIG } from '../../config/garage.config';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  readonly garage = GARAGE_CONFIG;
  readonly year = new Date().getFullYear();

  get whatsappLink(): string {
    return `https://wa.me/${this.garage.whatsapp}`;
  }

  get telLink(): string {
    return `tel:${this.garage.telephone.replace(/\s+/g, '')}`;
  }
}
