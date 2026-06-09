#!/bin/sh
set -e

log() {
	echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [$1] $2"
}

log "INFO" "Starting MonJardin..."
log "INFO" "Applying database migrations..."
node scripts/migrate.js

log "INFO" "Starting application server on port 3000..."
exec node build/index.js
