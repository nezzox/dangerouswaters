#!/usr/bin/env python3
"""Ko-fi webhook -> privacy-filtered public radio feed. No third-party packages."""
import hmac
import json
import os
import re
import sqlite3
import time
from decimal import Decimal, InvalidOperation
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

PREFIX = '/dangerouswaters-kofi'

def clean(value, limit):
    return ' '.join(str(value or '').split())[:limit]

def normalize(data, token):
    supplied = str(data.get('verification_token', '')).encode()
    if not token or not hmac.compare_digest(supplied, token.encode()):
        raise PermissionError('Invalid verification')
    if data.get('type') not in ('Tip', 'Donation', 'Subscription'):
        return None
    message_id = data.get('message_id')
    if not isinstance(message_id, str) or not re.fullmatch(r'[\w-]{1,120}', message_id):
        raise ValueError('Invalid event ID')
    public = data.get('is_public') is True
    try:
        amount = Decimal(str(data.get('amount', '')))
        if not amount.is_finite() or amount < 0 or amount > 10000000:
            raise ValueError('Invalid amount')
    except InvalidOperation as error:
        raise ValueError('Invalid amount') from error
    currency = str(data.get('currency', '')).upper()
    if not re.fullmatch('[A-Z]{3}', currency):
        raise ValueError('Invalid currency')
    event = {'name': clean(data.get('from_name'), 60) or 'A supporter',
             'amount': str(amount.quantize(Decimal('.01'))), 'currency': currency,
             'message': clean(data.get('message'), 280), 'public': public}
    if not public:
        event.update(name='Anonymous supporter', amount=None, currency=None, message='')
    return message_id, event

class Store:
    def __init__(self, path):
        self.path = str(path)
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, message_id TEXT UNIQUE NOT NULL, created REAL NOT NULL, payload TEXT NOT NULL)')
    def connect(self):
        return sqlite3.connect(self.path, timeout=10)
    def add(self, message_id, event):
        # Only sanitized display fields enter storage; never tokens or email addresses.
        with self.connect() as db:
            db.execute('INSERT OR IGNORE INTO events(message_id,created,payload) VALUES(?,?,?)', (message_id, time.time(), json.dumps(event)))
            db.execute('DELETE FROM events WHERE id < (SELECT MAX(id)-1000 FROM events)')
    def feed(self, after=None):
        with self.connect() as db:
            latest = db.execute('SELECT COALESCE(MAX(id),0) FROM events').fetchone()[0]
            if after is None:
                return {'cursor': latest, 'events': []}
            rows = db.execute('SELECT id,payload FROM events WHERE id>? ORDER BY id LIMIT 50', (after,)).fetchall()
            return {'cursor': rows[-1][0] if rows else max(latest, after),
                    'events': [{'id': key, **json.loads(payload)} for key, payload in rows]}

def handler(store, token, origin):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass  # Do not log payloads, donor information or verification tokens.
        def reply(self, status, payload):
            body = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            origins = origin.split(',')
            requested = self.headers.get('Origin', '')
            self.send_header('Access-Control-Allow-Origin', requested if requested in origins else origins[0])
            self.send_header('Vary', 'Origin')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(body)
        def do_GET(self):
            parsed = urlsplit(self.path)
            if parsed.path == PREFIX + '/health':
                return self.reply(200, {'ok': True})
            if parsed.path != PREFIX + '/events':
                return self.reply(404, {'error': 'Not found'})
            raw = parse_qs(parsed.query).get('after', [None])[0]
            if raw is not None and (not raw.isdigit() or len(raw) > 16):
                return self.reply(400, {'error': 'Invalid cursor'})
            self.reply(200, store.feed(None if raw is None else int(raw)))
        def do_POST(self):
            if urlsplit(self.path).path != PREFIX + '/webhook':
                return self.reply(404, {'error': 'Not found'})
            if self.headers.get('Content-Type', '').split(';')[0] != 'application/x-www-form-urlencoded':
                return self.reply(415, {'error': 'Form encoding required'})
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 65536:
                    return self.reply(413, {'error': 'Invalid body length'})
                fields = parse_qs(self.rfile.read(length).decode(), max_num_fields=8)
                data = json.loads(fields.get('data', [''])[0])
                if not isinstance(data, dict):
                    raise ValueError('Invalid data')
                result = normalize(data, token)
                if result:
                    store.add(*result)
            except PermissionError:
                return self.reply(403, {'error': 'Verification failed'})
            except (ValueError, UnicodeError, TypeError):
                return self.reply(400, {'error': 'Invalid event'})
            except sqlite3.Error:
                return self.reply(503, {'error': 'Storage unavailable'})
            self.reply(200, {'ok': True})
    return Handler

def main():
    token = os.environ.get('KOFI_VERIFICATION_TOKEN', '')
    if not token:
        raise SystemExit('KOFI_VERIFICATION_TOKEN is required')
    store = Store(os.environ.get('KOFI_DB_PATH', str(Path.home()/'.local/state/dangerouswaters-kofi/events.sqlite3')))
    server = ThreadingHTTPServer((os.environ.get('KOFI_BIND', '127.0.0.1'), int(os.environ.get('KOFI_PORT', '8791'))), handler(store, token, os.environ.get('KOFI_GAME_ORIGIN', 'https://nezzox.github.io')))
    server.serve_forever()

if __name__ == '__main__':
    main()
