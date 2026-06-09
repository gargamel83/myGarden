#!/bin/sh
set -e

VERSION=$(node -p "require(require('path').resolve('package.json')).version")
export DATA_DIR="data-docker-v${VERSION}"

echo "[INFO] Using data directory: ${DATA_DIR}"
exec docker compose up "$@"
