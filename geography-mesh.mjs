import {TERRAIN_DATA as data} from './terrain-data.mjs?v=0.18.47';
import {PORT_BUILDINGS,PORT_ROADS,PORT_PIERS} from './port-data.mjs?v=0.18.47';
import {geoToWorld,WORLD_LAND,isLand,MATTHEW_QUAY} from './world.mjs?v=0.18.47';
import {geometry} from './geometry.mjs?v=0.18.47';
const bounds=[];for(let i=0;i<data.length;i+=9)bounds.push([Math.min(data[i],data[i+3],data[i+6]),Math.max(data[i],data[i+3],data[i+6]),Math.min(data[i+1],data[i+4],data[i+7]),Math.max(data[i+1],data[i+4],data[i+7])]);
export function groundHeight(x,y){for(let n=0;n<bounds.length;n++){const b=bounds[n];if(x<b[0]||x>b[1]||y<b[2]||y>b[3])continue;const i=n*9,ax=data[i],ay=data[i+1],bx=data[i+3],by=data[i+4],cx=data[i+6],cy=data[i+7],det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(det)<.001)continue;const a=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/det,c=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/det,d=1-a-c;if(a>=-.0001&&c>=-.0001&&d>=-.0001)return a*data[i+2]+c*data[i+5]+d*data[i+8];}return 6;}
const city=PORT_BUILDINGS.map(b=>({...b,points:b.ring.map(([a,b])=>geoToWorld(a,b))})),roads=PORT_ROADS.map(r=>r.map(([a,b])=>geoToWorld(a,b))),piers=PORT_PIERS.map(r=>r.map(([a,b])=>geoToWorld(a,b)));
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

function pileShoreRocks(g,x,y,radius){
 let count=0;
 for(const {outer} of WORLD_LAND)for(let i=1;i<outer.length&&count<680;i++){
  const a=outer[i-1],b=outer[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  if(length<5)continue;
  const tx=dx/length,ty=dy/length,offset=(x-a.x)*tx+(y-a.y)*ty;
  const range=Math.min(radius,650);
  if(Math.abs((x-a.x)*ty-(y-a.y)*tx)>range)continue;
  for(let d=Math.max(2,Math.ceil((offset-range)/5)*5);d<Math.min(length-2,offset+range)&&count<680;d+=5){
   const sx=a.x+tx*d,sy=a.y+ty*d;
   if(Math.hypot(sx-x,sy-y)>range)continue;
   // Leave working quay faces and their approaches clear.
   if(Math.hypot(sx-MATTHEW_QUAY.x,sy-MATTHEW_QUAY.y)<260||Math.hypot(sx-47,sy+70)<230)continue;
   const landSide=isLand(sx-ty*4,sy+tx*4)?1:-1;
   const seed=i*113+d+sx*.013+sy*.011;
   const size=1.2+(Math.sin(seed)*.5+.5)*1.45;
   shoreStone(g,sx+ty*landSide*.45,.05,sy-tx*landSide*.45,size,seed);
   shoreStone(g,sx-ty*landSide*.4+tx*1.6,1.25,sy+tx*landSide*.4+ty*1.6,size*.7,seed+1);
   count+=2;
  }
 }
}
export function buildGeography(x,y,radius=2200,local=false){const g=geometry();for(let n=0;n<bounds.length;n++){const b=bounds[n];if(b[0]>x+radius||b[1]<x-radius||b[2]>y+radius||b[3]<y-radius)continue;const i=n*9,points=[0,3,6].map(j=>[data[i+j],data[i+j+2],data[i+j+1]]),height=(points[0][1]+points[1][1]+points[2][1])/3,color=height>650?[.51,.52,.48]:height>250?[.23,.29,.24]:[.19,.28,.20];g.tri(points[0],points[2],points[1],color,.97,-1);}
 // Give the shoreline a solid bank instead of a floating paper-thin surface.
 for(const land of WORLD_LAND){for(const ring of [land.outer,...land.holes])for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];if(Math.min(a.x,b.x)>x+radius||Math.max(a.x,b.x)<x-radius||Math.min(a.y,b.y)>y+radius||Math.max(a.y,b.y)<y-radius)continue;const ah=Math.max(6,groundHeight(a.x,a.y)),bh=Math.max(6,groundHeight(b.x,b.y));g.quad([a.x,-8,a.y],[b.x,-8,b.y],[b.x,bh,b.y],[a.x,ah,a.y],[.25,.27,.24],.98,-1);}}
 for(const building of city){const points=building.points,at=points[0];if(Math.abs(at.x-x)>radius||Math.abs(at.y-y)>radius)continue;const base=Math.max(...points.slice(0,8).map(p=>groundHeight(p.x,p.y))),h=base+building.height;for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j];g.quad([a.x,base,a.y],[a.x,h,a.y],[b.x,h,b.y],[b.x,base,b.y],[.39,.42,.38],.85);}for(let j=2;j<points.length-1;j++)g.tri([at.x,h,at.y],[points[j-1].x,h,points[j-1].y],[points[j].x,h,points[j].y],[.27,.31,.31],.8);}
 for(const road of roads){if(road.every(p=>Math.abs(p.x-x)>radius||Math.abs(p.y-y)>radius))continue;for(let i=1;i<road.length;i++){const a=road[i-1],b=road[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,nx=-dy/d*2.6,ny=dx/d*2.6,ah=groundHeight(a.x,a.y)+.14,bh=groundHeight(b.x,b.y)+.14;g.quad([a.x+nx,ah,a.y+ny],[b.x+nx,bh,b.y+ny],[b.x-nx,bh,b.y-ny],[a.x-nx,ah,a.y-ny],[.18,.20,.20],.98);}}
 for(const pier of piers){if(pier.every(p=>Math.abs(p.x-x)>radius||Math.abs(p.y-y)>radius))continue;for(let i=1;i<pier.length;i++){const a=pier[i-1],b=pier[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,nx=-dy/d*2,ny=dx/d*2;g.quad([a.x+nx,2.1,a.y+ny],[b.x+nx,2.1,b.y+ny],[b.x-nx,2.1,b.y-ny],[a.x-nx,2.1,a.y-ny],[.32,.31,.27],.8);}}
 pileShoreRocks(g,x,y,radius);
 if(local)for(let i=0;i<g.data.length;i+=11){g.data[i]-=x;g.data[i+2]-=y;}
 return g.array();}
