import {crewStations} from './crew-stations.mjs?v=0.18.1';
import {hullWidthAt} from './fenders.mjs?v=0.18.1';
import {deckSign} from './vessel-profile.mjs?v=0.18.1';
export function vesselStyle(design={}){const family=Number(/^boat-(\d+)-/.exec(design.id||'')?.[1]||0);return {family,netLane:!!design.salmon,gantry:[2,3,4,6,9,10].includes(family),exhausts:[2,7,9,10].includes(family)?2:1,upperBridge:[6,9,10].includes(family),bowShield:family===7,radarArch:[1,3,5,8].includes(family)};}
export function potRackPosition(i,design={}){return design.salmon?{x:-10+Math.floor(i/4)*2,z:1.7,y:2.4+(i%4)*1.25}:{x:-10+Math.floor(i/6)*2,z:-2.05+(i%2)*2.05,y:2.4+Math.floor((i%6)/2)*1.25};}

export const boxesOverlap=(a,b)=>a.min.every((v,i)=>v<b.max[i]&&a.max[i]>b.min[i]);
export const rackScale=design=>!design?.id||design.id==='nordvind'?[1,1,1]:[24/design.length,1/(1+(design.length-24)*.012),7.6/design.beam];
export const potBounds=p=>{const [x,y,z]=p.scale||[1,1,1];return {min:[p.x-.89*x,p.y-.62*y,p.z-.87*z],max:[p.x+.89*x,p.y+.62*y,p.z+.87*z]};};
export function gantryPlacement(design={}){const style=vesselStyle(design);return style.gantry?{x:style.family===2?-7:-9.8,z:3.25,height:design.salmon?7.6:6.8}:null;}
const hardwareCache=new Map();
const layoutKey=d=>(d.id||'starter')+'/'+(d.hauler||'starboard')+'/'+!!d.salmon+'/'+(d.length||24)+'/'+(d.beam||7.6)+'/'+deckSign(d);
export function deckHardware(design={}){const key=layoutKey(design);if(!hardwareCache.has(key))hardwareCache.set(key,buildDeckHardware(design));return hardwareCache.get(key);}
function buildDeckHardware(design={}){const style=vesselStyle(design),solid=[],work=[];if(!style.family)return {solid,work};
 const sides=design.hauler==='both'?[-1,1]:[design.hauler==='port'?-1:1];for(const side of sides){if(design.hauler==='stern'){solid.push({min:[-8.32,1.7,1.38],max:[-7.88,5.35,1.82]},{min:[-12.35,1.6,-.65],max:[-9.35,3.2,.65]});work.push({min:[-12.4,1.7,-.85],max:[-7,7.4,2.4]});}else{solid.push({min:[-1.73,1.7,side*2.1-.23],max:[-1.27,5.35,side*2.1+.23]},{min:[-3.45,1.6,side*2.7-.45],max:[-2.55,3.15,side*2.7+.45]});work.push({min:[-4.9,1.7,side>0?-.4:-5],max:[-.7,7.4,side>0?5:.4]});}}
 if(design.salmon)solid.push({min:[-8.95,1.7,-2.05],max:[-6.5,3.65,.18]});
 if(style.gantry){const {x,z,height:h}=gantryPlacement(design);for(const side of [-1,1])solid.push({min:[x-.2,1.7,side*z-.2],max:[x+1.6,h+.2,side*z+.2]});solid.push({min:[x-.24,h-.24,-z-.2],max:[x+.24,h+.24,z+.2]},{min:[x-.4,h-.35,-.6],max:[x+.4,h+.35,.6]});}
 return {solid,work};}
export const rackCount=count=>Math.max(0,Math.min(200,Math.floor(Number.isFinite(count)?count:0)));
const rackCache=new Map(),columnCache=new Map();
function rackColumns(design){const key=layoutKey(design);if(columnCache.has(key))return columnCache.get(key);const scale=rackScale(design),[sx,sy,sz]=scale,hardware=deckHardware(design),obstacles=[...hardware.solid,...hardware.work,{min:[-3,1.6,-1.6],max:[-.8,4,1.3]},{min:[9.3,1.6,-.9],max:[11.8,3,.9]}],columns=[],stations=crewStations(design);
 const fits=p=>{const box=potBounds(p),width=Math.min(hullWidthAt(box.min[0]*deckSign(design),design),hullWidthAt(box.max[0]*deckSign(design),design));return !stations.some(({target:[x,z]})=>x>box.min[0]-.5&&x<box.max[0]+.5&&z>box.min[2]-.5&&z<box.max[2]+.5)&&Math.max(Math.abs(box.min[2]),Math.abs(box.max[2]))<width-.12&&!obstacles.some(b=>boxesOverlap(box,b));};
 const add=(x,z)=>{const p={x,z,y:1.78+.62*sy,scale};if(!fits(p)||columns.some(c=>boxesOverlap(potBounds(c),potBounds(p))))return;columns.push(p);};
 if(!design.id||design.id==='nordvind')for(let i=0;i<20;i++){const p=potRackPosition(i,design);if(!columns.some(c=>c.x===p.x&&c.z===p.z))columns.push({...p,scale});}
 // A continuous starboard access aisle remains clear; net boats also use outboard racks.
 for(let x=-10;x<=-3.55;x+=1.9*sx)for(const z of [-2.3,-2.3+1.9*sz,2.4]){const box=potBounds({x,z,y:2.4,scale});if(box.max[2]>.25&&box.min[2]<1.55)continue;add(x,z);}
 // Short forecastle racks leave the windlass and central mooring passage unobstructed.
 for(let x=(design.powertrain==='electric'?7.45:6.9)+.89*sx;x<=9.1;x+=1.9*sx)for(const z of [-1.25,1.25])if((design.id&&design.id!=='nordvind')||z<0)add(x,z);
 const data={columns,scale,fits};columnCache.set(key,data);return data;}
export function rackPositions(count,design={}){count=rackCount(count);const key=layoutKey(design)+'/'+count;if(rackCache.has(key))return rackCache.get(key);const {columns,scale,fits}=rackColumns(design),result=[],blocked=new Set();
 // Preserve Nordvind's original eight-pot appearance, then fill supported stacks.
 if(!design.id||design.id==='nordvind')for(let i=0;i<Math.min(count,20);i++)result.push(potRackPosition(i,design));
 for(let tier=0;result.length<count&&tier<200;tier++)for(let i=0;i<columns.length&&result.length<count;i++){if(blocked.has(i))continue;const c=columns[i],p={...c,y:c.y+tier*1.25*scale[1]};if(result.some(q=>Math.abs(q.x-p.x)<.01&&Math.abs(q.z-p.z)<.01&&Math.abs(q.y-p.y)<.01))continue;if(!fits(p)){blocked.add(i);continue;}if(!result.some(q=>boxesOverlap(potBounds(q),potBounds(p))))result.push(p);}
 result.top=result.reduce((top,p)=>Math.max(top,p.y),0);result.footprints=result.filter((p,i)=>result.findIndex(q=>Math.abs(q.x-p.x)<.01&&Math.abs(q.z-p.z)<.01)===i);result.footprintKey=result.footprints.map(p=>[p.x,p.z,...(p.scale||[1,1,1])].join(',')).join(';');
 if(result.length!==count)throw Error('Insufficient pot rack space for '+(design.id||'starter'));
 if(rackCache.size>=256)rackCache.delete(rackCache.keys().next().value);rackCache.set(key,result);return result;}

export const rackFootprints=(count,design={})=>rackPositions(count,design).footprints;
export const rackFootprintKey=(count,design={})=>rackPositions(count,design).footprintKey;
