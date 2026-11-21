import {directionalSpectrum,SWELL} from './sea-spectrum.mjs?v=0.18.12';
const BASE_DIRECTION=(Math.atan2(SWELL[0].kz,SWELL[0].kx)*180/Math.PI-90+360)%360;
const BASE_PERIOD=2*Math.PI/SWELL[0].omega;
const wrap=n=>Math.atan2(Math.sin(n),Math.cos(n));
// Real seconds, independent of time compression. Keep local wave phase continuous
// when direction/period change, rather than rotating the accumulated animation time.
export function transitionWeather(previous,target,dt,time,x,z){
 const out={...previous},a=1-Math.exp(-Math.max(0,dt)/10),directionAlpha=1-Math.exp(-Math.max(0,dt)/30);
 for(const k of ['wind','waves','fog','rain','front','snow']){const value=Number.isFinite(target[k])?target[k]:0,from=Number.isFinite(previous[k])?previous[k]:0;out[k]=from+(value-from)*a;}
 for(const k of ['windDirection','waveDirection']){const from=Number.isFinite(previous[k])?previous[k]:BASE_DIRECTION,to=Number.isFinite(target[k])?target[k]:BASE_DIRECTION;out[k]=(from+((to-from+540)%360-180)*directionAlpha+360)%360;}
 const period=Number.isFinite(target.wavePeriod)?target.wavePeriod:BASE_PERIOD,from=Number.isFinite(previous.wavePeriod)?previous.wavePeriod:BASE_PERIOD;out.wavePeriod=from+(period-from)*a;
 const old=directionalSpectrum(previous),next=directionalSpectrum({...out,wavePhases:undefined});
 out.wavePhases=next.map((n,i)=>wrap(old[i].phase-n.phase+x*(old[i].kx-n.kx)+z*(old[i].kz-n.kz)-time*(old[i].omega-n.omega)));
 return out;
}
