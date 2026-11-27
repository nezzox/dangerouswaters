import {crabGroundAt,salmonAbundance} from './fishing-grounds.mjs?v=0.18.92';

// In-game prices in SEK per kg, balanced around the previous 42 kr/kg base.
const species=[
 {en:'Sockeye',sv:'Rödlax',price:48},
 {en:'Pink salmon',sv:'Puckellax',price:24},
 {en:'Chum salmon',sv:'Hundlax',price:35},
 {en:'Coho',sv:'Silverlax',price:56},
 {en:'Chinook',sv:'Kungslax',price:74},
];
export function salmonMarket(ground){
 return species[Math.abs(ground?.id||0)%species.length];
}
export function salmonHoldRate(holder){
 return Number.isFinite(holder.salmonRate)?Math.max(24,Math.min(74,holder.salmonRate)):42;
}
export function addSalmonCatch(holder,kg,point,hour){
 const existing=holder.salmon||0,ground=crabGroundAt(point,point.setAt??hour);
 const price=ground?salmonMarket(ground).price:42;
 if(kg<=0)return;
 holder.salmonRate=(existing*salmonHoldRate(holder)+kg*price)/(existing+kg);
 holder.salmon=existing+kg;
}

export function salmonCatch(net,hour,stats){const soak=Math.max(0,hour-net.setAt),ground=net.legacyAbundance??salmonAbundance(net.x,net.y,hour);return Math.round((80+ground*190)*(1-Math.exp(-soak/1.2))*Math.exp(-Math.max(0,soak-5)*.15)*stats.salmonYield);}
