export function solarCharge(stats,hour,weather,dt){if(stats.powertrain!=='electric')return 0;const daylight=Math.max(0,Math.sin(((hour%24)-6)/12*Math.PI)),cloud=Math.max(0,Math.min(1,weather.front||0));return (stats.solarKw||0)*daylight*(1-cloud*.8)*dt/3600;}
export function electricBurn(throttle,stats,dt){return (8+Math.min(1,Math.abs(throttle))**2*480)*(stats.fuelUse||1)*dt/3600;}
export const energyPrice=stats=>stats.powertrain==='electric'?2:9.5;
