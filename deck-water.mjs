import {HULL_STATIONS,hullWidthAt} from './fenders.mjs?v=0.17.7';
export const insideHullWater=([x,y,z])=>x>=-12&&x<=12.2&&Math.abs(z)<hullWidthAt(x)-.035&&y>-1.6;
export const createDeckWater=()=>({port:0,starboard:0});
// A thin draining sheet is separate from the ocean; driven only by rail overtopping.
export function stepDeckWater(water,port,starboard,dt){dt=Math.max(0,Math.min(dt,1.5));for(const [key,excess] of [['port',port],['starboard',starboard]]){const target=Math.min(.09,Math.max(0,excess)*.055),rate=target>water[key]?4:.65;water[key]+=(target-water[key])*(1-Math.exp(-dt*rate));if(water[key]<.00001)water[key]=0;}return water;}
const f=n=>Number(n).toFixed(7);
export const hullWaterGLSL=`uniform mat4 uHullInverse;uniform vec2 uDeckWater;
float hullHalfWidth(float x){${HULL_STATIONS.slice(0,-1).map(([x,w],i)=>{const [b,v]=HULL_STATIONS[i+1],before=HULL_STATIONS[Math.max(0,i-1)],after=HULL_STATIONS[Math.min(HULL_STATIONS.length-1,i+2)],m0=(v-before[1])/(b-before[0]),m1=(after[1]-w)/(after[0]-x);return `if(x<=${f(b)}){float t=clamp((x-(${f(x)}))/${f(b-x)},0.,1.);return max(.06,(2.*t*t*t-3.*t*t+1.)*${f(w)}+(t*t*t-2.*t*t+t)*${f((b-x)*m0)}+(-2.*t*t*t+3.*t*t)*${f(v)}+(t*t*t-t*t)*${f((b-x)*m1)});}`;}).join('')}return .06;}
bool insideHullWater(vec3 world){if(any(greaterThan(abs(world.xz-uBoat.xy),vec2(32.))))return false;vec3 p=(uHullInverse*vec4(world,1.)).xyz;return p.x>=-12.&&p.x<=12.2&&abs(p.z)<hullHalfWidth(p.x)-.035&&p.y> -1.6;}`;
