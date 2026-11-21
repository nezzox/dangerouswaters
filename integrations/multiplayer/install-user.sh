#!/usr/bin/env bash
set -euo pipefail
install -d -m 700 "$HOME/dangerouswaters-worlds" "$HOME/.config/systemd/user"
chmod 700 "$HOME/dangerouswaters-worlds/server.py"
cat > "$HOME/.config/systemd/user/dangerouswaters-worlds.service" <<UNIT
[Unit]
Description=Dangerous Waters multiplayer relay
After=network.target
[Service]
ExecStart=/usr/bin/python3 %h/dangerouswaters-worlds/server.py
Environment=DW_WORLD_BIND=172.17.0.1
Environment=DW_WORLD_PORT=8792
Restart=on-failure
NoNewPrivileges=true
[Install]
WantedBy=default.target
UNIT
systemctl --user daemon-reload
systemctl --user enable --now dangerouswaters-worlds.service
curl --fail --silent http://172.17.0.1:8792/dangerouswaters-worlds/health
