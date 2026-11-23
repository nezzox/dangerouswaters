import {travelBoost} from './speed-curve.mjs?v=0.18.57';
import {electricBurn} from './energy.mjs?v=0.18.57';
import {FUEL_SCALE} from './balance.mjs?v=0.18.57';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const fuelBurnRate=(throttle,fuelUse=1)=>(.012+clamp(Math.abs(throttle),0,1)*.09)*fuelUse*FUEL_SCALE;
// Steady-speed estimate at the selected target, not a change to the fuel model.
export function fuelEconomy(s,stats,w){const command=s.deckJob?clamp(s.desiredKnots||0,-4.9,4.9):s.desiredKnots||0,top=stats.top/(1+w.waves*.06),requested=command/1.94384,load=Math.abs(clamp(requested/top,-.35,1)),speed=Math.abs(clamp(requested,-top*.35,top)),enabled=s.fuel>0&&s.hull>0&&s.incident?.system!=='engine'&&!['unload','undock'].includes(s.deckJob?.kind)&&!(s.moored&&Math.abs(command)<.01),rate=enabled?(stats.powertrain==='electric'?electricBurn(load,stats,1):fuelBurnRate(load,stats.fuelUse)):0;return {load:enabled?load:0,rate,burn:enabled?(.012+load*.09)/.102:0,litersPerNm:rate>0&&speed>.01?rate*1852/speed:null};}

// Direct distance at steady ahead speed, including the game's voyage speed multiplier.
export function fuelToGround(s,ground,stats,weather){
 const knots=s.desiredKnots>0?s.desiredKnots:6;
 const top=stats.top/(1+weather.waves*.06),speed=Math.min(knots/1.94384,top);
 if(speed<=0)return null;
 const load=speed/top;
 const rate=stats.powertrain==='electric'?electricBurn(load,stats,1):fuelBurnRate(load,stats.fuelUse);
 return rate*Math.hypot(ground.x-s.x,ground.y-s.y)/(speed*travelBoost(speed));
}
