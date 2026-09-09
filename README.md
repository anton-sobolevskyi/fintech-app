# Fintech App

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://fintech-app-3aacb.web.app/)

Modern personal finance dashboard with accounts, transfers, top-ups, and PDF reports.

**Live:** [fintech-app-3aacb.web.app](https://fintech-app-3aacb.web.app/)

## Goals / Purpose

Portfolio project built to demonstrate frontend and full-stack skills relevant to job applications:

- Production-style fintech UI with Angular 22 (signals, standalone components, Signal Forms)
- Secure money operations via Firebase Cloud Functions
- State management with NgRx Signals, real-time-style updates via an event bus
- Deployed app (Firebase Hosting) with auth, roles, and accessible UI

## Features

- Email/password authentication with role-based access (user / admin)
- Dashboard with balance, cash flow chart, and recent activity
- Accounts: create, top-up, transfer by IBAN, generate PDF report
- Transactions list with filters and pagination
- Users management (admin)
- Profile settings (theme, language)
- Dark / light theme and responsive layout

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | Angular 22 (standalone components)              |
| State        | NgRx Store + NgRx Signals                       |
| UI           | PrimeNG 22, PrimeIcons, Tailwind CSS 4          |
| Backend      | Firebase (Auth, Firestore, Functions, Storage)  |
| PDF          | PDFKit (Cloud Function)                         |
| Charts       | Chart.js                                        |
| Forms        | Angular Signal Forms                            |
| Testing      | Vitest                                          |
| Deploy       | Firebase Hosting                                |
| Language     | TypeScript 6                                    |

## Architecture Highlights

- Signals-first state management (`@ngrx/signals`)
- Feature-based structure with lazy-loaded routes
- Centralized event bus (`EventService`) for cross-feature updates
- Critical operations (create account, top-up, transfer) run in Cloud Functions
- PDF reports generated on Firestore `onCreate` trigger and stored in Storage
- Strict TypeScript and accessibility (WCAG AA) focus

## Project Structure

```
src/app/
├── core/
│   ├── guards/
│   ├── models/
│   ├── services/          # AccountService, AccountOperationsService, EventService…
│   └── store/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── accounts/          # + TopUpDialog, TransferDialog
│   ├── transactions/
│   ├── users/
│   ├── profile/
│   ├── data-sources/
│   └── reports/
├── layout/
└── shared/

functions/
├── src/
│   ├── index.ts
│   ├── transactions.ts    # createAccount, topUpAccount, transferFunds, lookupAccountByIban
│   ├── generateReport.ts  # onReportCreated (PDF)
│   └── utils/
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 11+
- Firebase project (Auth, Firestore, Functions, Storage)

### Installation

```bash
git clone https://github.com/anton-sobolevskyi/fintech-app.git
cd fintech-app
npm install
```

### Environment

```bash
npm run prestart          # development env files
npm run prebuild          # production env files
```

Configure Firebase credentials via the generated environment files / project env scripts.

### Development

```bash
npm start
# → http://localhost:4200
```

### Build

```bash
npm run build
```

### Tests

```bash
npm test
# coverage (CI gate ≥ 80%):
npm run test:ci
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server (`ng serve`) |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:ci` | Tests with coverage report |
| `npm run prestart` | Generate development environment |
| `npm run prebuild` | Generate production environment |
| `npm run generate:env` | Generate production env via script |

## Key Implementation Details

### Callable Cloud Functions

| Function | Purpose |
|----------|---------|
| `createAccount` | Create account + unique UA IBAN |
| `topUpAccount` | Top-up balance |
| `transferFunds` | Transfer between accounts |
| `lookupAccountByIban` | Resolve recipient by IBAN |

### Triggers

| Function | Trigger | Purpose |
|----------|---------|---------|
| `onReportCreated` | Firestore `reports/{id}` onCreate | Build PDF, upload to Storage, set download URL |

Report flow: client creates a `reports` document → function fetches recent transactions → PDFKit builds PDF → Storage upload → document updated with `status: "ready"` and signed `downloadUrl`.

### Event bus

`EventService` emits `account.created`, `account.topup`, `account.transfer`, `transactions.changed`, etc., so Dashboard and other features can refresh without tight coupling.

## License

Portfolio project. Free to use for learning purposes.
