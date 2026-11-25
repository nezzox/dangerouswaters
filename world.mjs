import {CRAB_GROUND_DATA} from './crab-ground-data.mjs?v=0.18.78';
import {PORT_PIERS} from './port-data.mjs?v=0.18.78';
import {COAST_DATA} from './coast-data.mjs?v=0.18.78';
export const WORLD_VERSION=2;
export const GEO_ORIGIN={lon:-166.524,lat:53.9034};
const meters=111319.490793,cos=Math.cos(GEO_ORIGIN.lat*Math.PI/180);
export function geoToWorld(lon,lat){const delta=((lon-GEO_ORIGIN.lon+540)%360)-180;return {x:delta*meters*cos,y:(GEO_ORIGIN.lat-lat)*meters};}
export function worldToGeo(x,y){return {lon:((GEO_ORIGIN.lon+x/(meters*cos)+540)%360)-180,lat:GEO_ORIGIN.lat-y/meters};}
const nw=geoToWorld(155,66),se=geoToWorld(-155,50);
export const WORLD_BOUNDS={left:nw.x,right:se.x,top:nw.y,bottom:se.y};
export const WORLD_CENTER={x:(nw.x+se.x)/2,y:(nw.y+se.y)/2};
export const WORLD_LAND=COAST_DATA.map(p=>{const outer=p.outer.map(([a,b])=>geoToWorld(a,b)),holes=p.holes.map(r=>r.map(([a,b])=>geoToWorld(a,b)));return {outer,holes,left:Math.min(...outer.map(p=>p.x)),right:Math.max(...outer.map(p=>p.x)),top:Math.min(...outer.map(p=>p.y)),bottom:Math.max(...outer.map(p=>p.y))};});
export function pointInRing(x,y,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
// A point-in-polygon ray can cross only edges that span its latitude.
const coastBands=new WeakMap(),coastBandSize=4096;
function coastRingContains(x,y,ring){
 if(ring.length<64)return pointInRing(x,y,ring);
 let bands=coastBands.get(ring);
 if(!bands){
  bands=new Map();
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i],b=ring[j];
   if(a.y===b.y)continue;
   const low=Math.floor(Math.min(a.y,b.y)/coastBandSize),high=Math.floor(Math.max(a.y,b.y)/coastBandSize);
   for(let row=low;row<=high;row++){
    if(!bands.has(row))bands.set(row,[]);
    bands.get(row).push(a,b);
   }
  }
  coastBands.set(ring,bands);
 }
 const edges=bands.get(Math.floor(y/coastBandSize));
 let inside=false;
 if(edges)for(let i=0;i<edges.length;i+=2){
  const a=edges[i],b=edges[i+1];
  if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
function coastalLand(x,y){for(const p of WORLD_LAND){if(x<p.left||x>p.right||y<p.top||y>p.bottom)continue;if(coastRingContains(x,y,p.outer)&&!p.holes.some(r=>coastRingContains(x,y,r)))return true;}return false;}
const pierShapes=PORT_PIERS.map(r=>{const points=r.map(([a,b])=>geoToWorld(a,b));return {points,left:Math.min(...points.map(p=>p.x))-4,right:Math.max(...points.map(p=>p.x))+4,top:Math.min(...points.map(p=>p.y))-4,bottom:Math.max(...points.map(p=>p.y))+4};});
export const ST_PAUL_DIESEL={...geoToWorld(-170.319895,57.1534),range:220};
const matthewA=geoToWorld(-172.783315,60.41234),matthewB=geoToWorld(-173.004221,60.49018);
const matthewLength=Math.hypot(matthewB.x-matthewA.x,matthewB.y-matthewA.y);
const tx=(matthewB.x-matthewA.x)/matthewLength,ty=(matthewB.y-matthewA.y)/matthewLength;
export const MATTHEW_QUAY={name:'St Matthew Harbor',x:(matthewA.x+matthewB.x)/2+ty*32,y:(matthewA.y+matthewB.y)/2-tx*32,tx,ty,deck:6.8,heading:Math.atan2(ty,tx)};
export const DUTCH_QUAY={x:47.3186402115,y:-70.0756194544,tx:-.811539539913,ty:.584297505692,deck:6.8};
DUTCH_QUAY.heading=Math.atan2(DUTCH_QUAY.ty,DUTCH_QUAY.tx);
export const SERVICE_APRON={start:-303,end:96,depth:40};
function serviceApron(x,y,q){
 const dx=x-q.x,dy=y-q.y,u=dx*q.tx+dy*q.ty,v=-dx*q.ty+dy*q.tx;
 return u>=SERVICE_APRON.start&&u<=SERVICE_APRON.end&&v>=0&&v<=SERVICE_APRON.depth;
}
export function isLand(x,y){if(serviceApron(x,y,MATTHEW_QUAY)||serviceApron(x,y,DUTCH_QUAY)||coastalLand(x,y))return true;for(const pier of pierShapes){if(x<pier.left||x>pier.right||y<pier.top||y>pier.bottom)continue;const p=pier.points,closed=Math.hypot(p[0].x-p.at(-1).x,p[0].y-p.at(-1).y)<.1;if(closed&&pointInRing(x,y,p))return true;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<3)return true;}}return false;}
export const inWorld=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&x>=nw.x&&x<=se.x&&y>=nw.y&&y<=se.y;
export function clearWater(x,y,radius=28){return !isLand(x,y)&&[0,1,2,3,4,5,6,7].every(i=>!isLand(x+Math.cos(i*Math.PI/4)*radius,y+Math.sin(i*Math.PI/4)*radius));}
export function nearestWater(x,y){if(clearWater(x,y))return {x,y};for(let r=35;r<=3500;r+=35)for(let i=0;i<24;i++){const a=i*Math.PI/12,nx=x+Math.cos(a)*r,ny=y+Math.sin(a)*r;if(clearWater(nx,ny))return {x:nx,y:ny};}return {x:180,y:100};}
export const PLACES=[['Dutch Harbor',-166.5215,53.9027],['Unalaska',-166.542,53.8736],['Amaknak Island',-166.551,53.919],['Unalaska Island',-166.9,53.7],['Akutan',-165.773,54.134],['Akutan Island',-165.91,54.12],['Unimak Island',-164.1,54.82],['St. Paul',-170.28,57.125],['St. George',-169.55,56.60],['Bristol Bay',-162.6,58],['Bering Sea',-174,59],['Alaska',-161,62],['Chukotka',173,64],['Kamchatka',160.8,57.5]].map(([name,lon,lat])=>({name,lon,lat,...geoToWorld(lon,lat)}));
export const FISHING_GROUNDS=CRAB_GROUND_DATA.map(({lon,lat,...ground})=>({...ground,...geoToWorld(lon,lat)}));
export function migrateWorld(s){if(s.worldVersion===WORLD_VERSION)return s;let moved=0;const relocate=p=>{if(isLand(p.x,p.y)){Object.assign(p,nearestWater(p.x,p.y));moved++;}};for(const p of s.pots)p.legacyAbundance??=Math.max(.12,...[[850,-650],[1450,580],[-650,-1100]].map(([x,y])=>Math.exp(-((p.x-x)**2+(p.y-y)**2)/550000)));for(const n of s.nets||[])n.legacyAbundance??=Math.max(.15,...[[850,-650],[1450,580],[-650,-1100]].map(([x,y])=>Math.exp(-((n.x-x)**2+(n.y-y)**2)/900000)));const invalidStart=isLand(s.x,s.y);relocate(s);if(invalidStart&&s.deckJob?.kind==='unload')s.deckJob=null;for(const p of [...s.pots,...(s.nets||[])])relocate(p);for(const b of s.career?.fleet||[]){relocate(b);for(const p of b.pots||[])relocate(p);b.navigation=null;}if(s.deckJob){const target=s.deckJob.kind==='haul'?s.pots.find(p=>p.id===s.deckJob.potId):s.deckJob.kind==='netHaul'?s.nets.find(p=>p.id===s.deckJob.netId):null;if(target){s.deckJob.x=target.x;s.deckJob.y=target.y;}if(s.deckJob.released)relocate(s.deckJob.released);}s.worldVersion=WORLD_VERSION;if(moved)s.message='Geographic chart updated. Fishing gear preserved; positions on land moved to nearby water.';return s;}
