import {depthAt} from './simulation.mjs?v=0.17.4';
import {crabAbundance,salmonAbundance} from './fishing-grounds.mjs?v=0.17.4';
import {isLand} from './world.mjs?v=0.17.4';
// Gameplay interpretation of a sounder, not a physical model of species identification.
export const SONAR_GRADES=[
 {radius:60,samples:12,error:30,interval:2,name:'Basic'},
 {radius:100,samples:20,error:23,interval:1.6,name:'Improved'},
 {radius:160,samples:28,error:16,interval:1.2,name:'Advanced'},
 {radius:240,samples:36,error:10,interval:.8,name:'Survey'},
 {radius:360,samples:48,error:5,interval:.5,name:'Precision'}
];
const clamp=n=>Math.max(0,Math.min(100,n));
export function scanSonar(s){const grade=Math.max(0,Math.min(5,Math.floor(s.career?.parts?.sonar||0)));if(!grade)return null;const spec=SONAR_GRADES[grade-1],tick=Math.floor(s.hour*45/spec.interval),c=Math.cos(s.heading),n=Math.sin(s.heading),bottom=Array.from({length:spec.samples},(_,i)=>{const offset=(i/(spec.samples-1)*2-1)*spec.radius,x=s.x-n*offset,y=s.y+c*offset;return {offset,depth:isLand(x,y)?0:depthAt(x,y)};}),reading=(species,abundance)=>{const truth=abundance(s.x,s.y,s.hour)*100,jitter=Math.sin(tick*.37+s.x*.003+s.y*.002+(species==='salmon'?2:0))*spec.error*.35,mid=Math.round((truth+jitter)/5)*5;return {low:clamp(mid-spec.error),high:clamp(mid+spec.error),strength:clamp(mid)};};return {...spec,grade,tick,depth:depthAt(s.x,s.y),bottom,crab:reading('crab',crabAbundance),salmon:reading('salmon',salmonAbundance)};}
export function drawSonar(canvas,scan){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,maxDepth=Math.max(scan.depth*1.35,...scan.bottom.map(p=>p.depth*1.15)),y=d=>12+d/maxDepth*(h-28),bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#143c4b');bg.addColorStop(1,'#07151f');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle='#68b3ba22';for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(0,h*i/4);ctx.lineTo(w,h*i/4);ctx.stroke();}ctx.beginPath();ctx.moveTo(0,h);scan.bottom.forEach((p,i)=>ctx.lineTo(i/(scan.bottom.length-1)*w,y(p.depth)));ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle='#826436';ctx.fill();ctx.strokeStyle='#d3b275';ctx.stroke();
 const noise=i=>(Math.sin(i*127.1+scan.tick*.4)*43758.5453)%1;
 ctx.fillStyle='#f0bd61';for(let i=0;i<Math.round(scan.crab.strength/7);i++){const index=Math.floor((i+.5)/15*(scan.bottom.length-1)),x=(index/(scan.bottom.length-1))*w;ctx.beginPath();ctx.arc(x,y(scan.bottom[index].depth)-3-Math.abs(noise(i))*4,gradeSize(scan.grade),0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle='#78e2d8';for(let i=0;i<Math.round(scan.salmon.strength/10);i++){const x=20+Math.abs(noise(i+40))*(w-40),height=22+Math.abs(noise(i+70))*Math.max(0,y(scan.depth)-45);ctx.beginPath();ctx.arc(x,height,3+scan.grade*.4,Math.PI,Math.PI*2);ctx.stroke();}
 ctx.font='12px monospace';ctx.fillStyle='#d7e8df';ctx.fillText(`0 m`,6,13);ctx.fillText(`${Math.round(maxDepth)} m`,6,h-7);ctx.strokeStyle='#dbe6dc66';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);ctx.stroke();ctx.setLineDash([]);
}
const gradeSize=grade=>grade<3?3:2;
