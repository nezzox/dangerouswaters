import {HULL_STATIONS,hullWidthAt} from './fenders.mjs?v=0.18.41';
export const insideHullWater=([x,y,z],design={})=>x>=-12&&x<=12.2&&Math.abs(z)<hullWidthAt(x,design)*(.55+.45*Math.max(0,Math.min(1,(y+1.3)/1.65)))-.035&&y>=-1.3;
export const createDeckWater=()=>({port:0,starboard:0});
// A thin draining sheet is separate from the ocean; driven only by rail overtopping.
export function stepDeckWater(water,port,starboard,dt){dt=Math.max(0,Math.min(dt,1.5));for(const [key,excess] of [['port',port],['starboard',starboard]]){const target=Math.min(.09,Math.max(0,excess)*.055),rate=target>water[key]?4:.65;water[key]+=(target-water[key])*(1-Math.exp(-dt*rate));if(water[key]<.00001)water[key]=0;}return water;}
const f=n=>Number(n).toFixed(7);
export const hullWaterGLSL=`uniform float uHullRamp;uniform mat4 uHullInverse;uniform vec3 uHullOrigin;uniform vec2 uDeckWater;
float hullHalfWidth(float x){if(uHullRamp>.5&&x>=8.)return 2.7;${HULL_STATIONS.slice(0,-1).map(([x,w],i)=>{const [b,v]=HULL_STATIONS[i+1],before=HULL_STATIONS[Math.max(0,i-1)],after=HULL_STATIONS[Math.min(HULL_STATIONS.length-1,i+2)],m0=(v-before[1])/(b-before[0]),m1=(after[1]-w)/(after[0]-x);return `if(x<=${f(b)}){float t=clamp((x-(${f(x)}))/${f(b-x)},0.,1.);return max(.06,(2.*t*t*t-3.*t*t+1.)*${f(w)}+(t*t*t-2.*t*t+t)*${f((b-x)*m0)}+(-2.*t*t*t+3.*t*t)*${f(v)}+(t*t*t-t*t)*${f((b-x)*m1)});}`;}).join('')}return .06;}
vec3 hullLocalPoint(vec3 relative){return (uHullInverse*vec4(relative,0.)).xyz;}
bool insideHullLocal(vec3 p){
 float width=hullHalfWidth(p.x)*mix(.55,1.,clamp((p.y+1.3)/1.65,0.,1.));
 return p.x>=-12.&&p.x<=12.2&&abs(p.z)<width-.035&&p.y>=-1.3;
}
bool insideHullWater(vec3 world){if(any(greaterThan(abs(world.xz-uHullOrigin.xz),vec2(34.))))return false;return insideHullLocal(hullLocalPoint(world-uHullOrigin));}
float containOceanCrest(vec3 relative){
 if(any(greaterThan(abs(relative.xz),vec2(34.))))return relative.y;
 vec3 p=hullLocalPoint(relative);
 float edge=max(max(-12.-p.x,p.x-12.2),abs(p.z)-hullHalfWidth(p.x));
 float blend=1.-smoothstep(.05,1.25,edge);
 // Deck wash is rendered separately. Keep the open-water mesh below the deck at its edge.
 return relative.y-max(0.,p.y-1.62)*blend/max(.25,uHullInverse[1][1]);
}`;
