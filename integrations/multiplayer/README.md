# Multiplayer relay

The relay stores only player-published presence and leaderboard totals. World codes are public invitations, not passwords. Player tokens are private random ownership identifiers and are never returned to other players. Client-authoritative totals are suitable for a friendly leaderboard, not anti-cheat competition. Presence expires after 45 seconds; single-player saves and pots remain local.

Run `DW_WORLD_BIND=127.0.0.1 python3 integrations/multiplayer/server.py`, or bind to the Docker bridge behind an HTTPS reverse proxy with `/dangerouswaters-worlds/*`. Limit traffic at the proxy if exposed publicly. No secrets or local save files are uploaded.
