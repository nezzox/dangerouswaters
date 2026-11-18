#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
echo 'Dangerous Waters: http://127.0.0.1:8780'
exec python3 -m http.server 8780 --bind 127.0.0.1
