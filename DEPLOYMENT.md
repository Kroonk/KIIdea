# Deployment Guide - Foodlabs

## Docker Build & Push

### Lokaler Build
```bash
cd food-app
docker build -t ghcr.io/kroonk/kiidea:latest .
```

### Push zu GitHub Container Registry
```bash
docker push ghcr.io/kroonk/kiidea:latest
```

**Image Details:**
- Base: `node:20-bookworm-slim`
- Multi-Stage Build: deps → builder → runner
- Size: ~470 MB komprimiert
- Registry: `ghcr.io/kroonk/kiidea:latest`

---

## Docker Compose Setup

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

### Wichtige Punkte
- `pull_policy: always` - Automatische Updates beim Start
- Volume `./data:/app/data` - Persistente Datenbank
- `npm-net` - Externes Network für Nginx Proxy Manager

---

## Deployment auf Synology NAS

### Erstmaliges Setup
```bash
# SSH auf NAS
ssh admin@nas-ip

# Verzeichnis erstellen
mkdir -p /volume2/docker/Vibecoding/Website/KIIdea
cd /volume2/docker/Vibecoding/Website/KIIdea

# docker-compose.yml erstellen (siehe oben)
nano docker-compose.yml

# Network erstellen (falls nicht vorhanden)
docker network create npm-net

# Container starten
docker compose up -d
```

### Updates deployen
```bash
cd /volume2/docker/Vibecoding/Website/KIIdea
docker compose pull      # Neueste Version holen
docker compose up -d     # Container neu starten
```

### Container-Verwaltung
```bash
# Logs anzeigen
docker logs -f kiidea-food-app

# Status prüfen
docker compose ps

# Container neustarten
docker compose restart

# Container stoppen
docker compose down
```

---

## Volume-Strategie

### Problem
Leere Volumes überschreiben Container-Dateien beim ersten Start.

### Lösung: start.sh Init-Script
```bash
#!/bin/sh
mkdir -p /app/data

# Prüfe, ob DB im Volume existiert
if [ ! -f /app/data/dev.db ]; then
  echo "Keine Datenbank im Volume gefunden. Kopiere initiale Datenbank..."
  cp /app/prisma/dev.db /app/data/dev.db
  echo "Initialisierung abgeschlossen."
fi

# Starte Next.js Server
exec node server.js
```

**Flow:**
1. Container startet mit leerem `./data` Volume
2. `start.sh` prüft: Existiert `/app/data/dev.db`?
3. Falls nein: Master-DB von `/app/prisma/dev.db` kopieren
4. Next.js Server startet mit DB auf `/app/data/dev.db`

---

## Umgebungsvariablen

### In Container (docker-compose.yml)
```yaml
environment:
  - NODE_ENV=production
  - DATABASE_URL="file:/app/data/dev.db"
```

### In Entwicklung (.env)
```bash
DATABASE_URL="file:./dev.db"
```

---

## Build-Warnungen

### OpenSSL Warnungen beim Build
**Status:** ✅ HARMLOS

```
Warning: Prisma Query Engine could not find OpenSSL
```

**Warum:** Prisma versucht Query Engine im Builder-Stage zu laden, OpenSSL ist erst im Runner verfügbar. Build ist trotzdem erfolgreich.

---

## Port-Konfiguration

### Standard: Port 3000
```yaml
ports:
  - "3000:3000"
```

### Falls Port belegt
```yaml
ports:
  - "3001:3000"  # Host:Container
```

---

## GitHub Actions (Optional)

### Automatischer Build bei Push
```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: ./food-app
          push: true
          tags: ghcr.io/kroonk/kiidea:latest
```

---

## Backup vor Deployment

**WICHTIG:** Vor jedem Deployment Backup erstellen!

```bash
# Auf NAS
cd /volume2/docker/Vibecoding/Website/KIIdea
cp -r data data-backup-$(date +%Y%m%d-%H%M%S)
```

Oder über Web-UI: `/backup` → Export als JSON

---

## Rollback

Falls ein Update Probleme macht:

```bash
# Image-Tag von vorheriger Version holen
docker images ghcr.io/kroonk/kiidea

# docker-compose.yml anpassen
image: ghcr.io/kroonk/kiidea@sha256:ALTE_SHA

# Container neu starten
docker compose up -d
```

---

## Monitoring

### Container-Health
```bash
# Ressourcen-Nutzung
docker stats kiidea-food-app

# Logs der letzten 100 Zeilen
docker logs --tail 100 kiidea-food-app

# Follow Logs
docker logs -f kiidea-food-app
```

### Datenbank-Größe
```bash
ls -lh ./data/dev.db
```

---

## Performance-Tuning

### Node.js Memory Limit
Falls mehr RAM benötigt wird:

```yaml
environment:
  - NODE_OPTIONS="--max-old-space-size=512"
```

### CPU Limits (optional)
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```
