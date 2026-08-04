import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { CompareService } from '../../services/compare.service';
import { CarStorageService } from '../../services/car-storage.service';

@Component({
  selector: 'app-compare-bar',
  imports: [RouterLink],
  templateUrl: './compare-bar.html',
  styleUrl: './compare-bar.scss',
})
export class CompareBar {
  private readonly compare = inject(CompareService);
  private readonly storage = inject(CarStorageService);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly cars = computed(() => {
    if (this.currentUrl().startsWith('/comparateur')) return [];
    return this.compare
      .ids()
      .map((id) => this.storage.getById(id))
      .filter((c) => !!c);
  });

  remove(id: string): void {
    this.compare.remove(id);
  }

  clear(): void {
    this.compare.clear();
  }
}
