# Troubleshooting Guide - Foodlabs

## Container startet nicht

### "This page couldn't load" Server Error

**Ursache:** Prisma kann keine DB-Verbindung herstellen

**Diagnose:**
```bash
# 1. Prüfe ob DB existiert
ls -la ./data/dev.db

# 2. Prüfe Container-Logs
docker logs kiidea-food-app

# 3. Prüfe DATABASE_URL
docker exec kiidea-food-app env | grep DATABASE_URL
```

**Lösung:**
```bash
# Container neustarten
docker compose restart

# Falls DB fehlt: Container neu initialisieren
docker compose down
docker compose up -d
```

---

## Database locked / SQLITE_BUSY

**Ursache:** Mehrere Prozesse greifen gleichzeitig auf SQLite zu

**Lösung:**
```bash
# Container neustarten behebt meist das Problem
docker compose restart

# Falls persistent: DB-Backup wiederherstellen
cp data-backup/dev.db data/dev.db
docker compose restart
```

---

## npm-net Network not found

**Fehler:**
```
Error response from daemon: network npm-net not found
```

**Lösung:**
```bash
# Network erstellen
docker network create npm-net

# Container starten
docker compose up -d
```

---

## Port 3000 bereits belegt

**Fehler:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Lösung 1:** Anderen Container stoppen
```bash
# Welcher Container nutzt Port 3000?
docker ps | grep 3000

# Container stoppen
docker stop CONTAINER_NAME
```

**Lösung 2:** Port ändern
```yaml
# In docker-compose.yml
ports:
  - "3001:3000"  # Ändere Host-Port
```

---

## OpenSSL Warnungen beim Build

**Warnung:**
```
Warning: Prisma Query Engine could not find OpenSSL
```

**Status:** ✅ HARMLOS - Build ist erfolgreich

**Warum:** Prisma versucht Query Engine im Builder-Stage zu laden, OpenSSL ist erst im Runner verfügbar.

**Keine Aktion nötig.**

---

## Datenbank-Korruption

### Symptome
- "database disk image is malformed"
- Zufällige SQL-Fehler
- Daten verschwinden

### Lösung 1: SQLite Integrity Check
```bash
# Auf dem Host (nicht im Container)
cd data
sqlite3 dev.db "PRAGMA integrity_check;"
```

### Lösung 2: Backup wiederherstellen
```bash
# Backup von Web-UI (/backup) importieren
# Oder manuelles Backup verwenden
cp data-backup-DATUM/dev.db data/dev.db
docker compose restart
```

### Lösung 3: DB neu erstellen
```bash
# WARNUNG: Alle Daten gehen verloren!
docker compose down
rm data/dev.db
docker compose up -d
```

---

## Image-Pull schlägt fehl

**Fehler:**
```
Error response from daemon: manifest for ghcr.io/kroonk/kiidea:latest not found
```

**Ursache:** Image existiert nicht oder ist privat

**Lösung:**
```bash
# Prüfe ob Image public ist
curl -s https://ghcr.io/v2/kroonk/kiidea/tags/list

# Falls privat: Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Erneut versuchen
docker compose pull
```

---

## Next.js Build-Fehler

### Module not found

**Fehler:**
```
Module not found: Can't resolve '@/components/...'
```

**Lösung:**
```bash
# Dependencies neu installieren
cd food-app
rm -rf node_modules package-lock.json
npm install

# Erneuter Build
npm run build
```

### TypeScript-Fehler

**Lösung:**
```bash
# TypeScript-Check
npm run build

# Falls Fehler: Code korrigieren und erneut builden
```

---

## Backup/Restore Probleme

### Import schlägt fehl

**Fehler:** "Ungültiges Backup-Format"

**Lösung:**
1. Prüfe JSON-Datei auf Validität
2. Stelle sicher, dass `version` und `items` vorhanden sind
3. Versuche neueren Export

### Export ist leer

**Ursache:** Keine Daten in Datenbank

**Lösung:**
1. Prüfe auf Dashboard ob Daten vorhanden sind
2. Öffne Browser DevTools → Console für Fehler
3. Prüfe Container-Logs

---

## Barcode-Scanner funktioniert nicht

### Kamera-Zugriff verweigert

**Ursache:** Barcode-Scanner benötigt HTTPS oder localhost

**Lösung:**
- Auf localhost (http://localhost:3000) funktioniert es
- Auf NAS: Reverse Proxy mit HTTPS einrichten (Nginx Proxy Manager)
- Oder Selbst-signiertes Zertifikat

### Scanner erkennt Barcode nicht

**Tipps:**
1. Bessere Beleuchtung
2. Kamera ruhig halten
3. Barcode vollständig im Frame
4. Falls QR-Code: Aktiviere QR in Scanner-Einstellungen

---

## Prisma-Probleme

### "Prisma Client not initialized"

**Lösung:**
```bash
cd food-app
npx prisma generate
npm run build
```

### Migration-Fehler

**Warnung:** Foodlabs nutzt keine Migrations, sondern direktes Schema.

**Falls trotzdem benötigt:**
```bash
npx prisma migrate dev --name beschreibung
npx prisma generate
```

---

## Performance-Probleme

### Langsame Ladezeiten

**Ursachen:**
1. Zu viele Rezepte/Items in DB (>10.000)
2. Zu wenig RAM für Container
3. NAS-Festplatte überlastet

**Lösungen:**
```bash
# Mehr RAM für Container
docker-compose.yml:
  environment:
    - NODE_OPTIONS="--max-old-space-size=512"

# Alte/ungenutzte Daten löschen
# Via Web-UI: Rezepte/Items manuell entfernen

# DB-Größe prüfen
ls -lh ./data/dev.db
```

### Match-Algorithmus zu langsam

**Ursache:** Zu viele Rezepte

**Temporäre Lösung:**
Lösche ungenutzte Rezepte via Web-UI

**Permanente Lösung:**
Siehe [FEATURES.md - Performance-Optimierung](FEATURES.md#performance)

---

## Dark Mode Probleme

### Theme wechselt nicht

**Lösung:**
1. Browser-Cache leeren (Strg+Shift+R)
2. LocalStorage prüfen: DevTools → Application → Local Storage
3. Falls hartnäckig: LocalStorage löschen

### Theme "System" funktioniert nicht

**Ursache:** Browser unterstützt `prefers-color-scheme` nicht

**Lösung:** Wähle manuell "Hell" oder "Dunkel"

---

## HTTPS/SSL-Probleme

### Selbst-signiertes Zertifikat

Falls du selbst-signierte Zertifikate nutzt:

**Browser-Warnung umgehen:**
1. Chrome/Edge: Klicke auf "Erweitert" → "Trotzdem fortfahren"
2. Firefox: Klicke "Risiko akzeptieren"

**Besser:** Nutze Nginx Proxy Manager mit Let's Encrypt

---

## Logs analysieren

### Container-Logs
```bash
# Live-Logs
docker logs -f kiidea-food-app

# Letzte 100 Zeilen
docker logs --tail 100 kiidea-food-app

# Mit Timestamps
docker logs -t kiidea-food-app
```

### Browser-Console
1. F12 oder Rechtsklick → Untersuchen
2. Tab "Console" öffnen
3. Fehler (rot) und Warnungen (gelb) prüfen

---

## Container bleibt hängen

### Graceful Shutdown funktioniert nicht

```bash
# Force Stop
docker compose down --timeout 10

# Falls immer noch hängend
docker kill kiidea-food-app
docker rm kiidea-food-app
docker compose up -d
```

---

## Data-Volume-Probleme

### Volume ist leer nach Update

**Ursache:** Falsches Volume-Mapping

**Lösung:**
```bash
# Prüfe Volume-Pfad
docker inspect kiidea-food-app | grep -A 10 Mounts

# Sollte sein: /app/data → ./data
# Falls falsch: docker-compose.yml korrigieren
```

### Berechtigungen-Fehler

```bash
# Auf NAS: Berechtigungen setzen
chmod -R 755 ./data
chown -R 1000:1000 ./data  # Node-User im Container
```

---

## Support

Falls nichts hilft:

1. **GitHub Issues:** https://github.com/Kroonk/KIIdea/issues
2. **Logs sammeln:** `docker logs kiidea-food-app > logs.txt`
3. **Issue erstellen** mit:
   - Fehlerbeschreibung
   - Docker-Compose-Config
   - Logs
   - Browser/OS-Info
