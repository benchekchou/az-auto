import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CarStorageService } from '../../services/car-storage.service';
import { FavoritesService } from '../../services/favorites.service';
import { PhotoCarousel } from '../../components/photo-carousel/photo-carousel';
import { Statut, STATUTS } from '../../models/car.model';
import { monthlyPayment } from '../../services/finance.util';
import { GARAGE_CONFIG } from '../../config/garage.config';

const DUREES = [12, 24, 36, 48, 60] as const;

@Component({
  selector: 'app-car-detail',
  imports: [PhotoCarousel, DecimalPipe, FormsModule],
  templateUrl: './car-detail.html',
  styleUrl: './car-detail.scss',
})
export class CarDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly storage = inject(CarStorageService);
  private readonly favorites = inject(FavoritesService);

  private readonly id = signal(this.route.snapshot.paramMap.get('id') ?? '');
  readonly statuts = STATUTS;
  readonly garage = GARAGE_CONFIG;
  readonly durees = DUREES;

  readonly car = computed(() => this.storage.getById(this.id()));

  readonly apport = signal(0);
  readonly duree = signal<number>(48);
  readonly taux = signal(GARAGE_CONFIG.financement.tauxDefautPct);

  readonly mensualite = computed(() => {
    const car = this.car();
    if (!car) return 0;
    const principal = Math.max(0, car.prix - this.apport());
    return monthlyPayment(principal, this.taux(), this.duree());
  });

  constructor() {
    if (!this.car()) {
      this.router.navigate(['/'], { queryParams: { introuvable: '1' } });
      return;
    }
    this.apport.set(Math.round((this.car()!.prix * 0.15) / 100) * 100);
  }

  isFavorite(): boolean {
    const car = this.car();
    return !!car && this.favorites.isFavorite(car.id);
  }

  toggleFavorite(): void {
    const car = this.car();
    if (!car) return;
    this.favorites.toggle(car.id);
  }

  get whatsappLink(): string {
    const car = this.car();
    if (!car) return `https://wa.me/${this.garage.whatsapp}`;
    const text = encodeURIComponent(
      `Bonjour, je suis intéressé(e) par la ${car.marque} ${car.modele} (${car.prix.toLocaleString('fr-FR')} €).`
    );
    return `https://wa.me/${this.garage.whatsapp}?text=${text}`;
  }

  get telLink(): string {
    return `tel:${this.garage.telephone.replace(/\s+/g, '')}`;
  }

  get telLink2(): string {
    return `tel:${this.garage.telephone2.replace(/\s+/g, '')}`;
  }

  get mailLink(): string {
    const car = this.car();
    const subject = car ? encodeURIComponent(`Question sur ${car.marque} ${car.modele}`) : '';
    return `mailto:${this.garage.email}?subject=${subject}`;
  }

  statusClass(): string {
    switch (this.car()?.statut) {
      case 'Disponible':
        return 'badge--available';
      case 'Réservé':
        return 'badge--reserved';
      default:
        return 'badge--sold';
    }
  }

  edit(): void {
    this.router.navigate(['/voitures', this.id(), 'modifier']);
  }

  remove(): void {
    const car = this.car();
    if (!car) return;
    const confirmed = window.confirm(`Supprimer ${car.marque} ${car.modele} ? Cette action est définitive.`);
    if (!confirmed) return;
    this.storage.remove(car.id);
    this.router.navigate(['/catalogue']);
  }

  setStatus(statut: Statut): void {
    const car = this.car();
    if (!car) return;
    const { id, createdAt, ...input } = car;
    this.storage.update(id, { ...input, statut });
  }

  back(): void {
    this.router.navigate(['/catalogue']);
  }
}
