import {crabGroundAt} from './fishing-grounds.mjs?v=0.18.32';
import {CRAB_SPECIES} from './crab-species.mjs?v=0.18.32';
import {geoToWorld} from './world.mjs?v=0.18.32';
const harbor=geoToWorld(-166.524,53.9034);
// Gameplay reward for longer voyages: base rate inside 20 km, up to 5x at 1,620 km.
export function crabPriceAt(point){const distance=Math.hypot(point.x-harbor.x,point.y-harbor.y),progress=Math.max(0,Math.min(1,(distance-20000)/1600000));const ground=crabGroundAt(point,point.setAt??0),species=Object.hasOwn(CRAB_SPECIES,point.crabSpecies)?point.crabSpecies:ground?.species,base=species?CRAB_SPECIES[species].usdKg*10:65;return base*(1+4*progress**.75);}
export function crabHoldValue(holder){const base=Math.max(0,holder.cargo||0)*65;return Number.isFinite(holder.crabValue)?Math.max(0,Math.min(Math.max(0,holder.cargo||0)*850,holder.crabValue)):base;}
export function addCrabCatch(holder,kg,point){const value=crabHoldValue(holder);holder.cargo+=kg;holder.crabValue=value+kg*crabPriceAt(point);}
export function landCrab(holder,kg){const amount=Math.min(Math.max(0,kg),holder.cargo),value=holder.cargo?crabHoldValue(holder)*amount/holder.cargo:0;holder.crabValue=Math.max(0,crabHoldValue(holder)-value);holder.cargo-=amount;return value;}

export function captureCrabSpecies(point,hour=point.setAt??0){return Object.hasOwn(CRAB_SPECIES,point.crabSpecies)?point.crabSpecies:crabGroundAt(point,hour)?.species||null;}
