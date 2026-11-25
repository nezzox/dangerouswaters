import {seaLane} from './navigation.mjs?v=0.18.79';
import {travelBoost} from './speed-curve.mjs?v=0.18.79';

export const TOW_SPEED=13/1.94384;

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const angleDelta=(to,from)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));

export function roundTowRoute(start,route){
 const points=[start,...route],result=[];
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1];
  const inLength=Math.hypot(b.x-a.x,b.y-a.y),outLength=Math.hypot(c.x-b.x,c.y-b.y);
  const trim=Math.min(90,inLength*.34,outLength*.34);
  if(trim<5){result.push(b);continue;}
  const enter={x:b.x+(a.x-b.x)*trim/inLength,y:b.y+(a.y-b.y)*trim/inLength};
  const exit={x:b.x+(c.x-b.x)*trim/outLength,y:b.y+(c.y-b.y)*trim/outLength};
  const arc=[enter];
  const steps=Math.max(5,Math.ceil(trim/6));
  for(let j=1;j<=steps;j++){
   const t=j/steps,k=1-t;
   arc.push({x:k*k*enter.x+2*k*t*b.x+t*t*exit.x,y:k*k*enter.y+2*k*t*b.y+t*t*exit.y});
  }
  if(arc.every((point,j)=>!j||seaLane(arc[j-1],point,32)))result.push(...arc);
  else result.push(b);
 }
 return [...result,route.at(-1)];
}

export function moveTow(state,dt){
 const tow=state.tow;
 state.throttle=state.rudder=state.desiredKnots=0;
 const target=tow.route?.[tow.index];
 if(target&&Math.hypot(target.x-state.x,target.y-state.y)>.01){
  const course=Math.atan2(target.y-state.y,target.x-state.x);
  state.heading+=clamp(angleDelta(course,state.heading),-.12*dt,.12*dt);
 }
 if(tow.phase==='hook'){
  state.speed=0;
  tow.elapsed=Math.min(4,tow.elapsed+dt);
  if(tow.elapsed>=4)tow.phase='travel';
  return false;
 }
 if(tow.phase!=='travel'){state.speed=0;return false;}
 const course=target?Math.atan2(target.y-state.y,target.x-state.x):state.heading;
 const turn=Math.abs(angleDelta(course,state.heading));
 const limit=TOW_SPEED*clamp(1-turn*.72,.12,1);
 state.speed+=(limit-state.speed)*(1-Math.exp(-dt*.7));
 if(turn>.38)return false;
 let remaining=state.speed*travelBoost(state.speed)*dt;
 while(tow.index<tow.route.length){
  const target=tow.route[tow.index],dx=target.x-state.x,dy=target.y-state.y,distance=Math.hypot(dx,dy);
  if(distance>remaining){
   state.x+=dx/distance*remaining;state.y+=dy/distance*remaining;
   return false;
  }
  state.x=target.x;state.y=target.y;
  remaining-=distance;tow.index++;
 }
 state.speed=0;
 return true;
}
