import { Component, input, signal, computed } from '@angular/core';

@Component({
  selector: 'app-photo-carousel',
  imports: [],
  templateUrl: './photo-carousel.html',
  styleUrl: './photo-carousel.scss',
})
export class PhotoCarousel {
  photos = input<string[]>([]);
  index = signal(0);

  current = computed(() => this.photos()[this.index()] ?? null);
  hasMultiple = computed(() => this.photos().length > 1);

  prev(event: Event): void {
    event.stopPropagation();
    const total = this.photos().length;
    this.index.set((this.index() - 1 + total) % total);
  }

  next(event: Event): void {
    event.stopPropagation();
    const total = this.photos().length;
    this.index.set((this.index() + 1) % total);
  }

  goTo(event: Event, i: number): void {
    event.stopPropagation();
    this.index.set(i);
  }
}
