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
>      2. Docker Build & Push: `cd food-app && docker buildx build --platform linux/amd64 -t ghcr.io/kroonk/kiidea:latest --push .`
>      3. User kann dann direkt auf NAS deployen mit: `docker compose pull && docker compose up -d`
> 3. Behandle diese Datei wie dein Langzeitgedächtnis. Nutze sie proaktiv!
> 4. **Dokumentations-Struktur:** Detaillierte Infos sind ausgelagert - verweise immer auf die entsprechenden Dateien!
> 5. **Docs auto-pflegen:** Siehe Tabelle "Automatische Dokumentations-Pflege" weiter unten — bei jeder Aufgabe die passenden Dateien mitaktualisieren.

---

## 🎮 Standardisierte Befehle

Kurzbefehle für wiederkehrende Aufgaben — Claude führt sie vollständig aus ohne weitere Rückfragen.

| Befehl | Wann benutzen | Was passiert |
|--------|--------------|--------------|
| `/deploy` | Nach Änderungen die live gehen sollen | Commit → Push → Docker build (linux/amd64) → GHCR push → NAS-ready |
| `/release vX.Y.Z` | Wenn eine neue Version veröffentlicht wird | Alle Docs aktualisieren → CHANGELOG-Eintrag → `/deploy` |
| `/optimize` | Offene GitHub-Issues abarbeiten | Älteste 3 Issues holen → implementieren → committen → Issues schließen → `/deploy` |
| `/status` | Schneller Überblick | `git status` + offene GitHub Issues + aktuelle Version |

### Befehl-Implementierungen

**`/deploy`**
```bash
git add -A
git commit -m "feat/fix/chore: ..."
git push
cd food-app && docker buildx build --platform linux/amd64 -t ghcr.io/kroonk/kiidea:latest --push .
# → Auf NAS: docker compose pull && docker compose up -d
```
> ⚠️ Docker Build IMMER mit `--platform linux/amd64` — NAS ist x86, Mac ist ARM!

**`/release vX.Y.Z`**
1. Brain.md: Version + Changelog (Kurz) + ggf. Features/Struktur aktualisieren
2. CHANGELOG.md: Neuen Versions-Eintrag nach Keep-a-Changelog-Format einfügen
3. FEATURES.md: Neue/geänderte Features ergänzen (technische Details)
4. DEPLOYMENT.md: Nur wenn sich der Deploy-Prozess geändert hat
5. TROUBLESHOOTING.md: Neue bekannte Probleme/Lösungen ergänzen
6. Dann `/deploy` ausführen

**`/optimize`**
```bash
# Issues holen:
curl -s "https://api.github.com/repos/Kroonk/KIIdea/issues?state=open&sort=created&direction=asc&per_page=3"
# Pro Issue: implementieren → committen → Issue schließen:
curl -X PATCH -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Kroonk/KIIdea/issues/{NR} -d '{"state":"closed"}'
# Danach /deploy
```

---

## 📄 Automatische Dokumentations-Pflege

| Datei | Wann aktualisieren | Was rein |
|-------|--------------------|----------|
| **Brain.md** | Nach JEDER Code-Änderung | Version, neue Features (Kurz), Changelog (Kurz), Projektstruktur bei neuen Dateien |
| **CHANGELOG.md** | Bei jedem `/release` | Neuer Abschnitt `## [vX.Y.Z] - DATUM` mit Added/Changed/Fixed/Removed |
| **FEATURES.md** | Wenn Feature neu oder wesentlich geändert | Technische Implementierungsdetails mit Code-Snippets, Flows, Edge Cases |
| **DEPLOYMENT.md** | Wenn Build/Deploy-Prozess sich ändert | Aktualisierte Befehle, neue Env-Vars, geänderte docker-compose-Config |
| **TROUBLESHOOTING.md** | Wenn neues Problem/Lösung entdeckt | Neuer Abschnitt: Fehlerbild → Ursache → Lösung |
| **README.md** | Bei Major-Releases oder Setup-Änderungen | User-facing Doku, Setup-Schritte, Feature-Übersicht für Endnutzer |

**Nicht pflegen (kein Mehrwert):**
- `OPTIMIZATION.md` — einmaliger Plan, veraltet schnell → ignorieren

---

## 📚 Dokumentations-Übersicht

| Datei | Inhalt | Wann nutzen? |
|-------|--------|--------------|
| **Brain.md** | Projekt-Übersicht, Kritische Details, Projektstruktur | Grundlegendes Verständnis |
| **[FEATURES.md](FEATURES.md)** | Detaillierte Feature-Implementierung | Wie funktioniert Feature X? |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Docker Build, GHCR, NAS-Deployment | Deployment & Updates |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Fehlerbehandlung, Debugging | Probleme lösen |
| **[OPTIMIZATION.md](OPTIMIZATION.md)** | Code-Optimierungsplan, Security, Performance | Code verbessern |
| **[CHANGELOG.md](CHANGELOG.md)** | Versionshistorie | Was ist neu? |
| **README.md** | User-Dokumentation, Setup | Für Endnutzer |

---

## Projekt-Übersicht

Foodlabs (ehemals KIIdea) ist eine selbst gehostete "Mobile-First" PWA zur effizienten Verwaltung von Lebensmitteln mit smarten Rezeptvorschlägen basierend auf Kühlschrank-Inhalt.

**Status:** v2.2 Produktiv (März 2026)
**Repository:** https://github.com/Kroonk/KIIdea
**Docker Image:** `ghcr.io/kroonk/kiidea:latest`

### Haupt-Features
- ✅ Inventar-Verwaltung (Manuell + Barcode-Scanner)
- ✅ Smart Recipe Matching (Basierend auf Vorrat)
- ✅ URL-Scraping (Schema.org) mit robuster Instruction-Extraktion
- ✅ Koch-Workflow mit Bestandsabzug (funktioniert auf Rezept-Detailseite)
- ✅ Dark Mode (Light/Dark/System)
- ✅ Backup & Restore (JSON Export/Import, Admin-only)
- ✅ Einheiten-Editor (10 Einheiten)
- ✅ **Benutzeraccounts & Login** (Multi-Tenant, Admin/User Rollen)
- ✅ **Responsives Mobile-Design** (Bottom-Nav, Safe-Area, Padding)
- ✅ **Hamburger-Menü** (UserMenu-Popover oben rechts, Desktop + Mobile-Header)

**Siehe:** [FEATURES.md](FEATURES.md) für detaillierte Implementierung

---

## Tech-Stack

### Core Technologies
- **Framework:** Next.js 16.2.1 (App Router, Server Actions, Turbopack)
- **Runtime:** Node.js 20.x
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4 + Shadcn UI (Warm Food Theme + Dark Mode)
- **Datenbank:** Prisma ORM 5.22.0 + SQLite (`dev.db`)
- **Auth:** bcryptjs (Password Hashing) + Cookie-basierte Sessions
- **UI:** Shadcn UI, Lucide Icons, Geist Fonts
- **Theme:** next-themes (Light/Dark/System)
- **Notifications:** sonner (Toast-System)
- **Special:** html5-qrcode, cheerio, cmdk

### Architektur-Entscheidungen
- **SQLite:** Single-File DB, perfekt für NAS, keine externen Services
- **Node 20 Bookworm:** Debian-basiert mit OpenSSL 3.x Support
- **Server Actions:** Alle DB-Operationen als Server Actions (kein API-Layer)
- **Multi-Tenant:** userId auf Inventory & Recipe (logische Datentrennung)
- **Proxy (Next.js 16):** Route-Schutz über `proxy.ts` (ersetzt deprecated `middleware.ts`)
- **Base UI:** @base-ui/react für primitive UI-Komponenten

---

## Datenbank-Schema

**6 Modelle:**

```prisma
User              // Benutzer (username, password, role: admin|user)
  ↓
Session           // Auth-Session (token, expiresAt, userId)

Item              // Lebensmittel (name, barcode, unit, category)
  ↓
Inventory         // Vorrat (quantity, expiresAt, itemId, userId)

Recipe            // Rezepte (title, description, imageUrl, instructions, userId)
  ↓
RecipeIngredient  // Zutaten-Relation (quantity, unit, recipeId, itemId)
```

**Vollständiges Schema:** `food-app/prisma/schema.prisma`

**Wichtige Details:**
- `Item.name` - Unique (für searchItems)
- `Item.barcode` - Unique (für Barcode-Scan)
- `RecipeIngredient` - Unique Constraint auf (recipeId, itemId)
- `User.username` - Unique
- `Session.token` - Unique
- `Inventory.userId` und `Recipe.userId` - Optional (für Migration bestehender Daten)

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

---

### 2. Auth-System (v2.0)

**Pattern:**
```typescript
// Jede geschützte Server Action:
import { requireAuth } from './auth'

export async function myAction() {
  const user = await requireAuth() // Redirect zu /login wenn nicht eingeloggt
  // user.id für Multi-Tenant Queries verwenden
  const data = await prisma.inventory.findMany({
    where: { userId: user.id }
  })
}

// Admin-only Actions:
import { requireAdmin } from './auth'
export async function adminAction() {
  await requireAdmin() // Redirect wenn nicht Admin
}
```

**Session-Management:**
- Cookie-basiert (`httpOnly`, `secure`, `sameSite: lax`)
- 30 Tage Gültigkeit
- Token: 64-Char Random String
- Expired Sessions werden beim Login aufgeräumt

**Erster User = Admin:** Bei der Registration wird geprüft ob schon User existieren. Der erste wird automatisch Admin.

**Route-Schutz:** `src/proxy.ts` (Next.js 16 Proxy-Pattern)
- Öffentlich: `/login`, `/register`
- Geschützt: Alle anderen Routes

---

### 3. Docker Volume-Strategie

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

### 4. Next.js 16 Dynamic Routes (Params Promise) ⚠️ KRITISCH

**Next.js 15+ Breaking Change:** `params` sind jetzt Promises!

```typescript
// ✅ RICHTIG (Next.js 15+)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getData(id)
}
```

---

### 5. Next.js 16 Proxy (statt Middleware) ⚠️ NEU

**File:** `src/proxy.ts` (NICHT `middleware.ts`!)

```typescript
export function proxy(request: NextRequest) {
  // Route protection logic
}
export const config = { matcher: [...] }
```

---

### 6. Scrape-System (verbessert v2.0)

**Features:**
- URL-Validation (SSRF-Schutz: blockiert localhost, private IPs)
- 15s Timeout für Fetch
- Robuste Instruction-Extraktion: HowToStep, HowToSection, verschachtelte Strukturen
- Automatisches userId-Binding

**Unterstützte Schema.org Formate:**
- `recipeInstructions` als String
- Array von Strings
- Array von `HowToStep` (text/name/description)
- Array von `HowToSection` mit verschachtelten `HowToStep`

---

### 7. Server Actions Konvention

**Pattern:**
```typescript
"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './auth'

export async function createItem(data) {
  const user = await requireAuth()
  const item = await prisma.item.create({ data })
  revalidatePath('/inventory')
  return item
}
```

**WICHTIG:**
- Immer `"use server"` am Dateianfang
- Immer `requireAuth()` für geschützte Aktionen
- Immer `revalidatePath()` nach Mutation
- userId in where-Clauses für Multi-Tenant

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
    │   ├── proxy.ts              # Route-Schutz (Next.js 16 Proxy)
    │   ├── app/
    │   │   ├── actions/          # Server Actions (Prisma)
    │   │   │   ├── auth.ts       # Auth: Login/Register/Logout/User-CRUD
    │   │   │   ├── inventory.ts  # Inventar + Barcode + Einheit-Update
    │   │   │   ├── backup.ts     # Import/Export (Admin-only)
    │   │   │   ├── match.ts      # Match-Algorithmus + getRecipeMatchInfo
    │   │   │   ├── cook.ts       # Koch-Workflow
    │   │   │   ├── scrape.ts     # URL-Scraping (sanitized, rate-limited)
    │   │   │   └── recipes.ts    # Rezept-CRUD
    │   │   ├── error.tsx         # Error Boundary (globale Fehlerseite)
    │   │   ├── page.tsx          # Dashboard
    │   │   ├── login/page.tsx    # Login-Seite
    │   │   ├── register/page.tsx # Registrierung
    │   │   ├── admin/            # Admin: Nutzerverwaltung
    │   │   │   ├── page.tsx
    │   │   │   └── UserManagement.tsx
    │   │   ├── inventory/page.tsx
    │   │   ├── backup/page.tsx   # Backup & Restore
    │   │   └── recipes/
    │   ├── components/
    │   │   ├── Navigation.tsx    # Desktop + Mobile Nav (Auth-aware)
    │   │   ├── UserMenu.tsx      # Hamburger-Popover (Profil, Admin, Theme, Logout)
    │   │   ├── ThemeToggle.tsx
    │   │   ├── CookRecipeDialog.tsx (mit Props: buttonClassName, buttonLabel)
    │   │   ├── InventoryCard.tsx  # Mit ExpiryBadge (Ablaufdatum-Anzeige)
    │   │   ├── ItemSearch.tsx    # Typisiert (Item[] statt any[])
    │   │   ├── QuickSelectButtons.tsx  # Extrahierte Schnellauswahl
    │   │   ├── BarcodeScanner.tsx      # Dynamic Import (SSR:false)
    │   │   └── ui/               # Shadcn/Custom Components
    │   └── lib/
    │       ├── prisma.ts         # ⚠️ SINGLETON
    │       ├── sanitize.ts       # HTML-Sanitization für Scraping
    │       ├── ratelimit.ts      # In-Memory Rate Limiter
    │       └── errors.ts         # AppError + handleAction Helper
    ├── prisma/
    │   ├── schema.prisma         # 6 Models (User, Session, Item, Inventory, Recipe, RecipeIngredient)
    │   ├── dev.db                # Master-DB (im Image)
    │   └── seed.ts
    ├── Dockerfile
    ├── start.sh                  # Container Init
    └── package.json
```

---

## Bekannte Limitierungen (v2.1)

- ❌ Einkaufslisten
- ❌ PWA Offline-Modus
- ❌ Nicht alle Websites unterstützen Schema.org
- ❌ Barcode-Scanner benötigt HTTPS/Localhost (Kamera-Zugriff)
- ❌ Accessibility Audit ausstehend
- ❌ Unit Tests fehlen

**Geplant für:** v2.1+ (siehe [CHANGELOG.md](CHANGELOG.md))

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

### v2.2 (2026-03-25) — Hamburger-Menü
- ✅ UserMenu-Komponente (Popover-Dropdown) oben rechts auf Desktop und Mobile
- ✅ Mobile Top-Header (sticky) mit Logo + Hamburger-Menü
- ✅ Menü enthält: Benutzername, Profil & Passwort, Admin, Backup (Admin-only), Theme, Logout
- ✅ GitHub Issues #10 (Menu page) und #11 (Hamburger Menu) geschlossen

### v2.1 (2026-03-25) — Code-Optimierung
- ✅ Toast-System (sonner) — alle alert() ersetzt
- ✅ Input Sanitization für Scraping (HTML-Stripping)
- ✅ In-Memory Rate Limiting (5 Scrapes/h pro User)
- ✅ Error Handling Factory (AppError + handleAction)
- ✅ Error Boundaries (Next.js error.tsx)
- ✅ TypeScript: `any` → `Item[]` in ItemSearch.tsx
- ✅ Code Deduplication (QuickSelectButtons extrahiert)
- ✅ Next.js Image Optimization (AVIF/WebP, remotePatterns)
- ✅ Dynamic Import BarcodeScanner (~200KB gespart)
- ✅ Ablaufdatum UI (ExpiryBadge + DatePicker)
- ✅ Loading States Scraping (toast.loading)

### v2.0 (2026-03-25)
- ✅ Benutzeraccounts & Login (bcryptjs + Cookie-Sessions)
- ✅ Multi-Tenant Datentrennung (userId auf Inventory/Recipe)
- ✅ Admin-Rolle mit Nutzerverwaltung
- ✅ Backup/Restore nur für Admins
- ✅ Scraping Fix: Robuste Instruction-Extraktion (HowToSection, HowToStep)
- ✅ "Jetzt Kochen" Button auf Rezept-Detailseite funktional
- ✅ URL-Validation & SSRF-Schutz im Scraper
- ✅ Responsives Mobile-Design (Padding, Font-Sizes, ThemeToggle)
- ✅ Dark-Mode Badge-Farben auf Dashboard
- ✅ Next.js 16 Proxy (statt deprecated Middleware)
- ✅ TypeScript: `any` Types reduziert

### v1.4.1 (2026-03-24)
- Fix: Rezept-Detail-Seite nach URL-Import (#6)

### v1.4 (2026-03-24)
- Backup & Restore, Einheiten-Editor, Docs-Refactoring

### v1.3 (2026-03-24)
- Vorrat Bearbeiten/Löschen, Dark Mode, Rebranding

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

**Letzte Aktualisierung:** 25. März 2026
**Version:** 2.2 (Hamburger-Menü: UserMenu-Popover, Mobile Top-Header)
**Maintainer:** Kroonk

**📚 Für Details siehe:** [FEATURES.md](FEATURES.md), [DEPLOYMENT.md](DEPLOYMENT.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
