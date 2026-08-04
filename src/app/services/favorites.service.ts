import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'zr-auto:favoris';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly _ids = signal<Set<string>>(this.load());
  readonly ids = this._ids.asReadonly();

  private load(): Set<string> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  }

  private persist(ids: Set<string>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    this._ids.set(ids);
  }

  isFavorite(id: string): boolean {
    return this._ids().has(id);
  }

  toggle(id: string): void {
    const next = new Set(this._ids());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.persist(next);
  }
}
