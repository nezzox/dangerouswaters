import {travelBoost} from './speed-curve.mjs?v=0.18.49';

export const TOW_SPEED=13/1.94384;

export function moveTow(state,dt){
 const tow=state.tow;
 state.throttle=state.rudder=state.desiredKnots=0;
 state.speed=0;
 if(tow.phase==='hook'){
  tow.elapsed=Math.min(4,tow.elapsed+dt);
  if(tow.elapsed>=4)tow.phase='travel';
  return false;
 }
 if(tow.phase!=='travel')return false;
 state.speed=TOW_SPEED;
 let remaining=TOW_SPEED*travelBoost(TOW_SPEED)*dt;
 while(tow.index<tow.route.length){
  const target=tow.route[tow.index],dx=target.x-state.x,dy=target.y-state.y,distance=Math.hypot(dx,dy);
  if(distance>.01)state.heading=Math.atan2(dy,dx);
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
