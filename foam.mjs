import {seaHeight,directionalSpectrum,seaField} from './sea-spectrum.mjs?v=0.18.39';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
// Raised, broken foam ribbons ride on the same swell as the boat. Not a fluid solver.
export function buildFoam(wake,boat,weather,time){const data=[];
 function ribbon(x,z,fx,fz,length,width,lift,fade,phase){if(fade<.025)return;const rx=-fz,rz=fx,point=(i,j)=>{const u=i/6,v=j/3*2-1,along=(u-.5)*length,bend=Math.sin(u*5+phase)*width*.6,cross=v*width+bend,px=x+fx*along+rx*cross,pz=z+fz*along+rz*cross,raised=(1-v*v)*Math.sin(u*Math.PI)*lift*(.65+.35*Math.sin(u*12+phase));return [px,seaHeight(px,pz,time,weather.waves,weather)+.012+raised,pz,v,fade*Math.sin(u*Math.PI)];};
  const points=Array.from({length:28},(_,k)=>({p:point(Math.floor(k/4),k%4),n:[0,0,0]})),faces=[];
  function tri(a,b,c){const u=b.p.map((v,i)=>v-a.p[i]),v=c.p.map((v,i)=>v-a.p[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const vertex of [a,b,c])for(let k=0;k<3;k++)vertex.n[k]+=n[k];faces.push([a,b,c]);}
  for(let i=0;i<6;i++)for(let j=0;j<3;j++){const a=points[i*4+j],b=points[(i+1)*4+j],c=points[(i+1)*4+j+1],d=points[i*4+j+1];tri(a,d,b);tri(b,d,c);}
  for(const face of faces)for(const {p,n} of face){const l=Math.hypot(...n)||1;data.push(...p.slice(0,3),...n.map(v=>v/l),.75,.8,.78,p[3],p[4]);}
 }
 for(let i=0;i<(wake?.points.length||0);i+=3){const p=wake.points[i],age=wake.time-p.born;if(age>24||Math.hypot(p.x-boat.x,p.z-boat.y)>100)continue;const fx=Math.cos(p.heading),fz=Math.sin(p.heading),spread=2+age*p.energy*.34,fade=Math.exp(-age*.11)*p.energy/7;for(const side of [-1,1])ribbon(p.x-fz*spread*side,p.z+fx*spread*side,fx,fz,4+age*.2,.3+age*.01,.035+p.energy*.006,fade,i*1.7);if(i%4===0)ribbon(p.x,p.z,fx,fz,3,.65,.025,fade*.32,i);}
 // Long, advecting crest strands replace the former square grid of inflated patches.
 if(weather.waves>1.8){const severity=clamp((weather.waves-1.8)/4,0,1);for(const [i,s] of directionalSpectrum(weather).slice(0,2).entries()){const dx=s.kx/s.k,dz=s.kz/s.k,tx=-dz,tz=dx,center=boat.x*dx+boat.y*dz,alongCenter=boat.x*tx+boat.y*tz;const base=(Math.PI/2-s.phase+time*s.omega)/s.k,spacing=2*Math.PI/s.k,first=Math.floor((center-75-base)/spacing),last=Math.ceil((center+75-base)/spacing);for(let wave=first;wave<=last;wave++){const across=base+wave*spacing;for(let segment=Math.floor((alongCenter-75)/16);segment<Math.ceil((alongCenter+75)/16);segment++){const seed=hash(wave+i*17,segment);if(seed<.5)continue;const along=segment*16+seed*5,px=dx*across+tx*along,pz=dz*across+tz*along,field=seaField(px,pz,time,weather.waves,weather),fade=severity*clamp((field.compression-.12)*2.5,0,.7)*clamp(field.height/(.08+weather.waves*.51),0,1);ribbon(px,pz,tx,tz,3+seed*7,.35+seed*.25,.035+severity*.02,fade,seed*12);}}}}

 return new Float32Array(data);
}
