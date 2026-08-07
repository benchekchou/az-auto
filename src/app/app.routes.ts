import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Catalogue } from './pages/catalogue/catalogue';
import { CarDetail } from './pages/car-detail/car-detail';
import { CarForm } from './pages/car-form/car-form';
import { Compare } from './pages/compare/compare';
import { AdminLogin } from './pages/admin-login/admin-login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'catalogue', component: Catalogue },
  { path: 'comparateur', component: Compare },
  { path: 'admin/connexion', component: AdminLogin },
  // Réservées à l'admin : la garde redirige vers /admin/connexion sinon.
  { path: 'voitures/nouveau', component: CarForm, canActivate: [authGuard] },
  { path: 'voitures/:id/modifier', component: CarForm, canActivate: [authGuard] },
  { path: 'voitures/:id', component: CarDetail },
  { path: '**', redirectTo: '' },
];
