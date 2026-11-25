import {harborElevation} from './harbor-elevation.mjs?v=0.18.79';
import {TERRAIN_DATA as data} from './terrain-data.mjs?v=0.18.79';
import {PORT_BUILDINGS,PORT_ROADS,PORT_PIERS} from './port-data.mjs?v=0.18.79';
import {geoToWorld,WORLD_LAND,isLand,MATTHEW_QUAY,DUTCH_QUAY,SERVICE_APRON} from './world.mjs?v=0.18.79';
import {geometry} from './geometry.mjs?v=0.18.79';
const bounds=[];for(let i=0;i<data.length;i+=9)bounds.push([Math.min(data[i],data[i+3],data[i+6]),Math.max(data[i],data[i+3],data[i+6]),Math.min(data[i+1],data[i+4],data[i+7]),Math.max(data[i+1],data[i+4],data[i+7])]);
export function groundHeight(x,y){for(let n=0;n<bounds.length;n++){const b=bounds[n];if(x<b[0]||x>b[1]||y<b[2]||y>b[3])continue;const i=n*9,ax=data[i],ay=data[i+1],bx=data[i+3],by=data[i+4],cx=data[i+6],cy=data[i+7],det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(det)<.001)continue;const a=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/det,c=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/det,d=1-a-c;if(a>=-.0001&&c>=-.0001&&d>=-.0001)return harborElevation(x,y,a*data[i+2]+c*data[i+5]+d*data[i+8]);}return 6;}
const city=PORT_BUILDINGS.map(b=>({...b,points:b.ring.map(([a,b])=>geoToWorld(a,b))})),roads=PORT_ROADS.map(r=>r.map(([a,b])=>geoToWorld(a,b))),piers=PORT_PIERS.map(r=>r.map(([a,b])=>geoToWorld(a,b)));
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
export function pierTopTriangles(ring){
 const points=ring.slice(0,-1).filter((p,i)=>Math.hypot(p.x-ring[i?i-1:ring.length-2].x,p.y-ring[i?i-1:ring.length-2].y)>.001);
 const origin=points[0];
 if(points.length<3)return [];
 const area=points.reduce((total,a,i)=>total+cross(origin,a,points[(i+1)%points.length]),0);
 if(area>0)points.reverse();
 const triangles=[];
 while(points.length>3){
  let clipped=false;
  for(let i=0;i<points.length;i++){
   const a=points[(i+points.length-1)%points.length],b=points[i],c=points[(i+1)%points.length];
   const turn=cross(a,b,c);
   if(Math.abs(turn)<1e-6){points.splice(i,1);clipped=true;break;}
   if(turn>=0||points.some(p=>p!==a&&p!==b&&p!==c&&cross(a,b,p)<=0&&cross(b,c,p)<=0&&cross(c,a,p)<=0))continue;
   triangles.push([a,b,c]);points.splice(i,1);clipped=true;break;
  }
  if(!clipped)return [];
 }
 if(points.length===3)triangles.push(points.slice());
 return triangles;
}
function addPier(g,pier){
 const closed=Math.hypot(pier[0].x-pier.at(-1).x,pier[0].y-pier.at(-1).y)<.1;
 const at=(p,h)=>[p.x,h,p.y];
 if(closed){
  const triangles=pierTopTriangles(pier);
  if(!triangles.length)return;
  for(const triangle of triangles)g.tri(...triangle.map(p=>at(p,6)),[.34,.34,.30],.94);
  for(let i=1;i<pier.length;i++){
   const a=pier[i-1],b=pier[i];
   g.quad(at(a,-1),at(b,-1),at(b,6),at(a,6),[.23,.25,.24],.92);
  }
  return;
 }
 for(let i=1;i<pier.length;i++){
  const a=pier[i-1],b=pier[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,nx=-dy/d*2,ny=dx/d*2;
  g.quad([a.x+nx,2.1,a.y+ny],[b.x+nx,2.1,b.y+ny],[b.x-nx,2.1,b.y-ny],[a.x-nx,2.1,a.y-ny],[.32,.31,.27],.8);
 }
}
function shoreStone(g,x,y,z,size,seed){
 const rand=n=>{const f=Math.sin(seed*17.31+n*43.73)*43758.5453;return f-Math.floor(f);};
 const angle=rand(0)*Math.PI*2,stretch=.7+rand(1)*.6,shade=.17+rand(2)*.14;
 const color=[shade,shade*.98,shade*.92],middle=[],top=[];
 for(let i=0;i<6;i++){
  const a=angle+i*Math.PI/3,r=size*(.76+rand(3+i)*.44),dx=Math.cos(a)*r,dz=Math.sin(a)*r*stretch;
  middle.push([x+dx,y+size*(.12+.25*rand(10+i)),z+dz]);
  top.push([x+dx*.55,y+size*(.65+.45*rand(17+i)),z+dz*.55]);
 }
 for(let i=0;i<6;i++){
  const j=(i+1)%6,a=middle[i],b=middle[j];
  g.quad(a,top[i],top[j],b,color,.78,-2);
  g.quad([a[0],y-size*.65,a[2]],a,b,[b[0],y-size*.65,b[2]],color,.73,-2);
 }
 for(let i=1;i<5;i++)g.tri(top[0],top[i+1],top[i],color,.84,-2);
}

// The modelled Dutch Harbor wall replaces the natural bank on this frontage.
// Keep the rest of each coast segment, including at either end of the quay.
const {start:quayStart,end:quayEnd,depth:quayDepth}=SERVICE_APRON;
const bankSeaEdge=-8;
const quayUV=({x,y})=>{
 const q=DUTCH_QUAY,dx=x-q.x,dy=y-q.y;
 return [dx*q.tx+dy*q.ty,dy*q.tx-dx*q.ty];
};
function bankSegments(a,b){
 const p=quayUV(a),q=quayUV(b);
 let enter=0,exit=1;
 for(const [i,lo,hi] of [[0,quayStart,quayEnd],[1,bankSeaEdge,quayDepth]]){
  const d=q[i]-p[i];
  if(Math.abs(d)<1e-6){if(p[i]<lo||p[i]>hi)return [[a,b]];continue;}
  const x=(lo-p[i])/d,y=(hi-p[i])/d;
  enter=Math.max(enter,Math.min(x,y));exit=Math.min(exit,Math.max(x,y));
  if(exit-enter<1e-6)return [[a,b]];
 }
 const at=t=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
 const keep=[];
 if(enter>1e-6)keep.push([a,at(enter)]);
 if(exit<1-1e-6)keep.push([at(exit),b]);
 return keep;
}
function pileShoreRocks(g,x,y,radius){
 let count=0;
 for(const {outer} of WORLD_LAND)for(let i=1;i<outer.length&&count<1600;i++){
  const a=outer[i-1],b=outer[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  if(length<1)continue;
  const tx=dx/length,ty=dy/length,offset=(x-a.x)*tx+(y-a.y)*ty;
  const range=Math.min(radius,650);
  if(Math.abs((x-a.x)*ty-(y-a.y)*tx)>range)continue;
  const startHeight=Math.max(6,groundHeight(a.x,a.y)),endHeight=Math.max(6,groundHeight(b.x,b.y));
  for(let d=Math.max(1,Math.ceil((offset-range)/3.25)*3.25);d<Math.min(length,offset+range)&&count<1600;d+=3.25){
   const sx=a.x+tx*d,sy=a.y+ty*d;
   if(Math.hypot(sx-x,sy-y)>range)continue;
   // Leave working quay faces and their approaches clear.
   const [u,v]=quayUV({x:sx,y:sy});
   // Allow the continuation of the rocky bank to meet the outer concrete tip.
   const beyondDutchTip=u>=quayEnd+3.1&&v>=-14&&v<0;
   if(Math.hypot(sx-MATTHEW_QUAY.x,sy-MATTHEW_QUAY.y)<260||!beyondDutchTip&&(Math.hypot(sx-47,sy+70)<230||u>quayStart-5&&u<quayEnd+5&&v>bankSeaEdge-5&&v<quayDepth+5))continue;
   const landSide=isLand(sx-ty*4,sy+tx*4)?1:-1;
   const seed=i*113+d+sx*.013+sy*.011;
   const bankHeight=startHeight+(endHeight-startHeight)*d/length;
   const height=Math.min(10,bankHeight),rows=Math.ceil(height/1.65);
   for(let row=0;row<rows&&count<1600;row++){
    const frac=row/Math.max(1,rows-1);
    const stagger=(row%2)*1.28+Math.sin(seed+row*2)*.29;
    const tipClearance=beyondDutchTip?Math.min(1,.15+(u-quayEnd-3.1)/35):1;
    const outward=(1-frac)*3.3*tipClearance+.34;
    const size=1.78+(Math.sin(seed+row*1.87)*.5+.5)*.58;
    const level=-.3+frac*(height-1.14)+Math.sin(seed+row)*.26;
    shoreStone(g,sx+tx*stagger+ty*landSide*outward,level,sy+ty*stagger-tx*landSide*outward,size,seed+row*19);
    count++;
   }
  }
 }
}
function terrainFace(g,triangle){
 const raised=triangle.map(([x,h,y])=>[x,harborElevation(x,y,h),y]);
 const height=raised.reduce((sum,p)=>sum+p[1],0)/3;
 const color=height>450?[.35,.36,.33]:height>210?[.24,.27,.23]:[.19,.26,.18];
 g.tri(raised[0],raised[2],raised[1],color,.97,-1);
}
function subdivideTerrain(g,points,level){
 if(!level){terrainFace(g,points);return;}
 const [a,b,c]=points,mid=(p,q)=>p.map((v,i)=>(v+q[i])/2);
 const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);
 for(const tri of [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]])subdivideTerrain(g,tri,level-1);
}
export function buildGeography(x,y,radius=2200,local=false){if(Math.hypot(x,y)<2400)radius=Math.max(radius,3700);const g=geometry();for(let n=0;n<bounds.length;n++){const b=bounds[n];if(b[0]>x+radius||b[1]<x-radius||b[2]>y+radius||b[3]<y-radius)continue;const i=n*9,points=[0,3,6].map(j=>[data[i+j],data[i+j+2],data[i+j+1]]);
 const inHarborRegion=b[0]>-3650&&b[1]<2900&&b[2]>-7700&&b[3]<4900;
 const edge=Math.max(b[1]-b[0],b[3]-b[2]);
 subdivideTerrain(g,points,inHarborRegion&&edge<225?2:0);
 }
 // Give the shoreline a solid bank instead of a floating paper-thin surface.
 for(const land of WORLD_LAND){for(const ring of [land.outer,...land.holes])for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];if(Math.min(a.x,b.x)>x+radius||Math.max(a.x,b.x)<x-radius||Math.min(a.y,b.y)>y+radius||Math.max(a.y,b.y)<y-radius)continue;for(const [l,r] of bankSegments(a,b)){const lh=Math.max(6,groundHeight(l.x,l.y)),rh=Math.max(6,groundHeight(r.x,r.y));g.quad([l.x,-8,l.y],[r.x,-8,r.y],[r.x,rh,r.y],[l.x,lh,l.y],[.25,.27,.24],.98,-1);}}}
 for(const building of city){const points=building.points,at=points[0];if(Math.abs(at.x-x)>radius||Math.abs(at.y-y)>radius)continue;const base=Math.max(...points.slice(0,8).map(p=>groundHeight(p.x,p.y))),h=base+building.height;for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j];g.quad([a.x,base,a.y],[a.x,h,a.y],[b.x,h,b.y],[b.x,base,b.y],[.39,.42,.38],.85);}for(let j=2;j<points.length-1;j++)g.tri([at.x,h,at.y],[points[j-1].x,h,points[j-1].y],[points[j].x,h,points[j].y],[.27,.31,.31],.8);}
 for(const road of roads){if(road.every(p=>Math.abs(p.x-x)>radius||Math.abs(p.y-y)>radius))continue;for(let i=1;i<road.length;i++){const a=road[i-1],b=road[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,nx=-dy/d*2.6,ny=dx/d*2.6,ah=groundHeight(a.x,a.y)+.14,bh=groundHeight(b.x,b.y)+.14;g.quad([a.x+nx,ah,a.y+ny],[b.x+nx,bh,b.y+ny],[b.x-nx,bh,b.y-ny],[a.x-nx,ah,a.y-ny],[.18,.20,.20],.98);}}
 for(const pier of piers){
  if(!pier.every(p=>Math.abs(p.x-x)>radius||Math.abs(p.y-y)>radius))addPier(g,pier);
 }
 pileShoreRocks(g,x,y,radius);
 if(local)for(let i=0;i<g.data.length;i+=11){g.data[i]-=x;g.data[i+2]-=y;}
 return g.array();}
