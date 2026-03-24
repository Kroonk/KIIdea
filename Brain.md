# KIIdea - Food Tracker & Smart Recipes

> **⚠️ META-REGELN FÜR CLAUDE:**
> 1. Diese Datei ist das **Projekt-Gedächtnis**. Nach **jeder Code-Änderung** MUSS die Brain.md aktualisiert werden.
> 2. **AUTO-OPTIMIERUNG TRIGGER:** Wenn der User "Optimiere mein System", "Optimierung" oder ähnliche Befehle gibt:
>    - Rufe die ältesten 3 offenen GitHub Issues ab: `curl -s "https://api.github.com/repos/Kroonk/KIIdea/issues?state=open&sort=created&direction=asc&per_page=3"`
>    - Arbeite diese Issues nacheinander ab (implementieren, testen, committen)
>    - Schließe jedes Issue nach Fertigstellung mit: `curl -X PATCH -H "Accept: application/vnd.github+json" https://api.github.com/repos/Kroonk/KIIdea/issues/{issue_number} -d '{"state":"closed"}'`
>    - Aktualisiere die Brain.md mit den neuen Features
>    - **DEPLOYMENT:** Nach Abschluss IMMER ausführen:
>      1. `git push` - Änderungen auf GitHub pushen
>      2. Docker Build & Push: `cd food-app && docker build -t ghcr.io/kroonk/kiidea:latest . && docker push ghcr.io/kroonk/kiidea:latest`
>      3. User kann dann direkt auf NAS deployen mit: `docker compose pull && docker compose up -d`
> 3. Behandle diese Datei wie dein Langzeitgedächtnis. Nutze sie proaktiv!
> 4. **Dokumentations-Struktur:** Detaillierte Infos sind ausgelagert - verweise immer auf die entsprechenden Dateien!

---

## 📚 Dokumentations-Übersicht

| Datei | Inhalt | Wann nutzen? |
|-------|--------|--------------|
| **Brain.md** | Projekt-Übersicht, Kritische Details, Projektstruktur | Grundlegendes Verständnis |
| **[FEATURES.md](FEATURES.md)** | Detaillierte Feature-Implementierung | Wie funktioniert Feature X? |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Docker Build, GHCR, NAS-Deployment | Deployment & Updates |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Fehlerbehandlung, Debugging | Probleme lösen |
| **[CHANGELOG.md](CHANGELOG.md)** | Versionshistorie | Was ist neu? |
| **README.md** | User-Dokumentation, Setup | Für Endnutzer |

---

## Projekt-Übersicht

Foodlabs (ehemals KIIdea) ist eine selbst gehostete "Mobile-First" PWA zur effizienten Verwaltung von Lebensmitteln mit smarten Rezeptvorschlägen basierend auf Kühlschrank-Inhalt.

**Status:** v1.4.1 Produktiv (März 2026)
**Repository:** https://github.com/Kroonk/KIIdea
**Docker Image:** `ghcr.io/kroonk/kiidea:latest`

### Haupt-Features
- ✅ Inventar-Verwaltung (Manuell + Barcode-Scanner)
- ✅ Smart Recipe Matching (Basierend auf Vorrat)
- ✅ URL-Scraping (Schema.org)
- ✅ Koch-Workflow mit Bestandsabzug
- ✅ Dark Mode (Light/Dark/System)
- ✅ Backup & Restore (JSON Export/Import)
- ✅ Einheiten-Editor (10 Einheiten)

**Siehe:** [FEATURES.md](FEATURES.md) für detaillierte Implementierung

---

## Tech-Stack

### Core Technologies
- **Framework:** Next.js 16.2.1 (App Router, Server Actions, Turbopack)
- **Runtime:** Node.js 20.x
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4 + Shadcn UI (Warm Food Theme + Dark Mode)
- **Datenbank:** Prisma ORM 5.22.0 + SQLite (`dev.db`)
- **UI:** Shadcn UI, Lucide Icons, Geist Fonts
- **Theme:** next-themes (Light/Dark/System)
- **Special:** html5-qrcode, cheerio, cmdk

### Architektur-Entscheidungen
- **SQLite:** Single-File DB, perfekt für NAS, keine externen Services
- **Node 20 Bookworm:** Debian-basiert mit OpenSSL 3.x Support
- **Server Actions:** Alle DB-Operationen als Server Actions (kein API-Layer)
- **Base UI:** @base-ui/react für primitive UI-Komponenten

---

## Datenbank-Schema

**4 Haupt-Modelle:**

```prisma
Item              // Lebensmittel (name, barcode, unit, category)
  ↓
Inventory         // Vorrat (quantity, expiresAt, itemId)

Recipe            // Rezepte (title, description, imageUrl, instructions)
  ↓
RecipeIngredient  // Zutaten-Relation (quantity, unit, recipeId, itemId)
```

**Vollständiges Schema:** `food-app/prisma/schema.prisma`

**Wichtige Indizes:**
- `Item.name` - Unique (für searchItems)
- `Item.barcode` - Unique (für Barcode-Scan)
- `RecipeIngredient` - Unique Constraint auf (recipeId, itemId)

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

**WICHTIG:** Alle Server Actions MÜSSEN `import { prisma } from '@/lib/prisma'` verwenden!

**Warum?** Next.js Dev-Mode Hot-Reloads würden sonst mehrere Prisma-Instanzen erstellen → Memory Leak

---

### 2. Docker Volume-Strategie

**Problem:** Leere Volumes überschreiben Container-Dateien beim ersten Start.

**Lösung:** `start.sh` Init-Script

```bash
#!/bin/sh
mkdir -p /app/data

if [ ! -f /app/data/dev.db ]; then
  echo "Keine Datenbank im Volume gefunden. Kopiere initiale Datenbank..."
  cp /app/prisma/dev.db /app/data/dev.db
fi

exec node server.js
```

**Volume Mapping:** `./data:/app/data` (getrennt von `/app/prisma`)
**DATABASE_URL:** `file:/app/data/dev.db`

**Siehe:** [DEPLOYMENT.md - Volume-Strategie](DEPLOYMENT.md#volume-strategie)

---

### 3. Next.js 16 Dynamic Routes (Params Promise) ⚠️ KRITISCH

**Next.js 15+ Breaking Change:** `params` sind jetzt Promises!

```typescript
// ❌ FALSCH (Next.js 14)
export default async function Page({ params }: { params: { id: string } }) {
  const data = await getData(params.id)
}

// ✅ RICHTIG (Next.js 15+)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getData(id)
}
```

**WICHTIG:** Alle dynamischen Routes `[id]`, `[slug]` etc. müssen `params` als Promise behandeln!

---

### 4. Server Actions Konvention

**Pattern:**
```typescript
"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createItem(data) {
  const item = await prisma.item.create({ data })
  revalidatePath('/inventory')  // Cache invalidieren!
  return item
}
```

**WICHTIG:**
- Immer `"use server"` am Dateianfang
- Immer `revalidatePath()` nach Mutation
- Fehlerbehandlung mit try/catch

---

### 5. OpenFoodFacts Integration

**API:** `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`

**Smart Caching:**
1. Lokale DB checken (Barcode-Index)
2. Falls nicht gefunden: API-Call
3. Produkt dauerhaft lokal speichern

**Features:**
- Auto-Unit-Detection (kg→g, l→ml)
- Package Size Suggestion
- Category Extraction

**Siehe:** [FEATURES.md - Barcode-Scanner](FEATURES.md#12-barcode-scanner-mit-openfoodfacts)

---

## Projektstruktur (Wichtigste Dateien)

```
KIIdea/
├── Brain.md                      # Diese Datei
├── FEATURES.md                   # Detaillierte Feature-Docs
├── DEPLOYMENT.md                 # Docker & Deployment
├── TROUBLESHOOTING.md            # Fehlerbehandlung
├── CHANGELOG.md                  # Versionshistorie
├── README.md                     # User-Dokumentation
├── docker-compose.yml            # Docker Compose Config
├── data/                         # Volume für Runtime-DB
└── food-app/
    ├── src/
    │   ├── app/
    │   │   ├── actions/          # Server Actions (Prisma)
    │   │   │   ├── inventory.ts  # Inventar + Barcode + Einheit-Update
    │   │   │   ├── backup.ts     # Import/Export (v1.4)
    │   │   │   ├── match.ts      # Match-Algorithmus
    │   │   │   ├── cook.ts       # Koch-Workflow
    │   │   │   ├── scrape.ts     # URL-Scraping
    │   │   │   └── recipes.ts    # Rezept-CRUD
    │   │   ├── page.tsx          # Dashboard
    │   │   ├── inventory/page.tsx
    │   │   ├── backup/page.tsx   # Backup & Restore (v1.4)
    │   │   └── recipes/
    │   ├── components/
    │   │   ├── AddQuantityDialog.tsx (v1.2)
    │   │   ├── EditQuantityDialog.tsx (v1.3, v1.4: Einheiten-Editor)
    │   │   ├── InventoryCard.tsx (v1.3)
    │   │   ├── ThemeToggle.tsx (v1.3)
    │   │   ├── theme-provider.tsx (v1.3)
    │   │   ├── ItemSearch.tsx
    │   │   ├── BarcodeScanner.tsx
    │   │   ├── CookRecipeDialog.tsx
    │   │   └── ui/               # Shadcn/Custom Components
    │   │       ├── alert.tsx (v1.4)
    │   │       └── radio-group.tsx (v1.4)
    │   └── lib/
    │       └── prisma.ts         # ⚠️ SINGLETON
    ├── prisma/
    │   ├── schema.prisma
    │   ├── dev.db                # Master-DB (im Image)
    │   └── seed.ts
    ├── Dockerfile
    ├── start.sh                  # Container Init
    └── package.json
```

---

## Bekannte Limitierungen (v1.4)

- ❌ Ablaufdatum-Tracking (Feld existiert, UI fehlt)
- ❌ Einkaufslisten
- ❌ Multi-User Support
- ❌ PWA Offline-Modus
- ❌ Toast-Benachrichtigungen (aktuell nur console.log/alerts)
- ❌ Nicht alle Websites unterstützen Schema.org
- ❌ Barcode-Scanner benötigt HTTPS/Localhost (Kamera-Zugriff)

**Geplant für:** v2.0 (siehe [CHANGELOG.md](CHANGELOG.md))

---

## Quick Links

### Entwicklung
```bash
cd food-app
npm install
npm run dev        # http://localhost:3000
npx prisma studio  # DB-Browser
```

### Deployment
```bash
# Lokal Build & Push
cd food-app
docker build -t ghcr.io/kroonk/kiidea:latest .
docker push ghcr.io/kroonk/kiidea:latest

# NAS Update
cd /volume2/docker/Vibecoding/Website/KIIdea
docker compose pull
docker compose up -d
```

**Siehe:** [DEPLOYMENT.md](DEPLOYMENT.md) für Details

### Troubleshooting
- Server startet nicht? → [TROUBLESHOOTING.md - Container startet nicht](TROUBLESHOOTING.md#container-startet-nicht)
- DB-Probleme? → [TROUBLESHOOTING.md - Database locked](TROUBLESHOOTING.md#database-locked-sqlite_busy)
- Port belegt? → [TROUBLESHOOTING.md - Port 3000 belegt](TROUBLESHOOTING.md#port-3000-bereits-belegt)

---

## Changelog (Kurz)

### v1.4.1 (2026-03-24)
- 🐛 Fix: Rezept-Detail-Seite nach URL-Import (#6)
  - Next.js 16 Params Promise Compatibility
  - Rezepte sind nun nach Import direkt aufrufbar

### v1.4 (2026-03-24)
- ✅ Backup & Restore (JSON Export/Import)
- ✅ Einheiten-Editor (10 Einheiten)
- ✅ Alert & RadioGroup UI-Komponenten
- ✅ Dokumentation ausgelagert (FEATURES.md, DEPLOYMENT.md, etc.)

### v1.3 (2026-03-24)
- ✅ Vorrat Bearbeiten/Löschen
- ✅ Dark Mode (next-themes)
- ✅ Rebranding: KIIdea → Foodlabs

### v1.2 (2026-03-23)
- ✅ AddQuantityDialog mit Smart Package Detection
- ✅ Schnellauswahl-Buttons

### v1.1 (2026-03-22)
- ✅ GitHub Container Registry Migration

### v1.0 (2026-03-21)
- ✅ Production Release
- ✅ Prisma Singleton Pattern
- ✅ Docker Volume-Strategie

**Vollständiger Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

## Support & Ressourcen

- **GitHub:** https://github.com/Kroonk/KIIdea
- **Docker Image:** https://ghcr.io/kroonk/kiidea
- **Issues:** https://github.com/Kroonk/KIIdea/issues
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Shadcn UI:** https://ui.shadcn.com
- **OpenFoodFacts:** https://world.openfoodfacts.org/data

---

**Letzte Aktualisierung:** 24. März 2026
**Version:** 1.4.1 (Next.js 16 Params Fix)
**Maintainer:** Kroonk

**📚 Für Details siehe:** [FEATURES.md](FEATURES.md), [DEPLOYMENT.md](DEPLOYMENT.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
