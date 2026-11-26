export const OVERBOARD_NOTICE="The Dangerous Waters has claimed one of your crew. You're obligated to pay for the funeral and a severance to his family.";
export const OVERBOARD_COST=150000;

export function rollOverboard(state,side,random=Math.random,{wind=0,waves=0}={}){
 // Game balance: keep the calm baseline and cap each weather contribution.
 const exposure=(value,calm,rough)=>Math.max(0,Math.min(1,(value-calm)/(rough-calm)));
 const risk=(1+2*exposure(wind,10,42)+2*exposure(waves,.5,5.5))/2500;
 if(state.overboard||random()>=risk)return false;
 state.crewLosses=(state.crewLosses||0)+1;
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


// Compress the open-sea leg while leaving time for a readable approach on camera.
export function replacementProgress(event,target){
 const distance=Math.hypot(target.x-event.x,target.y-event.y);
 const close=Math.min(1,150/Math.max(1,distance));
 const approachStart=Math.max(1,event.flightSeconds-9);
 if(event.elapsed<approachStart)return (1-close)*event.elapsed/approachStart;
 const approach=Math.min(1,(event.elapsed-approachStart)/(event.flightSeconds-approachStart));
 return 1-close*(1-approach)**2;
}
