import {WORLD_BOUNDS} from './world.mjs?v=0.18.79';
export function createChartView(x=0,y=0){return {x,y,scale:.064,follow:false};}
export function chartPoint(view,x,y,width,height){return {x:width/2+(x-view.x)*view.scale,y:height/2+(y-view.y)*view.scale};}
export function chartWorld(view,x,y,width,height){return {x:view.x+(x-width/2)/view.scale,y:view.y+(y-height/2)/view.scale};}
export function followVessel(view,boat){view.follow=true;view.x=boat.x;view.y=boat.y;}
export function fitPots(view,pots,width,height){
 if(!pots.length)return false;
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
 for(const {x,y} of pots){
  left=Math.min(left,x);right=Math.max(right,x);
  top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 Object.assign(view,{follow:false,x:(left+right)/2,y:(top+bottom)/2,
  scale:Math.min(.35,width*.8/Math.max(120,right-left),height*.8/Math.max(120,bottom-top))});
 return true;
}
export function updateChartFollow(view,boat){if(view.follow){view.x=boat.x;view.y=boat.y;}}
export function panChart(view,dx,dy){view.follow=false;view.x=Math.max(WORLD_BOUNDS.left,Math.min(WORLD_BOUNDS.right,view.x-dx/view.scale));view.y=Math.max(WORLD_BOUNDS.top,Math.min(WORLD_BOUNDS.bottom,view.y-dy/view.scale));}
export function zoomChart(view,factor,x,y,width,height){const anchor=chartWorld(view,x,y,width,height);view.scale=Math.max(.000045,Math.min(1.2,view.scale*factor));view.x=anchor.x-(x-width/2)/view.scale;view.y=anchor.y-(y-height/2)/view.scale;}
// Fixed screen-size arrow: legible on the planning chart without scaling into a giant marker.
export function drawGroundMotion(ctx,point,direction){if(!direction)return;ctx.save();ctx.translate(point.x,point.y-15);ctx.rotate(Math.atan2(direction.y,direction.x));ctx.setLineDash([]);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.moveTo(3,-5);ctx.lineTo(9,0);ctx.lineTo(3,5);ctx.strokeStyle='#10272e';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#b8dbc3';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();}
