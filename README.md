# 🍳 KIIdea Food - Smart Food Tracker & Recipe Matcher

Eine selbst gehostete, mobile-first Progressive Web App (PWA) zur effizienten Verwaltung von Lebensmitteln mit intelligenten Rezeptvorschlägen basierend auf dem aktuellen Kühlschrank-Inhalt.

## 📋 Features

### ✅ Inventar-Verwaltung
- **Manuelle Eingabe** mit Autovervollständigung für bekannte Zutaten
- **Barcode-Scanner** via Smartphone-Kamera (`html5-qrcode`)
- **OpenFoodFacts Integration**: Automatische Produkterkennung und -speicherung für zukünftige Scans
- Übersichtliche Liste aller Vorräte mit Mengenangaben

### 🍲 Rezept-Verwaltung
- **URL-Import**: Automatisches Scraping von Rezeptseiten (Schema.org/JSON-LD)
  - Unterstützt Chefkoch, Lecker.de und viele andere Standard-Rezeptseiten
  - Extrahiert Titel, Bild, Beschreibung, Anleitung und Zutaten
- **Intelligentes Zutaten-Parsing**: Automatische Erkennung von Menge, Einheit und Zutatennamen
- **Manuelle Rezepteingabe** für eigene Hausrezepte

### 🎯 Smart Matching
- **"Was kochen wir heute?"** Dashboard mit Live-Berechnung
- **Prozentuale Übereinstimmung** zwischen Rezepten und Vorrat
- **Fehlende Zutaten** werden übersichtlich angezeigt
- Sortierung nach höchster Verfügbarkeit

### 👨‍🍳 Koch-Workflow
- **Kochen-Dialog** mit Zutatenauswahl
- **Automatischer Inventarabzug** mit Mengenberechnung
- Flexible Auswahl: Nur gewünschte Zutaten werden abgezogen

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Datenbank**: [Prisma ORM](https://www.prisma.io/) + SQLite
- **Barcode-Scanner**: [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- **Web-Scraping**: [Cheerio](https://cheerio.js.org/)
- **Deployment**: Docker (Node 20 Bookworm Slim)

## 🎨 Design

- **Mobile-First** Responsive Design
- **Warmes Farbschema**: Creme, Terra-Orange und Olive
- **PWA-Ready**: Optimiert für Installation als App
- **Dark Mode**: Unterstützung für System-Präferenzen

## 🚀 Installation & Deployment

### Voraussetzungen
- Docker & Docker Compose
- Optional: Nginx Proxy Manager für SSL/Routing

### 1. Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/Kroonk/KIIdea.git
cd KIIdea/food-app

# Dependencies installieren
npm install

# Prisma generieren
npx prisma generate

# Datenbank initialisieren (optional)
npx prisma db push
npx prisma db seed

# Development Server starten
npm run dev
```

Die App läuft unter `http://localhost:3000`

### 2. Docker Deployment

```bash
# Docker Image bauen
cd food-app
docker build -t kiidea-food-app:latest .

# Oder Image als .tar exportieren
docker save kiidea-food-app:latest -o ../food-app.tar

# Container starten mit docker-compose
cd ..
docker-compose up -d
```

### 3. Docker Compose Konfiguration

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
      - npm-net  # Optional: Für Nginx Proxy Manager

networks:
  npm-net:
    external: true
```

## 📁 Projektstruktur

```
KIIdea/
├── food-app/                 # Next.js Anwendung
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   │   ├── actions/     # Server Actions (Prisma Queries)
│   │   │   │   ├── inventory.ts   # Inventar-Logik
│   │   │   │   ├── recipes.ts     # Rezept-CRUD
│   │   │   │   ├── match.ts       # Match-Algorithmus
│   │   │   │   ├── cook.ts        # Koch-Workflow
│   │   │   │   └── scrape.ts      # URL-Scraping
│   │   │   ├── inventory/   # Inventar-Seite
│   │   │   ├── recipes/     # Rezept-Seiten
│   │   │   ├── add/         # Hinzufügen-Seite
│   │   │   ├── layout.tsx   # Root Layout
│   │   │   └── page.tsx     # Dashboard
│   │   ├── components/      # React Komponenten
│   │   │   ├── ui/          # Shadcn UI Komponenten
│   │   │   ├── Navigation.tsx
│   │   │   ├── BarcodeScanner.tsx
│   │   │   ├── ItemSearch.tsx
│   │   │   └── CookRecipeDialog.tsx
│   │   └── lib/
│   │       ├── prisma.ts    # Prisma Singleton
│   │       └── utils.ts     # Utilities
│   ├── prisma/
│   │   ├── schema.prisma    # Datenbank Schema
│   │   ├── dev.db           # SQLite Datenbank (Master)
│   │   └── seed.ts          # Seed-Daten
│   ├── Dockerfile           # Multi-Stage Build
│   ├── start.sh             # Container Startup Script
│   └── package.json
├── data/                    # Volume für Runtime-DB
├── docker-compose.yml       # Docker Compose Config
├── Brain.md                 # Technische Dokumentation
└── README.md               # Diese Datei
```

## 🗄️ Datenbank Schema

```prisma
model Item {
  id        String   @id @default(cuid())
  name      String   @unique
  barcode   String?  @unique
  unit      String   @default("Stück")
  category  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
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
}
```

## 🔧 Wichtige Technische Details

### Docker Volume-Strategie
- **Problem**: Leere gemountete Volumes überschreiben Container-Dateien
- **Lösung**: `start.sh` prüft beim Container-Start, ob eine DB im Volume existiert
  - Falls nein: Kopiert die Master-DB aus `/app/prisma/dev.db`
  - Falls ja: Verwendet die bestehende DB

### Prisma Singleton Pattern
Alle Server Actions verwenden eine zentrale Prisma-Instanz (`lib/prisma.ts`) statt individueller Clients. Dies verhindert:
- Memory Leaks
- Verbindungsprobleme
- Übermäßige Datenbankverbindungen

### OpenFoodFacts Integration
Bei Barcode-Scans wird automatisch:
1. Die lokale DB durchsucht
2. Falls nicht gefunden: OpenFoodFacts API abgefragt
3. Produkt in lokaler DB gespeichert für zukünftige Scans

## 🐛 Bekannte Probleme & Lösungen

### Problem: "This page couldn't load" Server Error
**Ursache**: Prisma konnte keine Verbindung zur Datenbank herstellen
**Lösung**:
- Stelle sicher, dass `data/dev.db` existiert
- Container neu starten: `docker-compose restart`
- Logs prüfen: `docker logs kiidea-food-app`

### Problem: Docker Image zu groß
**Ursache**: node_modules im Image
**Lösung**: Multi-Stage Build mit Standalone Output bereits implementiert

### Problem: Alpine OpenSSL Inkompatibilität
**Lösung**: Wir verwenden `node:20-bookworm-slim` statt Alpine

## 📝 Entwicklungs-Roadmap

### v1.0 (Aktuell) ✅
- [x] Inventar-Verwaltung
- [x] Barcode-Scanner
- [x] Rezept-Import via URL
- [x] Match-Algorithmus
- [x] Koch-Workflow
- [x] Docker Deployment

### v2.0 (Geplant)
- [ ] PWA Installation & Offline-Modus
- [ ] Ablaufdatum-Tracking mit Benachrichtigungen
- [ ] Einkaufslisten-Generierung
- [ ] Favoriten & Bewertungen
- [ ] Erweiterte Filter & Suche
- [ ] Rezept-Teilen per QR-Code
- [ ] Multi-User Support

## 🤝 Contributing

Contributions sind willkommen! Bitte erstelle einen Issue für größere Änderungen.

## 📄 Lizenz

Dieses Projekt ist privat gehostet und für persönliche Nutzung gedacht.

## 🔗 Links

- **GitHub**: https://github.com/Kroonk/KIIdea
- **OpenFoodFacts API**: https://world.openfoodfacts.org/
- **Shadcn UI**: https://ui.shadcn.com/

## 🙏 Credits

Entwickelt mit ❤️ für effizientes Lebensmittel-Management im Smart Home.

---

**Tipp**: Für detaillierte technische Dokumentation siehe [Brain.md](Brain.md)
