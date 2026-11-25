import {firebaseConfig} from './multiplayer-firebase-config.mjs';
import {positionInterval,vesselPosition,potChanges} from './multiplayer-pacing.mjs?v=0.18.81';

let firebase;
function connectFirebase(){
 return firebase??=(async()=>{
  const [app,auth,db]=await Promise.all([
   import('./firebase-sdk-app.mjs'),import('./firebase-sdk-auth.mjs'),import('./firebase-sdk-database.mjs'),
  ]);
  const instance=app.initializeApp(firebaseConfig),credentials=auth.getAuth(instance);
  await credentials.authStateReady();
  const user=credentials.currentUser||(await auth.signInAnonymously(credentials)).user;
  return {...db,database:db.getDatabase(instance),uid:user.uid};
 })().catch(error=>{firebase=null;throw error;});
}

const unpack=(packed,boat,sentAt)=>Array.isArray(packed)&&packed.length===3&&packed.every(Number.isFinite)?
 {...boat,x:packed[0],y:packed[1],heading:packed[2],positionSample:packed,sentAt}:boat;
const decodePots=entries=>Object.entries(entries||{}).flatMap(([id,p])=>
 Array.isArray(p)&&p.every(Number.isFinite)?[{id:Number(id),x:p[0],y:p[1]}]:[]);

export function createFirebaseMultiplayer(presence){
 let room=null,joining=null,status='offline',generation=0,peers=[];
 function reset(){
  generation++;
  if(room){
   for(const stop of room.stops)stop();
   for(const peer of room.links.values())closeLink(peer);
   void room.sdk.onDisconnect(room.mine).cancel().catch(()=>{});
   void room.sdk.onDisconnect(room.position).cancel().catch(()=>{});
   void room.sdk.remove(room.mine).catch(()=>{});
   void room.sdk.remove(room.position).catch(()=>{});
   releaseBerth(room);
  }
  room=null;joining=null;status='offline';peers=[];
 }
 function closeLink(link){
  link.stop?.();
  link.channel?.close();
  link.pc.close();
 }
 function refresh(r){
  if(room!==r)return;
  peers=Object.entries(r.members).filter(([id])=>id!==r.sdk.uid).slice(0,30).map(([id,member])=>{
   const link=r.links.get(id),direct=link?.received&&performance.now()-link.received.at<2300?link.received.data:null;
   const positions=direct||r.positions[id]||{};
   return unpack(positions.boat,{...member,id,hour:Number.isFinite(direct?.hour)?direct.hour:member.hour,transport:direct?"p2p":"firebase",pots:decodePots(member.pots),
    fleet:Object.entries(member.fleet||{}).map(([key,b])=>unpack(positions.fleet?.[key],{...b,transport:direct?"p2p":"firebase",pots:decodePots(b.pots)},direct?.sentAt))},direct?.sentAt);
  });
 }
 function openLink(r,id){
  if(typeof RTCPeerConnection!=='function')return;
  const {sdk}=r,uid=sdk.uid;
  const ref=path=>sdk.ref(sdk.database,r.path+'/signals/'+path);
  const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  const link={pc,last:0,received:null,candidates:[],seen:new Set()};
  r.links.set(id,link);
  const outbound=ref(id+'/'+uid),inbound=ref(uid+'/'+id);
  const send=message=>sdk.push(outbound,message).catch(()=>{});
  const bind=channel=>{
   link.channel=channel;
   channel.onmessage=event=>{
    if(typeof event.data!=='string'||event.data.length>16000)return;
    try{
     const data=JSON.parse(event.data),previous=link.received?.data.sentAt;
     if(!data.boat||Number.isFinite(previous)&&Number.isFinite(data.sentAt)&&data.sentAt<=previous)return;
     link.received={at:performance.now(),data};
     refresh(r);
    }catch{}
   };
  };
  pc.onicecandidate=event=>{if(event.candidate)void send({candidate:event.candidate.toJSON()});};
  pc.ondatachannel=event=>bind(event.channel);
  let queue=Promise.resolve();
  link.stop=sdk.onChildAdded(inbound,snap=>{
   if(link.seen.has(snap.key))return;
   link.seen.add(snap.key);
   const message=snap.val();
   queue=queue.then(async()=>{
    if(pc.signalingState==='closed')return;
    if(message.description){
     await pc.setRemoteDescription(message.description);
     for(const candidate of link.candidates.splice(0))await pc.addIceCandidate(candidate);
     if(message.description.type==='offer'){
      await pc.setLocalDescription(await pc.createAnswer());
      await send({description:pc.localDescription.toJSON()});
     }
    }else if(message.candidate){
     if(pc.remoteDescription)await pc.addIceCandidate(message.candidate);
     else link.candidates.push(message.candidate);
    }
   }).catch(()=>{}).finally(()=>sdk.remove(snap.ref).catch(()=>{}));
  });
  if(uid<id){
   bind(pc.createDataChannel('positions',{ordered:false,maxRetransmits:0}));
   void pc.createOffer().then(offer=>pc.setLocalDescription(offer)).then(()=>send({description:pc.localDescription.toJSON()})).catch(()=>{});
  }
 }
 function syncLinks(r){
  for(const [id,link] of r.links)if(!r.members[id]){closeLink(link);r.links.delete(id);}
  for(const id of Object.keys(r.members))if(id!==r.sdk.uid&&!r.links.has(id))try{openLink(r,id);}catch{}
 }
 function metadata(p){
  const pots=items=>Object.fromEntries(items.map(({id,x,y})=>[id,[x,y]]));
  return {name:p.name,boat:p.boat,lights:p.lights,isHost:p.isHost,x:p.x,y:p.y,heading:p.heading,
   hour:p.hour,landed:p.landed,earned:p.earned,
   ...(p.berth&&{berth:{x:p.berth.x,y:p.berth.y}}),pots:pots(p.pots),
   fleet:Object.fromEntries(p.fleet.map(b=>[b.id,{id:b.id,name:b.name,boat:b.boat,x:b.x,y:b.y,heading:b.heading,pots:pots(b.pots)}]))};
 }
 function releaseBerth(r){
  if(!r.berth)return;
  const ref=r.berth;
  r.berth=null;
  void r.sdk.onDisconnect(ref).cancel().catch(()=>{});
  void r.sdk.remove(ref).catch(()=>{});
 }
 async function bookBerth(r,state,point){
  const job=state.deckJob;
  if(r.booking)return;
  const key=point?Math.round(point.x/5)+'_'+Math.round(point.y/5):null;
  if(r.berth?.key===key){if(job?.reservationPending)job.reservationPending=false;return;}
  if(!point){releaseBerth(r);return;}
  r.booking=true;
  releaseBerth(r);
  const {sdk}=r,ref=sdk.ref(sdk.database,r.path+'/berths/'+key);
  try{
   const result=await sdk.runTransaction(ref,owner=>owner===null||owner===sdk.uid?sdk.uid:undefined,{applyLocally:false});
   if(!result.committed)throw Error('occupied');
   if(room!==r){await sdk.remove(ref);return;}
   await sdk.onDisconnect(ref).remove();
   r.berth=ref;
   if(state.deckJob===job&&job?.reservationPending)job.reservationPending=false;
  }catch{
   if(room===r&&state.deckJob===job&&job?.reservationPending){
    state.deckJob=null;state.speed=0;state.message='Berth occupied. Docking stopped; choose another berth.';
   }
  }finally{r.booking=false;}
 }
 async function join(state,create,epoch){
  try{
   const sdk=await connectFirebase(),path='worlds/'+state.worldId;
   if(epoch!==generation)return false;
   const ref=tail=>sdk.ref(sdk.database,path+'/'+tail);
   const host=ref('host'),snap=await sdk.get(host);
   if(!snap.exists()){
    if(!create){status='not-found';return false;}
    await sdk.runTransaction(host,value=>value??sdk.uid);
   }
   if(epoch!==generation)return false;
   const mine=ref('members/'+sdk.uid),position=ref('positions/'+sdk.uid);
   const r={sdk,path,mine,position,members:{},positions:{},links:new Map(),stops:[],lastFallback:0,lastMeta:0,previous:null};
   await Promise.all([sdk.onDisconnect(mine).remove(),sdk.onDisconnect(position).remove()]);
   if(epoch!==generation)return false;
   room=r;
   r.isHost=(snap.exists()?snap.val():(await sdk.get(host)).val())===sdk.uid;
   await sdk.set(mine,metadata({...presence(state),isHost:r.isHost}));
   if(room!==r)return false;
   r.stops.push(sdk.onValue(ref('members'),snap=>{r.members=snap.val()||{};syncLinks(r);refresh(r);}),
    sdk.onChildAdded(ref('positions'),snap=>{r.positions[snap.key]=snap.val();refresh(r);}),
    sdk.onChildChanged(ref('positions'),snap=>{r.positions[snap.key]=snap.val();refresh(r);}),
    sdk.onChildRemoved(ref('positions'),snap=>{delete r.positions[snap.key];refresh(r);}),
    sdk.onValue(sdk.ref(sdk.database,'.info/connected'),snap=>{
     if(room!==r)return;
     if(!snap.val()){
      status='offline';r.berth=null;
      for(const link of r.links.values())closeLink(link);
      r.links.clear();return;
     }
     if(status==='online')return;
     void Promise.all([sdk.onDisconnect(mine).remove(),sdk.onDisconnect(position).remove()])
      .then(()=>sdk.set(mine,metadata({...presence(state),isHost:r.isHost})))
      .then(()=>{if(room===r){r.previous=null;status='online';syncLinks(r);}})
      .catch(()=>{});
    }));
   status='online';
   return true;
  }catch{if(epoch===generation){reset();status='offline';}return false;}
 }
 function sync(state,create=false){
  if(room)return Promise.resolve(status==='online');
  if(!joining){
   const epoch=generation;
   joining=join(state,create,epoch).finally(()=>{if(epoch===generation)joining=null;});
  }
  return joining;
 }
 function updateRoom(r,state,now){
  const p={...presence(state),isHost:r.isHost},previous=r.previous;
  const packet={boat:vesselPosition(p),fleet:Object.fromEntries(p.fleet.map(b=>[b.id,vesselPosition(b)]))};
  let fallback=false,directPacket;
  for(const peer of peers){
   const link=r.links.get(peer.id);
   const near=Math.hypot(p.x-peer.x,p.y-peer.y);
   if(link?.channel?.readyState!=='open'){fallback=true;continue;}
   if(now-link.last<positionInterval(near)||link.channel.bufferedAmount>16000)continue;
   try{link.channel.send(directPacket??=JSON.stringify({...packet,sentAt:performance.timeOrigin+now,hour:p.hour}));link.last=now;}catch{fallback=true;}
  }
  if(fallback&&now-r.lastFallback>=600){
   r.lastFallback=now;
   void r.sdk.set(r.position,packet).catch(()=>{});
  }
  if(!r.booking&&(p.berth||r.berth))void bookBerth(r,state,p.berth);
  const changes={},fields=['name','boat','lights','isHost','landed','earned'];
  for(const key of fields)if(p[key]!==previous?.[key])changes[key]=p[key];
  if(now-r.lastMeta>=(r.isHost?1000:3000)||!previous){
   r.lastMeta=now;
   Object.assign(changes,{x:p.x,y:p.y,heading:p.heading,hour:p.hour});
  }
  if(JSON.stringify(p.berth)!==JSON.stringify(previous?.berth))changes.berth=p.berth?{x:p.berth.x,y:p.berth.y}:null;
  const gear=(path,before,after)=>{for(const [id,v] of Object.entries(potChanges(before,after)))changes[path+'/'+id]=v;};
  gear('pots',previous?.pots||[],p.pots);
  for(const old of previous?.fleet||[])if(!p.fleet.some(b=>b.id===old.id))changes['fleet/'+old.id]=null;
  for(const boat of p.fleet){
   const old=previous?.fleet.find(b=>b.id===boat.id),path='fleet/'+boat.id;
   if(!old||old.boat!==boat.boat){
    changes[path]={...boat,pots:Object.fromEntries(boat.pots.map(({id,x,y})=>[id,[x,y]]))};
   }else gear(path+'/pots',old.pots,boat.pots);
  }
  r.previous=p;
  if(Object.keys(changes).length)void r.sdk.update(r.mine,changes).catch(()=>{});
 }
 let lastTick=0,lastAttempt=-Infinity;
 return {get peers(){return peers;},get status(){return status;},reset,sync,tick(state,now){
  if(!room){if(!joining&&now-lastAttempt>=3000){lastAttempt=now;void sync(state,state.worldId===state.ownWorldId);}return;}
  if(now-lastTick<30)return;
  lastTick=now;
  if(status==='online')updateRoom(room,state,now);
 }};
}
