import {depthAt} from './simulation.mjs?v=0.18.66';
import {isLand} from './world.mjs?v=0.18.66';
import {SONAR_GRADES,sonarContact} from './sonar-signal.mjs?v=0.18.66';
export {SONAR_GRADES} from './sonar-signal.mjs?v=0.18.66';
export function scanSonar(s){const grade=Math.max(0,Math.min(5,Math.floor(s.career?.parts?.sonar||0)));if(!grade)return null;const spec=SONAR_GRADES[grade-1],tick=Math.floor(s.hour*45/spec.interval),c=Math.cos(s.heading),n=Math.sin(s.heading),bottom=Array.from({length:spec.samples},(_,i)=>{const offset=(i/(spec.samples-1)*2-1)*spec.radius,x=s.x-n*offset,y=s.y+c*offset;return {offset,depth:isLand(x,y)?0:depthAt(x,y)};});return {...spec,grade,tick,depth:depthAt(s.x,s.y),bottom,crab:sonarContact(s,'crab'),salmon:sonarContact(s,'salmon')};}
export function drawSonar(canvas,scan){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,maxDepth=Math.max(scan.depth*1.35,...scan.bottom.map(p=>p.depth*1.15)),y=d=>12+d/maxDepth*(h-28),bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#143c4b');bg.addColorStop(1,'#07151f');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle='#68b3ba22';for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(0,h*i/4);ctx.lineTo(w,h*i/4);ctx.stroke();}ctx.beginPath();ctx.moveTo(0,h);scan.bottom.forEach((p,i)=>ctx.lineTo(i/(scan.bottom.length-1)*w,y(p.depth)));ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle='#826436';ctx.fill();ctx.strokeStyle='#d3b275';ctx.stroke();
 const noise=i=>(Math.sin(i*127.1+scan.tick*.4)*43758.5453)%1;
 ctx.fillStyle='#f0bd61';for(let i=0;i<Math.round(scan.crab.strength/7);i++){const index=Math.floor((i+.5)/15*(scan.bottom.length-1)),x=(index/(scan.bottom.length-1))*w;ctx.beginPath();ctx.arc(x,y(scan.bottom[index].depth)-3-Math.abs(noise(i))*4,gradeSize(scan.grade),0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle='#78e2d8';for(let i=0;i<Math.round(scan.salmon.strength/10);i++){const x=20+Math.abs(noise(i+40))*(w-40),height=22+Math.abs(noise(i+70))*Math.max(0,y(scan.depth)-45);ctx.beginPath();ctx.arc(x,height,3+scan.grade*.4,Math.PI,Math.PI*2);ctx.stroke();}
 ctx.font='12px monospace';ctx.fillStyle='#d7e8df';ctx.fillText(`0 m`,6,13);ctx.fillText(`${Math.round(maxDepth)} m`,6,h-7);ctx.strokeStyle='#dbe6dc66';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);ctx.stroke();ctx.setLineDash([]);
}
const gradeSize=grade=>grade<3?3:2;
