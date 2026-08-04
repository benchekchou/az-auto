import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CompareService } from '../../services/compare.service';
import { CarStorageService } from '../../services/car-storage.service';
import { Car } from '../../models/car.model';

@Component({
  selector: 'app-compare',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './compare.html',
  styleUrl: './compare.scss',
})
export class Compare {
  private readonly compare = inject(CompareService);
  private readonly storage = inject(CarStorageService);
  private readonly router = inject(Router);

  readonly cars = computed(
    () => this.compare.ids().map((id) => this.storage.getById(id)).filter((c): c is Car => !!c)
  );

  readonly cheapestId = computed(() => {
    const cars = this.cars();
    if (cars.length < 2) return null;
    return cars.reduce((min, c) => (c.prix < min.prix ? c : min)).id;
  });

  readonly lowestKmId = computed(() => {
    const cars = this.cars();
    if (cars.length < 2) return null;
    return cars.reduce((min, c) => (c.kilometrage < min.kilometrage ? c : min)).id;
  });

  remove(id: string): void {
    this.compare.remove(id);
  }

  clear(): void {
    this.compare.clear();
  }

  viewDetail(id: string): void {
    this.router.navigate(['/voitures', id]);
  }
}
