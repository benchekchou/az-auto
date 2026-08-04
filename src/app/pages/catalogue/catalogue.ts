import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CarStorageService } from '../../services/car-storage.service';
import { FavoritesService } from '../../services/favorites.service';
import { CarCard } from '../../components/car-card/car-card';
import { CARBURANTS, TRANSMISSIONS, STATUTS, Carburant, Transmission, Statut } from '../../models/car.model';

type SortOption = 'recent' | 'prix-asc' | 'prix-desc' | 'annee-desc' | 'km-asc';

@Component({
  selector: 'app-catalogue',
  imports: [CarCard, FormsModule],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.scss',
})
export class Catalogue {
  private readonly storage = inject(CarStorageService);
  private readonly favorites = inject(FavoritesService);
  private readonly route = inject(ActivatedRoute);

  readonly cars = this.storage.cars;

  readonly carburants = CARBURANTS;
  readonly transmissions = TRANSMISSIONS;
  readonly statuts = STATUTS;

  readonly search = signal('');
  readonly marque = signal('');
  readonly prixMax = signal<number | null>(null);
  readonly anneeMin = signal<number | null>(null);
  readonly carburant = signal<Carburant | ''>('');
  readonly transmission = signal<Transmission | ''>('');
  readonly statut = signal<Statut | ''>('');
  readonly favorisOnly = signal(this.route.snapshot.queryParamMap.get('favoris') === '1');
  readonly sort = signal<SortOption>('recent');

  readonly marques = computed(() =>
    [...new Set(this.cars().map((c) => c.marque))].sort((a, b) => a.localeCompare(b))
  );

  readonly filteredCars = computed(() => {
    const search = this.search().trim().toLowerCase();
    const marque = this.marque();
    const prixMax = this.prixMax();
    const anneeMin = this.anneeMin();
    const carburant = this.carburant();
    const transmission = this.transmission();
    const statut = this.statut();
    const favorisOnly = this.favorisOnly();
    const favoriteIds = this.favorites.ids();

    let result = this.cars().filter((car) => {
      if (search && !`${car.marque} ${car.modele}`.toLowerCase().includes(search)) return false;
      if (marque && car.marque !== marque) return false;
      if (prixMax !== null && car.prix > prixMax) return false;
      if (anneeMin !== null && car.annee < anneeMin) return false;
      if (carburant && car.carburant !== carburant) return false;
      if (transmission && car.transmission !== transmission) return false;
      if (statut && car.statut !== statut) return false;
      if (favorisOnly && !favoriteIds.has(car.id)) return false;
      return true;
    });

    switch (this.sort()) {
      case 'prix-asc':
        result = [...result].sort((a, b) => a.prix - b.prix);
        break;
      case 'prix-desc':
        result = [...result].sort((a, b) => b.prix - a.prix);
        break;
      case 'annee-desc':
        result = [...result].sort((a, b) => b.annee - a.annee);
        break;
      case 'km-asc':
        result = [...result].sort((a, b) => a.kilometrage - b.kilometrage);
        break;
      default:
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return result;
  });

  readonly hasActiveFilters = computed(
    () =>
      !!this.search() ||
      !!this.marque() ||
      this.prixMax() !== null ||
      this.anneeMin() !== null ||
      !!this.carburant() ||
      !!this.transmission() ||
      !!this.statut() ||
      this.favorisOnly()
  );

  resetFilters(): void {
    this.search.set('');
    this.marque.set('');
    this.prixMax.set(null);
    this.anneeMin.set(null);
    this.carburant.set('');
    this.transmission.set('');
    this.statut.set('');
    this.favorisOnly.set(false);
  }
}
