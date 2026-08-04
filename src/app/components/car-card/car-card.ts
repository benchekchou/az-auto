import { Component, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Car } from '../../models/car.model';
import { PhotoCarousel } from '../photo-carousel/photo-carousel';
import { FavoritesService } from '../../services/favorites.service';
import { CompareService } from '../../services/compare.service';
import { GARAGE_CONFIG } from '../../config/garage.config';

@Component({
  selector: 'app-car-card',
  imports: [PhotoCarousel, DecimalPipe],
  templateUrl: './car-card.html',
  styleUrl: './car-card.scss',
})
export class CarCard {
  private readonly router = inject(Router);
  private readonly favorites = inject(FavoritesService);
  private readonly compare = inject(CompareService);
  private readonly garage = GARAGE_CONFIG;

  car = input.required<Car>();

  openDetail(): void {
    this.router.navigate(['/voitures', this.car().id]);
  }

  statusClass(): string {
    switch (this.car().statut) {
      case 'Disponible':
        return 'badge--available';
      case 'Réservé':
        return 'badge--reserved';
      default:
        return 'badge--sold';
    }
  }

  isFavorite(): boolean {
    return this.favorites.isFavorite(this.car().id);
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favorites.toggle(this.car().id);
  }

  isCompared(): boolean {
    return this.compare.isSelected(this.car().id);
  }

  compareDisabled(): boolean {
    return !this.isCompared() && this.compare.isFull();
  }

  toggleCompare(event: Event): void {
    event.stopPropagation();
    if (this.compareDisabled()) return;
    this.compare.toggle(this.car().id);
  }

  get whatsappLink(): string {
    const car = this.car();
    const text = encodeURIComponent(
      `Bonjour, je suis intéressé(e) par la ${car.marque} ${car.modele} (${car.prix.toLocaleString('fr-FR')} €).`
    );
    return `https://wa.me/${this.garage.whatsapp}?text=${text}`;
  }

  get telLink(): string {
    return `tel:${this.garage.telephone.replace(/\s+/g, '')}`;
  }

  stop(event: Event): void {
    event.stopPropagation();
  }
}
