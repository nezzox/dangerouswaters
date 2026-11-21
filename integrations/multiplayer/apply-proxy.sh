#!/usr/bin/env bash
set -euo pipefail
if [ "$(id -u)" != 0 ]; then exec sudo -- "$0" "$@"; fi
cd /home/nezzox/dangerouswaters-worlds
target=/media/nezzox/big/dockers/caddy/Caddyfile
expected=$(cat Caddyfile.sha256)
actual=$(sha256sum "$target" | cut -d' ' -f1)
[ "$actual" = "$expected" ] || { echo 'Caddy configuration changed; regenerate and review the patch.' >&2; exit 1; }
docker exec -i -w /etc/caddy caddy caddy adapt --config - --adapter caddyfile --validate < Caddyfile.new > /dev/null
backup="$target.dangerouswaters-worlds-$(date +%Y%m%d-%H%M%S)"
cp -p "$target" "$backup"
cat Caddyfile.new > "$target"
if ! docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; then
 cat "$backup" > "$target"
 docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
 exit 1
fi
curl --fail --silent https://nezzox.duckdns.org/dangerouswaters-worlds/health
