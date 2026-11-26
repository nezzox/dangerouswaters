import {deckSign,hullPaint,vesselExterior,workX,HIGHWATER_SEARCHLIGHT} from './vessel-profile.mjs?v=0.18.89';
import {craneColor} from './crane-style.mjs?v=0.18.89';
import {crewStations} from './crew-stations.mjs?v=0.18.89';
import {canStand} from './deck-layout.mjs?v=0.18.89';
import {lineHaulerMounts} from './line-hauler.mjs?v=0.18.89';
import {vesselStyle,rackPositions,rackFrames,gantryPlacement} from './vessel-style.mjs?v=0.18.89';
import {HULL_STATIONS,hullWidthAt} from './fenders.mjs?v=0.18.89';
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
function addMarineSearchlight(g,center,side=0,forward=1){
 const {box,tube}=g,body=[.46,.48,.45],rim=[.22,.25,.25],lens=[.57,.45,.26];
 const point=(a,b,c)=>side?[center[0]+c,center[1]+b,center[2]+side*a]:[center[0]+a*forward,center[1]+b,center[2]+c];
 tube(point(-.42,0,0),point(-.09,0,0),.30,body,16,.56);
 tube(point(-.105,0,0),point(.005,0,0),.328,rim,20,.48);
 tube(point(.004,0,0),point(.019,0,0),.276,dark,20,.18);
 tube(point(.020,0,0),point(.026,0,0),.185,lens,20,.23,1.7);
 for(const direction of [-1,1]){
  tube(point(-.21,-.43,0),point(-.23,-.22,direction*.34),.044,body,8);
  tube(point(-.23,-.22,direction*.34),point(-.23,.015,direction*.34),.044,body,8);
  tube(point(-.23,.015,direction*.28),point(-.23,.015,direction*.38),.082,rim,10);
 }
 const pedestal=point(-.21,-.44,0);
 box(...pedestal,.37,.12,.36,body,.65);
 for(const z of [-.17,0,.17]){
  tube(point(-.38,.25,z),point(-.16,.25,z),.027,rim,6);
 }
}
function buildOffshoreBridge(g,profile,paint){
 const {box,tube,quad,ellipsoid}=g;
 const {family,electric,trim}=profile;
 const carrier=family===12;
 const stepped=[6,9,10,11,12,13].includes(family)&&!electric,compact=[1,5,8].includes(family);
 // Lower cabin, sill, glazing header and visor have distinct footprints.
 const sill=electric?4.65:stepped?5.25:compact?3.92:4.3;
 const top=sill+1.12*profile.bridge;
 const ring=(aft,bow,width,corner,y)=>[
  [aft,y,-width+corner],[aft+corner,y,-width],[bow-corner,y,-width],[bow,y,-width+corner],
  [bow,y,width-corner],[bow-corner,y,width],[aft+corner,y,width],[aft,y,width-corner]
 ];
 const skirt=ring(.23,electric?7.18:compact?5.95:6.65,2.62,electric?.95:.43,1.78);
 const base=ring(.23,compact?5.85:6.49,2.62,electric?.94:.43,3.65);
 const lower=ring(stepped?.78:electric?.7:compact?.55:.38,electric?6.45:compact?5.65:6.47,
  carrier?3.02:electric?2.88:stepped?2.77:compact?2.30:2.62,carrier?1.35:electric?1.18:compact?.8:.46,sill);
 const upper=ring(stepped?.65:compact?1.22:.64,(electric?6.03:compact?4.72:6.28)-.5*(profile.rake-.7),
  carrier?3.18:electric?3.02:stepped?2.91:compact?2.17:2.68,carrier?1.30:electric?1.16:compact?.83:.55,top);
 const roof=ring(upper[0][0]-.23,upper[3][0]+.30,Math.abs(upper[1][2])+.23,electric?1.23:.64,top+.23);
 // The working deck door sits in the aft bulkhead of every bridge.
 for(const row of [skirt,base,lower]){
  row[0][2]=-2.31;
  row[7][2]=2.31;
 }
 const aftPoint=(row,z)=>[row[0][0],row[0][1],z];
 for(const [a,b,color] of [[skirt,base,paint],[base,lower,paint],[lower,upper,paint],[upper,roof,trim]]){
  for(let i=0;i<a.length;i++){
   const j=(i+1)%a.length;
   if(family===13||i!==7||(a!==skirt&&a!==base)){
    quad(a[i],b[i],b[j],a[j],color,.49);
    continue;
   }
   for(const [right,left] of [[2.31,2.19],[1.11,-2.31]]){
    quad(aftPoint(a,right),aftPoint(b,right),aftPoint(b,left),aftPoint(a,left),color,.49);
   }
   if(b[0][1]>3.9){
    const fraction=(3.9-a[0][1])/(b[0][1]-a[0][1]);
    const header=[a[0][0]+(b[0][0]-a[0][0])*fraction,3.9];
    quad([...header,2.19],aftPoint(b,2.19),aftPoint(b,1.11),[...header,1.11],color,.49);
   }
  }
 }
 for(let i=1;i<7;i++)g.tri(roof[0],roof[i+1],roof[i],trim,.45);
 const at=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t);
 for(let i=0;i<8;i++){
  const j=(i+1)%8,a=lower[i],b=lower[j],c=upper[i],d=upper[j];
  const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
  const panes=i===3?(electric?5:stepped?6:compact?3:5):i===1||i===5?(stepped?4:3):i===7?0:1;
  const point=(u,v)=>{const p=at(at(a,b,u),at(c,d,u),v);return [p[0]+dz/len*.028,p[1],p[2]-dx/len*.028];};
  for(let k=0;k<panes;k++){
   const start=(k+.09)/panes,end=(k+.91)/panes;
   const vertices=[point(start,.13),point(start,.89),point(end,.89),point(end,.13)];
   quad(...vertices,glass,.10);
   for(let n=0;n<4;n++)tube(vertices[n],vertices[(n+1)%4],.021,dark,6);
  }
 }
 if(stepped){
  for(const side of [-1,1]){
   box(3.4,sill-.43,side*2.79,5.42,.20,.45,trim,.54);
   tube([.81,sill+.28,side*3.02],[6.04,sill+.28,side*3.02],.039,paint,8);
   for(const x of [1,2.7,4.4,6])tube([x,sill-.36,side*3.02],[x,sill+.28,side*3.02],.025,paint,6);
   for(const x of [1.7,3.4,5.1])box(x,4.15,side*2.66,.74,.40,.05,glass,.15);
  }
 }
 if(electric){
  for(const x of [1.48,2.52,3.56,4.60])for(const z of [-1.18,1.18]){
   box(x,top+.25,z,.94,.035,2.05,[.035,.07,.085],.18);
   for(let i=0;i<5;i++)box(x,top+.274,z-.8+i*.4,.89,.008,.012,[.25,.31,.32],.5);
  }
  // Tapered radar tower with two working platforms above the wheelhouse.
  const foot=ring(2.16,3.96,.77,.22,top+.23);
  const crown=ring(2.65,3.55,.39,.12,7.65);
  for(let i=0;i<8;i++){
   const j=(i+1)%8;
   quad(foot[i],crown[i],crown[j],foot[j],paint,.57);
  }
  for(const y of [7.08,7.69]){
   box(3.11,y,0,1.36,.12,1.68,trim);
   for(const side of [-1,1]){
    tube([2.45,y+.31,side*.79],[3.77,y+.31,side*.79],.028,steel,8);
    for(const x of [2.49,3.71])tube([x,y,side*.79],[x,y+.31,side*.79],.025,steel,6);
   }
  }
  const mast=[3.1,7.69,0];
  tube(mast,[3.1,8.12,0],.11,steel,8);
  box(3.1,7.78,0,.38,.14,1.92,trim);
  ellipsoid(3.1,8.43,0,.30,.37,.30,paint,.42);
 }else{
  const h=compact?8.35:10.4+profile.bow,mx=compact?2.35:2.8,span=compact?1.16:2.10;
  tube([mx,top+.22,0],[mx,h,0],compact?.08:.15,paint,10);
  tube([mx,h-.60,-span],[mx,h-.60,span],.08,trim,8);
  for(const z of [-span,span])tube([mx,h-.62,z],[mx,top+.23,z*.64],.052,steel,8);
  if(family===11){
   for(const [y,half] of [[h-.18,1.23],[h-.94,.84],[h-1.68,.58]]){
    tube([mx,y,-half],[mx,y,half],.042,steel,8);
    tube([mx,y,half],[mx,y+.58,half],.024,steel,6);
   }
  }
  box(mx,h-1.25,0,.35,.18,compact?1.12:2.16,paint);
  for(const z of (compact?[-1.35]:[-1.45,1.45])){
   tube([1.25,top+.20,z],[1.25,top+1.43,z],.20,steel,10);
   tube([1.25,top+1.43,z],[.98,top+1.61,z],.20,dark,10);
  }
  for(const [x,z] of [[4.1,-1.65],[4.45,1.58]])tube([x,top+.23,z],[x,top+2.18,z],.023,steel,6);
 }
 if(family===13)return;
 // Carry the lamp bases on steel brackets bolted into the deckhouse.
 const frontBase=[7.03,4.86,0];
 const mountHeight=4.20;
 const [lowerWall,upperWall]=mountHeight<sill?[base[3],lower[3]]:[lower[3],upper[3]];
 const wallSlope=(mountHeight-lowerWall[1])/(upperWall[1]-lowerWall[1]);
 const wallX=lowerWall[0]+(upperWall[0]-lowerWall[0])*wallSlope;
 const frontWall=[wallX-.05,mountHeight,0];
 box(...frontWall,.27,.39,.66,steel,.65);
 for(const z of [-.21,.21]){
  tube([frontWall[0],frontWall[1],z],[frontBase[0],frontBase[1],z],.094,steel,8);
 }
 box(...frontBase,.49,.14,.64,steel,.6);
 for(const side of [-1,1]){
  const sideBase=[0,4.96,side*2.61];
  const wall=[.65,Math.min(sill-.08,4.64),side*2.12];
  box(...wall,.32,.38,.48,steel,.65);
  tube(wall,sideBase,.103,steel,8);
  box(...sideBase,.57,.14,.55,steel,.6);
 }
}
export function buildVessel(potCount=8,design={}){const orange=craneColor(design),paint=hullPaint(design),g=geometry(),{box,tube,quad,tri,roundedBox,ellipsoid}=g;
 const exterior=vesselExterior(design),orientation=deckSign(design),control=design.rampBow?HULL_STATIONS.map(([x,w])=>[x,x>=8?2.7:w]):HULL_STATIONS;const sections=[];for(let i=0;i<control.length-1;i++)for(let j=0;j<6;j++){const t=j/6,[x,a]=control[i],[xx,b]=control[i+1],before=control[Math.max(0,i-1)],after=control[Math.min(control.length-1,i+2)],m0=(b-before[1])/(xx-before[0]),m1=(after[1]-a)/(after[0]-x),w=(2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*(xx-x)*m0+(-2*t**3+3*t*t)*b+(t**3-t*t)*(xx-x)*m1;sections.push([x+(xx-x)*t,Math.max(.06,w)]);}sections.push(control.at(-1));
 const upperWidth=(x,width)=>{
  if(!exterior||design.rampBow)return width;
  const bow=Math.max(0,(x-7.1)/5.1);
  if(exterior.electric||exterior.family===12)return width+1.06*bow**1.3;
  return width*(1+(exterior.bow>.9 ? .38 : .08)*bow);
 };
 const sheer=x=>{
  if(!exterior)return 0;
  const highBow=exterior.electric||exterior.bow>.9;
  const shoulder=highBow?7.6:6.5;
  const bow=Math.max(0,(x-shoulder)/(12.2-shoulder));
  const stern=Math.max(0,(-x-8)/4);
  return exterior.bow*(highBow?1.32:1)*bow**(highBow?.65:1.4)+exterior.stern*stern**1.5;
 };
 for(let i=0;i<sections.length-1;i++){const [x,a]=sections[i],[xx,b]=sections[i+1];for(const side of [-1,1]){
  const face=(a,b,c,d,col,r)=>side>0?quad(a,b,c,d,col,r):quad(d,c,b,a,col,r);
  face([x,-1.3,a*.55*side],[xx,-1.3,b*.55*side],[xx,.35,b*side],[x,.35,a*side],[.18,.075,.055],.8);
  if(exterior){
   const forward=sheer(x),next=sheer(xx),wet=.21,stripe=.38,ua=upperWidth(x,a)*side,ub=upperWidth(xx,b)*side;
   face([x,.35,a*side],[xx,.35,b*side],[xx,.35+wet,b*side],[x,.35+wet,a*side],exterior.trim,.5);
   if(exterior.family===12){
    const stripeBottom=x=>Math.max(0,1-Math.abs(x-7.9)*1.65);
    const na=1.42+forward*stripeBottom(x),nb=1.42+next*stripeBottom(xx);
    const f=(x,y,base,top)=>base+(top-base)*(y-.56)/(1.75+sheer(x)-.56);
    const point=(x,y,base,top)=>[x,y,f(x,y,base,top)];
    const al=point(x,na-.12,a*side,ua),ar=point(xx,nb-.12,b*side,ub);
    const bl=point(x,na,a*side,ua),br=point(xx,nb,b*side,ub);
    face([x,.56,a*side],[xx,.56,b*side],ar,al,exterior.hull,.48);
    face(al,ar,br,bl,exterior.trim,.51);
    face(bl,br,[xx,1.75+next,ub],[x,1.75+forward,ua],exterior.hull,.48);
   }else face([x,.35+wet,a*side],[xx,.35+wet,b*side],[xx,1.75+next,ub],[x,1.75+forward,ua],exterior.hull,.48);
   if(design.forwardWork&&x>-8&&xx<6.7){
    tube([x,1.82,ua],[xx,1.82,ub],.065,exterior.trim,8);
    continue;
   }
   face([x,1.75+forward,ua],[xx,1.75+next,ub],[xx,2.15+next,ub],[x,2.15+forward,ua],exterior.trim,.62);
   tube([x,2.2+forward,ua],[xx,2.2+next,ub],.075,exterior.trim,8);
   tube([x,2.2+forward+stripe,ua],[xx,2.2+next+stripe,ub],.045,paint,8);
   tube([x,2.15+forward,ua],[x,2.2+forward+stripe,ua],.028,paint,6);
   continue;
  }
  face([x,.35,a*side],[xx,.35,b*side],[xx,1.75,b*side],[x,1.75,a*side],dark,.38);
  face([x,1.75,a*side],[xx,1.75,b*side],[xx,2.15,b*side],[x,2.15,a*side],paint,.55);
  tube([x,2.2,a*side],[xx,2.2,b*side],.075,paint);tube([x,3.,a*side],[xx,3.,b*side],.035,paint);
  tube([x,2.15,a*side],[x,3.,a*side],.035,paint);
 }const opening=design.forwardWork?[5.2,7]:orientation>0?[-2.8,-1]:[1,2.8],cuts=[x,...opening.filter(v=>v>x&&v<xx),xx];for(let j=0;j<cuts.length-1;j++){const l=cuts[j],r=cuts[j+1],lw=a+(b-a)*(l-x)/(xx-x),rw=a+(b-a)*(r-x)/(xx-x);if(l>=opening[0]&&r<=opening[1]){quad([l,1.7,-lw],[l,1.7,-1.4],[r,1.7,-1.4],[r,1.7,-rw],[.25,.29,.23],.82);quad([l,1.7,.4],[l,1.7,lw],[r,1.7,rw],[r,1.7,.4],[.25,.29,.23],.82);}else quad([l,1.7,-lw],[l,1.7,lw],[r,1.7,rw],[r,1.7,-rw],[.25,.29,.23],.82);}}
 if(exterior?.electric||exterior?.family===12){
  const x=12.2,width=upperWidth(x,sections.at(-1)[1]),top=2.15+sheer(x);
  quad([x,.56,-.06],[x,top,-width],[x,top,width],[x,.56,.06],exterior.hull,.47);
  tube([x,top,-width],[x,top,width],.075,paint,8);
  tube([x,top+.43,-width],[x,top+.43,width],.045,paint,8);
 }
 box(-11.95,1.,0,.25,2.2,5.6,dark);tube([-12,2.2,-2.8],[-12,2.2,2.8],.08,paint);for(const y of [2.6,3.])tube([-12,y,-2.8],[-12,y,2.8],.04,paint);for(let z=-2.8;z<=2.81;z+=.8)tube([-12,2.15,z],[-12,3.,z],.045,paint);
 if(exterior?.electric){
  // Join the bridge to the bow with a continuous cambered weather deck.
  let previous;
  for(const [x,width] of sections.filter(([x])=>x>=6.2)){
   const t=Math.min(1,(x-6.2)/6),half=upperWidth(x,width);
   const edge=2.15+sheer(x),crest=edge+(2.05*(1-t)+.34*Math.sin(Math.PI*t));
   const next=Array.from({length:9},(_,i)=>{
    const across=(i-4)/4;
    return [x,edge+(crest-edge)*Math.cos(across*Math.PI/2),across*half];
   });
   if(previous)for(let i=0;i<8;i++)quad(previous[i],previous[i+1],next[i+1],next[i],paint,.51);
   previous=next;
  }
  for(let i=0;i<8;i++)tri(previous[i],[12.2,2.15+sheer(12.2),0],previous[i+1],paint,.53);
 }
 if(exterior&&!exterior.electric&&!design.rampBow&&exterior.bow>.9){
  let prev=null;
  for(const [x,width] of sections.filter(([x])=>x>=10.1)){
   const half=upperWidth(x,width)*.98,y=exterior.electric?1.95+sheer(x)*.93:2.1+sheer(x)*.63;
   const edge=[[x,y,-half],[x,y+.14,0],[x,y,half]];
   if(prev){
    quad(prev[0],prev[1],edge[1],edge[0],paint,.69);
    quad(prev[1],prev[2],edge[2],edge[1],paint,.69);
   }
   prev=edge;
  }
 }
 if(exterior){
  const h=sheer(-12);
  quad([-12.08,2.1,-2.8],[-12.08,2.1+h,-2.8],[-12.08,2.1+h,2.8],[-12.08,2.1,2.8],exterior.hull,.6);
  tube([-12.08,2.18+h,-2.8],[-12.08,2.18+h,2.8],.065,exterior.trim,8);
 }
 const upperStart=g.data.length;
 for(let z=-3.;z<3.;z+=.28)if(z< -1.4||z>.4){
  if(orientation>0){box(-5,1.73,z,12,.025,.022,[.13,.17,.14],.9);continue;}
  // Upper fittings are mirrored below. Trim each plank against the physical bow first.
  const fits=x=>{const physical=-x,i=Math.max(0,sections.findIndex((p,k)=>k<sections.length-1&&physical<=sections[k+1][0])),[a,w]=sections[i],[b,v]=sections[i+1],width=w+(v-w)*(physical-a)/(b-a);return Math.abs(z)+.011+.04<=width;};
  let start=-11;if(!fits(start)){let lo=start,hi=1;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(fits(mid))hi=mid;else lo=mid;}start=hi;}
  box((start+1)/2,1.73,z,1-start,.025,.022,[.13,.17,.14],.9);
 }
 if(exterior){
  const bridgeStart=g.data.length;
  buildOffshoreBridge(g,exterior,paint);
  if(design.forwardWork){
   for(let i=bridgeStart;i<g.data.length;i+=11){
    g.data[i]=10.9-g.data[i]*.79;
    g.data[i+3]/=-.79;
    const normal=Math.hypot(g.data[i+3],g.data[i+4],g.data[i+5]);
    for(let j=3;j<6;j++)g.data[i+j]/=normal;
   }
  }
 }
 else{
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
 }
 // Hull-specific hauler mounts; animated booms are rendered separately.
 const layouts=design.hauler==='both'?['starboard','port']:[design.hauler||'starboard'];for(const layout of layouts){const side=layout==='port'?-1:1,pivot=[workX(design,-1.5),2.1,side*2.1];tube([pivot[0],1.8,pivot[2]],[pivot[0],5.1,pivot[2]],.18,orange,10);}
 for(const [x,y,z] of lineHaulerMounts(design)){
 const rubber=[.035,.045,.042];for(const side of [-1,1]){for(let i=0;i<32;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16,point=(t,r,d)=>[x+Math.cos(t)*r,y+Math.sin(t)*r,z+d];quad(point(a,.42,side*.16),point(b,.42,side*.16),point(b,.24,side*.025),point(a,.24,side*.025),rubber,.88);quad(point(a,.42,side*.16),point(a,.36,side*.21),point(b,.36,side*.21),point(b,.42,side*.16),rubber,.88);}tube([x,y,z+side*.2],[x,y,z+side*.23],.12,steel,16);}
 for(const dx of [-.3,.3])tube([x+dx,1.85,z-.27],[x+dx,y+.05,z-.27],.045,paint,8);tube([x-.34,y+.05,z-.27],[x+.34,y+.05,z-.27],.045,paint,8);tube([x,y,z-.4],[x,y,z-.23],.15,orange,12);tube([x+.33,y-.22,z-.12],[x+.33,y-.22,z+.12],.12,rubber,16);tube([x+.33,y-.22,z-.23],[x+.33,y-.22,z-.13],.045,steel,8);
 }
 if(design.salmon){for(const x of [-8.8,-6.7]){tube([x,1.8,-1.8],[x,3,-1.8],.09,steel);tube([x,1.8,0],[x,3,0],.09,steel);}tube([-7.75,2.8,-1.9],[-7.75,2.8,.1],.7,[.15,.28,.25],16);for(let z=-1.8;z<.1;z+=.12)tube([-7.75,2.8,z],[-7.75,2.8,z+.035],.76,[.3,.39,.31],16);}
 // Raised transport racks provide real headroom below the central row.
 for(const p of rackFrames(design)){const [sx,sy,sz]=p.scale,top=p.y-.64*sy;for(const x of [-.82,.82])for(const z of [-.8,.8])tube([p.x+x*sx,1.74,p.z+z*sz],[p.x+x*sx,top,p.z+z*sz],.045,steel,8);for(const z of [-.8,.8])tube([p.x-.86*sx,top,p.z+z*sz],[p.x+.86*sx,top,p.z+z*sz],.055,steel,8);for(const x of [-.82,.82])tube([p.x+x*sx,top,p.z-.86*sz],[p.x+x*sx,top,p.z+.86*sz],.055,steel,8);}
 if(exterior){
  // Paint the passages that remain clear even with the transport racks fully loaded.
  const fittedPots=design.pots+32;
  for(let x=-10.4;x<-.45;x+=.52)for(const z of [-1.2,0,1.2,2.5]){
   if(canStand(x,z,fittedPots,false,design)&&canStand(x+.18,z,fittedPots,false,design)){
    box(x,1.745,z,.22,.008,.061,[.56,.47,.29],.86);
   }
  }
  for(const {target:[x,z]} of crewStations(design)){
   box(x,1.748,z-.27,.32,.008,.038,[.59,.47,.23],.82);
   box(x,1.748,z+.27,.32,.008,.038,[.59,.47,.23],.82);
  }
 }
 // Wire cages remain open so the deck and cage shadows can be seen through them.
 for(const [i,{x,z,y,scale}] of rackPositions(potCount,design).entries())addRackPot(g,x,y,z,i,scale);
 if(design.forwardWork){
  addMarineSearchlight(g,HIGHWATER_SEARCHLIGHT,0,-1);
 }else{
  if(!exterior){
   tube([6.26,4.9,0],[7.03,4.86,0],.096,steel,8);
   box(7.03,4.86,0,.45,.14,.42,steel);
   for(const side of [-1,1]){
    tube([.48,4.75,side*2.35],[0,4.96,side*2.61],.095,steel,8);
    box(0,4.96,side*2.61,.51,.14,.5,steel);
   }
  }
  addMarineSearchlight(g,[7.24,5.3,0]);
  for(const side of [-1,1])addMarineSearchlight(g,[0,5.4,side*2.82],side);
 }
 // Rubber fenders, window seals and wipers, mooring cleats, hoses and fittings.
 for(const side of [-1,1]){
  for(const x of [-10.7,8.5]){const z=orientation>0?2.45:Math.min(2.45,hullWidthAt(orientation*x,design)-.35);tube([x,1.85,side*z],[x,2.1,side*z],.09,steel,12);tube([x-.32,2.1,side*z],[x+.32,2.1,side*z],.07,steel,12);}
  for(let x=-10.8;x<8;x+=1.8)box(x,1.94,side*(orientation>0?(x<4?3.5:2.8):(Math.min(hullWidthAt(orientation*(x-.2),design),hullWidthAt(orientation*(x+.2),design))-.045)),.4,.13,.04,dark,.85);
 }
 for(let i=0;i<44;i++){const a=i*Math.PI/11,b=(i+1)*Math.PI/11,r=.48+Math.floor(i/22)*.12;tube([-5.7+Math.cos(a)*r,1.83+i*.001,2.25+Math.sin(a)*r],[-5.7+Math.cos(b)*r,1.83+(i+1)*.001,2.25+Math.sin(b)*r],.04,[.36,.31,.2],8);}
 if(!exterior){
 roundedBox(-.45,6.8,-1.5,.9,1.7,1.1,.14,steel,.5);for(let y=6.2;y<7.4;y+=.15)box(-.91,y,-1.5,.025,.055,.8,dark,.8);
 for(const z of [-1.4,1.4]){tube([4.9,6.1,z],[4.9,6.4,z],.08,steel,12);tube([4.9,6.4,z],[5.2,6.4,z],.14,paint,16);}
 for(let y=2.3;y<5.7;y+=.3){tube([.05,y,-2.86],[.05,y, -3.18],.025,steel,8);}tube([.05,2,-2.86],[.05,5.9,-2.86],.035,steel,10);tube([.05,2,-3.18],[.05,5.9,-3.18],.035,steel,10);
 }
 // Aft cabin doorway: black recess, raised frame and a separately animated door leaf.
 if(design.forwardWork){
  // After bulkhead of the enclosed forecastle, with a clear door recess.
  for(const [z,width] of [[-.715,3.63],[2.37,.32]]){
   box(-8.15,2.90,z,.30,2.35,width,paint);
  }
  box(-8.07,4.03,0,.19,.26,5.06,exterior.trim);
  box(-9.67,2.84,1.65,.14,2.04,1.04,dark,.84);
  box(-8.03,3.97,1.65,.14,.15,1.29,paint);
  for(const z of [1.07,2.23])box(-8.03,2.83,z,.13,2.20,.09,paint);
  box(-7.97,1.79,1.65,.53,.12,1.24,steel);
  const roof=(x,w,y)=>[[x,y,-w],[x,y,w]];
  const rear=roof(-8,2.53,4.16),front=roof(-10.48,1.19,3.74);
  quad(rear[0],rear[1],front[1],front[0],exterior.trim,.55);
  for(const side of [0,1]){
   const a=rear[side],b=front[side];
   quad(a,b,[b[0],2.18,b[2]*.87],[a[0],1.77,a[2]*.97],paint,.58);
  }
 }else{
  if(exterior){
   box(.43,2.85,1.05,.74,2.16,.14,paint);
   box(.43,2.85,2.25,.74,2.16,.14,paint);
   box(.43,3.97,1.65,.74,.13,1.31,paint);
   box(.82,2.85,1.65,.08,2.05,1.05,[.008,.014,.015],.9);
  }else box(.15,2.85,1.65,.08,2.05,1.05,[.008,.014,.015],.9);
  for(const z of [1.07,2.23])box(.06,2.85,z,.12,2.2,.08,paint);box(.06,3.97,1.65,.12,.12,1.25,paint);box(-.05,1.79,1.65,.6,.12,1.25,steel);
 }
 // Raised metal lettering and deck hardware are actual geometry, so they catch light.
 const glyphs={N:[[0,0,0,1],[0,1,.6,0],[.6,0,.6,1]],O:[[0,0,0,1],[0,1,.6,1],[.6,1,.6,0],[.6,0,0,0]],R:[[0,0,0,1],[0,1,.6,1],[.6,1,.6,.5],[.6,.5,0,.5],[0,.5,.6,0]],D:[[0,0,0,1],[0,1,.5,.85],[.5,.85,.5,.15],[.5,.15,0,0]],V:[[0,1,.3,0],[.3,0,.6,1]],I:[[.3,0,.3,1]]};
 Object.assign(glyphs,{A:[[0,0,.3,1],[.3,1,.6,0],[.15,.45,.45,.45]],B:[[0,0,0,1],[0,1,.6,.8],[.6,.8,0,.5],[0,.5,.6,.25],[.6,.25,0,0]],C:[[.6,1,0,1],[0,1,0,0],[0,0,.6,0]],E:[[0,0,0,1],[0,1,.6,1],[0,.5,.5,.5],[0,0,.6,0]],F:[[0,0,0,1],[0,1,.6,1],[0,.5,.5,.5]],G:[[.6,1,0,1],[0,1,0,0],[0,0,.6,0],[.6,0,.6,.5],[.6,.5,.3,.5]],H:[[0,0,0,1],[.6,0,.6,1],[0,.5,.6,.5]],J:[[.6,1,.6,0],[.6,0,0,0],[0,0,0,.3]],K:[[0,0,0,1],[0,.5,.6,1],[0,.5,.6,0]],L:[[0,1,0,0],[0,0,.6,0]],M:[[0,0,0,1],[0,1,.3,.5],[.3,.5,.6,1],[.6,1,.6,0]],P:[[0,0,0,1],[0,1,.6,1],[.6,1,.6,.5],[.6,.5,0,.5]],Q:[[0,0,0,1],[0,1,.6,1],[.6,1,.6,0],[.6,0,0,0],[.3,.3,.7,-.1]],S:[[.6,1,0,1],[0,1,0,.5],[0,.5,.6,.5],[.6,.5,.6,0],[.6,0,0,0]],T:[[0,1,.6,1],[.3,1,.3,0]],U:[[0,1,0,0],[0,0,.6,0],[.6,0,.6,1]],W:[[0,1,.15,0],[.15,0,.3,.5],[.3,.5,.45,0],[.45,0,.6,1]],X:[[0,0,.6,1],[0,1,.6,0]],Y:[[0,1,.3,.5],[.6,1,.3,.5],[.3,.5,.3,0]],Z:[[0,1,.6,1],[.6,1,0,0],[0,0,.6,0]]});
 const segments=[[0,1,.6,1],[.6,1,.6,.5],[.6,.5,.6,0],[0,0,.6,0],[0,.5,0,0],[0,1,0,.5],[0,.5,.6,.5]];for(const [i,mask] of ['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'].entries())glyphs[i]=segments.filter((_,k)=>mask[k]==='1');
 const letteringStart=g.data.length;
 for(const side of [-1,1])for(const [i,char] of [...(design.name?.toUpperCase()||'NORDVIND')].entries())for(const [a,b,c,d] of glyphs[char]||[])tube([(side>0?(orientation>0?1:5.25)+orientation*(i*(4.25/Math.max(8,design.name?.length||8))+a*.45):(orientation>0?5.25:1)-orientation*(i*(design.id&&design.id!=='nordvind'?4.25/Math.max(8,design.name?.length||8):.56)+a*.55)),3.15+b*.5,side*2.686],[(side>0?(orientation>0?1:5.25)+orientation*(i*(4.25/Math.max(8,design.name?.length||8))+c*.45):(orientation>0?5.25:1)-orientation*(i*(design.id&&design.id!=='nordvind'?4.25/Math.max(8,design.name?.length||8):.56)+c*.55)),3.15+d*.5,side*2.686],.022,design.powertrain==='electric'?[.65,.76,.72]:dark,4,.45,design.powertrain==='electric'?1.4:0);
 if(design.forwardWork)for(let i=letteringStart;i<g.data.length;i+=11)g.data[i]+=5.25;
 // Recessed hold hatch and sorting chute, with an actual opening in the deck mesh.
 box(workX(design,-1.9),.55,-.5,1.8,.08,1.8,[.008,.014,.014],1);for(const x of [-2.85,-.95])box(workX(design,x),1.35,-.5,.13,1.1,2.05,steel);for(const z of [-1.45,.45])box(workX(design,-1.9),1.35,z,2.,1.1,.13,steel);for(const x of [-2.87,-.93])box(workX(design,x),1.87,-.5,.16,.25,2.15,[.43,.45,.37]);for(const z of [-1.48,.48])box(workX(design,-1.9),1.87,z,2.1,.25,.16,[.43,.45,.37]);
 box(workX(design,-1.5),2.2,-2.3,.9,.9,.8,[.29,.3,.27]);tube([workX(design,-1.5),2.65,-2.8],[workX(design,-1.5),2.65,-1.8],.26,steel,12);
 if(!exterior?.electric){
  box(10,2.1,0,.9,.5,1.1,steel);
  tube([9.4,2.3,-.5],[11.7,1.3,-.5],.05,steel);
 }
 const compactCoil=!!design.id&&design.id!=='nordvind',coilX=compactCoil?8.5:8.25,coilZ=compactCoil?0:1.1,coilRadius=compactCoil?.25:.5;for(let i=0;i<24;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12;tube([coilX+Math.cos(a)*coilRadius,1.84,coilZ+Math.sin(a)*coilRadius],[coilX+Math.cos(b)*coilRadius,1.84,coilZ+Math.sin(b)*coilRadius],.07,[.48,.45,.29],5);}
 const style=vesselStyle(design);if(style.family){
 if(style.gantry){const {x,z,height:h}=gantryPlacement(design);for(const side of [-1,1]){tube([x,1.85,side*z],[x,h,side*z],.16,paint,10);tube([x+1.4,1.85,side*z],[x,h,side*z],.09,steel,8);}tube([x,h,-z],[x,h,z],.2,paint,10);box(x,h,0,.7,.6,1.1,orange);}
 }
 if(orientation<0){for(let i=upperStart;i<g.data.length;i+=11){g.data[i]*=-1;g.data[i+3]*=-1;}}
 if(design.rampBow){const height=2.7+sheer(12.2);quad([12.2,.35,-2.7],[12.2,.35,2.7],[12.2,height,2.7],[12.2,height,-2.7],paint,.75);for(const z of [-2.4,-1.2,0,1.2,2.4])tube([12.24,.6,z],[12.24,2.45,z],.055,steel,8);}
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

export function buildArticulatedCrane(){
 const primary=geometry(),outer=geometry();
 for(const [section,depth,width] of [[primary,.38,.36],[outer,.28,.26]]){
  section.box(.5,0,0,1,depth,width,orange,.48);
  section.tube([.05,-depth*.75,0],[.76,-depth*.5,0],.10,steel,8);
  section.tube([.68,-depth*.52,0],[.94,-depth*.21,0],.048,[.62,.65,.65],8);
 }
 const hinge=geometry();
 hinge.tube([0,0,-.27],[0,0,.27],.22,orange,12);
 hinge.tube([0,0,-.31],[0,0,.31],.10,steel,10);
 return {primary:primary.array(),outer:outer.array(),hinge:hinge.array()};
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
