import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Protège les routes d'ajout/modification : redirige vers la page de connexion
// admin si non authentifié, avec l'URL d'origine pour y revenir après login.
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  return router.createUrlTree(['/admin/connexion'], { queryParams: { retour: state.url } });
};
