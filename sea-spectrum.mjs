// Directional Gerstner-style swell, evaluated as a height field by inverting horizontal displacement.
// CPU buoyancy and GPU water share the same coefficients and iteration count.
export const SWELL=[
 [.095,.061,.55,.2],[-.047,.11,.28,1.7],[.16,.09,.22,3.1],
 [.23,.14,.12,.8],[.31,.19,.08,2.5],[.39,.07,.045,4.2],
 [.49,.22,.03,5.6],[.61,.32,.02,1.3]
].map(([kx,kz,w,phase])=>({kx,kz,w,phase,k:Math.hypot(kx,kz),omega:Math.sqrt(9.81*Math.hypot(kx,kz))}));
export function seaField(x,z,time,waves){const chop=.55*waves/(waves+1.5),amplitude=.08+waves*.51;let u=x,v=z;
 for(let i=0;i<3;i++){let dx=0,dz=0;for(const s of SWELL){const c=Math.cos(u*s.kx+v*s.kz-time*s.omega+s.phase)*chop*s.w/s.k;dx+=s.kx/s.k*c;dz+=s.kz/s.k*c;}u=x-dx;v=z-dz;}
 let height=0,gx=0,gz=0,jx=1,jz=1,jxz=0;for(const s of SWELL){const phase=u*s.kx+v*s.kz-time*s.omega+s.phase,sn=Math.sin(phase),cs=Math.cos(phase),a=amplitude*s.w,c=chop*s.w*sn,dx=s.kx/s.k,dz=s.kz/s.k;height+=a*sn;gx+=a*s.kx*cs;gz+=a*s.kz*cs;jx-=c*dx*dx;jz-=c*dz*dz;jxz-=c*dx*dz;}const det=Math.max(.15,jx*jz-jxz*jxz);return {height,slopeX:(jz*gx-jxz*gz)/det,slopeZ:(jx*gz-jxz*gx)/det,compression:1-det};}
export const seaHeight=(x,z,time,waves)=>seaField(x,z,time,waves).height;
const f=n=>Number(n).toFixed(9);
export const seaHeightGLSL=`const vec4 swell[8]=vec4[8](${SWELL.map(s=>`vec4(${f(s.kx)},${f(s.kz)},${f(s.w)},${f(s.phase)})`).join(',')});
vec2 swellBase(vec2 p){vec2 u=p;float chop=.55*uWeather.x/(uWeather.x+1.5);for(int iteration=0;iteration<3;iteration++){vec2 offset=vec2(0.);for(int i=0;i<8;i++){vec4 s=swell[i];float k=length(s.xy),phase=dot(u,s.xy)-uTime*sqrt(9.81*k)+s.w;offset+=s.xy/k*cos(phase)*chop*s.z/k;}u=p-offset;}return u;}
vec4 seaField(vec2 p){vec2 u=swellBase(p),g=vec2(0.);vec3 j=vec3(1.,1.,0.);float h=0.,chop=.55*uWeather.x/(uWeather.x+1.5),amplitude=.08+uWeather.x*.51;for(int i=0;i<8;i++){vec4 s=swell[i];float k=length(s.xy),phase=dot(u,s.xy)-uTime*sqrt(9.81*k)+s.w,sn=sin(phase),cs=cos(phase);vec2 d=s.xy/k;h+=amplitude*s.z*sn;g+=amplitude*s.z*s.xy*cs;j-=chop*s.z*sn*vec3(d.x*d.x,d.y*d.y,d.x*d.y);}float det=max(.15,j.x*j.y-j.z*j.z);return vec4(h,(j.y*g.x-j.z*g.y)/det,(j.x*g.y-j.z*g.x)/det,1.-det);}
float oceanHeight(vec2 p){vec2 u=swellBase(p);float h=0.;for(int i=0;i<8;i++){vec4 s=swell[i];h+=s.z*sin(dot(u,s.xy)-uTime*sqrt(9.81*length(s.xy))+s.w);}return (.08+uWeather.x*.51)*h;}`;
