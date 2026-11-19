import {WORLD_BOUNDS} from './world.mjs?v=0.17.6';
export function createChartView(x=0,y=0){return {x,y,scale:.064,follow:false};}
export function chartPoint(view,x,y,width,height){return {x:width/2+(x-view.x)*view.scale,y:height/2+(y-view.y)*view.scale};}
export function chartWorld(view,x,y,width,height){return {x:view.x+(x-width/2)/view.scale,y:view.y+(y-height/2)/view.scale};}
export function followVessel(view,boat){view.follow=true;view.x=boat.x;view.y=boat.y;}
export function updateChartFollow(view,boat){if(view.follow){view.x=boat.x;view.y=boat.y;}}
export function panChart(view,dx,dy){view.follow=false;view.x=Math.max(WORLD_BOUNDS.left,Math.min(WORLD_BOUNDS.right,view.x-dx/view.scale));view.y=Math.max(WORLD_BOUNDS.top,Math.min(WORLD_BOUNDS.bottom,view.y-dy/view.scale));}
export function zoomChart(view,factor,x,y,width,height){const anchor=chartWorld(view,x,y,width,height);view.scale=Math.max(.000045,Math.min(1.2,view.scale*factor));view.x=anchor.x-(x-width/2)/view.scale;view.y=anchor.y-(y-height/2)/view.scale;}
