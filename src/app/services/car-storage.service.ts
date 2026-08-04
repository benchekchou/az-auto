import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Car, CarInput, CARBURANTS, TRANSMISSIONS, STATUTS } from '../models/car.model';

const STORAGE_KEY = 'zr-auto:cars';
// Fichier "base de données" statique embarqué dans le build (public/cars.json).
// Il sert de catalogue de référence pour tout nouveau visiteur : pour publier de
// nouvelles voitures, utilisez "Exporter le catalogue" puis remplacez ce fichier
// avant de reconstruire/redéployer le site.
const SEED_URL = 'cars.json';

@Injectable({ providedIn: 'root' })
export class CarStorageService {
  private readonly http = inject(HttpClient);

  private readonly _cars = signal<Car[]>(this.load());
  readonly cars = this._cars.asReadonly();

  constructor() {
    if (localStorage.getItem(STORAGE_KEY) === null) {
      this.seedFromStaticFile();
    }
  }

  private async seedFromStaticFile(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<unknown>(SEED_URL));
      if (Array.isArray(data) && data.every((c) => this.isValidCar(c))) {
        this.persist(data as Car[]);
      }
    } catch {
      // Pas de fichier cars.json (ou invalide) : le catalogue démarre vide.
    }
  }

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
    link.href = url;
    link.download = 'cars.json';
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
