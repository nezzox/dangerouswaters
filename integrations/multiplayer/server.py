#!/usr/bin/env python3
"""Small room relay: ephemeral presence; ownership secret stays with each client."""
import json, secrets, sqlite3, time, os, re, math, hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import RLock
DB=os.path.expanduser(os.environ.get('DW_WORLD_DB','~/.local/state/dangerouswaters-worlds.sqlite3'))
os.makedirs(os.path.dirname(DB),exist_ok=True)
lock=RLock(); db=sqlite3.connect(DB,check_same_thread=False)
db.execute('CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, created REAL)')
db.execute('CREATE TABLE IF NOT EXISTS players (room TEXT, token TEXT, state TEXT, seen REAL, PRIMARY KEY(room,token))');db.commit()
class Handler(BaseHTTPRequestHandler):
 def reply(self,status,data):
  body=json.dumps(data,separators=(',',':')).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.send_header('Access-Control-Allow-Origin','*');self.send_header('Access-Control-Allow-Methods','POST, OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def do_OPTIONS(self): self.reply(200,{})
 def do_GET(self): self.reply(200,{'ok':True}) if self.path=='/dangerouswaters-worlds/health' else self.reply(404,{'error':'not found'})
 def do_POST(self):
  if self.path!='/dangerouswaters-worlds/sync': return self.reply(404,{'error':'not found'})
  try:
   n=int(self.headers.get('Content-Length','0'))
   if n<1 or n>2000000: raise ValueError()
   data=json.loads(self.rfile.read(n));room=data.get('room','').upper();token=data.get('token','');state=data['state']
   if not re.fullmatch(r'[A-Z0-9]{6}',room) or not re.fullmatch(r'[a-f0-9]{32}',token): raise ValueError()
   if not isinstance(state,dict) or not isinstance(state.get('pots'),list) or len(state['pots'])>200: raise ValueError()
   state={k:state[k] for k in ('name','boat','x','y','heading','hour','landed','earned','pots','isHost','berth','fleet') if k in state}
   state['id']=hashlib.sha256((room+token).encode()).hexdigest()[:16]
   if not isinstance(state.get('name'),str) or not 1<=len(state['name'])<=24: raise ValueError()
   if any(not isinstance(state.get(k),(int,float)) or not math.isfinite(state[k]) or not -1000000000000<state[k]<1000000000000 for k in ('x','y','heading','hour','landed','earned')): raise ValueError()
   if not isinstance(state.get('boat'),str) or not re.fullmatch(r'nordvind|boat-\d{1,2}-\d{1,2}',state['boat']): raise ValueError()
   for p in state.get('pots',[]):
    if not isinstance(p,dict) or any(not isinstance(p.get(k),(int,float)) or not math.isfinite(p[k]) or not -5000000<p[k]<5000000 for k in ('x','y','id')): raise ValueError()
   fleet=state.get('fleet',[])
   if not isinstance(fleet,list) or len(fleet)>100: raise ValueError()
   clean_fleet=[]
   for b in fleet:
    if not isinstance(b,dict) or not isinstance(b.get('id'),str) or len(b['id'])>64 or not isinstance(b.get('name'),str) or len(b['name'])>40 or not isinstance(b.get('boat'),str) or not re.fullmatch(r'nordvind|boat-\d{1,2}-\d{1,2}',b['boat']): raise ValueError()
    if any(not isinstance(b.get(k),(int,float)) or not math.isfinite(b[k]) or abs(b[k])>5000000 for k in ('x','y','heading')): raise ValueError()
    pots=b.get('pots',[])
    if not isinstance(pots,list) or len(pots)>200: raise ValueError()
    for p in pots:
     if not isinstance(p,dict) or any(not isinstance(p.get(k),(int,float)) or not math.isfinite(p[k]) or abs(p[k])>5000000 for k in ('x','y','id')): raise ValueError()
    clean_fleet.append({k:b[k] for k in ('id','name','boat','x','y','heading','pots') if k in b})
   state['fleet']=clean_fleet
   berth=state.get('berth')
   if berth is not None and (not isinstance(berth,dict) or any(not isinstance(berth.get(k),(int,float)) or not math.isfinite(berth[k]) or abs(berth[k])>5000000 for k in ('x','y'))): raise ValueError()
   create=data.get('create') is True
   with lock:
    exists=db.execute('SELECT 1 FROM rooms WHERE id=?',(room,)).fetchone()
    if create and not exists: db.execute('INSERT INTO rooms VALUES (?,?)',(room,time.time()));exists=True
    if not exists: return self.reply(404,{'error':'world not found'})
    rows=db.execute('SELECT state,seen FROM players WHERE room=? AND token!=? AND seen>? ORDER BY seen DESC LIMIT 30',(room,token,time.time()-45)).fetchall()
    players=[json.loads(row[0]) for row in rows]
    conflict=berth is not None and any(isinstance(p.get('berth'),dict) and math.hypot(berth['x']-p['berth']['x'],berth['y']-p['berth']['y'])<40 for p in players)
    if conflict: state.pop('berth',None)
    db.execute('INSERT OR REPLACE INTO players VALUES (?,?,?,?)',(room,token,json.dumps(state,allow_nan=False),time.time()));db.commit()
   self.reply(200,{'players':players,'berthConflict':conflict})
  except (ValueError,TypeError,KeyError,json.JSONDecodeError,OverflowError): self.reply(400,{'error':'invalid request'})
 def log_message(self,*args): pass
if __name__=='__main__': ThreadingHTTPServer((os.environ.get('DW_WORLD_BIND','127.0.0.1'),int(os.environ.get('DW_WORLD_PORT','8792'))),Handler).serve_forever()
