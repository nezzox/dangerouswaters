import {WORLD_LAND} from './world.mjs?v=0.18.24';
// A water-only canvas clip: outer viewport minus land, retaining geographic holes.
// The caller owns save/restore so symbols can be drawn normally after habitat shading.
export function clipChartWater(context,point,width,height){context.beginPath();context.rect(0,0,width,height);for(const land of WORLD_LAND)for(const ring of [land.outer,...land.holes]){for(let i=0;i<ring.length;i++){const p=point(ring[i].x,ring[i].y);if(i)context.lineTo(p.x,p.y);else context.moveTo(p.x,p.y);}context.closePath();}context.clip('evenodd');}
