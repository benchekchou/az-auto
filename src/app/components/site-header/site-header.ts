import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CarStorageService } from '../../services/car-storage.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { GARAGE_CONFIG } from '../../config/garage.config';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  private readonly storage = inject(CarStorageService);
  private readonly favorites = inject(FavoritesService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly auth = inject(AuthService);

  readonly garage = GARAGE_CONFIG;
  readonly favoritesCount = () => this.favorites.ids().size;

  readonly isMenuOpen = signal(false);
  readonly isAdminOpen = signal(false);
  readonly errorMessage = signal<string | null>(null);

  private readonly importInput = viewChild<ElementRef<HTMLInputElement>>('importInput');

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isAdminOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.isAdminOpen.set(false);
    }
  }

  toggleMenu(): void {
    this.isMenuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  toggleAdmin(): void {
    if (!this.auth.isAuthenticated()) {
      this.closeMenu();
      this.router.navigate(['/admin/connexion']);
      return;
    }
    this.isAdminOpen.update((v) => !v);
  }

  logout(): void {
    this.isAdminOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/']);
  }

  addCar(): void {
    this.isAdminOpen.set(false);
    this.closeMenu();
    this.router.navigate(['/voitures/nouveau']);
  }

  exportJson(): void {
    this.isAdminOpen.set(false);
    this.storage.exportJson();
  }

  triggerImport(): void {
    this.errorMessage.set(null);
    this.importInput()?.nativeElement.click();
  }

  async onImportFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.isAdminOpen.set(false);
    if (!file) return;

    const confirmed = window.confirm(
      "Importer ce fichier remplacera toutes les voitures actuellement enregistrées. Continuer ?"
    );
    if (!confirmed) return;

    try {
      await this.storage.importJson(file);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : "Erreur d'import.");
    }
  }
}
