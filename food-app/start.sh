#!/bin/sh

mkdir -p /app/data

# Prüfe, ob in dem gemounteten Volume bereits eine Datenbank liegt
if [ ! -f /app/data/dev.db ]; then
  echo "Keine Datenbank im Volume gefunden. Kopiere initiale Datenbank..."
  cp /app/prisma/dev.db /app/data/dev.db
  echo "Initialisierung abgeschlossen."

  # Seed admin user on first boot
  echo "Erstelle Admin-Account..."
  node /app/seed-admin.js
fi

# Starte Next.js Server
exec node server.js
