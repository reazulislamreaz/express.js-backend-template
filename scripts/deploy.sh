#!/usr/bin/env bash
# Pull the latest app image and restart the production stack on a VPS.
#
# Required env:
#   APP_IMAGE  — e.g. ghcr.io/my-org/express-template:latest
#
# Optional env:
#   DEPLOY_PATH   — directory with docker-compose.prod.yml (default: cwd)
#   COMPOSE_FILE  — compose file name (default: docker-compose.prod.yml)
#   GHCR_TOKEN    — GitHub PAT with read:packages (if image is private)
#   GHCR_USER     — GitHub username for GHCR login

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-$(pwd)}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

: "${APP_IMAGE:?APP_IMAGE is required}"

cd "$DEPLOY_PATH"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $DEPLOY_PATH/$COMPOSE_FILE" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo ".env file not found in $DEPLOY_PATH — copy .env.production.example first" >&2
  exit 1
fi

if [[ -n "${GHCR_TOKEN:-}" ]]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:?GHCR_USER is required with GHCR_TOKEN}" --password-stdin
fi

echo "Deploying $APP_IMAGE ..."
docker compose -f "$COMPOSE_FILE" pull app
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans --force-recreate app
docker compose -f "$COMPOSE_FILE" exec -T app npx prisma migrate deploy

echo "Pruning unused images ..."
docker image prune -f

echo "Deploy complete."
docker compose -f "$COMPOSE_FILE" ps
