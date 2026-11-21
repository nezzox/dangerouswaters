import {crewStations} from './crew-stations.mjs?v=0.18.9';
import {hullWidthAt} from './fenders.mjs?v=0.18.9';
import {deckSign} from './vessel-profile.mjs?v=0.18.9';
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
 const sides=design.hauler==='both'?[-1,1]:[design.hauler==='port'?-1:1];for(const side of sides){if(design.hauler==='stern'){solid.push({min:[-8.32,1.7,1.38],max:[-7.88,5.35,1.82]},{min:[-10.5,1.6,-.5],max:[-9.5,3.2,.5]});work.push({min:[-8.7,1.7,1.05],max:[-7.35,5.7,2.35]});}else{solid.push({min:[-1.73,1.7,side*2.1-.23],max:[-1.27,5.35,side*2.1+.23]},{min:[-3.45,1.6,side*2.7-.45],max:[-2.55,3.15,side*2.7+.45]});work.push({min:[-4.25,1.7,side>0?1.65:-3.3],max:[-2.35,5.7,side>0?3.3:-1.65]});}}
 if(design.salmon)solid.push({min:[-8.95,1.7,-2.05],max:[-6.5,3.65,.18]});
 if(style.gantry){const {x,z,height:h}=gantryPlacement(design);for(const side of [-1,1])solid.push({min:[x-.2,1.7,side*z-.2],max:[x+1.6,h+.2,side*z+.2]});solid.push({min:[x-.24,h-.24,-z-.2],max:[x+.24,h+.24,z+.2]},{min:[x-.4,h-.35,-.6],max:[x+.4,h+.35,.6]});}
 return {solid,work};}
export const rackCount=count=>Math.max(0,Math.min(200,Math.floor(Number.isFinite(count)?count:0)));
const rackCache=new Map(),columnCache=new Map();
function rackColumns(design){const key=layoutKey(design);if(columnCache.has(key))return columnCache.get(key);const scale=rackScale(design),[sx,sy,sz]=scale,hardware=deckHardware(design),obstacles=[...hardware.solid,...hardware.work,{min:[-3,1.6,-1.6],max:[-.8,99,.6]},{min:[9.3,1.6,-.9],max:[11.8,3,.9]}],columns=[],stations=crewStations(design).slice(0,2);
 const fits=p=>{const box=potBounds(p),width=Math.min(hullWidthAt(box.min[0]*deckSign(design),design),hullWidthAt(box.max[0]*deckSign(design),design));return !stations.some(({target:[x,z]})=>x>box.min[0]-.32&&x<box.max[0]+.32&&z>box.min[2]-.32&&z<box.max[2]+.32)&&Math.max(Math.abs(box.min[2]),Math.abs(box.max[2]))<width-.12&&!obstacles.some(b=>boxesOverlap(box,b));};
 const add=(x,z,raised=false)=>{const p={x,z,y:1.78+(.62+(raised?2.15:0))*sy,scale,raised};const footprint={...p,y:1.78+.62*sy};if(!fits(p)||!fits(footprint)||columns.some(c=>boxesOverlap(potBounds(c),potBounds(p))))return;columns.push(p);};
 // Close-spaced rows leave shoulder-width lanes; the central row uses supported walk-under racks.
 for(let x=-10;x<=-.8;x+=2.4*sx)for(const z of [-2.4,0,2.4])add(x,z,Math.abs(z)<.5);
 // Short forecastle racks leave the windlass and central mooring passage unobstructed.
 for(let x=(design.powertrain==='electric'?7.45:6.9)+.89*sx;x<=9.1;x+=1.9*sx)for(const z of [-1.25,1.25])if((design.id&&design.id!=='nordvind')||z<0)add(x,z);
 const data={columns,scale,fits};columnCache.set(key,data);return data;}
function rackTemplate(data){if(data.template)return data.template;const {columns,scale,fits}=data,levels=columns.map(()=>0),blocked=new Set(),result=[];while(result.length<200){let chosen=-1,pick=null;for(let i=0;i<columns.length;i++){if(blocked.has(i))continue;const c=columns[i],p={...c,y:c.y+levels[i]*1.25*scale[1]};if(!fits(p)){blocked.add(i);continue;}if(!pick||p.y<pick.y-.001){chosen=i;pick=p;}}if(!pick)throw Error('Insufficient pot rack space');result.push(pick);levels[chosen]++;}data.template=result;return result;}
export function rackPositions(count,design={}){count=rackCount(count);const key=layoutKey(design)+'/'+count;if(rackCache.has(key))return rackCache.get(key);const result=rackTemplate(rackColumns(design)).slice(0,count);
 result.top=result.reduce((top,p)=>Math.max(top,p.y),0);result.footprints=result.filter((p,i)=>result.findIndex(q=>Math.abs(q.x-p.x)<.01&&Math.abs(q.z-p.z)<.01)===i);result.footprintKey=result.footprints.map(p=>[p.x,p.z,...(p.scale||[1,1,1])].join(',')).join(';');
 if(rackCache.size>=256)rackCache.delete(rackCache.keys().next().value);rackCache.set(key,result);return result;}

export const rackFootprints=(count,design={})=>rackPositions(count,design).footprints;
export const rackFootprintKey=(count,design={})=>rackPositions(count,design).footprintKey;

export const rackFrames=design=>rackColumns(design).columns.filter(p=>p.raised);
