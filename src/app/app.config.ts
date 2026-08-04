import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { routes } from './app.routes';

registerLocaleData(localeFr, 'fr-FR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Routage en mode hash (#/...) : les URL restent valides sur un hébergement
    // 100% statique (pas de réécriture serveur nécessaire pour /voitures/nouveau, etc.).
    provideRouter(routes, withHashLocation()),
    // Nécessaire pour charger public/cars.json (le "fichier base de données" du catalogue).
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ]
};
