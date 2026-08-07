# ZrAuto

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.2.

## Authentification admin (ajout/modification de voitures)

Le catalogue reste visible par tous sans connexion. Ajouter/modifier/supprimer une voiture
nécessite d'être connecté sur `/admin/connexion`, protégé par un mot de passe défini côté
serveur uniquement (jamais dans le code) :

1. Sur Vercel : **Project Settings → Environment Variables** → ajouter `ADMIN_PASSWORD`
   avec le mot de passe choisi (Production **et** Preview), puis redéployer.
2. En local avec `vercel dev` : créer un fichier `.env.local` à la racine avec
   `ADMIN_PASSWORD=votre-mot-de-passe` (ce fichier ne doit pas être commité).

Sans `vercel dev` (`ng serve` seul), les fonctions `/api/*` ne tournent pas : la connexion
admin ne fonctionnera pas, seul le catalogue en lecture (fallback `cars.json`) sera visible.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
