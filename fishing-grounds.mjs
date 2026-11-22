import {FISHING_GROUNDS,clearWater,isLand,inWorld,nearestWater} from './world.mjs?v=0.18.46';
// Gameplay approximation: deterministic slow migration, at most 37.5 m/game hour.
// Tracks reverse along proven water-only segments instead of jumping across islands.
const HOURS=36,STEP=900;
function waterSegment(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/150));for(let i=0;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;if(!inWorld(x,y)||!clearWater(x,y,150))return false;}return true;}
const tracks=FISHING_GROUNDS.map((base,index)=>{const start=nearestWater(base.x,base.y),points=[start];for(let j=0;j<5;j++){const a=points.at(-1);let next=a;for(let attempt=0;attempt<16;attempt++){const angle=index*1.7+j*.31+attempt*Math.PI/8,candidate={x:a.x+Math.cos(angle)*STEP,y:a.y+Math.sin(angle)*STEP};if(waterSegment(a,candidate)){next=candidate;break;}}points.push(next);}return{...base,id:index,points:[...points,...points.slice(1,-1).reverse(),start]};});
// Pick a different offset for each ground once, validating the whole migration loop.
// This avoids coast snapping and keeps searches/catches deterministic across reloads.
const coreOffsets=tracks.map(track=>{
 for(let attempt=0;attempt<128;attempt++){
  const angle=(track.id+1)*2.399963229728653+attempt*2.399963229728653;
  const radius=.18+.34*(((Math.sin((track.id+1)*12.9898+attempt*7.233)*43758.5453)%1+1)%1);
  const u=Math.cos(angle)*4000*(track.size||1)*radius,v=Math.sin(angle)*2600*(track.size||1)*radius,c=Math.cos(-.4),s=Math.sin(-.4),offset={x:u*c-v*s,y:u*s+v*c};
  if(track.points.slice(1).every((p,i)=>waterSegment({x:track.points[i].x+offset.x,y:track.points[i].y+offset.y},{x:p.x+offset.x,y:p.y+offset.y})))return offset;
 }
 throw Error('No water-only crab core offset for '+track.name);
});
function crabCore(g){const offset=coreOffsets[g.id]||coreOffsets[0];return {x:g.x+offset.x,y:g.y+offset.y,rx:g.rx*.3,ry:g.ry*.3,angle:g.angle};}
export function groundsAt(hour=0){return tracks.map(track=>{const time=Math.max(0,Number.isFinite(hour)?hour:0)/HOURS,index=Math.floor(time)%(track.points.length-1),t=time-Math.floor(time),u=t*t*(3-2*t),a=track.points[index],b=track.points[index+1];return{id:track.id,name:track.name,region:track.region,species:track.species,size:track.size,x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,rx:4000*(track.size||1),ry:2600*(track.size||1),angle:-.4};});}
export function crabAbundance(x,y,hour=0){if(!inWorld(x,y)||isLand(x,y))return 0;return Math.max(.12,...groundsAt(hour).map(g=>{const offset=coreOffsets[g.id],dx=x-g.x-offset.x,dy=y-g.y-offset.y,c=Math.cos(g.angle),s=Math.sin(g.angle),u=(c*dx+s*dy)/(g.rx*.55),v=(-s*dx+c*dy)/(g.ry*.55);return groundPotential(g,'crab',hour)*Math.exp(-2*(u*u+v*v));}));}
export function soakedAbundance(p,hour){if(p.legacyAbundance!==undefined)return p.legacyAbundance;const elapsed=Math.max(0,hour-p.setAt);return [1/6,.5,5/6].reduce((sum,t)=>sum+crabAbundance(p.x,p.y,p.setAt+elapsed*t),0)/3;}

// Fictional seasonal productivity, shared by actual yield and uncertain player forecasts.
export function groundPotential(g,species,hour=0){if(g.name==='Reymonds spot'&&species==='crab')return .94+.04*Math.sin(hour/72+g.id);if(g.id===0&&species==='crab')return 1;return Math.max(.3,Math.min(1,.64+.22*Math.sin(g.id*2.17+(species==='salmon'?2.8:0))+.13*Math.sin(hour/72+g.id)));}
export function groundReport(g,species,rank,hour=0){if(!(rank>0))return null;rank=Math.min(5,Math.floor(rank));const value=groundPotential(g,species,hour)*100,margin=30-rank*5,error=Math.sin(g.id*3.4+hour/120+(species==='salmon'?1:0))*margin*.4,mid=Math.round((value+error)/5)*5;return {low:Math.max(0,mid-margin),high:Math.min(100,mid+margin)};}
export function salmonAbundance(x,y,hour=0){if(!inWorld(x,y)||isLand(x,y))return 0;return Math.max(.15,...groundsAt(hour).map(g=>groundPotential(g,'salmon',hour)*Math.exp(-((x-g.x)**2+(y-g.y)**2)/(g.rx*g.ry*.3))));}

// Rank V reveals the dense core of the same abundance field used by pots and sonar.
export function crabHotspot(g,rank,hour=0){return rank>=5?{...crabCore(g),potential:groundPotential(g,'crab',hour)}:null;}

// Direction along the current water-only segment, including its next leg at a turn.
export function groundMotion(g,rank,hour=0){if(!(rank>=4))return null;const track=tracks[g.id];if(!track)return null;const time=Math.max(0,Number.isFinite(hour)?hour:0)/HOURS,index=Math.floor(time)%(track.points.length-1),a=track.points[index],b=track.points[index+1],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);return length>.001?{x:dx/length,y:dy/length}:null;}

export function crabGroundAt(point,hour=0){let best=null,score=Infinity;for(const g of groundsAt(hour)){const dx=point.x-g.x,dy=point.y-g.y,c=Math.cos(g.angle),s=Math.sin(g.angle),q=((c*dx+s*dy)/g.rx)**2+((-s*dx+c*dy)/g.ry)**2;if(q<=1&&q<score){best=g;score=q;}}return best;}
