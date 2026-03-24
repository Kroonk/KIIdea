# KIIdea - Food Tracker & Smart Recipes

## Projekt-Übersicht
KIIdea ist eine selbst gehostete, "Mobile-First" Web-Anwendung (PWA) zur effizienten Verwaltung von Lebensmitteln, mit integrierter Logik für smarte Rezeptvorschläge basierend auf dem aktuellen Kühlschrank-Inhalt.

## Tech-Stack & Architektur
- **Framework:** Next.js (App Router, Server Actions)
- **Styling:** Tailwind CSS, Shadcn UI (Custom Theme: Warm, Food-Inspired mit Creme, Terra-Orange und Olive)
- **Datenbank:** Prisma ORM mit lokaler SQLite Datei (`dev.db`). Diese Struktur ist perfekt für NAS-Umgebungen geeignet, da sie single-file Backups ermöglicht.
- **Docker Deployment:** 
  - Die App wird als Next.js Standalone in einem minimalistischen Container kompiliert.
  - **Base Image:** `node:20-bookworm-slim` (Wir verzichten auf `alpine`, um OpenSSL Kompatibilitätsprobleme mit den Next.js / Prisma Query Engines zu vermeiden).
  - **Startup Script (`start.sh`):** Prüft bei Container-Start dynamisch, ob im gemounteten NAS-Ordner (Volume) bereits eine Datenbankdatei liegt. Falls nein, wird unsere vorbereitete Erst-Datenbank (`dev.db`) dorthin kopiert. Das verhindert Abstürze beim ersten Start.
  - **Netzwerk:** Für sicheres Routing und SSL ist der Container im `docker-compose.yml` direkt in das `npm-net` (Nginx Proxy Manager) integriert.

## Haupt-Features & Logik

### 1. Inventar & Vorrat
- **Manuelle Eingabe & Autovervollständigung:** Nutzer tippen Produkte ein, die App vervollständigt bekannte Zutaten sofort.
- **Barcode-Scanner (Kamera):** Integration von `html5-qrcode`. Der Benutzer scannt einen Barcode mit der Handykamera.
- **OpenFoodFacts Fallback:** Wird ein Barcode nicht lokal in unserer Datenbank gefunden, wird die Live-API von OpenFoodFacts (https://world.openfoodfacts.org/) abgefragt, der Produktname (sowie Kategorie) ausgelesen und in unsere lokale Datenbank für die Zukunft eingespeichert! (Keine KI-API notwendig).

### 2. Rezepte & Import
- **URL Web-Scraping (`cheerio`):** Über den Button "Per URL importieren" kann der Nutzer einen Link zu einem Rezept (z.B. Chefkoch) einfügen. Die App liest das HTML aus, parst standardisierte `application/ld+json` (Schema.org) Blöcke und importiert Titel, Bild, Beschreibung, Anleitung und Zutaten automatisch.
- **Zutaten Parsing:** Die gescrapten Zutaten (z.B. "100g Mehl") werden rudimentär per Regex gesplittet und den internen Items zugeordnet.
- **Manuelle Rezepte:** Eine Maske zum Hinzufügen klassischer Hausrezepte (aktuell noch WIP/Skeleton für v2).

### 3. "Was kochen wir heute?" (Match-Logik)
- Auf dem Dashboard wird eine Live-Listenberechnung durchgeführt (Server Action in `match.ts`).
- Jedes gespeicherte Rezept vergleicht seine Zutaten mit dem Live-Inventar.
- Es errechnet sich ein **Match-Prozentsatz** (z.B. 100% = Alles im Haus, 60% = Teile fehlen).
- Fehlende Produkte werden in roter Schrift beim jeweiligen Rezept angemerkt ("Es fehlen 50g Zucker").

### 4. Der Koch-Workflow (Inventarabzug)
- Klickt man bei einem Rezept auf "Kochen", öffnet sich ein Dialog (Modal).
- Es werden alle verfügbaren Zutaten aufgelistet, die man laut Rezept verbrauchen würde. (Per Standard alle angehakt).
- Bei Klick auf "Kochen bestätigen", läuft eine Node-Iteration über die Prisma-Datenbank (`cook.ts`) und verringert präzise die Quantitäten im Vorrat oder löscht den Eintrag, wenn der Bestand auf `0` fällt.

## Bekannte Probleme / Historie
- **Docker Compose Volume Überschreibung:** Ursprünglich wurde `./data:/app/prisma` gemountet. Wenn `./data` leer war, hat das die `schema.prisma` im Container gelöscht und einen `500 Server Error` erzeugt. 
  - *Lösung:* Das gemountete Volume ist jetzt in `/app/data` getrennt von den Codefiles und das `start.sh` Skript schiebt die DB dort beim Start sicher hin.
- **Tipp:** Immer darauf achten, große tar-Dateien in der `.gitignore` auszuschließen, wenn die App mit Git versioniert wird!

## GitHub & Backups
Dieses komplette Projekt ist an das Github Repo `https://github.com/Kroonk/KIIdea` angebunden.
