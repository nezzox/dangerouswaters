import {deckSign,hullPaint} from './vessel-profile.mjs?v=0.18.35';
import {craneColor} from './crane-style.mjs?v=0.18.35';
import {lineHaulerMounts} from './line-hauler.mjs?v=0.18.35';
import {vesselStyle,rackPositions,rackFrames,gantryPlacement} from './vessel-style.mjs?v=0.18.35';
import {HULL_STATIONS,hullWidthAt} from './fenders.mjs?v=0.18.35';
const steel=[.19,.24,.25],paint=[.68,.7,.64],dark=[.045,.08,.1],glass=[.055,.13,.17],brass=[.43,.31,.13],orange=[.72,.29,.065];
export function geometry(){const data=[];
 function tri(a,b,c,color,rough=.6,emit=0){const u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n);if(len<1e-8)return;for(const p of [a,b,c])data.push(...p,...n.map(x=>x/len),...color,rough,emit);}
 function quad(a,b,c,d,color,rough=.6,emit=0){tri(a,b,c,color,rough,emit);tri(a,c,d,color,rough,emit);}
 function box(x,y,z,w,h,d,col=paint,r=.6,emit=0){const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,g=z+d/2;quad([a,c,f],[a,e,f],[b,e,f],[b,c,f],col,r,emit);quad([b,c,g],[b,e,g],[a,e,g],[a,c,g],col,r,emit);quad([a,e,f],[a,e,g],[b,e,g],[b,e,f],col,r,emit);quad([a,c,g],[a,c,f],[b,c,f],[b,c,g],col,r,emit);quad([a,c,g],[a,e,g],[a,e,f],[a,c,f],col,r,emit);quad([b,c,f],[b,e,f],[b,e,g],[b,c,g],col,r,emit);}
 function tube(a,b,r,col=steel,segments=12,rough=.45,emit=0){const axis=b.map((x,i)=>x-a[i]),l=Math.hypot(...axis);if(l<.0001)return;const n=axis.map(v=>v/l),ref=Math.abs(n[1])>.9?[1,0,0]:[0,1,0],u=[n[1]*ref[2]-n[2]*ref[1],n[2]*ref[0]-n[0]*ref[2],n[0]*ref[1]-n[1]*ref[0]],ul=Math.hypot(...u);for(let i=0;i<3;i++)u[i]/=ul;const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]],p=(o,t)=>o.map((x,i)=>x+r*(u[i]*Math.cos(t)+v[i]*Math.sin(t)));for(let i=0;i<segments;i++){const t=i*Math.PI*2/segments,k=(i+1)*Math.PI*2/segments;const start=data.length;quad(p(a,k),p(b,k),p(b,t),p(a,t),col,rough,emit);for(let j=start;j<data.length;j+=11){const d=[data[j]-a[0],data[j+1]-a[1],data[j+2]-a[2]],along=d.reduce((v,c,k)=>v+c*n[k],0),radial=d.map((v,k)=>v-along*n[k]),rl=Math.hypot(...radial);for(let k=0;k<3;k++)data[j+3+k]=radial[k]/rl;}tri(a,p(a,k),p(a,t),col,rough,emit);tri(b,p(b,t),p(b,k),col,rough,emit);}}
 // Rounded box with analytic edge normals: curved steelwork catches broad highlights.
 function roundedBox(x,y,z,w,h,d,r,col=paint,rough=.5){r=Math.min(r,w/2,h/2,d/2);const half=[w/2,h/2,d/2],center=[x,y,z],inner=half.map(v=>v-r),steps=k=>[-half[k],-inner[k]-r*.7,-inner[k]-r*.3,-inner[k],inner[k],inner[k]+r*.3,inner[k]+r*.7,half[k]];for(let axis=0;axis<3;axis++)for(const side of [-1,1]){const u=(axis+1)%3,v=(axis+2)%3,us=steps(u),vs=steps(v),point=(a,b)=>{const p=[0,0,0];p[axis]=side*half[axis];p[u]=a;p[v]=b;const q=p.map((c,k)=>Math.max(-inner[k],Math.min(inner[k],c))),n=p.map((c,k)=>c-q[k]),l=Math.hypot(...n);return {p:q.map((c,k)=>center[k]+c+r*n[k]/l),n:n.map(c=>c/l)};};for(let i=0;i<us.length-1;i++)for(let j=0;j<vs.length-1;j++){const a=point(us[i],vs[j]),b=point(us[i+1],vs[j]),c=point(us[i+1],vs[j+1]),d=point(us[i],vs[j+1]);for(const t of side>0?[[a,b,c],[a,c,d]]:[[a,c,b],[a,d,c]])for(const vertex of t)data.push(...vertex.p,...vertex.n,...col,rough,0);}}}
 function ellipsoid(x,y,z,rx,ry,rz,col=paint,rough=.6){const start=data.length,point=(a,b)=>[x+rx*Math.sin(a)*Math.cos(b),y+ry*Math.cos(a),z+rz*Math.sin(a)*Math.sin(b)];for(let i=0;i<10;i++)for(let j=0;j<16;j++){const a=i*Math.PI/10,b=j*Math.PI/8,c=(i+1)*Math.PI/10,d=(j+1)*Math.PI/8;if(i>0)tri(point(a,b),point(a,d),point(c,b),col,rough);if(i<9)tri(point(a,d),point(c,d),point(c,b),col,rough);}for(let k=start;k<data.length;k+=11){const n=[(data[k]-x)/(rx*rx),(data[k+1]-y)/(ry*ry),(data[k+2]-z)/(rz*rz)],l=Math.hypot(...n);for(let q=0;q<3;q++)data[k+3+q]=n[q]/l;}}
 return {data,tri,quad,box,tube,ellipsoid,roundedBox,array:()=>new Float32Array(data)};
}
export function buildVessel(potCount=8,design={}){const orange=craneColor(design),paint=hullPaint(design),g=geometry(),{box,tube,quad,tri,roundedBox,ellipsoid}=g;
 const orientation=deckSign(design),control=design.rampBow?HULL_STATIONS.map(([x,w])=>[x,x>=8?2.7:w]):HULL_STATIONS;const sections=[];for(let i=0;i<control.length-1;i++)for(let j=0;j<6;j++){const t=j/6,[x,a]=control[i],[xx,b]=control[i+1],before=control[Math.max(0,i-1)],after=control[Math.min(control.length-1,i+2)],m0=(b-before[1])/(xx-before[0]),m1=(after[1]-a)/(after[0]-x),w=(2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*(xx-x)*m0+(-2*t**3+3*t*t)*b+(t**3-t*t)*(xx-x)*m1;sections.push([x+(xx-x)*t,Math.max(.06,w)]);}sections.push(control.at(-1));
 for(let i=0;i<sections.length-1;i++){const [x,a]=sections[i],[xx,b]=sections[i+1];for(const side of [-1,1]){
  const face=(a,b,c,d,col,r)=>side>0?quad(a,b,c,d,col,r):quad(d,c,b,a,col,r);
  face([x,-1.3,a*.55*side],[xx,-1.3,b*.55*side],[xx,.35,b*side],[x,.35,a*side],[.18,.075,.055],.8);
  face([x,.35,a*side],[xx,.35,b*side],[xx,1.75,b*side],[x,1.75,a*side],dark,.38);
  face([x,1.75,a*side],[xx,1.75,b*side],[xx,2.15,b*side],[x,2.15,a*side],paint,.55);
  tube([x,2.2,a*side],[xx,2.2,b*side],.075,paint);tube([x,3.,a*side],[xx,3.,b*side],.035,paint);
  tube([x,2.15,a*side],[x,3.,a*side],.035,paint);
 }const opening=orientation>0?[-2.8,-1]:[1,2.8],cuts=[x,...opening.filter(v=>v>x&&v<xx),xx];for(let j=0;j<cuts.length-1;j++){const l=cuts[j],r=cuts[j+1],lw=a+(b-a)*(l-x)/(xx-x),rw=a+(b-a)*(r-x)/(xx-x);if(l>=opening[0]&&r<=opening[1]){quad([l,1.7,-lw],[l,1.7,-1.4],[r,1.7,-1.4],[r,1.7,-rw],[.25,.29,.23],.82);quad([l,1.7,.4],[l,1.7,lw],[r,1.7,rw],[r,1.7,.4],[.25,.29,.23],.82);}else quad([l,1.7,-lw],[l,1.7,lw],[r,1.7,rw],[r,1.7,-rw],[.25,.29,.23],.82);}}
 box(-11.95,1.,0,.25,2.2,5.6,dark);tube([-12,2.2,-2.8],[-12,2.2,2.8],.08,paint);for(const y of [2.6,3.])tube([-12,y,-2.8],[-12,y,2.8],.04,paint);for(let z=-2.8;z<=2.81;z+=.8)tube([-12,2.15,z],[-12,3.,z],.045,paint);
 const upperStart=g.data.length;
 for(let z=-3.;z<3.;z+=.28)if(z< -1.4||z>.4){
  if(orientation>0){box(-5,1.73,z,12,.025,.022,[.13,.17,.14],.9);continue;}
  // Upper fittings are mirrored below. Trim each plank against the physical bow first.
  const fits=x=>{const physical=-x,i=Math.max(0,sections.findIndex((p,k)=>k<sections.length-1&&physical<=sections[k+1][0])),[a,w]=sections[i],[b,v]=sections[i+1],width=w+(v-w)*(physical-a)/(b-a);return Math.abs(z)+.011+.04<=width;};
  let start=-11;if(!fits(start)){let lo=start,hi=1;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(fits(mid))hi=mid;else lo=mid;}start=hi;}
  box((start+1)/2,1.73,z,1-start,.025,.022,[.13,.17,.14],.9);
 }
 // Sloping bridge glazing, rounded lower cabin and overhanging roof.
 roundedBox(3.4,2.8,0,6.3,2.1,5.25,design.powertrain==='electric'?.5:.22,paint,.48);
 const front=y=>6.55-(y-3.8)*.6/1.95,sideZ=y=>2.625-(y-3.8)*.305/1.95;
 quad([6.55,3.8,-2.625],[5.95,5.75,-2.32],[5.95,5.75,2.32],[6.55,3.8,2.625],paint,.48);
 quad([.25,3.8,2.625],[.45,5.75,2.32],[.45,5.75,-2.32],[.25,3.8,-2.625],paint,.48);
 for(const side of [-1,1]){const points=[[.25,3.8,side*2.625],[6.55,3.8,side*2.625],[5.95,5.75,side*2.32],[.45,5.75,side*2.32]];if(side<0)points.reverse();quad(...points,paint,.48);
  for(const x of [1.2,2.7,4.2]){const y0=4.02,y1=5.48,z0=side*(sideZ(y0)+.025),z1=side*(sideZ(y1)+.025),corners=[[x-.62,y0,z0],[x+.62,y0,z0],[x+.62,y1,z1],[x-.62,y1,z1]];if(side<0)corners.reverse();quad(...corners,glass,.08);for(let i=0;i<4;i++)tube(corners[i],corners[(i+1)%4],.031,dark,8);tube([x,y0+.08,z0+side*.025],[x+.24,4.95,side*(sideZ(4.95)+.05)],.018,dark,8);}
  tube([-.1,2.,side*3.2],[-.1,4.2,side*3.2],.055,paint);
 }
 for(const z of [-1.65,-.55,.55,1.65]){const y0=4.02,y1=5.48,corners=[[front(y0)+.025,y0,z-.48],[front(y1)+.025,y1,z-.48],[front(y1)+.025,y1,z+.48],[front(y0)+.025,y0,z+.48]];quad(...corners,glass,.08);for(let i=0;i<4;i++)tube(corners[i],corners[(i+1)%4],.03,dark,8);tube([front(y0)+.06,y0,z],[front(5.05)+.06,5.05,z+.18],.018,dark,8);}
 roundedBox(3.2,5.92,0,7.1,.3,5.85,.13,[.77,.77,.69],.35);
 box(3.4,6.15,0,1.9,.3,1.6,[.32,.37,.34]);box(3.4,6.34,0,1.6,.1,1.3,glass,.12);
 for(let x=.1;x<6.8;x+=1.1)box(x,6.085,0,.018,.012,5.5,[.45,.5,.45]);
 if(design.powertrain!=='electric'){
 // Mast, radar, aerials, stays and stack.
 tube([2.8,6.,0],[2.8,11.,0],.11,paint,10);tube([2.8,9.,-2.1],[2.8,9.,2.1],.07,paint);tube([-1,2.,-3],[2.8,10.,0],.018,steel,5);tube([-1,2.,3],[2.8,10.,0],.018,steel,5);
 box(2.8,9.25,0,.55,.3,3.4,paint);tube([4.6,6.,1],[4.6,8.6,1],.018,steel,5);tube([1.5,6.,-1],[1.5,8.9,-1],.018,steel,5);box(.3,5.9,-1.5,.6,2.5,.7,[.24,.25,.22]);box(.3,7.2,-1.5,.8,.18,.9,dark);
 }else{roundedBox(3.4,6.2,0,7.8,.45,6.3,.2,paint,.24);tube([3.2,6.5,0],[3.2,8.2,0],.07,steel,8);box(3.2,8.2,0,.45,.18,1.7,paint);for(let x=.4;x<6.4;x+=1.3)for(const z of [-1.5,1.5]){box(x,6.48,z,1.15,.04,2.55,[.035,.07,.085],.18);for(let i=0;i<5;i++)box(x,6.51,z-1+i*.5,1.08,.008,.012,[.25,.31,.32],.5);}}
 // Hull-specific hauler mounts; animated booms are rendered separately.
 const layouts=design.hauler==='both'?['starboard','port']:[design.hauler||'starboard'];for(const layout of layouts){const side=layout==='port'?-1:1,stern=layout==='stern',pivot=stern?[-8.1,2.1,1.6]:[-1.5,2.1,side*2.1];tube([pivot[0],1.8,pivot[2]],[pivot[0],5.1,pivot[2]],.18,orange,10);}
 for(const [x,y,z] of lineHaulerMounts(design)){
 const rubber=[.035,.045,.042];for(const side of [-1,1]){for(let i=0;i<32;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16,point=(t,r,d)=>[x+Math.cos(t)*r,y+Math.sin(t)*r,z+d];quad(point(a,.42,side*.16),point(b,.42,side*.16),point(b,.24,side*.025),point(a,.24,side*.025),rubber,.88);quad(point(a,.42,side*.16),point(a,.36,side*.21),point(b,.36,side*.21),point(b,.42,side*.16),rubber,.88);}tube([x,y,z+side*.2],[x,y,z+side*.23],.12,steel,16);}
 for(const dx of [-.3,.3])tube([x+dx,1.85,z-.27],[x+dx,y+.05,z-.27],.045,paint,8);tube([x-.34,y+.05,z-.27],[x+.34,y+.05,z-.27],.045,paint,8);tube([x,y,z-.4],[x,y,z-.23],.15,orange,12);tube([x+.33,y-.22,z-.12],[x+.33,y-.22,z+.12],.12,rubber,16);tube([x+.33,y-.22,z-.23],[x+.33,y-.22,z-.13],.045,steel,8);
 }
 if(design.salmon){for(const x of [-8.8,-6.7]){tube([x,1.8,-1.8],[x,3,-1.8],.09,steel);tube([x,1.8,0],[x,3,0],.09,steel);}tube([-7.75,2.8,-1.9],[-7.75,2.8,.1],.7,[.15,.28,.25],16);for(let z=-1.8;z<.1;z+=.12)tube([-7.75,2.8,z],[-7.75,2.8,z+.035],.76,[.3,.39,.31],16);}
 // Raised transport racks provide real headroom below the central row.
 for(const p of rackFrames(design)){const [sx,sy,sz]=p.scale,top=p.y-.64*sy;for(const x of [-.82,.82])for(const z of [-.8,.8])tube([p.x+x*sx,1.74,p.z+z*sz],[p.x+x*sx,top,p.z+z*sz],.045,steel,8);for(const z of [-.8,.8])tube([p.x-.86*sx,top,p.z+z*sz],[p.x+.86*sx,top,p.z+z*sz],.055,steel,8);for(const x of [-.82,.82])tube([p.x+x*sx,top,p.z-.86*sz],[p.x+x*sx,top,p.z+.86*sz],.055,steel,8);}
 // Wire cages remain open so the deck and cage shadows can be seen through them.
 for(const [i,{x,z,y,scale}] of rackPositions(potCount,design).entries())addRackPot(g,x,y,z,i,scale);
 for(const side of [-1,1]){box(5.4,5.5,side*2.75,.3,.16,.2,side<0?[.6,.015,.005]:[.015,.5,.13],.2,1);box(-.3,5.3,side*2.72,.4,.25,.24,[1.,.69,.28],.2,1.4);}
 // Directional searchlight and side floodlight housings.
 tube([6.8,5.3,0],[7.2,5.3,0],.23,steel,10);tube([7.2,5.3,0],[7.23,5.3,0],.19,[.78,.9,1.],10,.05);box(7.24,5.3,0,.03,.3,.3,[.78,.9,1.],.1,2);
 for(const side of [-1,1])box(0,5.4,side*2.82,.42,.3,.1,[.78,.9,1.],.1,1.5);
 // Survival equipment establishes scale without external models.
 for(const side of [-1,1])for(let i=0;i<16;i++){const a=i*Math.PI/8,b=(i+1)*Math.PI/8;tube([6.+Math.cos(a)*.48,3.4+Math.sin(a)*.48,side*2.76],[6.+Math.cos(b)*.48,3.4+Math.sin(b)*.48,side*2.76],.11,i%4===0?paint:orange,6);}
 // Rubber fenders, window seals and wipers, mooring cleats, hoses and fittings.
 for(const side of [-1,1]){
  for(const x of [-10.7,8.5]){const z=orientation>0?2.45:Math.min(2.45,hullWidthAt(orientation*x,design)-.35);tube([x,1.85,side*z],[x,2.1,side*z],.09,steel,12);tube([x-.32,2.1,side*z],[x+.32,2.1,side*z],.07,steel,12);}
  for(let x=-10.8;x<8;x+=1.8)box(x,1.94,side*(orientation>0?(x<4?3.5:2.8):(Math.min(hullWidthAt(orientation*(x-.2),design),hullWidthAt(orientation*(x+.2),design))-.045)),.4,.13,.04,dark,.85);
 }
 for(let i=0;i<44;i++){const a=i*Math.PI/11,b=(i+1)*Math.PI/11,r=.48+Math.floor(i/22)*.12;tube([-5.7+Math.cos(a)*r,1.83+i*.001,2.25+Math.sin(a)*r],[-5.7+Math.cos(b)*r,1.83+(i+1)*.001,2.25+Math.sin(b)*r],.04,[.36,.31,.2],8);}
 roundedBox(-.45,6.8,-1.5,.9,1.7,1.1,.14,steel,.5);for(let y=6.2;y<7.4;y+=.15)box(-.91,y,-1.5,.025,.055,.8,dark,.8);
 for(const z of [-1.4,1.4]){tube([4.9,6.1,z],[4.9,6.4,z],.08,steel,12);tube([4.9,6.4,z],[5.2,6.4,z],.14,paint,16);}
 for(let y=2.3;y<5.7;y+=.3){tube([.05,y,-2.86],[.05,y, -3.18],.025,steel,8);}tube([.05,2,-2.86],[.05,5.9,-2.86],.035,steel,10);tube([.05,2,-3.18],[.05,5.9,-3.18],.035,steel,10);
 // Aft cabin doorway: black recess, raised frame and a separately animated door leaf.
 box(.15,2.85,1.65,.08,2.05,1.05,[.008,.014,.015],.9);for(const z of [1.07,2.23])box(.06,2.85,z,.12,2.2,.08,paint);box(.06,3.97,1.65,.12,.12,1.25,paint);box(-.05,1.79,1.65,.6,.12,1.25,steel);
 // Raised metal lettering and deck hardware are actual geometry, so they catch light.
 const glyphs={N:[[0,0,0,1],[0,1,.6,0],[.6,0,.6,1]],O:[[0,0,0,1],[0,1,.6,1],[.6,1,.6,0],[.6,0,0,0]],R:[[0,0,0,1],[0,1,.6,1],[.6,1,.6,.5],[.6,.5,0,.5],[0,.5,.6,0]],D:[[0,0,0,1],[0,1,.5,.85],[.5,.85,.5,.15],[.5,.15,0,0]],V:[[0,1,.3,0],[.3,0,.6,1]],I:[[.3,0,.3,1]]};
 Object.assign(glyphs,{A:[[0,0,.3,1],[.3,1,.6,0],[.15,.45,.45,.45]],B:[[0,0,0,1],[0,1,.6,.8],[.6,.8,0,.5],[0,.5,.6,.25],[.6,.25,0,0]],C:[[.6,1,0,1],[0,1,0,0],[0,0,.6,0]],E:[[0,0,0,1],[0,1,.6,1],[0,.5,.5,.5],[0,0,.6,0]],F:[[0,0,0,1],[0,1,.6,1],[0,.5,.5,.5]],G:[[.6,1,0,1],[0,1,0,0],[0,0,.6,0],[.6,0,.6,.5],[.6,.5,.3,.5]],H:[[0,0,0,1],[.6,0,.6,1],[0,.5,.6,.5]],J:[[.6,1,.6,0],[.6,0,0,0],[0,0,0,.3]],K:[[0,0,0,1],[0,.5,.6,1],[0,.5,.6,0]],L:[[0,1,0,0],[0,0,.6,0]],M:[[0,0,0,1],[0,1,.3,.5],[.3,.5,.6,1],[.6,1,.6,0]],P:[[0,0,0,1],[0,1,.6,1],[.6,1,.6,.5],[.6,.5,0,.5]],Q:[[0,0,0,1],[0,1,.6,1],[.6,1,.6,0],[.6,0,0,0],[.3,.3,.7,-.1]],S:[[.6,1,0,1],[0,1,0,.5],[0,.5,.6,.5],[.6,.5,.6,0],[.6,0,0,0]],T:[[0,1,.6,1],[.3,1,.3,0]],U:[[0,1,0,0],[0,0,.6,0],[.6,0,.6,1]],W:[[0,1,.15,0],[.15,0,.3,.5],[.3,.5,.45,0],[.45,0,.6,1]],X:[[0,0,.6,1],[0,1,.6,0]],Y:[[0,1,.3,.5],[.6,1,.3,.5],[.3,.5,.3,0]],Z:[[0,1,.6,1],[.6,1,0,0],[0,0,.6,0]]});
 const segments=[[0,1,.6,1],[.6,1,.6,.5],[.6,.5,.6,0],[0,0,.6,0],[0,.5,0,0],[0,1,0,.5],[0,.5,.6,.5]];for(const [i,mask] of ['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'].entries())glyphs[i]=segments.filter((_,k)=>mask[k]==='1');
 for(const side of [-1,1])for(const [i,char] of [...(design.name?.toUpperCase()||'NORDVIND')].entries())for(const [a,b,c,d] of glyphs[char]||[])tube([(side>0?(orientation>0?1:5.25)+orientation*(i*(4.25/Math.max(8,design.name?.length||8))+a*.45):(orientation>0?5.25:1)-orientation*(i*(design.id&&design.id!=='nordvind'?4.25/Math.max(8,design.name?.length||8):.56)+a*.55)),3.15+b*.5,side*2.686],[(side>0?(orientation>0?1:5.25)+orientation*(i*(4.25/Math.max(8,design.name?.length||8))+c*.45):(orientation>0?5.25:1)-orientation*(i*(design.id&&design.id!=='nordvind'?4.25/Math.max(8,design.name?.length||8):.56)+c*.55)),3.15+d*.5,side*2.686],.022,design.powertrain==='electric'?[.65,.76,.72]:dark,4,.45,design.powertrain==='electric'?1.4:0);
 // Recessed hold hatch and sorting chute, with an actual opening in the deck mesh.
 box(-1.9,.55,-.5,1.8,.08,1.8,[.008,.014,.014],1);for(const x of [-2.85,-.95])box(x,1.35,-.5,.13,1.1,2.05,steel);for(const z of [-1.45,.45])box(-1.9,1.35,z,2.,1.1,.13,steel);for(const x of [-2.87,-.93])box(x,1.87,-.5,.16,.25,2.15,[.43,.45,.37]);for(const z of [-1.48,.48])box(-1.9,1.87,z,2.1,.25,.16,[.43,.45,.37]);
 box(-1.5,2.2,-2.3,.9,.9,.8,[.29,.3,.27]);tube([-1.5,2.65,-2.8],[-1.5,2.65,-1.8],.26,steel,12);
 box(10,2.1,0,.9,.5,1.1,steel);tube([9.4,2.3,-.5],[11.7,1.3,-.5],.05,steel);
 const compactCoil=!!design.id&&design.id!=='nordvind',coilX=compactCoil?8.5:8.25,coilZ=compactCoil?0:1.1,coilRadius=compactCoil?.25:.5;for(let i=0;i<24;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12;tube([coilX+Math.cos(a)*coilRadius,1.84,coilZ+Math.sin(a)*coilRadius],[coilX+Math.cos(b)*coilRadius,1.84,coilZ+Math.sin(b)*coilRadius],.07,[.48,.45,.29],5);}
 const style=vesselStyle(design);if(style.family){
 if(style.gantry){const {x,z,height:h}=gantryPlacement(design);for(const side of [-1,1]){tube([x,1.85,side*z],[x,h,side*z],.16,paint,10);tube([x+1.4,1.85,side*z],[x,h,side*z],.09,steel,8);}tube([x,h,-z],[x,h,z],.2,paint,10);box(x,h,0,.7,.6,1.1,orange);}
 if(style.exhausts===2&&design.powertrain!=='electric')for(const z of [-1.65,1.65]){tube([1.2,5.9,z],[1.2,8.2,z],.22,dark,10);tube([1.2,8.2,z],[.7,8.5,z],.24,steel,10);}
 if(style.upperBridge&&design.powertrain!=='electric'){roundedBox(3.2,6.7,0,3.1,1.4,3.7,.2,paint);box(4.76,6.85,0,.03,.65,2.9,glass,.1);roundedBox(3.2,7.5,0,3.6,.2,4.1,.12,paint);}
 if(style.bowShield)for(const side of [-1,1]){quad([8,2.2,side*2.4],[11.5,2.2,side*.8],[11.5,3.2,side*.8],[8,3.5,side*2.4],paint,.7);}
 if(style.radarArch){for(const side of [-1,1])tube([4.2,6,side*2.3],[4.2,7.3,side*2.3],.09,steel,8);tube([4.2,7.3,-2.3],[4.2,7.3,2.3],.1,paint,8);box(4.2,7.5,0,.8,.3,1.8,paint);}
 }
 if(orientation<0){for(let i=upperStart;i<g.data.length;i+=11){g.data[i]*=-1;g.data[i+3]*=-1;}}
 if(design.rampBow){quad([12.2,.35,-2.7],[12.2,.35,2.7],[12.2,2.7,2.7],[12.2,2.7,-2.7],paint,.75);for(const z of [-2.4,-1.2,0,1.2,2.4])tube([12.24,.6,z],[12.24,2.45,z],.055,steel,8);}
 return g.array();}
function addRackPot(g,x,y,z,i,scale=[1,1,1]){const start=g.data.length,{tube}=g;const c=[.39+(i%3)*.025,.31,.16];
  const xx=[x-.85,x+.85],yy=[y-.58,y+.58],zz=[z-.83,z+.83];for(const a of xx)for(const b of yy)tube([a,b,zz[0]],[a,b,zz[1]],.035,c,5);for(const a of xx)for(const b of zz)tube([a,yy[0],b],[a,yy[1],b],.035,c,5);for(const a of yy)for(const b of zz)tube([xx[0],a,b],[xx[1],a,b],.035,c,5);
  for(let j=-.6;j<.8;j+=.32){for(const side of [-1,1]){tube([x+j,yy[0],z+side*.83],[x+j,yy[1],z+side*.83],.012,c,4);tube([x-.85,yy[1],z+j],[x+.85,yy[1],z+j],.012,c,4);}}
 if(scale.some(v=>v!==1))for(let i=start;i<g.data.length;i+=11){for(let k=0;k<3;k++){const offset=[x,y,z][k];g.data[i+k]=offset+(g.data[i+k]-offset)*scale[k];g.data[i+3+k]/=scale[k];}const length=Math.hypot(...g.data.slice(i+3,i+6));for(let k=0;k<3;k++)g.data[i+3+k]/=length;}
}
export function buildRackPot(variant=0){const g=geometry();addRackPot(g,0,0,0,variant);return g.array();}
export function buildBuoy(color=orange){const g=geometry();g.tube([0,-.4,0],[0,.9,0],.48,color,12);g.tube([0,.35,0],[0,.6,0],.5,paint,12);g.tube([0,.9,0],[0,2.1,0],.035,steel);g.box(.35,1.9,0,.7,.35,.025,color);return g.array();}
export function buildOceanGrid(size=4000,segments=220){const data=new Float32Array(segments*segments*18),half=size/2;let k=0;for(let z=0;z<segments;z++)for(let x=0;x<segments;x++){const coord=v=>Math.sinh((v/segments*2-1)*5.5)/Math.sinh(5.5)*half,a=coord(x),b=coord(z),c=coord(x+1),d=coord(z+1);for(const p of [[a,0,b],[a,0,d],[c,0,b],[c,0,b],[a,0,d],[c,0,d]])for(const v of p)data[k++]=v;}return data;}

export function buildCrewParts(role=0){
 const jacket=[[.72,.29,.065],[.12,.2,.26],[.7,.59,.16]][role%3],helmet=[[.85,.72,.16],[.82,.35,.12],[.7,.73,.65]][role%3],skin=[[.57,.42,.3],[.38,.26,.18],[.69,.51,.39]][role%3];
 const torso=geometry(),head=geometry(),arm=geometry(),forearm=geometry(),thigh=geometry(),shin=geometry();
 torso.ellipsoid(0,1.1,0,.23,.36,.29,jacket,.7);torso.ellipsoid(.02,.81,0,.21,.2,.25,dark,.8);torso.tube([0,1.16,-.26],[0,1.16,.26],.052,[.76,.81,.51],16);torso.tube([.22,.88,0],[.22,1.32,0],.013,dark);
 head.ellipsoid(0,1.59,0,.165,.22,.16,skin);head.ellipsoid(.15,1.6,0,.07,.055,.055,skin);head.ellipsoid(0,1.76,0,.21,.12,.22,helmet);head.roundedBox(.09,1.7,0,.31,.035,.47,.015,helmet,.5);head.tube([0,1.38,0],[0,1.48,0],.085,[.39,.28,.2],12);for(const side of [-1,1]){head.ellipsoid(.139,1.64,side*.065,.025,.018,.025,[.025,.03,.025]);head.ellipsoid(-.01,1.61,side*.168,.05,.08,.035,jacket);torso.roundedBox(.21,1.02,side*.15,.06,.16,.16,.025,[.48,.2,.04],.8);}
 arm.tube([0,0,0],[0,-.32,0],.09,jacket,8);arm.tube([0,-.12,0],[0,-.18,0],.096,[.76,.81,.51],8);
 forearm.tube([0,0,0],[0,-.29,0],.075,jacket,8);forearm.ellipsoid(.025,-.3,0,.09,.085,.08,dark,.8);
 thigh.tube([0,0,0],[0,-.36,0],.105,[.17,.2,.18],8);shin.tube([0,0,0],[0,-.38,0],.085,[.09,.12,.12],8);shin.roundedBox(.07,-.37,0,.28,.14,.19,.05,dark,.85);
 return {torso:torso.array(),head:head.array(),arm:arm.array(),forearm:forearm.array(),thigh:thigh.array(),shin:shin.array()};
}

export function buildDeckEquipment(){const pot=geometry(),boom=geometry(),rope=geometry(),lid=geometry(),crab=geometry(),hook=geometry(),throwLine=geometry(),door=geometry(),fender=geometry(),retch=geometry(),softRope=geometry(),tote=geometry(),trolley=geometry(),haulerRotor=geometry(),craneControls=geometry(),controlLever=geometry();
 for(const x of [-.85,.85])for(const y of [-.6,.6])pot.tube([x,y,-.85],[x,y,.85],.04,brass,6);for(const x of [-.85,.85])for(const z of [-.85,.85])pot.tube([x,-.6,z],[x,.6,z],.04,brass,6);for(const y of [-.6,.6])for(const z of [-.85,.85])pot.tube([-.85,y,z],[.85,y,z],.04,brass,6);
 for(let i=-.65;i<.8;i+=.25)for(const side of [-1,1]){pot.tube([i,-.6,side*.85],[i,.6,side*.85],.015,brass,4);pot.tube([side*.85,-.6,i],[side*.85,.6,i],.015,brass,4);}pot.tube([0,.6,0],[0,1.1,0],.035,steel,6);
 for(const side of [-1,1]){boom.tube([0,0,side*.12],[1.85,.68,side*.12],.11,orange,10);boom.tube([1.65,.61,side*.1],[3,1.1,side*.1],.075,orange,10);boom.tube([0,-.38,side*.16],[1.4,.18,side*.16],.09,steel,10);boom.tube([1.05,.04,side*.16],[2.35,.81,side*.16],.043,[.62,.65,.65],10);for(const at of [[0,0],[1.75,.65],[2.95,1.08]])boom.ellipsoid(at[0],at[1],side*.19,.1,.1,.04,steel,.3);}boom.tube([2.85,1.05,-.17],[2.85,1.05,.17],.16,dark,12);boom.tube([.2,.25,-.22],[1.5,.75,-.22],.022,dark,6);rope.tube([0,0,0],[0,1,0],.022,steel,6);
 lid.box(0,.05,.9,1.75,.1,1.8,[.32,.37,.32],.5);lid.box(0,.13,.9,.3,.08,.2,steel);
 crab.ellipsoid(0,.055,0,.18,.09,.16,[.39,.17,.055],.35);for(const side of [-1,1]){crab.tube([.1,.06,side*.1],[.3,.1,side*.24],.035,[.48,.22,.08],8);crab.ellipsoid(.31,.11,side*.25,.09,.04,.055,[.48,.22,.08],.4);crab.tube([.35,.11,side*.25],[.42,.11,side*.22],.02,[.6,.32,.11],8);}for(const side of [-1,1])for(let i=0;i<4;i++){const x=-.12+i*.08;crab.tube([x,.06,side*.1],[x-.12,.03,side*.32],.018,[.45,.19,.06],5);crab.tube([x-.12,.03,side*.32],[x-.18,-.04,side*.42],.012,[.45,.19,.06],5);}hook.tube([0,.35,0],[0,0,0],.035,steel,7);for(let i=0;i<3;i++){const a=i*Math.PI*2/3,x=Math.cos(a),z=Math.sin(a);hook.tube([0,0,0],[x*.28,-.18,z*.28],.025,steel,6);hook.tube([x*.28,-.18,z*.28],[x*.35,.08,z*.35],.025,steel,6);}
 throwLine.tube([0,0,0],[0,1,0],.055,[.74,.57,.28],6,.8);
 door.roundedBox(0,1.04,.53,.085,2.,1.02,.035,[.39,.47,.44],.5);door.box(-.05,1.48,.53,.025,.5,.58,glass,.1);for(const z of [.04,1.03])door.tube([-.05,.12,z],[-.05,1.98,z],.022,steel);door.tube([-.1,.86,.9],[-.1,1.06,.9],.027,steel,10);
 fender.ellipsoid(0,-.57,0,.25,.57,.25,[.022,.028,.025],.92);for(const y of [-.17,-.95]){fender.tube([0,y-.04,0],[0,y+.04,0],.24,[.04,.045,.04],16,.85);}fender.tube([0,0,0],[0,.12,0],.07,[.09,.12,.1],12);
 retch.ellipsoid(0,0,0,.027,.055,.025,[.28,.3,.11],.9);
 softRope.tube([0,0,0],[0,1,0],.007,[.29,.26,.19],6,.98);
 tote.roundedBox(0,0,0,.64,.42,.48,.045,[.15,.28,.27],.85);for(const z of [-.25,.25]){tote.tube([-.26,.23,z],[.26,.23,z],.025,[.3,.42,.37],8);tote.box(0,.08,z,.2,.055,.02,[.025,.04,.035],.9);}
 trolley.box(0,.24,0,1.4,.12,.85,steel,.7);for(const x of [-.5,.5])for(const z of [-.4,.4])trolley.tube([x,.14,z-.05],[x,.14,z+.05],.14,dark,12);for(const z of [-.35,.35]){trolley.tube([-.65,.3,z],[-.65,1.05,z],.035,steel);trolley.tube([-.65,1.05,z],[0,1.05,z],.035,steel);}
 for(const z of [-.215,.215]){for(let i=0;i<4;i++){const a=i*Math.PI/2;haulerRotor.tube([Math.cos(a)*.13,Math.sin(a)*.13,z],[Math.cos(a)*.35,Math.sin(a)*.35,z],.018,[.46,.49,.45],6);}haulerRotor.tube([.34,0,z],[.4,0,z],.028,[.9,.68,.2],6);}
 craneControls.roundedBox(0,0,0,.42,.22,.48,.035,[.16,.2,.19],.65);for(const z of [-.13,.13])craneControls.tube([0,.115,z],[0,.13,z],.065,steel,8);craneControls.ellipsoid(-.14,.14,0,.045,.03,.045,[.45,.12,.08],.65);controlLever.tube([0,0,0],[0,.2,0],.018,steel,8);controlLever.ellipsoid(0,.22,0,.04,.035,.04,dark,.8);
 return {craneControls:craneControls.array(),controlLever:controlLever.array(),haulerRotor:haulerRotor.array(),tote:tote.array(),trolley:trolley.array(),softRope:softRope.array(),door:door.array(),fender:fender.array(),retch:retch.array(),throwLine:throwLine.array(),hook:hook.array(),pot:pot.array(),boom:boom.array(),rope:rope.array(),lid:lid.array(),crab:crab.array()};
}

export function buildDeckWash(design={}){const g=geometry();for(let x=-11.8;x<11.8;x+=.3)for(let z=-3.4;z<3.4;z+=.3){const r=x+.3,b=z+.3;if(x*deckSign(design)>-.5)continue;if(Math.max(Math.abs(z),Math.abs(b))>Math.min(hullWidthAt(x,design),hullWidthAt(r,design))-.12)continue;const a=deckSign(design)>0?-2.9:.9,c=deckSign(design)>0?-.9:2.9;if(x<c&&r>a&&z<.55&&b>-1.55)continue;g.quad([x,1.795,z],[x,1.795,b],[r,1.795,b],[r,1.795,z],[.17,.26,.27],.12);}return g.array();}
