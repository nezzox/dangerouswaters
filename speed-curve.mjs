// Keep low-speed deck handling unchanged while shortening longer voyages.
export function travelBoost(speed){return 1+Math.max(0,Math.abs(speed)*1.94384-5)**2*.018;}
