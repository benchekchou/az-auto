import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Car, CarInput, CARBURANTS, TRANSMISSIONS, STATUTS } from '../models/car.model';
import { AuthService } from './auth.service';

// Cache local de secours (mode hors-ligne, ou dev local sans fonctions Vercel).
// La source de vérité reste l'API /api/cars (Vercel Blob), partagée par tous les appareils.
const CACHE_KEY = 'zr-auto:cars';
const API_URL = 'api/cars';
const UPLOAD_URL = 'api/upload';
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
    try {
      // Filet de sécurité pour les voitures enregistrées avant le passage à
      // l'upload direct vers Blob (voir uploadPhoto) : si des photos sont
      // encore des data URLs base64, on les téléverse maintenant et on
      // remplace par leur URL avant d'envoyer le catalogue. Sans ça, ces
      // vieilles photos continuent de gonfler CHAQUE POST /api/cars (toutes
      // voitures confondues) jusqu'à redépasser la limite de 4.5 Mo de Vercel
      // (413 Payload Too Large), même pour une modification qui ne les
      // touche pas.
      const migrated = await this.migrateBase64Photos(cars);
      if (migrated !== cars) {
        this._cars.set(migrated);
        this.cacheLocally(migrated);
      }

      const token = this.auth.token();
      const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
      await firstValueFrom(this.http.post(API_URL, migrated, { headers }));
    } catch (err: any) {
      // Toujours visible en console pour diagnostiquer (status HTTP réel,
      // masqué par les messages utilisateur ci-dessous).
      console.error('Échec de la synchronisation du catalogue :', err);

      if (err?.status === 401) {
        // Jeton refusé par le serveur (expiré/invalide) : on déconnecte pour
        // forcer une reconnexion plutôt que de laisser croire que ça a marché.
        this.auth.logout();
        this.syncError.set('Session admin expirée. Reconnectez-vous pour enregistrer vos modifications.');
        return;
      }
      if (err?.status === 413) {
        this.syncError.set(
          'Enregistré sur cet appareil, mais le catalogue est trop volumineux pour être synchronisé (trop de photos). Réessayez : les photos existantes sont converties automatiquement, cela peut prendre quelques essais si la connexion est lente.'
        );
        return;
      }
      this.syncError.set(
        "Enregistré sur cet appareil, mais la synchronisation en ligne a échoué. Vérifiez votre connexion et réessayez."
      );
    }
  }

  // Convertit en URLs Blob toute photo encore stockée en base64 (héritée
  // d'avant l'upload direct). Ne retéléverse rien si le catalogue n'en
  // contient plus, pour ne pas ralentir les sauvegardes suivantes.
  private async migrateBase64Photos(cars: Car[]): Promise<Car[]> {
    let changed = false;
    const migrated = await Promise.all(
      cars.map(async (car) => {
        if (!car.photos.some((p) => p.startsWith('data:'))) return car;
        changed = true;
        const photos = await Promise.all(
          car.photos.map((p) => (p.startsWith('data:') ? this.uploadPhoto(p) : p))
        );
        return { ...car, photos };
      })
    );
    return changed ? migrated : cars;
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

  // Téléverse une photo (data URL base64) vers Vercel Blob et renvoie son URL
  // publique. Contrairement à l'ancien flux (photos base64 stockées telles
  // quelles dans Car.photos), ceci évite que le catalogue entier — toutes
  // voitures et toutes photos confondues — soit renvoyé dans chaque
  // POST /api/cars, ce qui finissait par dépasser la limite de taille de
  // requête de Vercel (413 Payload Too Large) au fur et à mesure que le
  // catalogue grandissait.
  async uploadPhoto(dataUrl: string): Promise<string> {
    this.requireAuth();
    const token = this.auth.token();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const result = await firstValueFrom(
      this.http.post<{ url: string }>(UPLOAD_URL, { data: dataUrl }, { headers })
    );
    return result.url;
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
