# KIIdea - Food Tracker & Smart Recipes

## Projekt-Übersicht
KIIdea ist eine selbst gehostete, "Mobile-First" Web-Anwendung (PWA) zur effizienten Verwaltung von Lebensmitteln, mit integrierter Logik für smarte Rezeptvorschläge basierend auf dem aktuellen Kühlschrank-Inhalt.

**Status:** v1.0 Produktiv (März 2026)
**Repository:** https://github.com/Kroonk/KIIdea

---

## Tech-Stack & Architektur

### Core Technologies
- **Framework:** Next.js 16.2.1 (App Router, Server Actions, Turbopack)
- **Runtime:** Node.js 20.x
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4 + Shadcn UI (Custom Theme: Warm, Food-Inspired mit Creme, Terra-Orange und Olive)
- **Datenbank:** Prisma ORM 5.22.0 + SQLite (single-file `dev.db`)
- **UI Components:** Shadcn UI, Lucide Icons, Geist Fonts
- **Special Libraries:**
  - `html5-qrcode` (Barcode-Scanner)
  - `cheerio` (Web-Scraping)
  - `cmdk` (Command Menu)

### Architektur-Entscheidungen

#### Warum SQLite?
- ✅ **Single-File Database**: Perfekt für NAS-Umgebungen (einfache Backups)
- ✅ **Keine externen Services**: Keine Netzwerk-Latenz
- ✅ **Ausreichend Performance**: Für typische Haushalts-Daten (~1000 Items, ~100 Rezepte)
- ✅ **Zero Configuration**: Kein Setup notwendig

#### Warum Node 20 Bookworm statt Alpine?
- ❌ **Alpine Problem**: OpenSSL 1.1.x vs 3.x Inkompatibilität mit Prisma Query Engine
- ✅ **Bookworm Lösung**: Debian-basiert mit nativem OpenSSL Support
- ✅ **Kleineres Image**: `bookworm-slim` ist minimal (470 MB komprimiert)

---

## Datenbank-Architektur

### Schema Overview
```prisma
model Item {
  id        String   @id @default(cuid())
  name      String   @unique
  barcode   String?  @unique
  unit      String   @default("Stück")
  category  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  inventories       Inventory[]
  recipeIngredients RecipeIngredient[]
}

model Inventory {
  id        String    @id @default(cuid())
  quantity  Float
  expiresAt DateTime?
  item      Item      @relation(...)
  itemId    String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Recipe {
  id           String   @id @default(cuid())
  title        String
  description  String?
  imageUrl     String?
  sourceUrl    String?
  instructions String?
  ingredients  RecipeIngredient[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
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

### Datenfluss-Architektur
```
┌─────────────────────────────────────────────────────────────┐
│                    Data Sources                              │
├─────────────────────────────────────────────────────────────┤
│ [1] Seed Data      → 16 Basis-Lebensmittel                  │
│ [2] Manual Input   → User-Eingabe via Suchfeld              │
│ [3] Barcode Scan   → html5-qrcode → OpenFoodFacts API       │
│ [4] Recipe Scraper → Cheerio → Schema.org JSON-LD           │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│              Prisma Client (Singleton)                       │
│              src/lib/prisma.ts                               │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                SQLite Database                               │
│                /app/data/dev.db                              │
│  ┌────────────┐  ┌───────────┐  ┌────────┐                 │
│  │   Items    │  │ Inventory │  │ Recipe │                 │
│  │ (Master)   │  │ (Stock)   │  │        │                 │
│  └──────┬─────┘  └─────┬─────┘  └────┬───┘                 │
│         │              │              │                      │
│         └──────────────┴──────────────┘                     │
│                RecipeIngredient                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Haupt-Features & Implementierung

### 1. Inventar & Vorrat

#### 1.1 Manuelle Eingabe mit Autovervollständigung
**File:** `src/app/actions/inventory.ts`

```typescript
export async function searchItems(query: string) {
  if (!query || query.length < 2) return []
  return await prisma.item.findMany({
    where: { name: { contains: query } },
    take: 10
  })
}
```

**Flow:**
1. User tippt ≥2 Zeichen
2. Live-Suche in `Item` Tabelle (Case-insensitive)
3. Top 10 Matches werden zurückgegeben
4. User wählt Item oder erstellt neues

#### 1.2 Barcode-Scanner mit OpenFoodFacts Integration
**File:** `src/app/actions/inventory.ts` → `handleBarcodeScan()`

**Smart Caching Flow:**
```
User scannt Barcode
    ↓
┌─────────────────────────────┐
│ 1. Lokale DB durchsuchen    │
│    WHERE barcode = ?        │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │ Gefunden?   │
    └──────┬──────┘
           │
    ┌──────┴──────┐
    Yes            No
    │              │
    ↓              ↓
[Fertig!]   ┌──────────────────────────────┐
            │ 2. OpenFoodFacts API Call     │
            │    GET /api/v2/product/{ean}  │
            └──────────┬───────────────────┘
                       │
                ┌──────┴──────┐
                │ Product?    │
                └──────┬──────┘
                       │
                ┌──────┴──────┐
                Yes            No
                │              │
                ↓              ↓
         ┌──────────────┐  [Manuell]
         │ 3. Cache in  │
         │    lokaler DB│
         └──────┬───────┘
                ↓
         [Zum Inventar]
```

**Wichtig:** Jedes gescannte Produkt wird **dauerhaft lokal gespeichert**!

#### 1.3 Seed-Daten (Initial-Befüllung)
**File:** `food-app/prisma/seed.ts`

16 Basis-Lebensmittel:
- Milch (Vollmilch) - Liter
- Eier - Stück
- Mehl (Weizen) - Gramm
- Zucker - Gramm
- Salz - Prise
- Pfeffer (Schwarz) - Prise
- Olivenöl - ml
- Zwiebel - Stück
- Knoblauch - Zehe
- Kartoffel - Gramm
- Reis - Gramm
- Nudeln - Gramm
- Tomaten (Passiert) - ml
- Hähnchenbrust - Gramm
- Butter - Gramm
- Wasser - ml

**Aufruf:**
```bash
npx prisma db seed
```

### 2. Rezept-Management

#### 2.1 URL Web-Scraping (Schema.org)
**File:** `src/app/actions/scrape.ts` → `scrapeRecipeUrl()`

**Unterstützte Formate:**
- Schema.org `application/ld+json` mit `@type: "Recipe"`
- Websites: Chefkoch.de, Lecker.de, AllRecipes, etc.

**Scraping-Flow:**
```typescript
1. Fetch HTML mit User-Agent Header
2. Cheerio Parse
3. Suche alle <script type="application/ld+json">
4. Rekursive Suche nach @type="Recipe"
5. Extrahiere:
   - name → title
   - description → description
   - image → imageUrl (string | array | object.url)
   - recipeInstructions → instructions (array.text oder string)
   - recipeIngredient → ingredients (array of strings)
6. Parse jede Zutat mit Regex: /^([\d.,]+)\s*([a-zA-Z]+)?\s+(.+)$/
7. Upsert Items in DB
8. Create Recipe + RecipeIngredients
```

**Beispiel Regex-Parsing:**
```
Input:  "100 g Mehl"
Output: quantity=100, unit="g", name="Mehl"

Input:  "1 TL Salz"
Output: quantity=1, unit="TL", name="Salz"

Input:  "Prise Pfeffer"
Output: quantity=1, unit="Stück", name="Prise Pfeffer"
```

#### 2.2 Manuelle Rezepteingabe
**Status:** UI-Skeleton existiert in `src/app/recipes/new/page.tsx`
**Geplant für:** v2.0

### 3. Smart Matching ("Was kochen wir heute?")

#### 3.1 Match-Algorithmus
**File:** `src/app/actions/match.ts` → `getMatchedRecipes()`

**Performance-Optimierung:**
```typescript
// HashMap für O(1) Lookup statt O(n) Array-Suche
const inventoryMap = new Map<string, number>()
for (const inv of inventory) {
  inventoryMap.set(inv.itemId, inv.quantity)
}

// Für jedes Rezept:
for (const recipe of recipes) {
  let matchCount = 0
  for (const ingredient of recipe.ingredients) {
    const availableQty = inventoryMap.get(ingredient.itemId) || 0
    if (availableQty >= ingredient.quantity) {
      matchCount++
    }
  }
  const percentage = Math.round((matchCount / recipe.ingredients.length) * 100)
}
```

**Match-Kategorien:**
- 🟢 **100%**: Alles im Haus → "Alles im Haus!" Badge
- 🟡 **50-99%**: Teilweise vorhanden → Gelbes Badge + Fehlende Zutaten
- 🔴 **0-49%**: Wenig vorhanden → Rotes Badge + Fehlende Zutaten

**Sortierung:** Absteigende Reihenfolge nach Match-Prozentsatz

#### 3.2 Fehlende Zutaten Anzeige
```typescript
missingIngredients: {
  ...ingredient,
  inventoryHas: number  // Zeigt an, wie viel vorhanden ist
}

// UI: "Es fehlen 50g Zucker (0g vorhanden)"
```

### 4. Koch-Workflow (Inventarabzug)

#### 4.1 Dialog mit Zutatenauswahl
**Component:** `src/components/CookRecipeDialog.tsx`

**Features:**
- ✅ Alle verfügbaren Zutaten vorausgewählt
- ✅ Checkboxen zum Ab-/Auswählen
- ✅ Mengenanzeige pro Zutat
- ✅ Loading State während Abzug

#### 4.2 Präziser Inventarabzug
**File:** `src/app/actions/cook.ts` → `deductIngredients()`

```typescript
export async function deductIngredients(items: { itemId: string, quantity: number }[]) {
  for (const requested of items) {
    const inv = await prisma.inventory.findFirst({
      where: { itemId: requested.itemId }
    })

    if (inv) {
      if (inv.quantity > requested.quantity) {
        // Subtrahiere Menge
        await prisma.inventory.update({
          where: { id: inv.id },
          data: { quantity: inv.quantity - requested.quantity }
        })
      } else {
        // Lösche Eintrag komplett (Bestand aufgebraucht)
        await prisma.inventory.delete({
          where: { id: inv.id }
        })
      }
    }
  }

  revalidatePath('/')
  revalidatePath('/inventory')
}
```

**Edge Cases:**
- ✅ Bestand = 0 → Delete statt Update
- ✅ Teilabzug möglich (z.B. 50g von 200g)
- ✅ Cache Invalidation für Dashboard & Inventar

---

## Kritische Technische Details

### 1. Prisma Client Singleton Pattern ⚠️ KRITISCH

**Problem (Behoben März 2026):**
Ursprünglich erstellte jede Server Action eine eigene `PrismaClient` Instanz:
```typescript
// ❌ FALSCH - Memory Leak!
const prisma = new PrismaClient()
```

**Lösung:**
Zentrale Singleton-Instanz in `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma
```

**Verwendung in allen Server Actions:**
```typescript
import { prisma } from '@/lib/prisma'
```

**Vorteile:**
- ✅ Verhindert Memory Leaks
- ✅ Wiederverwendung bestehender Connections
- ✅ Hot-Reload kompatibel (Development)
- ✅ Production-optimiert

**Files aktualisiert:**
- `src/app/actions/inventory.ts`
- `src/app/actions/match.ts`
- `src/app/actions/recipes.ts`
- `src/app/actions/cook.ts`
- `src/app/actions/scrape.ts`

### 2. Error Handling Strategy

**Alle kritischen Actions haben try-catch:**

```typescript
export async function getInventory() {
  try {
    return await prisma.inventory.findMany({
      include: { item: true },
      orderBy: { item: { name: 'asc' } }
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return []  // Graceful fallback
  }
}
```

**Fehlerbehandlung:**
- 🔴 **Datenbank-Fehler:** Leere Arrays zurückgeben (UI zeigt "Keine Daten")
- 🔴 **API-Fehler (OpenFoodFacts):** Manueller Fallback vorgeschlagen
- 🔴 **Scraping-Fehler:** Fehlermeldung mit Details

### 3. Docker Build OpenSSL Warnungen

**Während des Builds erscheinen diese Warnungen (HARMLOS):**
```
prisma:warn Prisma failed to detect the libssl/openssl version to use
Error [PrismaClientInitializationError]: libssl.so.1.1: cannot open shared object file
```

**Warum?**
- Prisma versucht während `npx prisma generate` die Query Engine zu laden
- Im **Builder-Stage** ist OpenSSL noch nicht verfügbar
- Die Fehler sind nur beim **Build**, nicht beim **Runtime**!

**Runtime-Lösung:**
- `node:20-bookworm-slim` hat OpenSSL 3.x nativ integriert
- Im **Runner-Stage** funktioniert alles einwandfrei
- Container startet ohne Fehler: `✓ Ready in 0ms`

### 4. Database Volume Strategie

**Problem (Behoben):**
Ursprüngliches Mapping `./data:/app/prisma` überschrieb `schema.prisma` im Container!

**Aktuelle Lösung:**
```yaml
volumes:
  - ./data:/app/data  # Getrennt von /app/prisma!
```

**start.sh Logic:**
```bash
#!/bin/sh
mkdir -p /app/data

if [ ! -f /app/data/dev.db ]; then
  echo "Keine Datenbank im Volume gefunden. Kopiere initiale Datenbank..."
  cp /app/prisma/dev.db /app/data/dev.db
  echo "Initialisierung abgeschlossen."
fi

exec node server.js
```

**Flow:**
1. Container startet
2. `/app/data` wird als Volume gemountet (leer beim ersten Start)
3. `start.sh` prüft: Existiert `/app/data/dev.db`?
4. Falls NEIN: Kopiere Master-DB von `/app/prisma/dev.db` → `/app/data/dev.db`
5. Falls JA: Nutze bestehende DB (Daten bleiben erhalten!)

**Vorteile:**
- ✅ Erster Start ohne manuelle DB-Kopie
- ✅ Daten überleben Container-Neustarts
- ✅ Einfaches Backup: Kopiere `./data/dev.db`

---

## Docker Deployment

### Multi-Stage Build Architektur

**Dockerfile Struktur:**
```dockerfile
# Stage 1: Base
FROM node:20-bookworm-slim AS base

# Stage 2: Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate    # Generiere Prisma Client
RUN npm run build          # Next.js Standalone Build

# Stage 4: Runner (Production)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Kopiere nur notwendige Files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000
CMD ["./start.sh"]
```

**Image-Größe:**
- Unkomprimiert: ~470 MB
- Komprimiert (.tar): ~455 MB

### docker-compose.yml Konfiguration

```yaml
services:
  food-app:
    image: kiidea-food-app:latest
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

**Netzwerk-Setup:**
- `npm-net` ist ein **externes Docker-Netzwerk** für Nginx Proxy Manager
- Muss vorher erstellt werden: `docker network create npm-net`
- Ermöglicht SSL/HTTPS via Nginx Reverse Proxy

### Nginx Proxy Manager Integration

**Setup-Schritte:**

1. **Netzwerk erstellen:**
```bash
docker network create npm-net
```

2. **Proxy Host in NPM hinzufügen:**
- **Domain Names:** `food.example.com`
- **Scheme:** `http`
- **Forward Hostname:** `kiidea-food-app` (Container-Name!)
- **Forward Port:** `3000`
- **Cache Assets:** ✅
- **Block Common Exploits:** ✅
- **Websockets Support:** ✅

3. **SSL Zertifikat:**
- Let's Encrypt Auto-Renewal
- Force SSL: ✅
- HTTP/2: ✅

**Wichtig:** Container-Name als Hostname verwenden, nicht IP!

---

## Deployment-Workflow

### Lokale Entwicklung
```bash
cd food-app
npm install
npx prisma generate
npx prisma db push      # Schema → DB
npx prisma db seed      # Seed-Daten
npm run dev             # Dev-Server: http://localhost:3000
```

### Docker Image Build
```bash
cd food-app
docker build -t kiidea-food-app:latest .
```

### Docker Image Export (.tar)
```bash
docker save kiidea-food-app:latest -o food-app-v1.0.tar
```

### Image auf NAS laden
```bash
# Auf NAS:
docker load -i food-app-v1.0.tar
docker-compose up -d
```

### Container-Status prüfen
```bash
docker ps                          # Läuft der Container?
docker logs kiidea-food-app        # Logs anzeigen
curl http://localhost:3000         # HTTP-Test
```

---

## Troubleshooting

### Problem: "This page couldn't load" / Server Error

**Ursache:** Prisma kann keine Verbindung zur Datenbank herstellen

**Lösungsschritte:**
1. **Container-Logs prüfen:**
```bash
docker logs kiidea-food-app
```

2. **Datenbank existiert?**
```bash
ls -la ./data/dev.db
```

3. **Container neu starten:**
```bash
docker-compose restart
```

4. **Volume-Permissions prüfen:**
```bash
# Auf NAS:
chmod 755 ./data
chmod 644 ./data/dev.db
```

5. **Prisma Singleton prüfen:**
```typescript
// src/lib/prisma.ts muss existieren!
import { prisma } from '@/lib/prisma'
```

### Problem: OpenSSL Warnungen beim Build

**Symptom:**
```
prisma:warn Prisma failed to detect the libssl/openssl version
Error [PrismaClientInitializationError]: libssl.so.1.1: cannot open
```

**Diagnose:** ✅ HARMLOS - Build war trotzdem erfolgreich!

**Warum?**
- Prisma versucht Query Engine im Builder-Stage zu laden
- OpenSSL ist erst im Runner-Stage verfügbar
- Runtime funktioniert einwandfrei (siehe Logs: `✓ Ready in 0ms`)

**Aktion:** Ignorieren, solange der Build erfolgreich ist!

### Problem: npm-net Network not found

**Symptom:**
```
Error response from daemon: network npm-net not found
```

**Lösung:**
```bash
# Option 1: Netzwerk erstellen
docker network create npm-net

# Option 2: docker-compose.yml anpassen (ohne NPM)
# Kommentiere networks-Sektion aus
```

### Problem: Port 3000 bereits belegt

**Symptom:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Lösung:**
```bash
# Option 1: Anderen Container stoppen
docker ps | grep 3000
docker stop <container-id>

# Option 2: Anderen Port verwenden
# docker-compose.yml:
ports:
  - "3001:3000"  # Host:3001 → Container:3000
```

### Problem: Datenbank-Fehler nach Update

**Symptom:** Schema-Änderungen sind nicht aktiv

**Lösung:**
```bash
# In food-app/:
npx prisma generate      # Client neu generieren
npx prisma db push       # Schema → DB pushen

# Dann Image neu bauen:
docker build -t kiidea-food-app:latest .
docker-compose up -d --force-recreate
```

---

## Performance & Optimierungen

### Prisma Query Optimierungen

**Includes nutzen:**
```typescript
// ✅ OPTIMAL: Alles in 1 Query
const inventory = await prisma.inventory.findMany({
  include: { item: true }
})

// ❌ SCHLECHT: N+1 Problem
const inventory = await prisma.inventory.findMany()
for (const inv of inventory) {
  const item = await prisma.item.findUnique({ where: { id: inv.itemId }})
}
```

**HashMap für Lookups:**
```typescript
// ✅ O(1) Lookup
const inventoryMap = new Map<string, number>()
for (const inv of inventory) {
  inventoryMap.set(inv.itemId, inv.quantity)
}
const qty = inventoryMap.get(itemId) || 0

// ❌ O(n) Lookup
const qty = inventory.find(inv => inv.itemId === itemId)?.quantity || 0
```

### Next.js Caching

**revalidatePath() nach Mutations:**
```typescript
await prisma.inventory.create({ ... })
revalidatePath('/inventory')  // Invalidate Cache
```

**Dynamic Routes:**
```typescript
export const dynamic = "force-dynamic"  // Immer Server-Rendered
```

### Docker Layer Caching

**Reihenfolge optimiert:**
```dockerfile
# 1. Dependencies (cached wenn package.json unverändert)
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Code (nur wenn Code sich ändert)
COPY . .
RUN npm run build
```

---

## Sicherheits-Überlegungen

### Input Validation

**Server Actions:**
```typescript
// Barcode: Nur Zahlen erlaubt
if (!/^\d+$/.test(barcode)) {
  return { success: false, message: 'Ungültiger Barcode' }
}

// Quantity: Nur positive Zahlen
if (quantity <= 0) {
  return { success: false, message: 'Menge muss positiv sein' }
}
```

### SQL Injection Protection

✅ **Prisma schützt automatisch** via Prepared Statements:
```typescript
// ✅ SICHER
prisma.item.findMany({
  where: { name: { contains: userInput }}
})

// Wird zu Prepared Statement:
// SELECT * FROM Item WHERE name LIKE ?
```

### XSS Protection

✅ **React escaped automatisch** HTML:
```tsx
// ✅ SICHER
<p>{recipe.title}</p>  // Automatisch escaped

// ❌ UNSICHER (nicht verwendet!)
<p dangerouslySetInnerHTML={{ __html: recipe.title }} />
```

### Environment Variables

**Sensitive Daten in .env:**
```bash
DATABASE_URL="file:./dev.db"
```

**.gitignore:**
```
.env
.env*.local
*.db          # Lokale DB nicht committen
data/dev.db   # Runtime-DB nicht committen
```

---

## Bekannte Limitierungen

### 1. Rezept-Scraping
- ❌ Nicht alle Websites unterstützen Schema.org
- ❌ Regex-Parsing kann bei ungewöhnlichen Formaten fehlschlagen
- ✅ Fallback: Manuelle Rezepteingabe (v2.0)

### 2. Barcode-Scanner
- ❌ Funktioniert nur mit Kamera-Zugriff (HTTPS/Localhost notwendig)
- ❌ OpenFoodFacts API kann Produkte fehlen
- ✅ Fallback: Manuelle Eingabe

### 3. SQLite Performance
- ⚠️ Bei >10.000 Items kann Performance sinken
- ⚠️ Keine Concurrent Writes (Single-Writer)
- ✅ Für Haushalts-Use-Case ausreichend

### 4. Fehlende Features (v1.0)
- ❌ Ablaufdatum-Tracking
- ❌ Einkaufslisten
- ❌ Multi-User Support
- ❌ PWA Offline-Modus
- ✅ Geplant für v2.0

---

## Changelog & Version History

### v1.0 (März 2026) - Production Release
**Fixes:**
- ✅ Prisma Singleton Pattern implementiert (`lib/prisma.ts`)
- ✅ Server-Error behoben (PrismaClient Memory Leak)
- ✅ Error Handling in allen Server Actions
- ✅ docker-compose.yml für Nginx Proxy Manager optimiert
- ✅ Volume-Strategie korrigiert (`./data:/app/data`)

**Improvements:**
- ✅ Metadata aktualisiert (deutscher Titel, Sprache)
- ✅ .gitignore erweitert (runtime DB ausgeschlossen)
- ✅ Umfassende Dokumentation (README.md, Brain.md, Plan.md)

**Technical:**
- ✅ Next.js 16.2.1 (Turbopack)
- ✅ Prisma 5.22.0
- ✅ Tailwind CSS 4
- ✅ Node 20 Bookworm Slim

### v0.9 (März 2026) - Beta
- Initial Build
- Basis-Features implementiert
- Docker-Setup

---

## Zukünftige Features (v2.0 Roadmap)

### Geplante Features
- [ ] **PWA Offline-Modus** (Service Worker, Cache API)
- [ ] **Ablaufdatum-Tracking** mit Push-Benachrichtigungen
- [ ] **Einkaufslisten** aus fehlenden Zutaten
- [ ] **Favoriten & Bewertungen** für Rezepte
- [ ] **Erweiterte Suche** (Filter nach Kategorie, Allergenen)
- [ ] **Multi-User Support** mit Authentifizierung
- [ ] **Dark Mode Toggle**
- [ ] **Rezept-Export** (PDF, JSON)
- [ ] **Mengeneinheiten-Konverter** (g ↔ kg, ml ↔ l)
- [ ] **Nährwertinformationen** (Kalorien, Protein, etc.)

### Technische Improvements
- [ ] **React Query** für besseres Caching
- [ ] **Vitest** Unit Tests
- [ ] **Playwright** E2E Tests
- [ ] **Sentry** Error Tracking
- [ ] **Rate Limiting** für OpenFoodFacts API

---

## Support & Ressourcen

### Offizielle Dokumentation
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Shadcn UI:** https://ui.shadcn.com

### APIs
- **OpenFoodFacts:** https://world.openfoodfacts.org/data
- **Schema.org Recipe:** https://schema.org/Recipe

### Repository
- **GitHub:** https://github.com/Kroonk/KIIdea
- **Issues:** https://github.com/Kroonk/KIIdea/issues

### Community
- Docker: https://docs.docker.com
- Nginx Proxy Manager: https://nginxproxymanager.com

---

**Letzte Aktualisierung:** März 2026
**Version:** 1.0 (Produktiv)
**Maintainer:** Kroonk
