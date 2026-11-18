import {boatById} from './catalog.mjs?v=0.12.0-r8';
export const BERTH={x:61.9,y:79,heading:0};
export const PIERS=[-200,-55,90,235].map(y=>({x:-65,y,halfLength:155,halfWidth:3.5}));
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
// Conservative full-hull oriented rectangle; includes bow, stern and fender clearance.
export function vesselIntersectsHarbor(s){const c=Math.cos(s.heading),n=Math.sin(s.heading),hx=13.2*boatById(s.career?.boat).length/24,hz=4.6*boatById(s.career?.boat).beam/7.6;if(s.x-hx*Math.abs(c)-hz*Math.abs(n)<-218&&Math.abs(s.y)<535)return true;for(const p of PIERS){const dx=s.x-p.x,dy=s.y-p.y;if(Math.abs(dx)>p.halfLength+hx*Math.abs(c)+hz*Math.abs(n)||Math.abs(dy)>p.halfWidth+hx*Math.abs(n)+hz*Math.abs(c))continue;if(Math.abs(dx*c+dy*n)>hx+p.halfLength*Math.abs(c)+p.halfWidth*Math.abs(n))continue;if(Math.abs(-dx*n+dy*c)>hz+p.halfLength*Math.abs(n)+p.halfWidth*Math.abs(c))continue;return true;}return false;}
export function buildDockRoute(s){const legs=[];let at={x:s.x,y:s.y,heading:s.heading};const add=(x,y,h,speed=1.7)=>{const d=Math.hypot(x-at.x,y-at.y),turn=angle(h-at.heading),duration=Math.max(d?1.5*d/speed:0,Math.abs(turn)/.23,1);if(d<.01&&Math.abs(turn)<.01)return;const to={x,y,heading:at.heading+turn};legs.push({from:{...at},to,duration,label:d<.01?'Aligning for the berth':x<at.x?'Backing into the berth':x>at.x?'Clearing the pier':'Repositioning clear of the pier'});at=to;};
 if(Math.abs(s.y-BERTH.y)<.05&&Math.abs(angle(s.heading))<.03){add(BERTH.x,BERTH.y,0,1.4);return legs;}
 const clearance=Math.max(23,14.5*boatById(s.career?.boat).length/24),outside=Math.max(125,s.x);if(s.x<125){let low=-10000,high=10000;for(const p of PIERS){if(p.y<s.y)low=Math.max(low,p.y+clearance);else high=Math.min(high,p.y-clearance);}const clearY=Math.max(low,Math.min(high,s.y));add(at.x,clearY,at.heading,.8);add(at.x,at.y,0);add(outside,at.y,0);}
 const direction=BERTH.y>=at.y?Math.PI/2:-Math.PI/2;if(Math.abs(at.y-BERTH.y)>.1){add(at.x,at.y,direction);add(at.x,BERTH.y,direction);}
 add(at.x,at.y,0);add(BERTH.x,BERTH.y,0,1.4);return legs;
}
export function dockRouteDuration(route){return route.reduce((sum,l)=>sum+l.duration,0);}
export function dockingPose(route,elapsed){let time=elapsed;for(const leg of route){if(time>leg.duration){time-=leg.duration;continue;}const t=Math.max(0,Math.min(1,time/leg.duration)),u=t*t*(3-2*t),a=leg.from,b=leg.to,dx=b.x-a.x,dy=b.y-a.y,heading=a.heading+(b.heading-a.heading)*u;return {x:a.x+dx*u,y:a.y+dy*u,heading,speed:(dx*Math.cos(heading)+dy*Math.sin(heading))*6*t*(1-t)/leg.duration};}return {...(route.at(-1)?.to||BERTH),speed:0};}

export function dockingStage(route,elapsed){let time=elapsed;for(const leg of route){if(time>leg.duration){time-=leg.duration;continue;}return leg.label||'Approaching the unloading berth';}return 'Securing mooring lines';}
