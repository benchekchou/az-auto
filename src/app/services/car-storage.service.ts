import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Car, CarInput, CARBURANTS, TRANSMISSIONS, STATUTS } from '../models/car.model';
import { AuthService } from './auth.service';

// Cache local de secours (mode hors-ligne, ou dev local sans fonctions Vercel).
// La source de vérité reste l'API /api/cars (Vercel Blob), partagée par tous les appareils.
const CACHE_KEY = 'zr-auto:cars';
const API_URL = 'api/cars';
const SEED_URL = 'cars.json';

@Injectable({ providedIn: 'root' })
export class CarStorageService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly _cars = signal<Car[]>(this.loadCache());
  readonly cars = this._cars.asReadonly();

  readonly ready = signal(false);
  readonly syncError = signal<string | null>(null);

  constructor() {
    this.refreshFromServer();
  }

  private async refreshFromServer(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<unknown>(API_URL));
      if (Array.isArray(data) && data.every((c) => this.isValidCar(c))) {
        this._cars.set(data as Car[]);
        this.cacheLocally(data as Car[]);
        this.ready.set(true);
        return;
      }
    } catch {
      // API indisponible (ex : dev local avec `ng serve` sans `vercel dev`).
    }
    if (this._cars().length === 0) {
      await this.seedFromStaticFile();
    }
    this.ready.set(true);
  }

  private async seedFromStaticFile(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<unknown>(SEED_URL));
      if (Array.isArray(data) && data.every((c) => this.isValidCar(c))) {
        this._cars.set(data as Car[]);
        this.cacheLocally(data as Car[]);
      }
    } catch {
      // Pas de fichier cars.json non plus : catalogue vide.
    }
  }

  private loadCache(): Car[] {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private cacheLocally(cars: Car[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cars));
    } catch {
      // Cache local best-effort uniquement ; l'API reste la source de vérité.
    }
  }

  private async syncToServer(cars: Car[]): Promise<void> {
    this.syncError.set(null);
    const token = this.auth.token();
    try {
      const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
      await firstValueFrom(this.http.post(API_URL, cars, { headers }));
    } catch (err: any) {
      if (err?.status === 401) {
        // Jeton refusé par le serveur (expiré/invalide) : on déconnecte pour
        // forcer une reconnexion plutôt que de laisser croire que ça a marché.
        this.auth.logout();
        this.syncError.set('Session admin expirée. Reconnectez-vous pour enregistrer vos modifications.');
        return;
      }
      this.syncError.set(
        "Enregistré sur cet appareil, mais la synchronisation en ligne a échoué. Vérifiez votre connexion et réessayez."
      );
    }
  }

  private save(cars: Car[]): void {
    this._cars.set(cars);
    this.cacheLocally(cars);
    void this.syncToServer(cars);
  }

  private requireAuth(): void {
    if (!this.auth.isAuthenticated()) {
      throw new Error('Vous devez être connecté en tant qu’admin pour modifier le catalogue.');
    }
  }

  getById(id: string): Car | undefined {
    return this._cars().find((c) => c.id === id);
  }

  add(input: CarInput): Car {
    this.requireAuth();
    const car: Car = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.save([car, ...this._cars()]);
    return car;
  }

  update(id: string, changes: CarInput): void {
    this.requireAuth();
    this.save(this._cars().map((c) => (c.id === id ? { ...c, ...changes } : c)));
  }

  remove(id: string): void {
    this.requireAuth();
    this.save(this._cars().filter((c) => c.id !== id));
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
    this.requireAuth();
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
    this.save(parsed as Car[]);
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
