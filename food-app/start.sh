#!/bin/sh

mkdir -p /app/data

# Prüfe, ob in dem gemounteten Volume bereits eine Datenbank liegt
if [ ! -f /app/data/dev.db ]; then
  echo "Keine Datenbank im Volume gefunden. Kopiere initiale Datenbank..."
  cp /app/prisma/dev.db /app/data/dev.db
  # Setze Prisma auf Stand
  echo "Initialisierung abgeschlossen."
fi

# Starte Next.js Server
exec node server.js
