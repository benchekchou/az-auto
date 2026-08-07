import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss',
})
export class AdminLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  password = '';
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl());
    }
  }

  private returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('retour') || '/voitures/nouveau';
  }

  async submit(): Promise<void> {
    if (!this.password) return;
    this.error.set(null);
    this.loading.set(true);
    try {
      await this.auth.login(this.password);
      this.router.navigateByUrl(this.returnUrl());
    } catch {
      this.error.set('Mot de passe incorrect.');
    } finally {
      this.loading.set(false);
    }
  }
}
