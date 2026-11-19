#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT/docker/docker-compose-pacs.yml"
ENV_FILE="$ROOT/docker/pacs/stack.env"
CONF_DIR="$ROOT/docker/pacs/conf"

compose() {
    docker compose -p andes-pacs -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

mkdir -p "$CONF_DIR"
sed "s|<andes-secret>|${ANDES_SECRET}|g" \
    "$ROOT/docker/pacs/templates/andes.json.template" > "$CONF_DIR/andes.json"
sed "s|<archive-name>|${ARCHIVE_DEVICE_NAME}|g" \
    "$ROOT/docker/pacs/templates/mwl.ldif.template" > "$CONF_DIR/mwl.ldif"

echo "esperando el realm dcm4che..."
listo=0
for _ in $(seq 1 90); do
    if curl -sf --max-time 5 -o /dev/null "http://127.0.0.1:8880/auth/realms/dcm4che"; then
        listo=1
        break
    fi
    sleep 5
done
if [ "$listo" -ne 1 ]; then
    echo "keycloak no respondió el realm dcm4che" >&2
    exit 1
fi

keycloak_id="$(compose ps -q keycloak)"
ldap_id="$(compose ps -q ldap)"
if [ -z "$keycloak_id" ] || [ -z "$ldap_id" ]; then
    echo "keycloak o ldap no están corriendo" >&2
    exit 1
fi

docker cp "$CONF_DIR/andes.json" "$keycloak_id":/tmp/andes.json
docker cp "$CONF_DIR/mwl.ldif" "$ldap_id":/tmp/mwl.ldif

compose exec -T keycloak kcadm.sh config credentials \
    --server http://keycloak:8880/auth \
    --realm master \
    --user "$KEYCLOAK_USER" \
    --password "$KEYCLOAK_PASSWORD"

if ! compose exec -T keycloak kcadm.sh get clients -r dcm4che -q clientId=andes --fields id | grep -q '"id"'; then
    compose exec -T keycloak kcadm.sh create clients -r dcm4che -f /tmp/andes.json
fi

if ! compose exec -T keycloak kcadm.sh get roles/user -r dcm4che >/dev/null 2>&1; then
    compose exec -T keycloak kcadm.sh create roles -r dcm4che -s name=user
fi

compose exec -T keycloak kcadm.sh add-roles \
    --uusername service-account-andes \
    --rolename user \
    -r dcm4che \
    || echo "rol user ya asignado a service-account-andes"

echo "configurando MWL..."
mwl_ok=0
for _ in $(seq 1 12); do
    if compose exec -T ldap ldapmodify -x \
        -w "$LDAP_ROOTPASS" \
        -D "cn=admin,dc=dcm4che,dc=org" \
        -H ldap://localhost:389 \
        -f /tmp/mwl.ldif; then
        mwl_ok=1
        break
    fi
    sleep 5
done
if [ "$mwl_ok" -ne 1 ]; then
    echo "no se pudo configurar el MWL en ldap" >&2
    exit 1
fi

echo "esperando el archive..."
arc_ok=0
for _ in $(seq 1 60); do
    if curl -sS -o /dev/null --max-time 5 "http://127.0.0.1:8080/dcm4chee-arc/aets/PACS/rs/studies"; then
        arc_ok=1
        break
    fi
    sleep 5
done
if [ "$arc_ok" -ne 1 ]; then
    echo "el archive no respondió en el 8080" >&2
    exit 1
fi

echo "cliente andes y MWL listos"
