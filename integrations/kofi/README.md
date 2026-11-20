# Ko-fi radio bridge

The static game stays on GitHub Pages. This optional Python 3 service runs on nezserv, receives Ko-fi POST requests, authenticates the server-side verification token, deduplicates retries in SQLite, and exposes a sanitized public event feed. No third-party Python packages or in-game currency rewards are involved.

Routes under `https://nezzox.duckdns.org/dangerouswaters-kofi`:

- `POST /webhook`: Ko-fi form field `data` containing JSON. Returns 200 after durable insertion. Wrong tokens return 403. Only Tip/Donation/Subscription events become donation messages.
- `GET /events`: returns current cursor with no history. Subsequent `?after=N` returns up to 50 newer events.
- `GET /health`: health check, no secrets or donor data.

Only display name, amount, currency and public message enter the database. Private events are anonymized and their amount/message are withheld. Email addresses and verification tokens never enter event storage or the browser. Text is rendered as text, never HTML. The bounded feed retains about 1,000 events; clients deduplicate and ignore initial history. Anonymous/public events remain readable without game authentication, so this endpoint must never include private payment information.

Installed user service: `dangerouswaters-kofi.service`. Working directory `/home/nezzox/dangerouswaters-kofi`; protected environment file `dw-kofi-service.env` mode 600. SQLite defaults to `~/.local/state/dangerouswaters-kofi/events.sqlite3`. The backend binds only the host's Docker bridge IP, `172.17.0.1:8791`; Caddy handles public TLS. `apply-proxy.sh` validates a staged Caddyfile, preserves the original bind-mounted inode, reloads Caddy with rollback on failure, and enables user lingering for reboot persistence. It refuses to overwrite a config changed since staging.

Required environment: `KOFI_VERIFICATION_TOKEN`. Optional: `KOFI_BIND`, `KOFI_PORT`, `KOFI_DB_PATH`, `KOFI_GAME_ORIGIN` (comma-separated permitted origins; normally only `https://nezzox.github.io`). Never commit an environment file or token. Do not pass them on a command line or put them in the public game configuration.

The client polls at most every ten seconds while visible. Donations appear only in the fading radio feed and never pause play or enter the OK dialog queue. Network failures are quiet and do not affect gameplay. Changing Ko-fi's verification token requires updating the protected server environment and restarting the user service.

Verification commands:

```
python3 -m unittest discover -s integrations/kofi/tests
systemctl --user status dangerouswaters-kofi.service
curl --fail https://nezzox.duckdns.org/dangerouswaters-kofi/health
```
