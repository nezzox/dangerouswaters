import {boatById} from './catalog.mjs?v=0.18.76';
import {isLand,MATTHEW_QUAY,DUTCH_QUAY} from './world.mjs?v=0.18.76';
import {planSeaRoute} from './navigation.mjs?v=0.18.76';
// Shared frame on the new geographic quay. Positive inland points onto its apron.
export const QUAY=DUTCH_QUAY;
export function quayPoint(along=0,inland=0,quay=QUAY){return{x:quay.x+quay.tx*along-quay.ty*inland,y:quay.y+quay.ty*along+quay.tx*inland};}
const berthOffsets=[0,68,-68,-136,-204,-272];
const quayBerths=quay=>berthOffsets.map(along=>({...quayPoint(along,-12,quay),heading:quay.heading}));
export const BERTHS=quayBerths(QUAY);
export const BERTH=BERTHS[0];
export const PORT_QUAYS=[QUAY,MATTHEW_QUAY];
const matthewBerths=quayBerths(MATTHEW_QUAY);
export const berthsAt=quay=>quay===QUAY?BERTHS:matthewBerths;
export function restoreBerth(saved){
 for(const quay of PORT_QUAYS){
  const berths=berthsAt(quay);
  const match=berths.find(b=>Math.hypot(saved.x-b.x,saved.y-b.y)<.1);
  if(match)return match;
  const old=[0,50,-50,-100,-150,-200].findIndex(along=>{
   const p=quayPoint(along,quay===QUAY?-6:-7,quay);
   return Math.hypot(saved.x-p.x,saved.y-p.y)<.1;
  });
  if(old>=0)return berths[old];
 }
 return null;
}
export function nearestQuay(s){return Math.hypot(s.x-QUAY.x,s.y-QUAY.y)<Math.hypot(s.x-MATTHEW_QUAY.x,s.y-MATTHEW_QUAY.y)?QUAY:MATTHEW_QUAY;}
export function chooseBerth(s,boats=[]){return berthsAt(nearestQuay(s)).find(b=>!vesselIntersectsHarbor({...s,...b})&&boats.every(o=>Math.hypot(o.x-b.x,o.y-b.y)>Math.max(45,(boatById(s.career?.boat).length+boatById(o.boat).length)*.6)&&(!o.berth||Math.hypot(o.berth.x-b.x,o.berth.y-b.y)>40)))||null;}
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
// Only real geographic land and piers obstruct navigation; the retired timber docks have no hitboxes.
export function vesselIntersectsHarbor(s){const boat=boatById(s.career?.boat),c=Math.cos(s.heading),n=Math.sin(s.heading),hx=boat.length*.55,hz=boat.beam*.55;for(const u of [-hx,0,hx])for(const v of [-hz,0,hz])if(isLand(s.x+c*u-n*v,s.y+n*u+c*v))return true;return false;}
export function buildDockRoute(s,berth=BERTH){const legs=[];let at={x:s.x,y:s.y,heading:s.heading};const add=(x,y,h,label)=>{const d=Math.hypot(x-at.x,y-at.y),turn=angle(h-at.heading);if(d<.01&&Math.abs(turn)<.01)return;const to={x,y,heading:at.heading+turn},duration=Math.max(1.5*d/1.7,Math.abs(turn)/.23,1);legs.push({from:{...at},to,duration,label});at=to;};
 const quay=nearestQuay(berth);
 const localU=(s.x-berth.x)*quay.tx+(s.y-berth.y)*quay.ty,localN=(s.x-quay.x)*quay.ty-(s.y-quay.y)*quay.tx;
 if(Math.abs(localU)<1&&localN>=11.9&&Math.abs(angle(s.heading-berth.heading))<.03){add(berth.x,berth.y,berth.heading,'Closing alongside the quay');return legs;}
 // Move sideways away from shore before turning, as a pilot-assisted maneuver.
 const escape=Math.max(0,70-localN);if(escape>0)add(at.x+quay.ty*escape,at.y-quay.tx*escape,at.heading,'Clearing the quay');
 const along=(berth.x-quay.x)*quay.tx+(berth.y-quay.y)*quay.ty,staging=quayPoint(along,-75,quay),route=planSeaRoute(at,staging);
 if(!route)return [];
 for(const waypoint of route){const heading=Math.atan2(waypoint.y-at.y,waypoint.x-at.x);if(Math.hypot(waypoint.x-at.x,waypoint.y-at.y)>.1){add(at.x,at.y,heading,'Aligning clear of the quay');add(waypoint.x,waypoint.y,heading,'Approaching the service quay');}}
 add(at.x,at.y,berth.heading,'Aligning alongside the quay');add(berth.x,berth.y,berth.heading,'Closing alongside the quay');return legs;
}
export function dockRouteDuration(route){return route.reduce((sum,l)=>sum+l.duration,0);}
export function dockingPose(route,elapsed){let time=elapsed;for(const leg of route){if(time>leg.duration){time-=leg.duration;continue;}const t=Math.max(0,Math.min(1,time/leg.duration)),u=t*t*(3-2*t),a=leg.from,b=leg.to,dx=b.x-a.x,dy=b.y-a.y,heading=a.heading+(b.heading-a.heading)*u;return {x:a.x+dx*u,y:a.y+dy*u,heading,speed:(dx*Math.cos(heading)+dy*Math.sin(heading))*6*t*(1-t)/leg.duration};}return {...(route.at(-1)?.to||BERTH),speed:0};}

export function dockingStage(route,elapsed){let time=elapsed;for(const leg of route){if(time>leg.duration){time-=leg.duration;continue;}return leg.label||'Approaching the unloading berth';}return 'Securing mooring lines';}

// Pilot/thruster assist: move broadside offshore before allowing a turn.
export function castOffPosition(s){
 const quay=nearestQuay(s);
 const boat=boatById(s.career?.boat),offshore=(s.x-quay.x)*quay.ty-(s.y-quay.y)*quay.tx;
 if(Math.min(...berthsAt(quay).map(b=>Math.hypot(s.x-b.x,s.y-b.y)))>120||offshore>Math.max(25,boat.length*.7))return null;
 for(let d=12;d<=140;d+=2){const at={...s,x:s.x+quay.ty*d,y:s.y-quay.tx*d};let clear=true;
  for(let a=0;a<Math.PI*2;a+=Math.PI/24)if(vesselIntersectsHarbor({...at,heading:a})){clear=false;break;}
  if(clear)return {x:at.x,y:at.y,heading:Math.atan2(-quay.tx,quay.ty)};
 }
 return null;
}
// Three pilot-assisted phases: let go, translate broadside, then turn in clear water.
export function buildCastOffRoute(s,target=castOffPosition(s)){if(!target)return [];const start={x:s.x,y:s.y,heading:s.heading},sideways={x:target.x,y:target.y,heading:s.heading},end={...target,heading:s.heading+angle(target.heading-s.heading)};return [{from:start,to:{...start},duration:2,label:'Letting go mooring lines'},{from:{...start},to:sideways,duration:Math.max(8,Math.hypot(target.x-s.x,target.y-s.y)*1.5),label:'Moving clear of the quay'},{from:{...sideways},to:end,duration:Math.max(4,Math.abs(end.heading-start.heading)/.12),label:'Turning toward open water'}];}
