import {QUAY,quayPoint,berthsAt} from './harbor.mjs?v=0.18.50';
import {geometry} from './geometry.mjs?v=0.18.50';
import {WORLD_LAND,isLand} from './world.mjs?v=0.18.50';
import {groundHeight} from './geography-mesh.mjs?v=0.18.50';
const asphalt=[.16,.18,.18],concrete=[.36,.37,.34],steel=[.29,.33,.33],dark=[.07,.09,.085];
export const MATTHEW_FLOODLIGHTS=[-215,-122,-37,61];
function buildMatthewDetails(g,quay){
 const base=quay.deck;
 const at=(u,v,h=0)=>{const p=quayPoint(u,v,quay);return [p.x,base+h,p.y];};
 function block(u,v,width,depth,bottom,top,color,emit=0){
  const corners=[[-1,-1],[-1,1],[1,1],[1,-1]];
  const points=h=>corners.map(([x,y])=>at(u+x*width/2,v+y*depth/2,h));
  const low=points(bottom),high=points(top);
  g.quad(...high,color,.78,emit);
  for(let i=0;i<4;i++){const j=(i+1)%4;g.quad(low[i],low[j],high[j],high[i],color,.78,emit);}
 }
 for(const [u,w,h,color] of [[-183,38,9,[.34,.43,.44]],[-89,42,11,[.47,.38,.29]],[28,27,7,[.52,.52,.44]]]){
  block(u,30,w,18,0,h,color);
  block(u,30,w+1,19,h,h+.45,steel);
  for(let x=u-w/2+6;x<u+w/2-3;x+=10){
   block(x,20.94,5,.12,.2,5,[.19,.23,.25]);
   block(x,20.8,1.4,.18,5.5,6,[.85,.64,.37],.55);
  }
 }
 for(const [u,v] of [[-217,26],[-210,32],[-137,31],[-48,30],[-39,32],[66,31]]){
  block(u,v,5,10,0,2.6,[.31,.20,.15]);
  block(u,v,5.2,10.2,2.6,2.8,steel);
 }
 for(let u=-222;u<75;u+=8){
  block(u,2,3,.19,.012,.032,[.63,.49,.22]);
  if(u%16===2){g.tube(at(u,1.5),at(u,1.5,.8),.19,steel,8);}
 }
 for(const u of MATTHEW_FLOODLIGHTS){
  g.tube(at(u,5),at(u,5,10),.18,steel,8);
  block(u,4.8,1.7,.85,9.6,10.4,dark);
  block(u,4.32,1.5,.14,9.7,10.3,[1.,.73,.25],.55);
 }
}
// A small break spot and a striped windsock give the Dutch Harbor waterfront some character.
function buildDutchBreakSpot(g){
 const coffee=quayPoint(-75,19),deck=QUAY.deck;
 g.box(coffee.x,deck+1.3,coffee.y,4,2.6,3,[.30,.43,.42]);
 g.box(coffee.x,deck+2.72,coffee.y,4.5,.24,3.6,[.57,.30,.18]);
 g.box(coffee.x,deck+1.72,coffee.y-1.52,2.7,.77,.07,[.83,.64,.35],.35,.32);
 g.box(coffee.x,deck+1.22,coffee.y-1.77,3,.13,.55,steel);
 for(const offset of [-5,5]){
  const bench=quayPoint(-75+offset,17);
  g.box(bench.x,deck+.55,bench.y,3,.13,.65,[.51,.34,.19]);
  for(const side of [-1,1])g.box(bench.x+side,deck+.26,bench.y,.16,.52,.5,steel);
 }
 const mast=quayPoint(41,12),top=deck+8;
 g.tube([mast.x,deck,mast.y],[mast.x,top,mast.y],.10,steel,8);
 for(let i=0;i<5;i++)g.tube([mast.x+i*.49,top-i*.10,mast.y],[mast.x+(i+1)*.49,top-(i+1)*.10,mast.y],.27-i*.030,i%2?[.72,.72,.65]:[.73,.26,.10],8);
}
// Interpreted Ballyhoo Road industrial frontage, fitted to the geographic shoreline.
// No satellite imagery is shipped; the source coastline remains authoritative.
export function buildPortScenery(selected=QUAY,local=false){const g=geometry();let index=0;
 if(selected===QUAY)for(const land of WORLD_LAND){if(land.right< -1300||land.left>1100||land.bottom< -1500||land.top>650)continue;
 for(let i=1;i<land.outer.length;i++){const a=land.outer[i-1],b=land.outer[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<8)continue;
 const tx=dx/length,ty=dy/length,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;let nx=-ty,ny=tx;
 if(!isLand(mx+nx*8,my+ny*8)){nx=-nx;ny=-ny;}if(!isLand(mx+nx*15,my+ny*15))continue;
 const count=Math.ceil(length/65);for(let j=0;j<count;j++){const t=(j+.5)/count,x=a.x+dx*t,y=a.y+dy*t;if(x< -1150||x>900||y< -1350||y>500)continue;
 const span=Math.min(65,length/count),base=Math.max(6,groundHeight(x+nx*50,y+ny*50)+.18),seed=++index;
 const p=(u,v,h=base)=>[x+tx*u+nx*v,h,y+ty*u+ny*v];
 const slab=(u,v,w,d,h,col,rough=.85)=>{const q=[p(u-w/2,v-d/2),p(u+w/2,v-d/2),p(u+w/2,v+d/2),p(u-w/2,v+d/2)];g.quad(q[0],q[3],q[2],q[1],col,rough,h<.2?-2:0);if(h)for(let k=0;k<4;k++){const a=q[k],b=q[(k+1)%4];g.quad(a,b,[b[0],b[1]+h,b[2]],[a[0],a[1]+h,a[2]],col,rough);}if(h)g.quad(...[q[0],q[3],q[2],q[1]].map(a=>[a[0],a[1]+h,a[2]]),col,rough,h<.2?-2:0);};
 // Reclaimed apron, quayside edge, and the road along the foot of the hill.
 slab(0,19,span+.4,37,0,asphalt);slab(0,1,span,.9,.35,concrete);slab(0,43,span+1,7.5,.08,[.12,.14,.14]);
 for(let u=-span/2+4;u<span/2;u+=28){slab(u,43,3,.16,.09,[.66,.64,.49]);const pole=p(u,32);g.tube(p(u,32),p(u,32,base+9),.11,steel,6);g.box(pole[0],base+9,pole[2],.8,.25,.65,[.77,.70,.46],.6,.5);}
 // Heavy mooring bollards and dark tire fenders break up the sheer shoreline.
 for(let u=-span/2+3;u<span/2;u+=9){g.tube(p(u,2,base+.35),p(u,2,base+1),.23,dark,6);g.tube(p(u-.5,2,base+.9),p(u+.5,2,base+.9),.16,dark,6);g.tube(p(u,-.5,base-2),p(u,-.5,base-.6),.6,dark,8);}
 if(Math.hypot(x-QUAY.x,y-QUAY.y)<72)continue;
 if(seed%3===0){for(let k=0;k<3;k++){const q=p(k*6-6,20);g.tube([q[0],base,q[2]],[q[0],base+7+(k%2),q[2]],2.5,[.57,.60,.56],16);g.tube([q[0],base+7.2+(k%2),q[2]],[q[0],base+7.4+(k%2),q[2]],2.55,steel,16);}}
 else if(seed%3===1){const w=Math.min(38,span-5),d=16,h=9;slab(0,23,w,d,h,[.47,.49,.44]);const a=p(-w/2,23-d/2,base+h),b=p(w/2,23-d/2,base+h),c=p(w/2,23,base+h+3),d1=p(-w/2,23,base+h+3),e=p(-w/2,23+8,base+h),f=p(w/2,23+8,base+h);g.quad(a,b,c,d1,[.36,.40,.39]);g.quad(d1,c,f,e,[.29,.33,.33]);for(let u=-w/2+3;u<w/2-2;u+=7){const aa=p(u-2,14.95,base+.2),bb=p(u+2,14.95,base+.2);g.quad(aa,bb,[bb[0],base+5,bb[2]],[aa[0],base+5,aa[2]],[.20,.25,.26]);}}
 else {for(let k=0;k<5;k++){const q=p((k-2)*5,20+(k%2)*7);for(let level=0;level<1+(k%3===0);level++){g.box(q[0],base+1.35+level*2.7,q[2],4,2.6,6,k%2?[.35,.17,.10]:[.13,.25,.27]);for(let z=-2.8;z<3;z+=.6)g.box(q[0]+2.02,base+1.35+level*2.7,q[2]+z,.06,2.4,.06,steel);}}}
 // Forklift and loading yard markings add a readable working scale.
 if(seed%4===0){const q=p(8,9);g.box(q[0],base+.9,q[2],1.6,1.1,2.5,[.65,.43,.11]);g.box(q[0],base+2.2,q[2]-.4,1.7,.14,1.5,steel);for(const side of [-1,1]){g.tube([q[0]+side*.8,base+.5,q[2]-.8],[q[0]+side*1.02,base+.5,q[2]-.8],.38,dark,8);g.tube([q[0]+side*.8,base+.5,q[2]+.8],[q[0]+side*1.02,base+.5,q[2]+.8],.38,dark,8);g.box(q[0]+side*.55,base+1.7,q[2]+1.25,.13,3,.13,steel);g.box(q[0]+side*.45,base+.4,q[2]+1.9,.18,.12,1.7,steel);}}
 // Pallets and loading yard markings.
 for(let k=0;k<4;k++){const q=p(k*3-5,7);g.box(q[0],base+.45,q[2],2,.8,1.5,[.43,.35,.22]);}
 }} }
 // The service crane is part of this quay, with its foundation on the apron.
 for(const quay of [selected]){
 const point=(u,v)=>quayPoint(u,v,quay);
 if(quay!==QUAY){
  buildMatthewDetails(g,quay);
  const corners=[point(-228,0),point(-228,40),point(78,40),point(78,0)];
  const vertex=(i,h)=>[corners[i].x,h,corners[i].y];
  g.quad(...[0,1,2,3].map(i=>vertex(i,quay.deck)),concrete);
  for(let i=0;i<4;i++){const j=(i+1)%4;g.quad(vertex(i,-2),vertex(j,-2),vertex(j,quay.deck),vertex(i,quay.deck),concrete);}
 }
 for(const berth of berthsAt(quay)){const along=(berth.x-quay.x)*quay.tx+(berth.y-quay.y)*quay.ty,mast=point(along,8),bin=point(along-14,21),base=quay.deck;
 g.box(mast.x,base+.3,mast.y,5,.6,5,concrete,.95);
 for(const u of [-1.7,1.7])for(const v of [-1.7,1.7]){const a=point(along+u,8+v),b=point(along+u*.4,8+v*.4);g.tube([a.x,base+.6,a.y],[b.x,23,b.y],.18,[.64,.28,.10],8);}
 for(let h=base+1;h<22;h+=2){const a=point(along-1,7),b=point(along+1,9);g.tube([a.x,h,a.y],[b.x,h+2,b.y],.08,steel,6);}
 g.box(mast.x,22,mast.y,3,3,3,[.64,.28,.10]);g.box(mast.x,23.7,mast.y,3.5,.3,3.5,steel);
 g.box(bin.x,base+1,bin.y,5,2,4,steel);g.box(bin.x,base+2.05,bin.y,4.5,.15,3.5,dark);}
 }
 if(selected===QUAY)buildDutchBreakSpot(g);
 if(local)for(let i=0;i<g.data.length;i+=11){g.data[i]-=selected.x;g.data[i+2]-=selected.y;}
 return g.array();}
