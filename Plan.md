# Plan.md - Projektstruktur & Nächste Schritte

## Aktueller Status
- **Phase**: Architektur- und Projekt-Setup
- **Nächster Meilenstein**: Initialisierung des Next.js Projekts und Aufbau des Docker-Environments.

## Geplanter Aufbau (MVP Scope)

### 1. Kernfunktionen für v1.0
- **Inventar**: Liste der vorhandenen Lebensmittel (CRUD). Hinzufügen per Autocomplete-Suche & Kamera-Barcodescanner (`html5-qrcode`).
- **Rezepte**: Eigene Rezepte manuell anlegen. Smarter Import via URL-Scraping (Extraktion von `application/ld+json` Metadaten gängiger Rezeptseiten).
- **Vergleichs-Logik**: Ansicht "Was kann ich kochen?" mit prozentualer Übereinstimmung der Zutaten.
- **Abbuchungs-Logik**: "Kochen"-Dialog mit abwählbaren Checkboxen vor dem tatsächlichen Datenbank-Abzug.

### 2. Technologie-Stack
- **Framework**: Next.js (App Router, React).
- **Styling**: Tailwind CSS (Farbschema: Creme-Weiß, Terra-Orange, Olive).
- **Datenbank**: SQLite via Prisma ORM (Perfekt für kleine/mittlere Home-Server, da eine einzige '.db' Datei gesichert werden muss).
- **Hosting**: Docker (Standalone Output von Next.js) auf dem lokalen NAS.

### 3. Versionskontrolle (GitHub)
- Lokales Git Repository im Ordner `KIIdea`.
- Code wird vom Entwickler verfasst und in Repository gepusht.

### 4. Datenbank-Schema (Prisma Draft)
- `Item` (Stammdaten: z.B. Mehl, EAN, Default-Einheit)
- `Inventory` (Bestand: Menge, Referenz auf Item)
- `Recipe` (Titel, Beschreibung, Bild-URL, URL-Quelle, Instruktionen)
- `RecipeIngredient` (Mapping: Menge + Einheit, Referenz auf Recipe und Item)

## Implementierungs-Roadmap

- [ ] **Schritt 1**: Next.js Bootstrap (`create-next-app`) mit Tailwind CSS & TypeScript im Ordner initialisieren.
- [ ] **Schritt 2**: Projekt von Standard-Design befreien und rohe Globals (Warme Farben) setzen. Git Init.
- [ ] **Schritt 3**: Prisma ORM einrichten, SQLite DB aufsetzen und erstes Schema (`Item` + `Inventory`) definieren.
- [ ] **Schritt 4**: Dockerfile und docker-compose.yml für das einfache Deployment vorbereiten.
- [ ] **Schritt 5**: API-Routings und Frontend-Komponenten für das Inventar (Liste + Hinzufügen via Search/Scanner) bauen.
- [ ] **Schritt 6**: Scraping-Logik für Rezept-URLs in Next.js API-Route bauen.
- [ ] **Schritt 7**: "Kochen" Workflow und Match-Algorithmus implementieren.

## Nächste To-Dos
1. Die KI generiert nun den detaillierten Umsetzungsplan (`implementation_plan.md`) und die Aufgabenliste (`task.md`).
2. Bestätigen des Plans mit dem Nutzer.
3. Start des Setups (Schritt 1).
