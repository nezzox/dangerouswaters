import {crabGroundAt} from './fishing-grounds.mjs?v=0.18.74';
import {CRAB_SPECIES} from './crab-species.mjs?v=0.18.74';
import {geoToWorld} from './world.mjs?v=0.18.74';
const harbor=geoToWorld(-166.524,53.9034);
// Gameplay reward for longer voyages: base rate inside 20 km, up to 5x at 1,620 km.
const marketHours=10*24;
const marketSpecies=Object.keys(CRAB_SPECIES);
function marketCycle(hour){return Math.max(0,Math.floor((Number.isFinite(hour)?hour:0)/marketHours));}
export function crabMarketRate(species,hour){
 const rank=marketSpecies.indexOf(species);
 if(rank<0)return 65;
 const pricedAs=marketSpecies[(rank+marketCycle(hour))%marketSpecies.length];
 return CRAB_SPECIES[pricedAs].usdKg*10;
}
export function crabGroundPriceFactor(id,hour){
 const cycle=marketCycle(hour);
 if(!id||cycle===0)return 1;
 let hash=2166136261;
 for(const char of String(id))hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
 const offset=hash%101,step=1+(Math.floor(hash/101)%100);
 return .55+1.10*((offset+step*(cycle%101))%101)/100;
}
export function crabPriceAt(point,hour=point.hour??point.setAt??0){
 const distance=Math.hypot(point.x-harbor.x,point.y-harbor.y);
 const progress=Math.max(0,Math.min(1,(distance-20000)/1600000));
 const ground=crabGroundAt(point,point.setAt??hour);
 const species=Object.hasOwn(CRAB_SPECIES,point.crabSpecies)?point.crabSpecies:ground?.species;
 return crabMarketRate(species,hour)*(1+4*progress**.75)*crabGroundPriceFactor(point.groundId??ground?.id,hour);
}
export function crabHoldValue(holder){const base=Math.max(0,holder.cargo||0)*65;return Number.isFinite(holder.crabValue)?Math.max(0,Math.min(Math.max(0,holder.cargo||0)*1400,holder.crabValue)):base;}
export function addCrabCatch(holder,kg,point,hour){const value=crabHoldValue(holder);holder.cargo+=kg;holder.crabValue=value+kg*crabPriceAt(point,hour);}
export function landCrab(holder,kg){const amount=Math.min(Math.max(0,kg),holder.cargo),value=holder.cargo?crabHoldValue(holder)*amount/holder.cargo:0;holder.crabValue=Math.max(0,crabHoldValue(holder)-value);holder.cargo-=amount;return value;}

export function captureCrabSpecies(point,hour=point.setAt??0){return Object.hasOwn(CRAB_SPECIES,point.crabSpecies)?point.crabSpecies:crabGroundAt(point,hour)?.species||null;}
