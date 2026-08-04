import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarStorageService } from '../../services/car-storage.service';
import { CarCard } from '../../components/car-card/car-card';
import { GARAGE_CONFIG } from '../../config/garage.config';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CarCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly storage = inject(CarStorageService);

  readonly garage = GARAGE_CONFIG;

  readonly availableCars = computed(() => this.storage.cars().filter((c) => c.statut === 'Disponible'));

  readonly featuredCars = computed(() =>
    [...this.availableCars()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
  );

  get whatsappLink(): string {
    return `https://wa.me/${this.garage.whatsapp}`;
  }

  get telLink(): string {
    return `tel:${this.garage.telephone.replace(/\s+/g, '')}`;
  }

  get telLink2(): string {
    return `tel:${this.garage.telephone2.replace(/\s+/g, '')}`;
  }
}
