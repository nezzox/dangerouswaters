import {crabAbundance} from './fishing-grounds.mjs?v=0.18.84';
import {isLand} from './world.mjs?v=0.18.84';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Best habitat fills at 3.6 kg per effective hour; poor habitat is much slower.
export const POT_CAPACITY=90;
const NORMAL_RATE=3.6;
export function effectiveSoakHours(hours){const t=clamp(hours,0,36);return Math.min(t,6)+clamp(t-6,0,18)*.75+clamp(t-24,0,12)*.5;}
export function potCatchAt(p,hour,yieldMultiplier=1){if(!Number.isFinite(hour)||!Number.isFinite(p.setAt)||isLand(p.x,p.y))return 0;const age=clamp(hour-p.setAt,0,36),groundStart=Number.isFinite(p.groundSetAt)?p.groundSetAt:p.setAt;let kg=0;
 // Fixed hourly midpoint samples ensure a longer soak only adds catch, even as habitat migrates.
 for(let i=0;i<Math.ceil(age);i++){const hours=Math.min(1,age-i),rate=i<6?1:i<24?.75:.5,abundance=p.legacyAbundance??crabAbundance(p.x,p.y,groundStart+i+.5);kg+=clamp(abundance,0,1)**2*NORMAL_RATE*rate*hours;}
 const baitRank=Number.isFinite(p.baitRank)?clamp(p.baitRank,0,5):0;
 return Math.min(POT_CAPACITY,Math.round(kg*yieldMultiplier*(1+baitRank*.05)));
}
export const potSoakStage=hours=>hours<6?'FILLING 100%':hours<24?'FILLING 75%':hours<36?'FILLING 50%':'SOAK COMPLETE';
