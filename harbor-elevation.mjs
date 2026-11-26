import {DEM} from './harbor-dem-data.mjs';
import {geoToWorld} from './world.mjs?v=0.18.87';

const nw=geoToWorld(DEM.west,DEM.north),se=geoToWorld(DEM.east,DEM.south);
let heights;
export function harborElevation(x,y,fallback){
 const u=(x-nw.x)/(se.x-nw.x),v=(y-nw.y)/(se.y-nw.y);
 if(u<0||u>1||v<0||v>1)return fallback;
 heights??=Uint8Array.from(atob(DEM.data),c=>c.charCodeAt(0));
 const col=Math.max(0,Math.min(DEM.width-1,u*DEM.width-.5));
 const row=Math.max(0,Math.min(DEM.height-1,v*DEM.height-.5));
 const a=Math.floor(col),b=Math.floor(row),c=Math.min(DEM.width-1,a+1),d=Math.min(DEM.height-1,b+1);
 const value=(x,y)=>{const i=2*(x+DEM.width*y);return (heights[i]+256*heights[i+1])/4;};
 const mix=(a,b,t)=>a+(b-a)*t;
 const height=mix(mix(value(a,b),value(c,b),col-a),mix(value(a,d),value(c,d),col-a),row-b);
 const fade=Math.min(1,Math.min(u,1-u,v,1-v)*20);
 return mix(fallback,Math.max(6,height),fade);
}
