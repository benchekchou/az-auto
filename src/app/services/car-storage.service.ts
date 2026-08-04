import { Injectable, signal } from '@angular/core';
import { Car, CarInput, CARBURANTS, TRANSMISSIONS, STATUTS } from '../models/car.model';

const STORAGE_KEY = 'zr-auto:cars';

@Injectable({ providedIn: 'root' })
export class CarStorageService {
  private readonly _cars = signal<Car[]>(this.load());
  readonly cars = this._cars.asReadonly();

  private load(): Car[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(cars: Car[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
      this._cars.set(cars);
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
        throw new Error(
          "Stockage plein : supprimez des photos ou des annonces avant d'ajouter cette voiture."
        );
      }
      throw err;
    }
  }

  getById(id: string): Car | undefined {
    return this._cars().find((c) => c.id === id);
  }

  add(input: CarInput): Car {
    const car: Car = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.persist([car, ...this._cars()]);
    return car;
  }

  update(id: string, changes: CarInput): void {
    const cars = this._cars().map((c) => (c.id === id ? { ...c, ...changes } : c));
    this.persist(cars);
  }

  remove(id: string): void {
    this.persist(this._cars().filter((c) => c.id !== id));
  }

  exportJson(): void {
    const blob = new Blob([JSON.stringify(this._cars(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `voitures-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importJson(file: File): Promise<void> {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Le fichier n'est pas un JSON valide.");
    }
    if (!Array.isArray(parsed) || !parsed.every((c) => this.isValidCar(c))) {
      throw new Error(
        'Le fichier ne correspond pas au format attendu (liste de voitures).'
      );
    }
    this.persist(parsed as Car[]);
  }

  private isValidCar(value: unknown): value is Car {
    if (typeof value !== 'object' || value === null) return false;
    const c = value as Record<string, unknown>;
    return (
      typeof c['id'] === 'string' &&
      typeof c['marque'] === 'string' &&
      typeof c['modele'] === 'string' &&
      typeof c['annee'] === 'number' &&
      typeof c['prix'] === 'number' &&
      typeof c['kilometrage'] === 'number' &&
      (CARBURANTS as string[]).includes(c['carburant'] as string) &&
      (TRANSMISSIONS as string[]).includes(c['transmission'] as string) &&
      (STATUTS as string[]).includes(c['statut'] as string) &&
      Array.isArray(c['photos'])
    );
  }
}
