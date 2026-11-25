import {hullWaterGLSL} from './deck-water.mjs?v=0.18.79';
import {seaHeightGLSL} from './sea-spectrum.mjs?v=0.18.79';
// Shared atmosphere and ocean functions keep lighting and reflections consistent.
export const common=`
precision highp float;precision highp int;
uniform vec4 uRemoteLights[8];
uniform vec4 uQuayLights[4];
uniform float uDeckSign;uniform vec3 uRoofSearchlight;uniform vec3 uCraneColor;
uniform float uReflectionPass;uniform float uKind;uniform float uDaylight;uniform float uLights;uniform vec4 uLampUpgrade;uniform vec3 uRelativeEye;uniform mat4 uMVP;uniform mat4 uShadowMVP;uniform float uHullY;uniform vec4 uWake[48];uniform vec4 uWakeInfo[48];uniform int uWakeCount;uniform float uWakeTime;
uniform float uDetailTime;uniform vec3 uSea;uniform float uTime;uniform vec4 uWeather;uniform vec4 uBoat;uniform vec3 uEye;uniform mat4 uVP;uniform mat4 uLightVP;
float hash(vec2 p){uvec2 i=uvec2(ivec2(p));uint h=i.x*1597334677u^i.y*3812015801u;h=(h^(h>>16))*2246822519u;return float(h^(h>>13))/4294967295.;}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float f=0.,a=.5;for(int i=0;i<4;i++){f+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+17.3;a*=.5;}return f;}

vec4 wakeAt(vec2 p){vec4 result=vec4(0.);for(int i=0;i<48;i++){if(i>=uWakeCount)break;float age=uWakeTime-uWakeInfo[i].w;if(age<0.||age>35.)continue;vec2 d=p-uWake[i].xy,f=uWakeInfo[i].xy,r=vec2(-f.y,f.x);float along=dot(d,f),side=dot(d,r),energy=uWakeInfo[i].z;if(abs(along)>20.+age||abs(side)>5.+age*energy*.4)continue;float q=abs(side)-(2.+age*energy*.34),fade=exp(-age*.10)*energy/7.;float ring=exp(-q*q/(.2+age*.035))*exp(-along*along/pow(6.+age*.3,2.));float churn=exp(-dot(d,d)/(8.+age*1.5));result.x=max(result.x,(ring*.32+churn*.18)*fade);float phase=q*2.1-age*1.4;result.yz+=r*sign(side)*(-sin(phase))*ring*fade*.07;result.w+=cos(phase)*ring*fade*.028;}result.x*=smoothstep(.25,.7,fbm(p*1.7+vec2(uDetailTime*.08,0.)));result.w=clamp(result.w,-.07,.07);return result;}
vec3 shipLocal(vec3 p){vec2 f=vec2(cos(uBoat.z),sin(uBoat.z)),r=vec2(-f.y,f.x),d=p.xz-uBoat.xy;return vec3(dot(d,f),p.y-uHullY,dot(d,r));}
bool blocked(vec3 o,vec3 p,vec3 lo,vec3 hi){vec3 inv=1./(p-o+vec3(.00001)),a=(lo-o)*inv,b=(hi-o)*inv,mn=min(a,b),mx=max(a,b);return max(max(mn.x,mn.y),max(mn.z,.025))<min(min(mx.x,mx.y),min(mx.z,.98));}
vec3 lamps(vec3 p,vec3 n,vec3 view,bool volume,bool water){if(uLights<.5||length(p.xz)>160.*uLampUpgrade.z)return vec3(0.);vec3 sum=vec3(0.);for(int i=0;i<3;i++){if(abs(uDeckSign)>1.5&&i>0)break;vec3 o,dir,col;float cone,power;if(i==0){o=vec3(7.266,5.3,0.);dir=normalize(vec3(1.,-.2,0.));col=vec3(1.,.83,.62);cone=.91;power=8.;}else{float side=i==1?-1.:1.;o=vec3(0.,5.4,side*2.846);dir=normalize(vec3(.23,-.40,side));col=vec3(1.,.87,.68);cone=.79;power=6.;}cone-=uLampUpgrade.w;power*=volume?sqrt(uLampUpgrade.y):uLampUpgrade.y;if(i==0)dir=normalize(vec3(1.,-.2+uLampUpgrade.x*.015,0.));float axis=sign(uDeckSign);
 if(abs(uDeckSign)>1.5){
  o=uRoofSearchlight-vec3(.026,0.,0.);
  dir.x=-dir.x;
 }
 o.x*=axis;dir.x*=axis;vec3 delta=p-o;float dist=length(delta);vec3 toPoint=delta/max(.01,dist);float beam=smoothstep(cone,min(.999,cone+.09),dot(toPoint,dir));if(beam<.001)continue;float range=volume?mix(1.,uLampUpgrade.z,.38):uLampUpgrade.z;float energy=power*beam/(1.+dist*dist*.035/(range*range));if(!volume&&p.y<1.5&&(blocked(o,p,vec3(.25,1.75,-2.6),vec3(6.5,5.8,2.6))||blocked(o,p,vec3(-10.8,1.8,-2.9),vec3(-3.15,5.3,.8))))energy*=.55;if(volume)sum+=col*energy;else{float diffuse=max(.04,dot(n,-toPoint)),spec=pow(max(0.,dot(n,normalize(view-toPoint))),70.);sum+=col*energy*((water?spec*.65+diffuse*(.001+uLampUpgrade.x*.00055):diffuse*.42+spec*.25));}}return sum;}
vec3 directLamps(vec3 p,vec3 n,vec3 view){vec2 f=vec2(cos(uBoat.z),sin(uBoat.z)),r=vec2(-f.y,f.x);vec3 localN=vec3(dot(n.xz,f),n.y,dot(n.xz,r)),localV=vec3(dot(view.xz,f),view.y,dot(view.xz,r));vec3 lighting=lamps(shipLocal(p),localN,localV,false,false)*(1.-uDaylight*.88);if(p.x<115.&&p.x> -235.)for(int i=0;i<4;i++){vec3 o=vec3(80.,9.,-200.+float(i)*145.),d=o-p;float dist=length(d);lighting+=vec3(1.,.77,.48)*max(0.,dot(n,d/max(.01,dist)))*3./(1.+dist*dist*.09)*(1.-uDaylight*.85);}return lighting;}
vec3 waterLamps(vec3 p,vec3 n,vec3 view){vec2 f=vec2(cos(uBoat.z),sin(uBoat.z)),r=vec2(-f.y,f.x);return lamps(shipLocal(p),vec3(dot(n.xz,f),n.y,dot(n.xz,r)),vec3(dot(view.xz,f),view.y,dot(view.xz,r)),false,true)*(1.-uDaylight*.995);}
vec3 remoteBeams(vec3 p){
 float night=1.-smoothstep(.08,.65,uDaylight);
 if(night<=0.)return vec3(0.);
 vec3 viewRay=p-uEye;
 float energy=0.;
 for(int i=0;i<4;i++){
  vec4 lamp=uRemoteLights[i*2];if(lamp.w==0.)continue;
  vec3 axis=normalize(uRemoteLights[i*2+1].xyz),offset=uEye-lamp.xyz;
  // Closest approach of the visible camera ray to the finite beam axis.
  vec3 across=viewRay-axis*dot(viewRay,axis);
  vec3 originAcross=offset-axis*dot(offset,axis);
  float t=clamp(-dot(originAcross,across)/max(.001,dot(across,across)),0.,1.);
  vec3 samplePoint=offset+viewRay*t;
  float along=dot(samplePoint,axis);
  float radius=.28+max(0.,along)*.20;
  float profile=1.-smoothstep(0.,radius,length(samplePoint-axis*along));
  float fade=smoothstep(0.,1.8,along)*(1.-smoothstep(15.,46.,along));
  energy+=profile*fade;
 }
 return vec3(1.,.85,.65)*energy*night*(.009+uWeather.y*.055+uWeather.z*.012);
}
vec3 quayLighting(vec3 p){
 float amount=0.;
 for(int i=0;i<4;i++){
  vec4 lamp=uQuayLights[i];if(lamp.w==0.)continue;
  vec2 d=p.xz-lamp.xy,forward=vec2(cos(lamp.z),sin(lamp.z));
  float distance=length(d),along=dot(d,forward);
  float fan=smoothstep(.72,.94,along/max(1.,distance));
  amount+=fan*(1.-smoothstep(6.,115.,distance))*.34+exp(-distance*.13)*.08;
 }
 return vec3(1.,.73,.25)*amount*.5*(1.-smoothstep(.12,.8,uDaylight));
}
vec3 beamFog(vec3 world){if(uLights<.5||uDaylight>.7)return vec3(0.);vec3 sum=vec3(0.);for(int i=0;i<12;i++){float t=(float(i)+.5)/12.;vec3 p=mix(uEye,world,t);sum+=lamps(shipLocal(p),vec3(0,1,0),vec3(0,1,0),true,false);}return sum*.5*(.0016+uWeather.y*.012+uWeather.z*.006)*(1.-smoothstep(.07,.6,uDaylight));}

vec3 sunDir(){return normalize(vec3(-.65,.55,-.45));}
vec3 sky(vec3 ray){float cover=clamp(uWeather.w*.7+uWeather.z*.25,0.,1.);float elev=max(ray.y,0.);vec3 horizon=mix(vec3(.62,.69,.69),vec3(.31,.39,.43),cover);vec3 zenith=mix(vec3(.23,.36,.47),vec3(.12,.20,.27),cover);vec3 color=mix(horizon,zenith,pow(elev,.45));float clouds=fbm(ray.xz/(max(.18,ray.y)+.25)*1.8+vec2(uTime*.008,0.));color=mix(color,mix(vec3(.76,.76,.69),vec3(.37,.43,.46),cover),smoothstep(.38,.7,clouds)*.65);float sun=pow(max(0.,dot(ray,sunDir())),350.);color+=vec3(1.,.73,.42)*sun*2.*pow(1.-cover,3.);return color*(.015+.985*uDaylight);}
${seaHeightGLSL}
${hullWaterGLSL}
float shadowAt(vec4 lightPos,sampler2D shadowMap){vec3 p=lightPos.xyz/lightPos.w*.5+.5;if(any(lessThan(p,vec3(0.)))||any(greaterThan(p,vec3(1.))))return 1.;float s=0.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float depth=texture(shadowMap,p.xy+vec2(float(x),float(y))/2048.).r;s+=p.z-.0007<=depth?1.:.24;}return s/9.;}
vec3 finishColor(vec3 c,vec3 world){if(uReflectionPass>.5)return c/(1.+c);float mist=(1.-exp(-length(world-uEye)*(.00035+uWeather.y*.0028)));c=mix(c,mix(vec3(.019,.032,.05),vec3(.4,.47,.5),uDaylight),mist);c+=beamFog(world)+remoteBeams(world)+quayLighting(world);c*=1.18;c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);return pow(max(c,vec3(0.)),vec3(.4545));}
`;
export const oceanVertex=`#version 300 es
${common}
layout(location=0) in vec3 aPosition;uniform vec2 uCenter;uniform vec3 uHullOffset;out vec3 vWorld;out vec4 vShadow;out vec2 vWaterLocal;
void main(){vWaterLocal=aPosition.xz;vec3 p=aPosition;p.xz+=uCenter;p.y=oceanHeight(vWaterLocal)+wakeAt(p.xz).w;p.y=containOceanCrest(vec3(vWaterLocal.x,p.y,vWaterLocal.y)-uHullOffset)+uHullOffset.y;vWorld=p;vec4 local=vec4(vWaterLocal.x,p.y,vWaterLocal.y,1.);vShadow=uLightVP*local;gl_Position=uVP*local;}`;
export const oceanFragment=`#version 300 es
${common}
in vec3 vWorld;in vec4 vShadow;in vec2 vWaterLocal;uniform vec3 uHullOffset;uniform vec4 uDieselSlick;uniform vec2 uCenter;uniform sampler2D uShadow;uniform sampler2D uReflection;uniform mat4 uReflectionVP;out vec4 outColor;
void main(){if(insideHullLocal(hullLocalPoint(vec3(vWaterLocal.x,vWorld.y,vWaterLocal.y)-uHullOffset)))discard;vec2 p=vWorld.xz;vec4 field=seaField(vWaterLocal),wake=wakeAt(p);float h=field.x;vec2 slope=field.yz+wake.yz;vec2 detail=vWaterLocal+mod(uCenter,25600.);
{vec2 k=vec2(1.9727300,1.1825128);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*2.3);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uDetailTime*4.7500526+0.000+2.3*noise(detail*.67+vec2(0.000,uDetailTime*.03)))*0.0350000*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}
{vec2 k=vec2(3.0404593,2.4424593);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*3.9);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uDetailTime*6.1853860+2.170+2.3*noise(detail*.67+vec2(2.170,uDetailTime*.03)))*0.0250000*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}
{vec2 k=vec2(6.4150080,1.9333061);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*6.7);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uDetailTime*8.1072190+4.340+2.3*noise(detail*.67+vec2(4.340,uDetailTime*.03)))*0.0194444*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}
{vec2 k=vec2(7.1248581,8.1164276);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*10.8);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uDetailTime*10.2931045+6.510+2.3*noise(detail*.67+vec2(6.510,uDetailTime*.03)))*0.0159091*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}
{vec2 k=vec2(16.8596806,3.8782949);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*17.3);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uDetailTime*13.0273942+8.680+2.3*noise(detail*.67+vec2(8.680,uDetailTime*.03)))*0.0134615*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}
{vec2 k=vec2(18.9348971,19.3876164);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*27.1);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uDetailTime*16.3049379+10.850+2.3*noise(detail*.67+vec2(10.850,uDetailTime*.03)))*0.0116667*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}

 vec2 warp=vec2(noise(detail*.17+vec2(uDetailTime*.025,0.)),noise(detail*.17+vec2(37.,uDetailTime*.02)));vec2 microPoint=mat2(.83,-.56,.56,.83)*detail*1.3+warp*2.;float microBase=fbm(microPoint);vec2 grainSlope=vec2(fbm(microPoint+vec2(.12,0.))-microBase,fbm(microPoint+vec2(0.,.12))-microBase)/.12;float grainFilter=1.-smoothstep(.3,1.4,length(fwidth(vWaterLocal*1.3)));float agitation=smoothstep(.14,.72,field.w+length(field.yz)*.75);
 slope+=grainSlope*(.10+uWeather.x*.026+agitation*.14)*grainFilter;
 // Local rain impacts distort the water normal, without changing buoyancy.
 float dropFilter=1.-smoothstep(.045,.18,length(fwidth(vWaterLocal)));
 if(uWeather.z>.06&&dropFilter>.001){
  vec2 grid=detail*4.,cell=floor(grid),xy=fract(grid);
  float seed=hash(cell),age=fract(uDetailTime*(2.8+seed*2.)+seed*27.);
  vec2 r=xy-(.31+.38*vec2(hash(cell+vec2(19.,0.)),hash(cell+vec2(0.,21.))));
  float d=length(r),radius=.035+age*.255;
  float rings=sin((d-radius)*59.)*exp(-pow((d-radius)*19.,2.));
  slope+=r/max(.04,d)*rings*dropFilter*uWeather.z*max(0.,1.-age)*.24;
 }

 vec3 n=normalize(vec3(-slope.x,1.,-slope.y)),v=normalize(uEye-vWorld),l=sunDir(),halfway=normalize(v+l);float nv=max(.001,dot(n,v)),nl=max(0.,dot(n,l)),fresnel=.0204+.9796*pow(1.-nv,5.);
 vec3 reflected=sky(reflect(-v,n));vec4 clip=uReflectionVP*vec4(vWaterLocal.x,0.,vWaterLocal.y,1.);vec2 uv=clip.xy/clip.w*.5+.5+slope*.007;vec4 objects=textureLod(uReflection,clamp(uv,vec2(.002),vec2(.998)),.7+uWeather.x*.2);float edge=smoothstep(0.,.04,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));reflected=mix(reflected,objects.rgb/max(vec3(.035),1.-objects.rgb),objects.a*edge);
 float trough=smoothstep(-1.15,.65,h);
 vec3 deep=mix(vec3(.002,.008,.013),vec3(.006,.022,.031),trough);
 vec3 scatter=vec3(.021,.061,.067)*max(0.,h)*(.04+.13*pow(max(0.,dot(v,-l)),3.));vec3 water=deep*(.5+nl*.5)*(.12+.88*uDaylight)+scatter*uDaylight;
 float rough=mix(.13,.067,agitation)+uWeather.x*.004,a=rough*rough,nh=max(0.,dot(n,halfway)),den=nh*nh*(a*a-1.)+1.,ggx=a*a/(3.14159*den*den+.00001),spec=ggx*.022*mix(.32,1.,pow(1.-uWeather.w,2.));
 vec3 color=mix(water,reflected,clamp(fresnel,.0204,.95))+vec3(1.,.88,.7)*spec*nl*uDaylight;
 vec2 forward=vec2(cos(uBoat.z),sin(uBoat.z)),delta=p-uBoat.xy;float along=dot(delta,forward),side=abs(dot(delta,vec2(-forward.y,forward.x))),speed=abs(uBoat.w);float bubbles=fbm(detail*1.8-vec2(uDetailTime*.12,0.));float bow=exp(-pow((along-10.8)/2.,2.))*exp(-pow((side-2.)/.9,2.))*clamp(speed/5.,0.,1.);float froth=clamp(wake.x+bow*.3,0.,.6)*smoothstep(.3,.7,bubbles);
 float whitecaps=smoothstep(.64,1.07,h)*smoothstep(.12,.32,field.w)*smoothstep(.46,.7,bubbles)*smoothstep(1.25,4.3,uWeather.x)*.32;
 color=mix(color,vec3(.64,.71,.70)*(.1+.9*uDaylight),max(froth,whitecaps));color*=mix(.72,1.,shadowAt(vShadow,uShadow));color+=waterLamps(vWorld,n,v)+directLamps(vWorld,n,v)*froth*.08;
 if(uDieselSlick.z>0.){vec2 spill=p-uDieselSlick.xy;float radius=12.+(180.-uDieselSlick.z)*.09,edge=length(spill*vec2(.75,1.2))/radius+noise(spill*.14)*.26;float oil=(1.-smoothstep(.67,1.,edge))*smoothstep(0.,60.,uDieselSlick.z);color=mix(color,vec3(.004,.005,.006),oil*.9);}
 outColor=vec4(finishColor(color,vWorld),1.);}`;
export const meshVertex=`#version 300 es
${common}
layout(location=0) in vec3 aPosition;layout(location=1) in vec3 aNormal;layout(location=2) in vec3 aColor;layout(location=3) in vec2 aSurface;
layout(location=4) in vec3 aInstance;uniform float uInstanced;uniform vec3 uRackScale;uniform mat4 uModel;out vec3 vWorld;out vec3 vNormal;out vec3 vColor;out vec2 vSurface;out vec3 vLocal;out vec3 vRelative;out vec4 vShadow;
void main(){vec4 local=vec4(aPosition*mix(vec3(1.),uRackScale,uInstanced)+aInstance*uInstanced,1.);vec4 p=uModel*local;vWorld=p.xyz;vNormal=transpose(inverse(mat3(uModel)))*(aNormal/mix(vec3(1.),uRackScale,uInstanced));vColor=aColor;vSurface=aSurface;vLocal=aPosition;vRelative=mat3(uModel)*local.xyz;vShadow=uShadowMVP*local;gl_Position=uMVP*local;}`;
export const meshFragment=`#version 300 es
${common}
in vec3 vWorld;in vec3 vNormal;in vec3 vColor;in vec2 vSurface;in vec3 vLocal;in vec3 vRelative;in vec4 vShadow;uniform sampler2D uShadow;uniform float uVesselIce;out vec4 outColor;
const float PI=3.14159265;
vec3 brdf(vec3 base,vec3 f0,float rough,vec3 n,vec3 v,vec3 l){vec3 h=normalize(l+v);float nv=max(.02,dot(n,v)),nl=max(0.,dot(n,l)),nh=max(0.,dot(n,h)),vh=max(0.,dot(v,h)),a=rough*rough,a2=a*a,d=a2/(PI*pow(nh*nh*(a2-1.)+1.,2.)+.00001),k=pow(rough+1.,2.)/8.,g=nv/(nv*(1.-k)+k)*nl/(nl*(1.-k)+k);vec3 F=f0+(1.-f0)*pow(1.-vh,5.);return ((1.-F)*base/PI+F*d*g/max(.08,4.*nv*nl))*nl;}
float filteredGrain(vec2 p){float footprint=max(length(dFdx(p)),length(dFdy(p)));return mix(noise(p),.5,smoothstep(.35,1.2,footprint));}
void main(){if(uReflectionPass>.5&&vWorld.y<.04)discard;
 vec3 n=normalize(vNormal),v=normalize(uRelativeEye-vRelative),localN=abs(normalize(cross(dFdx(vLocal),dFdy(vLocal))));
 vec2 uv=localN.y>.65?vLocal.xz:localN.x>.65?vLocal.zy:vLocal.xy;
 float grain=filteredGrain(uv*48.),macro=fbm(uv*.7),vertical=1.-abs(n.y),painted=step(.34,vColor.r),glass=1.-step(.145,vSurface.x),detail=step(.5,uKind)*(1.-glass);
 float rust=0.,seam=0.,height=0.;vec3 base=pow(vColor,vec3(2.2));float rough=clamp(vSurface.x,.08,.98);float lowerHull=(uKind>.5&&uKind<1.5&&vLocal.y<1.65)?1.:0.;if(lowerHull>.5)rough=max(rough,.84);if(uKind>4.5&&distance(vColor,vec3(.72,.29,.065))<.03)base=pow(uCraneColor,vec3(2.2));
 if(vSurface.y< -2.5){
  float damp=(1.-smoothstep(.3,2.8,vWorld.y))*vertical;
  base*=.90+.19*macro+.07*grain-.14*damp;
  rough=.97;height=(grain-.5)*.001;
 }else if(vSurface.y< -1.5){base=pow(vColor,vec3(2.2))*(.82+.28*noise(vWorld.xz*8.));rough=.98;height=(grain-.5)*.001;
 }else if(uKind>.5&&uKind<1.5){
  float drip=noise(vec2(uv.x*5.8,uv.y*.42))*noise(vec2(uv.x*18.,uv.y*.15)),salt=smoothstep(.53,.8,fbm(uv*vec2(1.8,5.)));
  rust=smoothstep(.41,.67,drip+macro*.25)*painted*vertical*.58;
  float panelX=abs(fract(vLocal.x/1.9+.2)-.5),panelY=abs(fract(vLocal.y/.85)-.5);
  seam=(1.-smoothstep(.003,.003+max(fwidth(panelX),.002),panelX))*vertical*step(vLocal.y,3.8);
  seam=max(seam,(1.-smoothstep(.003,.003+max(fwidth(panelY),.002),panelY))*.45*vertical*step(vLocal.y,2.1));
  base*=1.-salt*.12-vertical*noise(uv*vec2(16.,.35))*.1;
  if(localN.y>.8&&vLocal.y>1.65&&vLocal.y<1.8){float tread=abs(sin((uv.x+uv.y)*35.)*sin((uv.x-uv.y)*35.));seam=max(seam,tread*.12*(1.-smoothstep(.35,1.2,length(fwidth(uv*35.)))));base*=.8+macro*.25;}
  height=(grain-.5)*.003+rust*.005-seam*.004;
 }else if(uKind>1.5&&uKind<2.5){
  float plank=hash(floor(uv*vec2(.45,3.)));base*=.7+macro*.3+grain*.12;
  if(n.y>.8&&vLocal.x> -220.&&vLocal.y<2.5){base*=.8+plank*.28;float fibers=noise(uv*vec2(3.,75.));base*=.86+fibers*.18;height=fibers*.008;}
  else{float corrugation=sin(uv.x*9.);height=corrugation*.008+grain*.004;base*=.88+.12*corrugation;}
  rust=smoothstep(.65,.84,macro)*vertical*.23;
 }else if(uKind>3.5&&vSurface.y<-.5){
  vec2 land=vWorld.xz;
  float drainage=fbm(land*vec2(.047,.026)+vec2(fbm(land*.013)*1.5,0.));
  float tufts=fbm(land*.29),grit=noise(land*2.4);
  float rock=smoothstep(.12,.48,1.-n.y+(drainage-.5)*.42);
  vec3 grass=mix(vec3(.071,.055,.027),vec3(.080,.122,.044),smoothstep(.32,.68,drainage));
  grass=mix(grass,vec3(.145,.114,.058),smoothstep(.52,.81,tufts)*.6);
  vec3 stone=mix(vec3(.057,.063,.071),vec3(.20,.185,.16),fbm(land*.15));
  base=mix(grass,stone,max(rock,1.-smoothstep(5.,14.,vWorld.y)));
  base*=.81+.25*grit+.14*tufts;
  height=(grit-.5)*.023+(tufts-.5)*.024;rough=.96;
 }else if(uKind>2.5){height=grain*.001;rough=max(.58,rough);base*=.91+grain*.1;}
 base=mix(base,vec3(.23,.085,.032),rust);base*=1.-seam*.22;
 float wet=clamp(uWeather.z*.6+(.48-macro)*.5,0.,.8)*detail;rough=max(.085,rough*(1.-wet*.55));base*=1.-wet*.13;
 if(uVesselIce>.001&&glass<.5&&lowerHull<.5){
  // Irregular pale rime over translucent blue-gray glaze, thicker on top.
  float crust=fbm(uv*vec2(1.5,2.8)),drips=noise(uv*vec2(12.,.7));
  float exposed=uKind<.5||uKind>4.5?1.:mix(.55,1.,smoothstep(1.65,2.35,vLocal.y));
  float ice=smoothstep(.60,.77,crust*.77+drips*.23+uVesselIce*exposed*(.64+.25*max(0.,n.y)));
  base=mix(base,mix(vec3(.35,.53,.61),vec3(.83,.88,.91),smoothstep(.28,.72,crust+grain*.16)),ice*.96);
  rough=mix(rough,mix(.22,.68,crust),ice);height+=ice*(grain-.5)*.013;
 }
 if(detail>.5&&uKind<3.5){vec3 dx=dFdx(vRelative),dy=dFdy(vRelative),r1=cross(dy,n),r2=cross(n,dx);float det=dot(dx,r1);n=normalize(n-sign(det)*(dFdx(height)*r1+dFdy(height)*r2)/max(abs(det),.0001));}
 vec3 l=sunDir(),f0=mix(vec3(.045),base*.5,(1.-painted)*.3);float shade=shadowAt(vShadow,uShadow),skyVisibility=.75+.25*n.y,contact=1.;
 if(uKind>.5&&uKind<1.5&&n.y>.5&&vLocal.y<2.){float cabin=length(max(abs(vLocal.xz-vec2(3.4,0.))-vec2(3.3,2.65),0.));contact=.5+.5*smoothstep(0.,1.6,cabin);}
 vec3 ambient=mix(vec3(.14,.21,.27),vec3(.43,.49,.5),n.y*.5+.5)*(.11+.89*uDaylight);
 vec3 c=base*ambient*contact*skyVisibility+brdf(base,f0,rough,n,v,l)*vec3(2.9,2.65,2.25)*shade*(1.-uWeather.w*.65)*uDaylight;
 vec3 reflected=sky(reflect(-v,n));vec3 F=f0+(1.-f0)*pow(1.-max(.01,dot(n,v)),5.);c+=reflected*F*(1.-rough*.65)*contact*mix(1.,.08,lowerHull);
 if(glass>.5){float interior=.25+.25*noise(vLocal.xz*5.);c=base*ambient*interior*.2+reflected*(.07+.72*pow(1.-max(0.,dot(n,v)),4.));}
 // Negative surface emission marks matte earth/shore banks; buildings keep their own materials.
 if(vSurface.y< -1.5)c*=mix(.48,1.,smoothstep(.0,2.3,vWorld.y));
 else if(uKind>3.5&&vSurface.y<-.5)c=base*(ambient+vec3(1.1)*max(0.,dot(n,l))*uDaylight*(1.-uWeather.w*.65));
 c+=base*directLamps(vWorld,n,v);c+=vColor*max(0.,vSurface.y)*2.*((vSurface.y>1.1&&uKind<1.5)?uLampUpgrade.y:1.)*((uKind>1.5&&uKind<2.5||uKind>5.5)?max(.12,1.-uDaylight):uLights);
 outColor=vec4(finishColor(c,vWorld),1.);}`;
export const depthVertex=`#version 300 es
precision highp float;layout(location=0) in vec3 aPosition;layout(location=4) in vec3 aInstance;uniform float uInstanced;uniform vec3 uRackScale;uniform mat4 uModel;uniform mat4 uLightVP;uniform mat4 uMVP;void main(){gl_Position=uMVP*vec4(aPosition*mix(vec3(1.),uRackScale,uInstanced)+aInstance*uInstanced,1.);}`;
export const depthFragment=`#version 300 es
precision highp float;void main(){}`;
export const sprayVertex=`#version 300 es
precision highp float;layout(location=0) in vec3 aPosition;layout(location=1) in vec2 aParticle;uniform mat4 uVP;uniform float uPixelRatio;out float vAlpha;
void main(){vec4 p=uVP*vec4(aPosition,1.);gl_Position=p;gl_PointSize=clamp(aParticle.y*115./max(1.,p.w)*uPixelRatio,1.,10.);vAlpha=aParticle.x;}`;
export const sprayFragment=`#version 300 es
precision highp float;uniform float uDaylight;in float vAlpha;out vec4 outColor;void main(){vec2 p=gl_PointCoord*2.-1.;p.x*=1.2;float r=dot(p,p);if(r>1.)discard;float mist=exp(-r*3.8)*(1.-smoothstep(.65,1.,r));outColor=vec4(vec3(.7,.74,.73)*(.12+.88*uDaylight),mist*vAlpha);}`;

export const foamFragment=`#version 300 es
${common}
in vec3 vWorld;in vec3 vNormal;in vec3 vColor;in vec2 vSurface;in vec3 vLocal;in vec4 vShadow;out vec4 outColor;
void main(){if(insideHullWater(vWorld))discard;float pores=noise(vWorld.xz*21.+vec2(uTime*.14,0.)),density=fbm(vWorld.xz*3.1+vec2(uTime*.05,0.)),edge=1.-smoothstep(.25,1.,abs(vSurface.x));pores=mix(pores,.55,smoothstep(.35,1.2,length(fwidth(vWorld.xz*21.))));float alpha=vSurface.y*edge*smoothstep(.25,.65,density)*mix(.5,1.,pores);if(alpha<.04)discard;vec3 n=normalize(vNormal),v=normalize(uEye-vWorld);float light=.7+.3*max(0.,dot(n,sunDir()));vec3 color=vColor*light*(.12+.88*uDaylight)+directLamps(vWorld,n,v)*.1;outColor=vec4(finishColor(color,vWorld),alpha);}`;

export const deckWashFragment=`#version 300 es
${common}
in vec3 vWorld;in vec3 vNormal;in vec3 vColor;in vec2 vSurface;in vec3 vLocal;in vec4 vShadow;out vec4 outColor;
void main(){float amount=mix(uDeckWater.x,uDeckWater.y,smoothstep(-.3,.3,vLocal.z));if(amount<.001)discard;float front=sin(vLocal.x*4.+uTime*3.2+abs(vLocal.z)*5.),ripple=sin(vLocal.x*12.-uTime*6.)*.03;vec3 n=normalize(vNormal+vec3(front*.06,0.,ripple));float sparkle=pow(max(0.,dot(n,normalize(normalize(uEye-vWorld)+sunDir()))),80.);vec3 c=vec3(.07,.13,.14)+vec3(.5,.58,.57)*smoothstep(.65,1.,front)*amount*2.+sparkle*.18*uDaylight;outColor=vec4(finishColor(c,vWorld),clamp(amount*5.,0.,.38));}`;

export const deckWashVertex=meshVertex.replace('vec4 local=vec4(aPosition*mix(vec3(1.),uRackScale,uInstanced)+aInstance*uInstanced,1.);vec4 p=uModel*local;','vec3 position=aPosition;position.y=1.745+mix(uDeckWater.x,uDeckWater.y,smoothstep(-.3,.3,aPosition.z))*(.7+.3*sin(aPosition.x*3.+uTime*3.));vec4 local=vec4(position,1.);vec4 p=uModel*local;');
