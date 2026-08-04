import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Catalogue } from './pages/catalogue/catalogue';
import { CarDetail } from './pages/car-detail/car-detail';
import { CarForm } from './pages/car-form/car-form';
import { Compare } from './pages/compare/compare';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'catalogue', component: Catalogue },
  { path: 'comparateur', component: Compare },
  { path: 'voitures/nouveau', component: CarForm },
  { path: 'voitures/:id/modifier', component: CarForm },
  { path: 'voitures/:id', component: CarDetail },
  { path: '**', redirectTo: '' },
];
