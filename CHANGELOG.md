# Changelog - Foodlabs

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [1.4.0] - 2026-03-24

### Added
- **Backup & Restore-Funktion** (Issue #4)
  - Neue Route `/backup` mit vollständiger UI
  - `exportData()` Server Action - Exportiert alle Daten als JSON
  - `importData()` Server Action - Import mit Merge/Replace-Modi
  - Backup-Button (Database-Icon) in Vorrats-Seite
  - Alert-Komponente für Status-Meldungen
  - RadioGroup-Komponente (native HTML-basiert)

- **Einheiten-Editor** (Issue #5)
  - EditQuantityDialog erweitert mit Einheiten-Selektor
  - Native HTML `<select>` für 10 Einheiten
  - Einheiten: Stück, Gramm, Kilogramm, ml, Liter, Teelöffel, Esslöffel, Packung, Dose, Bund
  - `updateInventory()` Server Action erweitert für Einheiten-Updates
  - Schnellauswahl-Buttons passen sich an gewählte Einheit an

- **Dokumentation**
  - DEPLOYMENT.md - Docker & NAS Deployment-Guide
  - TROUBLESHOOTING.md - Umfassende Fehlerbehebung
  - CHANGELOG.md - Diese Datei
  - FEATURES.md - Detaillierte Feature-Dokumentation
  - Brain.md - Auto-Deployment-Workflow in META-REGELN

### Changed
- Brain.md strukturiert und verlinkt zu neuen Dokumentations-Dateien
- EditQuantityDialog zeigt Menge und Einheit in separaten Feldern

### Technical
- Neue Server Actions: `exportData()`, `importData()`
- UI-Komponenten: `alert.tsx`, `radio-group.tsx`
- BackupData TypeScript Interface mit Version 1.4

---

## [1.3.0] - 2026-03-24

### Added
- **Vorrat Bearbeiten/Löschen**
  - Inventory-Cards mit Edit & Delete Buttons
  - EditQuantityDialog - Dialog zum Bearbeiten von Mengen
  - InventoryCard Component - Eigenständige Card-Komponente mit Actions
  - Schnell-Hinzufügen Button - Direkter Link zu `/add` in Vorrats-Seite

- **Dark Mode**
  - next-themes Integration mit 3 Modi (Hell, Dunkel, System)
  - ThemeToggle - Dialog-basierter Theme-Switcher in Navigation
  - theme-provider.tsx - Client-seitiger Theme-Provider
  - Persistenz in localStorage

- **Rebranding**
  - "KIIdea Food" → "Foodlabs"
  - Neues Branding in Navigation und Titeln

### Changed
- `updateInventory()` Server Action - Unterstützt Mengen-Updates
- Navigation zeigt "Foodlabs" statt "KIIdea Food"

### Dependencies
- Added: `next-themes@^0.4.6`

---

## [1.2.0] - 2026-03-23

### Added
- **AddQuantityDialog** - Verbesserter Mengen-Eingabe-Dialog
  - Number-Input mit Auto-Focus
  - Enter-Support zum schnellen Hinzufügen
  - Schnellauswahl-Buttons (1, 2, 5, 10)
  - Kontext-sensitive Buttons (500g, 1kg bei Gramm-Einheiten)

- **Smart Package Size Detection**
  - OpenFoodFacts Packungsgrößen-Erkennung
  - Automatische Konvertierung: kg→g, l→ml
  - Vorschlag der Packungsgröße als Standard-Menge

### Changed
- `handleBarcodeScan()` gibt Item-Info zurück statt direktem Auto-Add
- Barcode-Scan öffnet jetzt AddQuantityDialog mit vorgeschlagener Menge

### Docker
- Image: `ghcr.io/kroonk/kiidea:latest` (sha256:0ccf1a9...)

---

## [1.1.0] - 2026-03-22

### Added
- **GitHub Container Registry Integration**
  - Migration von lokalem TAR-Export zu GHCR
  - `pull_policy: always` für automatische Updates
  - Public Package (login-freies Pulling)
  - Direkte Deployment-Pipeline

### Removed
- TAR-Export/Import Workflow eliminiert
- Manuelle Image-Transfer-Schritte nicht mehr nötig

### Changed
- docker-compose.yml nutzt GHCR-Image
- Deployment-Prozess vereinfacht

---

## [1.0.0] - 2026-03-21 - Production Release

### Added
- **Prisma Singleton Pattern**
  - `lib/prisma.ts` - Verhindert Memory Leaks in Development
  - Globaler Prisma Client für konsistente DB-Verbindungen

- **Docker Volume-Strategie**
  - `./data:/app/data` Volume-Mapping
  - `start.sh` Init-Script für DB-Initialisierung
  - Persistente Datenspeicherung auf NAS

- **Umfassende Dokumentation**
  - Brain.md - Projekt-Gedächtnis für Claude
  - README.md mit Setup-Anleitung
  - Inline-Code-Dokumentation

### Fixed
- Server-Error durch Memory Leak (Development Hot-Reload)
- Volume-Überschreibung beim ersten Container-Start
- Prisma Client Initialization Race Conditions

### Changed
- Volume-Mapping von `/app/prisma` auf `/app/data`
- DATABASE_URL zeigt auf `/app/data/dev.db`

---

## [0.9.0] - 2026-03-20 - Beta Release

### Added
- **Inventar-Management**
  - Manuelle Eingabe mit Live-Suche
  - Barcode-Scanner mit OpenFoodFacts Integration
  - Vorrats-Anzeige mit Cards

- **Rezept-Management**
  - URL-Scraping mit Schema.org Support
  - Rezept-Anzeige mit Bild und Zutaten
  - Manuelles Rezept-Erstellen

- **Smart Matching**
  - Match-Algorithmus mit Prozent-Anzeige
  - Kategorien: 100%, 50-99%, 0-49%
  - Fehlende Zutaten-Anzeige

- **Koch-Workflow**
  - CookRecipeDialog - Zutaten-Auswahl
  - Automatischer Bestandsabzug
  - Cache Invalidation

### Technical
- Next.js 16.2.1 mit App Router
- Prisma ORM 5.22.0 + SQLite
- Shadcn UI + Tailwind CSS 4
- Base UI (@base-ui/react) für Primitives
- Docker mit Multi-Stage Build

---

## [0.5.0] - 2026-03-19 - Alpha Release

### Added
- **Grundlegende Architektur**
  - Next.js Setup mit TypeScript
  - Prisma + SQLite Datenbank
  - Basic UI mit Shadcn Components

- **Datenbank-Schema**
  - Item Model (Lebensmittel)
  - Inventory Model (Vorrat)
  - Recipe Model (Rezepte)
  - RecipeIngredient Model (Zutaten-Relation)

- **Basic Features**
  - Dashboard mit Übersicht
  - Lebensmittel-Suche
  - Rezept-Liste

---

## [Unreleased]

### Planned for v2.0
- PWA Offline-Modus (Service Worker)
- Ablaufdatum-Tracking mit Benachrichtigungen
- Einkaufslisten aus fehlenden Zutaten
- Favoriten & Bewertungen
- Multi-User Support
- Nährwertinformationen
- Toast-Benachrichtigungen statt Browser-Alerts
- PostgreSQL-Unterstützung (optional)
- Mobile App (React Native/Expo)

---

## Version-Schema

Foodlabs folgt [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x): Breaking Changes
- **MINOR** (x.1.x): Neue Features (abwärtskompatibel)
- **PATCH** (x.x.1): Bugfixes (abwärtskompatibel)

---

## Links

- [Repository](https://github.com/Kroonk/KIIdea)
- [Docker Image](https://ghcr.io/kroonk/kiidea)
- [Issues](https://github.com/Kroonk/KIIdea/issues)
