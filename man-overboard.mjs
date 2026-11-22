export const OVERBOARD_NOTICE="The Dangerous Waters has claimed one of your crew. You're obligated to pay for the funeral and a severance to his family.";
export const OVERBOARD_COST=150000;

export function rollOverboard(state,side,random=Math.random){
 if(state.overboard||random()>=1/2500)return false;
 state.overboard={phase:'fall',elapsed:0,side:side<0?-1:1};
 state.speed=state.throttle=state.desiredKnots=state.rudder=0;
 state.autopilot=state.skipperMission=null;
 return true;
}

export function settleOverboard(state){
 if(state.overboard?.phase!=='film')return;
 const borrowed=Math.max(0,OVERBOARD_COST-state.money);
 state.money+=borrowed-OVERBOARD_COST;
 state.career.borrowed+=borrowed;
 state.career.debt+=Math.round(borrowed*1.1);
 state.overboard.phase='notice';
}

export function dispatchReplacement(state,port){
 if(state.overboard?.phase!=='notice')return;
 const distance=Math.hypot(port.x-state.x,port.y-state.y);
 Object.assign(state.overboard,{phase:'flight',elapsed:0,flightSeconds:Math.max(24,Math.min(90,distance/3500)),x:port.x,y:port.y});
}

export function stepOverboard(state,dt){
 const event=state.overboard;
 if(!event)return false;
 state.speed=state.throttle=state.desiredKnots=state.rudder=0;
 if(event.phase==='fall'||event.phase==='flight')event.elapsed+=dt;
 if(event.phase==='fall'&&event.elapsed>=5)event.phase='film';
 if(event.phase==='flight'&&event.elapsed>=event.flightSeconds+12)state.overboard=null;
 return true;
}
