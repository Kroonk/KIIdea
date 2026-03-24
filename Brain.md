# KIIdea - Food Tracker & Smart Recipes

> **⚠️ META-REGELN FÜR CLAUDE:**
> 1. Diese Datei ist das **Projekt-Gedächtnis**. Nach **jeder Code-Änderung** MUSS die Brain.md aktualisiert werden.
> 2. **AUTO-OPTIMIERUNG TRIGGER:** Wenn der User "Optimiere mein System", "Optimierung" oder ähnliche Befehle gibt:
>    - Rufe die ältesten 3 offenen GitHub Issues ab: `curl -s "https://api.github.com/repos/Kroonk/KIIdea/issues?state=open&sort=created&direction=asc&per_page=3"`
>    - Arbeite diese Issues nacheinander ab (implementieren, testen, committen)
>    - Schließe jedes Issue nach Fertigstellung mit: `curl -X PATCH -H "Accept: application/vnd.github+json" https://api.github.com/repos/Kroonk/KIIdea/issues/{issue_number} -d '{"state":"closed"}'`
>    - Aktualisiere die Brain.md mit den neuen Features
> 3. Behandle diese Datei wie dein Langzeitgedächtnis. Nutze sie proaktiv!

---

## Projekt-Übersicht
Foodlabs (ehemals KIIdea) ist eine selbst gehostete "Mobile-First" PWA zur effizienten Verwaltung von Lebensmitteln mit smarten Rezeptvorschlägen basierend auf Kühlschrank-Inhalt.

**Status:** v1.4 Produktiv (März 2026)
**Repository:** https://github.com/Kroonk/KIIdea

---

## Tech-Stack & Architektur

### Core Technologies
- **Framework:** Next.js 16.2.1 (App Router, Server Actions, Turbopack)
- **Runtime:** Node.js 20.x
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4 + Shadcn UI (Warm Food-Inspired Theme + Dark Mode)
- **Datenbank:** Prisma ORM 5.22.0 + SQLite (`dev.db`)
- **UI Components:** Shadcn UI, Lucide Icons, Geist Fonts
- **Theme System:** next-themes (Light/Dark/System)
- **Special Libraries:** `html5-qrcode`, `cheerio`, `cmdk`

### Wichtige UI-Komponenten
**Custom Components:**
- `AddQuantityDialog.tsx` (v1.2) - Mengen-Eingabe mit Smart Package Detection
- `EditQuantityDialog.tsx` (v1.3) - Mengen-Bearbeitung für Vorrat
- `InventoryCard.tsx` (v1.3) - Card mit Edit/Delete Actions
- `ThemeToggle.tsx` (v1.3) - Dark Mode Switcher (Dialog-basiert)
- `BarcodeScanner.tsx` - Wrapper für html5-qrcode
- `CookRecipeDialog.tsx` - Zutaten-Auswahl beim Kochen
- `ItemSearch.tsx` - Lebensmittel-Suche mit Autocomplete
- `Navigation.tsx` - Bottom/Top Navigation Bar mit Theme-Toggle

### Architektur-Entscheidungen
- **SQLite:** Single-File DB, perfekt für NAS, keine externen Services, ausreichend Performance für Haushalts-Daten
- **Node 20 Bookworm:** Debian-basiert mit nativem OpenSSL 3.x Support (Alpine hatte Inkompatibilitäten)

---

## Datenbank-Schema

```prisma
model Item {
  id        String   @id @default(cuid())
  name      String   @unique
  barcode   String?  @unique
  unit      String   @default("Stück")
  category  String?
  inventories       Inventory[]
  recipeIngredients RecipeIngredient[]
}

model Inventory {
  id        String    @id @default(cuid())
  quantity  Float
  expiresAt DateTime?
  item      Item      @relation(...)
  itemId    String
}

model Recipe {
  id           String   @id @default(cuid())
  title        String
  description  String?
  imageUrl     String?
  sourceUrl    String?
  instructions String?
  ingredients  RecipeIngredient[]
}

model RecipeIngredient {
  id       String @id @default(cuid())
  quantity Float
  unit     String?
  recipe   Recipe @relation(...)
  item     Item   @relation(...)
  @@unique([recipeId, itemId])
}
```

---

## Haupt-Features & Implementierung

### 1. Inventar & Vorrat

#### 1.1 Manuelle Eingabe
**File:** `src/app/actions/inventory.ts` → `searchItems()`
- Live-Suche ab 2 Zeichen (Case-insensitive)
- Top 10 Matches

#### 1.2 Barcode-Scanner mit OpenFoodFacts
**File:** `src/app/actions/inventory.ts` → `handleBarcodeScan()`

**Smart Caching Flow:**
1. Lokale DB durchsuchen
2. Falls nicht gefunden: OpenFoodFacts API
3. Produkt dauerhaft lokal speichern

#### 1.3 Mengen-Eingabe (v1.2)
**Component:** `AddQuantityDialog.tsx`

**Features:**
- Number-Input mit Auto-Focus & Enter
- Schnellauswahl (1, 2, 5, 10, 500g, 1kg)
- Kontext-sensitive Buttons basierend auf Einheit
- Smart Package Size Detection von OpenFoodFacts (kg→g, l→ml)

### 2. Rezept-Management

#### 2.1 URL Web-Scraping
**File:** `src/app/actions/scrape.ts` → `scrapeRecipeUrl()`

**Unterstützt:** Schema.org `application/ld+json` (Chefkoch, Lecker, etc.)

**Flow:**
1. Fetch HTML → Cheerio Parse
2. Suche `<script type="application/ld+json">`
3. Rekursive Suche nach `@type="Recipe"`
4. Extrahiere: name, description, image, instructions, ingredients
5. Parse Zutaten mit Regex: `/^([\d.,]+)\s*([a-zA-Z]+)?\s+(.+)$/`
6. Upsert Items → Create Recipe + Ingredients

### 3. Smart Matching

#### 3.1 Match-Algorithmus
**File:** `src/app/actions/match.ts` → `getMatchedRecipes()`

**Performance-Optimierung:**
```typescript
// HashMap für O(1) Lookup statt O(n)
const inventoryMap = new Map<string, number>()
for (const inv of inventory) {
  inventoryMap.set(inv.itemId, inv.quantity)
}
```

**Match-Kategorien:**
- 🟢 100%: "Alles im Haus!"
- 🟡 50-99%: Teilweise + Fehlende Zutaten
- 🔴 0-49%: Wenig vorhanden

### 4. Koch-Workflow

**Component:** `CookRecipeDialog.tsx`
**Action:** `src/app/actions/cook.ts` → `deductIngredients()`

**Edge Cases:**
- Bestand = 0 → Delete statt Update
- Teilabzug möglich (50g von 200g)
- Cache Invalidation für Dashboard & Inventar

### 5. Backup & Restore (v1.4)

#### 5.1 Export-Funktion
**File:** `src/app/actions/backup.ts` → `exportData()`

**Export-Format:**
```typescript
{
  version: "1.4",
  exportDate: "2026-03-24T...",
  items: [...],      // Alle Items mit ID, name, barcode, unit, category
  inventory: [...],  // Alle Vorräte mit ID, quantity, expiresAt, itemId
  recipes: [...]     // Alle Rezepte mit Zutaten
}
```

**Route:** `/backup` - UI für Export/Import mit RadioGroup für Modi

#### 5.2 Import-Funktion
**Action:** `importData(data, mode)`

**Modi:**
- **merge**: Bestehende Einträge behalten + Neue hinzufügen (Upsert by ID)
- **replace**: ALLE Daten löschen → Neu importieren

**Flow:**
1. Validierung (version, items Array)
2. Replace Mode: Delete RecipeIngredient → Recipe → Inventory → Item
3. Upsert Items (by ID)
4. Upsert Inventory (by ID)
5. Upsert Recipes + Ingredients (by ID)
6. Cache Invalidation (/, /inventory, /recipes)

### 6. Einheiten-Editor (v1.4)

**Component:** `EditQuantityDialog.tsx`
**Action:** `updateInventory(id, quantity, unit?)`

**Features:**
- Native HTML `<select>` mit 10 Einheiten
- Einheiten: Stück, Gramm, Kilogramm, ml, Liter, Teelöffel, Esslöffel, Packung, Dose, Bund
- Wenn Einheit geändert: Update Item.unit via Inventory.itemId
- Schnellauswahl-Buttons passen sich an gewählte Einheit an

---

## Kritische Technische Details

### 1. Prisma Client Singleton Pattern ⚠️ KRITISCH

**File:** `src/lib/prisma.ts`

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma
```

**Wichtig:** Alle Server Actions MÜSSEN `import { prisma } from '@/lib/prisma'` verwenden!

### 2. Docker Volume Strategie

**Problem:** Leere Volumes überschreiben Container-Dateien

**Lösung:** `start.sh` prüft beim Start:
```bash
if [ ! -f /app/data/dev.db ]; then
  cp /app/prisma/dev.db /app/data/dev.db
fi
```

**Volume Mapping:** `./data:/app/data` (getrennt von `/app/prisma`)

### 3. Docker Build
**Base Image:** `node:20-bookworm-slim`
**Multi-Stage:** deps → builder → runner
**Image Size:** ~470 MB komprimiert

**OpenSSL Warnungen beim Build sind HARMLOS** (Query Engine wird erst im Runner verfügbar).

---

## Docker Deployment

### docker-compose.yml
```yaml
services:
  food-app:
    image: ghcr.io/kroonk/kiidea:latest
    pull_policy: always
    container_name: kiidea-food-app
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - DATABASE_URL="file:/app/data/dev.db"
    restart: unless-stopped
    networks:
      - npm-net

networks:
  npm-net:
    external: true
```

### Deployment auf NAS
```bash
cd /volume2/docker/Vibecoding/Website/KIIdea
docker compose pull     # Neueste Version
docker compose up -d    # Update Container
```

### Lokaler Build & Push
```bash
cd food-app
docker build -t ghcr.io/kroonk/kiidea:latest .
docker push ghcr.io/kroonk/kiidea:latest
```

**Wichtig:** Docker Compose V2 nutzt `docker compose` (mit Leerzeichen), nicht `docker-compose`!

---

## Troubleshooting

### "This page couldn't load" Server Error
**Ursache:** Prisma kann keine DB-Verbindung herstellen
**Lösung:**
1. `ls -la ./data/dev.db` (existiert DB?)
2. `docker compose restart`
3. `docker logs kiidea-food-app`

### OpenSSL Warnungen beim Build
**Status:** ✅ HARMLOS - Build ist erfolgreich
**Warum:** Prisma versucht Query Engine im Builder-Stage zu laden, OpenSSL ist erst im Runner verfügbar

### npm-net Network not found
```bash
docker network create npm-net
```

### Port 3000 belegt
```bash
# Anderen Container stoppen oder Port ändern:
ports:
  - "3001:3000"
```

---

## Bekannte Limitierungen (v1.4)

- ❌ Ablaufdatum-Tracking
- ❌ Einkaufslisten
- ❌ Multi-User Support
- ❌ PWA Offline-Modus
- ❌ Toast-Benachrichtigungen (aktuell nur console.log)
- ❌ Nicht alle Websites unterstützen Schema.org
- ❌ Barcode-Scanner benötigt HTTPS/Localhost (Kamera-Zugriff)

**Geplant für:** v2.0

---

## Changelog

### v1.4 (März 2026) - Backup/Restore & Einheiten-Editor
- ✅ **Import/Export-Funktion** (Issue #4): Backup & Restore auf /backup-Seite
- ✅ **exportData()** Server Action: Exportiert Items, Inventory, Recipes als JSON
- ✅ **importData()** Server Action: Import mit Merge/Replace-Modi
- ✅ **Backup-Button**: Database-Icon in Vorrats-Seite für schnellen Zugriff
- ✅ **Einheiten-Editor** (Issue #5): Maßeinheit im EditQuantityDialog änderbar
- ✅ **10 Einheiten**: Stück, Gramm, Kilogramm, ml, Liter, Teelöffel, Esslöffel, Packung, Dose, Bund
- ✅ **updateInventory() erweitert**: Unterstützt optionale Einheiten-Updates
- ✅ **Neue UI-Komponenten**: Alert & RadioGroup (native HTML-basiert)
- **Neue Routes:** `/backup`

### v1.3 (März 2026) - Inventory Management & Dark Mode
- ✅ **Vorrat Bearbeiten/Löschen**: Inventory-Cards mit Edit & Delete Buttons
- ✅ **EditQuantityDialog**: Dialog zum Bearbeiten von Mengen
- ✅ **InventoryCard Component**: Eigenständige Card-Komponente mit Actions
- ✅ **Schnell-Hinzufügen Button**: Direkter Link zu /add in Vorrats-Seite
- ✅ **Dark Mode**: next-themes Integration mit 3 Modi (Hell, Dunkel, System)
- ✅ **ThemeToggle**: Dialog-basierter Theme-Switcher in Navigation
- ✅ **Rebranding**: "KIIdea Food" → "Foodlabs"
- ✅ **updateInventory()** Server Action
- **Neue Dependencies:** next-themes@^0.4.4

### v1.2 (März 2026) - Quantity Input & Smart Package Detection
- ✅ AddQuantityDialog mit Number-Input, Enter-Support, Schnellauswahl
- ✅ OpenFoodFacts Packungsgrößen-Erkennung (kg→g, l→ml)
- ✅ Kontext-sensitive Buttons (500g, 1kg bei Gramm)
- ✅ `handleBarcodeScan()` gibt Item-Info zurück statt auto-add
- **Docker:** `ghcr.io/kroonk/kiidea:latest` (sha256:0ccf1a9...)

### v1.1 (März 2026) - GHCR Migration
- ✅ Migration zu GitHub Container Registry
- ✅ `pull_policy: always` für automatische Updates
- ✅ Public Package (login-freies Pulling)
- ✅ Eliminiert TAR-Export/Import Workflow

### v1.0 (März 2026) - Production Release
- ✅ Prisma Singleton Pattern (`lib/prisma.ts`)
- ✅ Server-Error behoben (Memory Leak Fix)
- ✅ Volume-Strategie korrigiert (`./data:/app/data`)
- ✅ Umfassende Dokumentation

---

## Projektstruktur (Wichtigste Dateien)

```
KIIdea/
├── food-app/
│   ├── src/
│   │   ├── app/
│   │   │   ├── actions/          # Server Actions (Prisma Queries)
│   │   │   │   ├── inventory.ts  # Inventar + Barcode + Einheit-Update
│   │   │   │   ├── backup.ts     # Import/Export (v1.4)
│   │   │   │   ├── match.ts      # Match-Algorithmus
│   │   │   │   ├── cook.ts       # Koch-Workflow
│   │   │   │   ├── scrape.ts     # URL-Scraping
│   │   │   │   └── recipes.ts    # Rezept-CRUD
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── inventory/page.tsx
│   │   │   ├── backup/page.tsx   # Backup & Restore (v1.4)
│   │   │   └── recipes/
│   │   ├── components/
│   │   │   ├── AddQuantityDialog.tsx (v1.2)
│   │   │   ├── EditQuantityDialog.tsx (v1.3, v1.4: Einheiten-Editor)
│   │   │   ├── InventoryCard.tsx (v1.3)
│   │   │   ├── ThemeToggle.tsx (v1.3)
│   │   │   ├── theme-provider.tsx (v1.3)
│   │   │   ├── ItemSearch.tsx
│   │   │   ├── BarcodeScanner.tsx
│   │   │   ├── CookRecipeDialog.tsx
│   │   │   └── ui/               # Shadcn/Custom Components
│   │   │       ├── alert.tsx (v1.4)
│   │   │       └── radio-group.tsx (v1.4)
│   │   └── lib/
│   │       └── prisma.ts         # ⚠️ SINGLETON
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── dev.db                # Master-DB
│   │   └── seed.ts
│   ├── Dockerfile
│   ├── start.sh                  # Container Init
│   └── package.json
├── data/                         # Volume für Runtime-DB
├── docker-compose.yml
├── Brain.md                      # Diese Datei
└── README.md
```

---

## Zukünftige Features (v2.0 Roadmap)

- [ ] PWA Offline-Modus (Service Worker)
- [ ] Ablaufdatum-Tracking mit Benachrichtigungen
- [ ] Einkaufslisten aus fehlenden Zutaten
- [ ] Favoriten & Bewertungen
- [ ] Multi-User Support
- [ ] Nährwertinformationen
- [ ] Toast-Benachrichtigungen statt Browser-Alerts

---

## Support & Ressourcen

- **GitHub:** https://github.com/Kroonk/KIIdea
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Shadcn UI:** https://ui.shadcn.com
- **OpenFoodFacts:** https://world.openfoodfacts.org/data

---

**Letzte Aktualisierung:** 24. März 2026
**Version:** 1.4 (Backup/Restore & Einheiten-Editor)
**Maintainer:** Kroonk
