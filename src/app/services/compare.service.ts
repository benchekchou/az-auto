import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'zr-auto:comparateur';
const MAX_ITEMS = 3;

@Injectable({ providedIn: 'root' })
export class CompareService {
  private readonly _ids = signal<string[]>(this.load());
  readonly ids = this._ids.asReadonly();
  readonly max = MAX_ITEMS;

  private load(): string[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(ids: string[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    this._ids.set(ids);
  }

  isSelected(id: string): boolean {
    return this._ids().includes(id);
  }

  isFull(): boolean {
    return this._ids().length >= MAX_ITEMS;
  }

  toggle(id: string): void {
    const current = this._ids();
    if (current.includes(id)) {
      this.persist(current.filter((c) => c !== id));
      return;
    }
    if (current.length >= MAX_ITEMS) return;
    this.persist([...current, id]);
  }

  remove(id: string): void {
    this.persist(this._ids().filter((c) => c !== id));
  }

  clear(): void {
    this.persist([]);
  }
}
