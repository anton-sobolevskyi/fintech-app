# FintechApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.5.

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

### Code coverage

To run the unit tests once with a coverage report, use:

```bash
npm run test:ci
```

Coverage reports (HTML + Cobertura XML) are generated in `coverage/fintech-app/`.

Coverage thresholds are enforced in `angular.json` (`coverageThresholds`): statements, branches,
functions and lines must each be **≥ 80%**, otherwise the test run fails. This gate also runs in
CI (GitHub Actions) before every deploy. Files that are pure application wiring (`src/main.ts`,
`src/app/app.config.ts`, `src/app/app.routes.server.ts`, `src/environments/**`) are excluded from
the metric via `coverageExclude`.

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
