import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

// Authentification admin très simple : un seul mot de passe partagé (variable
// d'environnement ADMIN_PASSWORD côté serveur, jamais exposée au navigateur).
// Le "token" stocké côté client est le mot de passe lui-même : il n'a de valeur
// que parce que /api/login et /api/cars le revérifient à chaque écriture.
// Cacher les boutons côté client est du confort d'UI, pas la protection réelle :
// la vraie barrière est le contrôle serveur sur POST /api/cars (voir api/cars.js).
const TOKEN_KEY = 'zr-auto:admin-token';
const LOGIN_URL = 'api/login';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(this.readStoredToken());
  readonly token = this._token.asReadonly();

  isAuthenticated(): boolean {
    return this._token() !== null;
  }

  async login(password: string): Promise<void> {
    // Lève une erreur (HttpErrorResponse) si le mot de passe est incorrect —
    // laissée volontairement à la charge de l'appelant (page de login).
    await firstValueFrom(this.http.post(LOGIN_URL, { password }));
    this._token.set(password);
    try {
      localStorage.setItem(TOKEN_KEY, password);
    } catch {
      // localStorage indisponible : la session ne survivra pas à un rechargement.
    }
  }

  logout(): void {
    this._token.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // best-effort
    }
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
