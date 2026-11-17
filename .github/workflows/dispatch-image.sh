#!/usr/bin/env bash
# Dispara docker-image.yml en $REPO sobre la rama $REF y espera a que termine.
# Ese workflow tagea la imagen con los primeros 7 caracteres de GITHUB_SHA.
# GH_TOKEN tiene que poder disparar workflows en ese repo. El de esta corrida no alcanza.

set -euo pipefail

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "Falta el secret DISPATCH_TOKEN, con actions:write sobre ${REPO}." >&2
  exit 1
fi

if [[ -z "${REF:-}" || -z "${REPO:-}" || -z "${IMAGE:-}" ]]; then
  echo "Faltan REPO, IMAGE o REF." >&2
  exit 1
fi

prev=$(gh run list \
  --repo "$REPO" \
  --workflow docker-image.yml \
  --branch "$REF" \
  --event workflow_dispatch \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId // empty')

gh workflow run docker-image.yml --repo "$REPO" --ref "$REF"

run_id=""
for _ in $(seq 1 30); do
  candidate=$(gh run list \
    --repo "$REPO" \
    --workflow docker-image.yml \
    --branch "$REF" \
    --event workflow_dispatch \
    --limit 1 \
    --json databaseId \
    --jq '.[0].databaseId // empty')
  if [[ -n "$candidate" && "$candidate" != "$prev" ]]; then
    run_id="$candidate"
    break
  fi
  sleep 2
done

if [[ -z "$run_id" ]]; then
  echo "No apareció la corrida de docker-image.yml en ${REPO}@${REF}." >&2
  exit 1
fi

gh run watch "$run_id" --repo "$REPO" --exit-status

sha=$(gh run view "$run_id" --repo "$REPO" --json headSha --jq .headSha)
url=$(gh run view "$run_id" --repo "$REPO" --json url --jq .url)
tag="${sha:0:7}"

if [[ ! "$tag" =~ ^[0-9a-f]{7}$ ]]; then
  echo "SHA corto inesperado para ${IMAGE}: ${tag}" >&2
  exit 1
fi

echo "tag=${tag}" >> "$GITHUB_OUTPUT"
echo "${IMAGE}:${tag} ${url}"
