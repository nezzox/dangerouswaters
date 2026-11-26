import {getUnstuck,notify,towDestination} from './simulation.mjs?v=0.18.86';
import {QUAY} from './harbor.mjs?v=0.18.86';

function goToHarbor(s){
 if(s.overboard)return false;
 const arrival={...s,...towDestination(),heading:Math.atan2(QUAY.ty,QUAY.tx),tow:null,deckJob:null,log:[]};
 if(getUnstuck(arrival)!==true)return false;
 if(s.deckJob?.kind==='deploy'){s.deck++;s.money+=s.deckJob.baitCost??150;}
 Object.assign(s,{x:arrival.x,y:arrival.y,heading:arrival.heading,tow:null,deckJob:null,
  moored:null,autopilot:null,skipperMission:null,activity:null,intelligentSetRunout:0,
  speed:0,desiredKnots:0,throttle:0,rudder:0});
 notify(s,'Arrived outside Dutch Harbor.');
 return true;
}

// Save currency uses ten SEK per USD.
export function redeemDeveloperCode(s,code){
 if(code==='Go to harbor')return goToHarbor(s);
 if(s.tow)return false;
 if(code==='Nezzox is king'){s.money+=500000;return true;}
 if(code==='Give me a chance'&&!s.chanceCodeUsed){s.money+=750000;s.chanceCodeUsed=true;return true;}
 const match=typeof code==='string'&&/^Ge mig +([0-9]+)$/.exec(code.trim());
 if(!match)return false;
 const amount=Number(match[1])*10;
 if(amount<=0||!Number.isSafeInteger(amount)||Math.abs(s.money+amount)>Number.MAX_SAFE_INTEGER)return false;
 s.money+=amount;
 return true;
}
