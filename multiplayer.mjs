import {createFirebaseMultiplayer} from './multiplayer-firebase.mjs?v=0.18.90';
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newWorldCode(){const values=crypto.getRandomValues(new Uint8Array(6));return Array.from(values,n=>alphabet[n%alphabet.length]).join('');}
export function newPlayerToken(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');}
export function cleanPlayerName(value){return String(value||'').trim().replace(/[\x00-\x1f\x7f]/g,'').slice(0,24);}
export function playerPresence(s){return {name:cleanPlayerName(s.playerName),isHost:s.worldId===s.ownWorldId,boat:s.career.boat,lights:s.lights!==false,fleet:(s.career.fleet||[]).slice(0,100).map(b=>({id:b.id,name:b.name,boat:b.boat,x:b.x,y:b.y,heading:b.heading,pots:(b.pots||[]).slice(0,200).map(({id,x,y})=>({id,x,y}))})),berth:s.deckJob?.kind==='unload'?s.deckJob.berth:s.moored,x:s.x,y:s.y,heading:s.heading,hour:s.hour,landed:Math.max(0,s.totalLanded||s.landed||0),earned:Math.max(0,s.totalEarned||0),pots:s.pots.slice(0,200).map(({id,x,y})=>({id,x,y}))};}
export const createMultiplayer=()=>createFirebaseMultiplayer(playerPresence);
// Render buffered poses independently of fleet, chat and presence metadata updates.
const angleDelta=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
const sampleOf=(peer,time)=>({x:peer.x,y:peer.y,heading:peer.heading,time});
export function createPeerSmoother(){
 const tracks=new Map();
 return {
  reset(){tracks.clear();},
  update(peers,now){
   const active=new Set(peers.map(p=>p.id));
   for(const id of tracks.keys())if(!active.has(id))tracks.delete(id);
   return peers.map(peer=>{
    let track=tracks.get(peer.id);
    const sampleKey=peer.positionSample??peer;
    if(!track){
     const first=sampleOf(peer,now);
     track={samples:[first],key:sampleKey,pose:first,lastFrame:now,
      delay:peer.transport==='firebase'?780:peer.transport==='p2p'?320:450,
      interval:peer.transport==='firebase'?600:150,sentAt:peer.sentAt,arrival:now};
     tracks.set(peer.id,track);
    }else if(track.key!==sampleKey){
     const last=track.samples.at(-1);
     const metadataOnly=!peer.positionSample&&peer.transport&&peer.x===last.x&&peer.y===last.y&&peer.heading===last.heading;
     if(!metadataOnly){
      if(Math.hypot(peer.x-last.x,peer.y-last.y)>1000){
       const arrived=sampleOf(peer,now);
       track.samples=[arrived];
       track.pose=arrived;
       track.offset=undefined;
      }else{
       const senderGap=peer.sentAt-track.sentAt;
       const interval=senderGap>0&&senderGap<2500?senderGap:now-track.arrival;
       track.interval+=(Math.max(100,Math.min(900,interval))-track.interval)*.35;
       let time=now;
       if(Number.isFinite(peer.sentAt)){
        const offset=now-peer.sentAt;
        track.offset=Math.min(offset,(track.offset??offset)+interval*.015);
        time=Math.max(last.time+1,Math.min(now,peer.sentAt+track.offset));
       }else track.offset=undefined;
       track.samples.push(sampleOf(peer,Math.max(last.time+1,time)));
       if(track.samples.length>12)track.samples.shift();
      }
      track.sentAt=peer.sentAt;
      track.arrival=now;
     }
     track.key=sampleKey;
    }
    const dt=Math.max(0,now-track.lastFrame);
    track.lastFrame=now;
    const idealDelay=peer.transport==='firebase'?780:peer.transport==='p2p'?Math.max(320,Math.min(860,track.interval*1.3)):450;
    track.delay+=Math.max(-dt*.25,Math.min(dt*.25,idealDelay-track.delay));
    const target=now-track.delay,samples=track.samples;
    while(samples.length>2&&samples[1].time<=target)samples.shift();
    const [a,b]=samples;
    let desired=a;
    if(b){
     const span=b.time-a.time;
     const progress=Math.max(0,(target-a.time)/span);
     const lead=Math.min(Math.max(0,progress-1),Math.min(420,track.interval)/span);
     const stale=Math.max(0,now-b.time-track.delay-track.interval);
     const u=Math.min(progress,1)+lead*Math.max(0,1-stale/900);
     const turn=angleDelta(a.heading,b.heading);
     const predictedTurn=Math.max(-.18,Math.min(.18,turn*Math.max(0,u-1)));
     desired={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,
      heading:a.heading+turn*Math.min(u,1)+predictedTurn};
    }
    // Blend the small correction when a new packet replaces a prediction.
    const blend=1-Math.exp(-dt/65),old=track.pose;
    const x=old.x+(desired.x-old.x)*blend,y=old.y+(desired.y-old.y)*blend;
    const heading=old.heading+angleDelta(old.heading,desired.heading)*blend;
    track.pose={x,y,heading};
    return {...peer,x,y,heading};
   });
  },
 };
}


// The host drives the shared watch. Each boat keeps its own elapsed-time
// counters so reconnecting cannot age or un-age a player's gear or incidents.
export function createWorldClock(){
 let sample=null;
 return {
  update(worldId,host,now){
   if(sample?.worldId!==worldId)sample=null;
   if(!host){sample=null;return undefined;}
   if(!Number.isFinite(host.hour)||host.hour<0){
    if(sample?.id!==host.id){sample=null;return undefined;}
    sample.missing=true;
    return sample.display;
   }
   if(!sample||sample.id!==host.id||sample.hour!==host.hour||sample.missing){
    const elapsed=sample&&sample.id===host.id&&!sample.missing?(now-sample.at)/1000:0;
    const rate=elapsed>=.05?Math.min(1/3,Math.max(0,(host.hour-sample.hour)/elapsed)):0;
    sample={worldId,id:host.id,hour:host.hour,at:now,rate};
   }
   const age=Math.max(0,(now-sample.at)/1000);
   const prediction=Math.min(.65,age)*Math.max(0,Math.min(1,(1.65-age)/.65));
   sample.display=sample.hour+sample.rate*prediction;
   return sample.display;
  },
 };
}
