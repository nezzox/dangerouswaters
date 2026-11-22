import {hullWidthAt} from './fenders.mjs?v=0.18.51';
import {deckSign} from './vessel-profile.mjs?v=0.18.51';
import {rackPositions,rackFootprints,rackFootprintKey,potBounds,rackFrames,rackScale,deckHardware} from './vessel-style.mjs?v=0.18.51';
export const CREW_RADIUS=.26,CREW_SPACING=.62;
export const CABIN_DOOR={x:.18,z:1.65};
export function potPositions(count,design={}){return rackPositions(count,design);}
const rectangle=(x,z,a,b,c,d,r)=>Math.max(a-x,0,x-b)**2+Math.max(c-z,0,z-d)**2<r*r;
export function canStand(x,z,count=8,door=false,design={}){
 if(deckSign(design)<0&&Math.abs(z)+CREW_RADIUS+.08>Math.min(hullWidthAt(-x-CREW_RADIUS,design),hullWidthAt(-x+CREW_RADIUS,design)))return false;
 if(x< -11.25||x>-.1||Math.abs(z)>3){if(!(door&&x>=-.3&&x<=.85&&z>=1.3&&z<=2.0))return false;}
 if(rectangle(x,z,-2.95,-.85,-1.55,.65,CREW_RADIUS))return false;
 if(Math.hypot(x+1.5,z-2.1)<.38+CREW_RADIUS||Math.hypot(x+3,z-3.1)<.42+CREW_RADIUS)return false;
 if(rectangle(x,z,-1.95,-1.05,-2.7,-1.9,CREW_RADIUS))return false;
 for(const p of rackFootprints(count,design)){const b=potBounds(p);if(b.min[1]>1.7+2*rackScale(design)[1])continue;if(rectangle(x,z,b.min[0],b.max[0],b.min[2],b.max[2],CREW_RADIUS))return false;}
 for(const p of rackFrames(design))for(const dx of [-.82,.82])for(const dz of [-.8,.8])if(Math.hypot(x-p.x-dx*p.scale[0],z-p.z-dz*p.scale[2])<CREW_RADIUS+.055)return false;
 for(const box of deckHardware(design).solid)if(box.min[1]<3.65&&rectangle(x,z,box.min[0],box.max[0],box.min[2],box.max[2],CREW_RADIUS))return false;
 return true;
}
export function clearSegment(a,b,count=8,door=false,design={}){const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.025);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(!canStand(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,count,door,design))return false;}return true;}
const gridCache=new Map();
function deckGrid(count,door,design){const key=[design.id||'',design.hauler||'',!!design.salmon,rackFootprintKey(count,design),door].join('/');if(gridCache.has(key))return gridCache.get(key);const nodes=[];for(let ix=0;ix<=48;ix++)for(let iz=0;iz<=24;iz++){const x=-11.25+ix*.25,z=-3+iz*.25;if(canStand(x,z,count,door,design))nodes.push({x,z,key:ix*25+iz});}const grid={nodes,byKey:new Map(nodes.map(n=>[n.key,n])),edges:new Map()};if(gridCache.size>=64)gridCache.delete(gridCache.keys().next().value);gridCache.set(key,grid);return grid;}
export function walkableDeck(count,design={}){return deckGrid(count,false,design).nodes;}
// A small fixed deck grid routes around cage stacks, hatch, hauler, crane and people.
export function routeOnDeck(start,target,count=8,people=[],door=false,design={}){
 const free=(x,z)=>canStand(x,z,count,door,design)&&people.every(p=>Math.hypot(p.x-x,p.z-z)>=CREW_SPACING+.03);
 if(!free(...target))return [];
 const grid=deckGrid(count,door,design),nodes=people.length?grid.nodes.filter(n=>people.every(p=>Math.hypot(p.x-n.x,p.z-n.z)>=CREW_SPACING+.03)):grid.nodes;
 const clearEdge=(a,b)=>{const key=Math.min(a.key,b.key)*2000+Math.max(a.key,b.key);if(!grid.edges.has(key))grid.edges.set(key,clearSegment([a.x,a.z],[b.x,b.z],count,door,design));return grid.edges.get(key);};
 const nearest=p=>{let closest=null,best=Infinity;for(const n of nodes){const d=(n.x-p[0])**2+(n.z-p[1])**2;if(d<best){best=d;closest=n;}}if(closest&&clearSegment(p,[closest.x,closest.z],count,door,design))return closest;return [...nodes].sort((a,b)=>(a.x-p[0])**2+(a.z-p[1])**2-((b.x-p[0])**2+(b.z-p[1])**2)).find(n=>clearSegment(p,[n.x,n.z],count,door,design));},first=nearest(start),last=nearest(target);if(!first||!last)return [];
 const byKey=people.length?new Map(nodes.map(n=>[n.key,n])):grid.byKey,open=[first.key],cost=new Map([[first.key,0]]),came=new Map(),closed=new Set();
 while(open.length){open.sort((a,b)=>cost.get(a)+Math.hypot(byKey.get(a).x-last.x,byKey.get(a).z-last.z)-cost.get(b)-Math.hypot(byKey.get(b).x-last.x,byKey.get(b).z-last.z));const key=open.shift(),n=byKey.get(key);if(key===last.key){const result=[];let at=key;while(at!==undefined){const v=byKey.get(at);result.unshift([v.x,v.z]);at=came.get(at);}if(free(...target))result.push(target);return result;}
  closed.add(key);for(const delta of [-26,-25,-24,-1,1,24,25,26]){const next=byKey.get(key+delta);if(!next||closed.has(next.key)||Math.hypot(next.x-n.x,next.z-n.z)>.36||!clearEdge(n,next))continue;if(next.x!==n.x&&next.z!==n.z&&(!free(next.x,n.z)||!free(n.x,next.z)))continue;const c=cost.get(key)+Math.hypot(next.x-n.x,next.z-n.z);if(c<(cost.get(next.key)??Infinity)){came.set(next.key,key);cost.set(next.key,c);if(!open.includes(next.key))open.push(next.key);}}
 }return [];
}
