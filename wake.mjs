export const WAKE_LIMIT=48;
export function createWake(){return {points:[],time:0,last:null};}
export function stepWake(wake,boat,dt){if(dt<=0)return wake;wake.time+=dt;wake.points=wake.points.filter(p=>wake.time-p.born<42);const speed=Math.abs(boat.speed);if(speed<.45){wake.last=null;return wake;}const direction=boat.heading+(boat.speed<0?Math.PI:0),x=boat.x-Math.cos(direction)*11,z=boat.y-Math.sin(direction)*11;
 if(!wake.last||Math.hypot(x-wake.last.x,z-wake.last.z)>2.8||wake.time-wake.last.born>.6){const point={x,z,heading:direction,born:wake.time,energy:Math.min(speed,9)};wake.points.push(point);wake.last=point;if(wake.points.length>WAKE_LIMIT)wake.points.shift();}return wake;}
