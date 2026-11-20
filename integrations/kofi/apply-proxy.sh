#!/usr/bin/env bash
# Run on nezserv as root after reviewing the staged Caddyfile diff.
set -euo pipefail
if [ "$(id -u)" != 0 ]; then exec sudo -- "$0" "$@"; fi
cd /home/nezzox/dangerouswaters-kofi
target=/media/nezzox/big/dockers/caddy/Caddyfile
expected=$(cat Caddyfile.sha256)
actual=$(sha256sum "$target" | cut -d' ' -f1)
if [ "$actual" != "$expected" ]; then
  echo 'Caddyfile changed since preparation. Review and regenerate the patch first.' >&2
  exit 1
fi
# Validate without changing the running service or printing adapted credentials.
docker exec -i -w /etc/caddy caddy caddy adapt --config - --adapter caddyfile --validate < Caddyfile.new > /dev/null
backup="$target.dangerouswaters-backup-$(date +%Y%m%d-%H%M%S)"
cp -p "$target" "$backup"
# Preserve the inode because Docker bind-mounts this individual file.
cat Caddyfile.new > "$target"
if ! docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; then
  cat "$backup" > "$target"
  docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  exit 1
fi
loginctl enable-linger nezzox
printf 'Proxy enabled. Backup: %s\n' "$backup"
curl --fail --silent --show-error https://nezzox.duckdns.org/dangerouswaters-kofi/health
