#!/usr/bin/env bash
# Runs on each VMSS instance via az vmss run-command.
# Variables ACR_NAME, IMAGE_NAME, IMAGE_TAG are substituted before upload.
set -euo pipefail

ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
FULL_IMAGE="${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "==> Logging in to ACR: ${ACR_LOGIN_SERVER}"
az acr login --name "${ACR_NAME}" 2>/dev/null || \
  docker login "${ACR_LOGIN_SERVER}" -u "00000000-0000-0000-0000-000000000000" \
    -p "$(az acr login --name "${ACR_NAME}" --expose-token --query accessToken -o tsv)"

echo "==> Pulling image: ${FULL_IMAGE}"
docker pull "${FULL_IMAGE}"

echo "==> Stopping existing container (if any)"
docker rm -f myapp 2>/dev/null || true

echo "==> Starting container"
docker run -d \
  --name myapp \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file /opt/app/.env 2>/dev/null || true \
  "${FULL_IMAGE}"

echo "==> Pruning old images"
docker image prune -af --filter "until=24h" 2>/dev/null || true

echo "==> Deploy complete on $(hostname)"
