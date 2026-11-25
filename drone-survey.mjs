import {crabAbundance} from './fishing-grounds.mjs?v=0.18.83';
import {clearWater,inWorld} from './world.mjs?v=0.18.83';

export const DRONE_RADIUS=Math.round(10000/(2*Math.PI)),DRONE_DURATION=10;
const GRID=100,SEPARATION=140,MIN_SIGNAL=.16;
const GRID_STEPS=Math.floor(DRONE_RADIUS/GRID),MAX_SAMPLES=(2*GRID_STEPS+1)**2;
const valid=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&inWorld(p.x,p.y);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const safe=p=>valid(p)&&clearWater(p.x,p.y,45);

// Rank samples of the same migrating abundance field that feeds the pot yield.
// A signal is a relative habitat estimate, not a guaranteed catch percentage.
export function scanCrab(origin,hour,pots,allow=()=>true){
 if(!valid(origin)||!Number.isFinite(hour)||!Number.isInteger(pots)||pots<1)return [];
 const samples=[];
 const extent=GRID_STEPS*GRID;
 for(let x=-extent;x<=extent;x+=GRID)for(let y=-extent;y<=extent;y+=GRID){
  const p={x:origin.x+x,y:origin.y+y};
  if(Math.hypot(x,y)>DRONE_RADIUS||!allow(p))continue;
  const score=crabAbundance(p.x,p.y,hour);
  if(score>=MIN_SIGNAL&&safe(p))samples.push({...p,score});
 }
 samples.sort((a,b)=>b.score-a.score||distance(a,origin)-distance(b,origin));
 const points=[];
 for(const p of samples){
  if(p.score<samples[0].score*.72)break;
  if(points.every(other=>distance(p,other)>=SEPARATION))points.push(p);
  if(points.length===pots)break;
 }
 return points;
}
export function readSurvey(raw){
 if(!valid(raw?.origin)||!Number.isFinite(raw.hour)||raw.hour<0||!Array.isArray(raw.points))return null;
 const {x,y}=raw.origin,points=[];
 for(const p of raw.points.slice(0,MAX_SAMPLES)){
  if(safe(p)&&distance(raw.origin,p)<=DRONE_RADIUS&&Number.isFinite(p.score)&&p.score>=MIN_SIGNAL&&p.score<=1&&points.every(q=>distance(p,q)>=SEPARATION))points.push({x:p.x,y:p.y,score:p.score});
 }
 return {origin:{x,y},hour:raw.hour,points};
}

const LIFT=1.25,SCAN_START=2.4,SCAN_END=7.6,DESCEND=8.75,HEIGHT=29;
const smooth=t=>t*t*(3-2*t);
// Follow the drone once it leaves the immediate deck area, so HUD panels don't cover it.
export function droneCameraFollow(span){return smooth(Math.max(0,Math.min(1,(span-8)/88)));}
const between=(a,b,t)=>a+(b-a)*t;
export function dronePose({origin,heading,elapsed:t},dock){
 const angle=heading+Math.PI/5+Math.PI*2*Math.max(0,Math.min(1,(t-SCAN_START)/(SCAN_END-SCAN_START)));
 const edge={x:origin.x+DRONE_RADIUS*Math.cos(angle),y:origin.y+DRONE_RADIUS*Math.sin(angle)};
 if(t<LIFT)return {...dock,height:between(dock.height,HEIGHT,smooth(t/LIFT)),heading,phase:'launch'};
 if(t<SCAN_START){const u=smooth((t-LIFT)/(SCAN_START-LIFT));return {x:between(dock.x,edge.x,u),y:between(dock.y,edge.y,u),height:HEIGHT,heading:angle,phase:'launch'};}
 if(t<SCAN_END)return {...edge,height:HEIGHT,heading:angle+Math.PI/2,phase:'scan'};
 if(t<DESCEND){const u=smooth((t-SCAN_END)/(DESCEND-SCAN_END));return {x:between(edge.x,dock.x,u),y:between(edge.y,dock.y,u),height:HEIGHT,heading:angle+Math.PI,phase:'return'};}
 const u=smooth(Math.min(1,(t-DESCEND)/(DRONE_DURATION-DESCEND)));
 return {...dock,height:between(HEIGHT,dock.height,u),heading,phase:'return'};
}
