import {hullWaterGLSL} from './deck-water.mjs?v=0.18.33';
import {seaHeightGLSL} from './sea-spectrum.mjs?v=0.18.33';
// Shared atmosphere and ocean functions keep lighting and reflections consistent.
export const common=`
precision highp float;precision highp int;
uniform vec4 uRemoteLights[4];
uniform float uDeckSign;uniform vec3 uCraneColor;
uniform float uReflectionPass;uniform float uKind;uniform float uDaylight;uniform float uLights;uniform vec4 uLampUpgrade;uniform vec3 uRelativeEye;uniform mat4 uMVP;uniform mat4 uShadowMVP;uniform float uHullY;uniform vec4 uWake[48];uniform vec4 uWakeInfo[48];uniform int uWakeCount;uniform float uWakeTime;
uniform vec3 uSea;uniform float uTime;uniform vec4 uWeather;uniform vec4 uBoat;uniform vec3 uEye;uniform mat4 uVP;uniform mat4 uLightVP;
float hash(vec2 p){uvec2 i=uvec2(ivec2(p));uint h=i.x*1597334677u^i.y*3812015801u;h=(h^(h>>16))*2246822519u;return float(h^(h>>13))/4294967295.;}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float f=0.,a=.5;for(int i=0;i<4;i++){f+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+17.3;a*=.5;}return f;}

vec4 wakeAt(vec2 p){vec4 result=vec4(0.);for(int i=0;i<48;i++){if(i>=uWakeCount)break;float age=uWakeTime-uWakeInfo[i].w;if(age<0.||age>35.)continue;vec2 d=p-uWake[i].xy,f=uWakeInfo[i].xy,r=vec2(-f.y,f.x);float along=dot(d,f),side=dot(d,r),energy=uWakeInfo[i].z;if(abs(along)>20.+age||abs(side)>5.+age*energy*.4)continue;float q=abs(side)-(2.+age*energy*.34),fade=exp(-age*.10)*energy/7.;float ring=exp(-q*q/(.2+age*.035))*exp(-along*along/pow(6.+age*.3,2.));float churn=exp(-dot(d,d)/(8.+age*1.5));result.x=max(result.x,(ring*.32+churn*.18)*fade);float phase=q*2.1-age*1.4;result.yz+=r*sign(side)*(-sin(phase))*ring*fade*.07;result.w+=cos(phase)*ring*fade*.028;}result.x*=smoothstep(.25,.7,fbm(p*1.7+vec2(uTime*.08,0.)));result.w=clamp(result.w,-.07,.07);return result;}
vec3 shipLocal(vec3 p){vec2 f=vec2(cos(uBoat.z),sin(uBoat.z)),r=vec2(-f.y,f.x),d=p.xz-uBoat.xy;return vec3(dot(d,f),p.y-uHullY,dot(d,r));}
bool blocked(vec3 o,vec3 p,vec3 lo,vec3 hi){vec3 inv=1./(p-o+vec3(.00001)),a=(lo-o)*inv,b=(hi-o)*inv,mn=min(a,b),mx=max(a,b);return max(max(mn.x,mn.y),max(mn.z,.025))<min(min(mx.x,mx.y),min(mx.z,.98));}
vec3 lamps(vec3 p,vec3 n,vec3 view,bool volume,bool water){if(uLights<.5||length(p.xz)>160.*uLampUpgrade.z)return vec3(0.);vec3 sum=vec3(0.);for(int i=0;i<5;i++){if(volume&&i>2)break;vec3 o,dir,col;float cone,power;if(i==0){o=vec3(7.,5.3,0.);dir=normalize(vec3(1.,-.2,0.));col=vec3(.7,.86,1.);cone=.91;power=8.;}else if(i<3){float side=i==1?-1.:1.;o=vec3(.0,5.4,side*2.8);dir=normalize(vec3(.3,-.37,side));col=vec3(.72,.87,1.);cone=.79;power=6.;}else{float side=i==3?-1.:1.;o=vec3(-.35,5.4,side*2.8);dir=normalize(vec3(-.6,-1.,-side*.25));col=vec3(1.,.77,.49);cone=.55;power=3.8;}cone-=uLampUpgrade.w;power*=uLampUpgrade.y;if(i>2)col=mix(col,vec3(.92,.96,1.),uLampUpgrade.x*.16);o.x*=uDeckSign;dir.x*=uDeckSign;vec3 delta=p-o;float dist=length(delta);vec3 toPoint=delta/max(.01,dist);float beam=smoothstep(cone,min(.999,cone+.09),dot(toPoint,dir));if(beam<.001)continue;float energy=power*beam/(1.+dist*dist*.035/(uLampUpgrade.z*uLampUpgrade.z));if(!volume&&p.y<1.5&&(blocked(o,p,vec3(.25,1.75,-2.6),vec3(6.5,5.8,2.6))||blocked(o,p,vec3(-10.8,1.8,-2.9),vec3(-3.15,5.3,.8))))energy*=.55;if(volume)sum+=col*energy;else{float diffuse=max(.04,dot(n,-toPoint)),spec=pow(max(0.,dot(n,normalize(view-toPoint))),70.);sum+=col*energy*((water?spec*.65+diffuse*.001:diffuse*.42+spec*.25));}}return sum;}
vec3 directLamps(vec3 p,vec3 n,vec3 view){vec2 f=vec2(cos(uBoat.z),sin(uBoat.z)),r=vec2(-f.y,f.x);vec3 localN=vec3(dot(n.xz,f),n.y,dot(n.xz,r)),localV=vec3(dot(view.xz,f),view.y,dot(view.xz,r));vec3 lighting=lamps(shipLocal(p),localN,localV,false,false)*(1.-uDaylight*.88);if(p.x<115.&&p.x> -235.)for(int i=0;i<4;i++){vec3 o=vec3(80.,9.,-200.+float(i)*145.),d=o-p;float dist=length(d);lighting+=vec3(1.,.77,.48)*max(0.,dot(n,d/max(.01,dist)))*3./(1.+dist*dist*.09)*(1.-uDaylight*.85);}return lighting;}
vec3 waterLamps(vec3 p,vec3 n,vec3 view){vec2 f=vec2(cos(uBoat.z),sin(uBoat.z)),r=vec2(-f.y,f.x);return lamps(shipLocal(p),vec3(dot(n.xz,f),n.y,dot(n.xz,r)),vec3(dot(view.xz,f),view.y,dot(view.xz,r)),false,true)*(1.-uDaylight*.995);}
vec3 remoteBeams(vec3 p){float energy=0.;for(int i=0;i<4;i++){
 vec4 lamp=uRemoteLights[i];if(lamp.w<=0.)continue;
 vec2 f=vec2(cos(lamp.z),sin(lamp.z)),d=p.xz-lamp.xy-f*8.;
 float dist=length(d),along=dot(d,f);
 float cone=smoothstep(.88,.99,along/max(.1,dist));
 float side=abs(dot(d,vec2(-f.y,f.x)));
 float deck=exp(-dist*.12),beam=cone*smoothstep(0.,7.,along)*(1.-smoothstep(12.,105.,dist));
 energy+=deck*.08+beam*(.09+uWeather.y*.16)*exp(-side*.04);
 }return vec3(.66,.84,1.)*energy*(1.-smoothstep(.08,.65,uDaylight));}
vec3 beamFog(vec3 world){if(uLights<.5||uDaylight>.7)return vec3(0.);vec3 sum=vec3(0.);for(int i=0;i<12;i++){float t=(float(i)+.5)/12.;vec3 p=mix(uEye,world,t);sum+=lamps(shipLocal(p),vec3(0,1,0),vec3(0,1,0),true,false);}return sum*.5*(.0016+uWeather.y*.012+uWeather.z*.006)*smoothstep(.6,.07,uDaylight);}

vec3 sunDir(){return normalize(vec3(-.65,.55,-.45));}
vec3 sky(vec3 ray){float cover=clamp(uWeather.w*.7+uWeather.z*.25,0.,1.);float elev=max(ray.y,0.);vec3 horizon=mix(vec3(.62,.69,.69),vec3(.31,.39,.43),cover);vec3 zenith=mix(vec3(.23,.36,.47),vec3(.12,.20,.27),cover);vec3 color=mix(horizon,zenith,pow(elev,.45));float clouds=fbm(ray.xz/(max(.18,ray.y)+.25)*1.8+vec2(uTime*.008,0.));color=mix(color,mix(vec3(.76,.76,.69),vec3(.37,.43,.46),cover),smoothstep(.38,.7,clouds)*.65);float sun=pow(max(0.,dot(ray,sunDir())),350.);color+=vec3(1.,.73,.42)*sun*2.*pow(1.-cover,3.);return color*(.015+.985*uDaylight);}
${seaHeightGLSL}
${hullWaterGLSL}
float shadowAt(vec4 lightPos,sampler2D shadowMap){vec3 p=lightPos.xyz/lightPos.w*.5+.5;if(any(lessThan(p,vec3(0.)))||any(greaterThan(p,vec3(1.))))return 1.;float s=0.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float depth=texture(shadowMap,p.xy+vec2(float(x),float(y))/2048.).r;s+=p.z-.0007<=depth?1.:.24;}return s/9.;}
vec3 finishColor(vec3 c,vec3 world){if(uReflectionPass>.5)return c/(1.+c);float mist=(1.-exp(-length(world-uEye)*(.00035+uWeather.y*.0028)));c=mix(c,mix(vec3(.019,.032,.05),vec3(.4,.47,.5),uDaylight),mist);c+=beamFog(world)+remoteBeams(world);c*=1.18;c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);return pow(max(c,vec3(0.)),vec3(.4545));}
`;
export const oceanVertex=`#version 300 es
${common}
layout(location=0) in vec3 aPosition;uniform vec2 uCenter;out vec3 vWorld;out vec4 vShadow;out vec2 vWaterLocal;
void main(){vWaterLocal=aPosition.xz;vec3 p=aPosition;p.xz+=uCenter;p.y=oceanHeight(p.xz)+wakeAt(p.xz).w;vWorld=p;vShadow=uLightVP*vec4(p,1.);gl_Position=uVP*vec4(p,1.);}`;
export const oceanFragment=`#version 300 es
${common}
in vec3 vWorld;in vec4 vShadow;in vec2 vWaterLocal;uniform vec4 uDieselSlick;uniform vec2 uCenter;uniform sampler2D uShadow;uniform sampler2D uReflection;uniform mat4 uReflectionVP;out vec4 outColor;
void main(){if(insideHullWater(vWorld))discard;vec2 p=vWorld.xz;vec4 field=seaField(p),wake=wakeAt(p);float h=field.x;vec2 slope=field.yz+wake.yz;vec2 detail=vWaterLocal+mod(uCenter,25600.);
{vec2 k=vec2(1.9727300,1.1825128);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*2.3);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uTime*4.7500526+0.000+2.3*noise(detail*.67+vec2(0.000,uTime*.03)))*0.0350000*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}
{vec2 k=vec2(3.0404593,2.4424593);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*3.9);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uTime*6.1853860+2.170+2.3*noise(detail*.67+vec2(2.170,uTime*.03)))*0.0250000*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}
{vec2 k=vec2(6.4150080,1.9333061);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*6.7);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uTime*8.1072190+4.340+2.3*noise(detail*.67+vec2(4.340,uTime*.03)))*0.0194444*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}
{vec2 k=vec2(7.1248581,8.1164276);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*10.8);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uTime*10.2931045+6.510+2.3*noise(detail*.67+vec2(6.510,uTime*.03)))*0.0159091*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}
{vec2 k=vec2(16.8596806,3.8782949);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*17.3);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uTime*13.0273942+8.680+2.3*noise(detail*.67+vec2(8.680,uTime*.03)))*0.0134615*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}
{vec2 k=vec2(18.9348971,19.3876164);float rippleFilter=1.-smoothstep(.55,2.5,length(fwidth(vWaterLocal))*27.1);slope+=normalize(k)*cos(dot(vWaterLocal,k)+mod(dot(mod(uCenter,25600.),k),6.2831853)-uTime*16.3049379+10.850+2.3*noise(detail*.67+vec2(10.850,uTime*.03)))*0.0116667*rippleFilter*(.35+uWeather.x*.14)*(.35+.9*noise(detail*.19+k*7.));}

 vec2 warp=vec2(noise(detail*.17+vec2(uTime*.025,0.)),noise(detail*.17+vec2(37.,uTime*.02)));vec2 microPoint=mat2(.83,-.56,.56,.83)*detail*1.3+warp*2.;float microBase=fbm(microPoint);vec2 grainSlope=vec2(fbm(microPoint+vec2(.12,0.))-microBase,fbm(microPoint+vec2(0.,.12))-microBase)/.12;float grainFilter=1.-smoothstep(.3,1.4,length(fwidth(vWaterLocal*1.3)));slope+=grainSlope*(.12+uWeather.x*.035)*grainFilter;
 vec3 n=normalize(vec3(-slope.x,1.,-slope.y)),v=normalize(uEye-vWorld),l=sunDir(),halfway=normalize(v+l);float nv=max(.001,dot(n,v)),nl=max(0.,dot(n,l)),fresnel=.0204+.9796*pow(1.-nv,5.);
 vec3 reflected=sky(reflect(-v,n));vec4 clip=uReflectionVP*vec4(p.x,0.,p.y,1.);vec2 uv=clip.xy/clip.w*.5+.5+slope*.007;vec4 objects=textureLod(uReflection,clamp(uv,vec2(.002),vec2(.998)),.7+uWeather.x*.2);float edge=smoothstep(0.,.04,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));reflected=mix(reflected,objects.rgb/max(vec3(.035),1.-objects.rgb),objects.a*edge);
 vec3 deep=vec3(.003,.018,.026),scatter=vec3(.012,.065,.061)*pow(max(0.,dot(v,-l)),3.)*max(0.,h)*.11;vec3 water=deep*(.5+nl*.5)*(.12+.88*uDaylight)+scatter*uDaylight;
 float rough=.105+uWeather.x*.006,a=rough*rough,nh=max(0.,dot(n,halfway)),den=nh*nh*(a*a-1.)+1.,ggx=a*a/(3.14159*den*den+.00001),spec=ggx*.014*pow(1.-uWeather.w,3.);
 vec3 color=mix(water,reflected,clamp(fresnel,.0204,.95))+vec3(1.,.88,.7)*spec*nl*uDaylight;
 vec2 forward=vec2(cos(uBoat.z),sin(uBoat.z)),delta=p-uBoat.xy;float along=dot(delta,forward),side=abs(dot(delta,vec2(-forward.y,forward.x))),speed=abs(uBoat.w);float bubbles=fbm(detail*1.8-vec2(uTime*.12,0.));float bow=exp(-pow((along-10.8)/2.,2.))*exp(-pow((side-2.)/.9,2.))*clamp(speed/5.,0.,1.);float froth=clamp(wake.x+bow*.3,0.,.6)*smoothstep(.3,.7,bubbles);
 color=mix(color,vec3(.6,.67,.65)*(.1+.9*uDaylight),froth);color*=mix(.72,1.,shadowAt(vShadow,uShadow));color+=waterLamps(vWorld,n,v)+directLamps(vWorld,n,v)*froth*.08;
 if(uDieselSlick.z>0.){vec2 spill=p-uDieselSlick.xy;float radius=12.+(180.-uDieselSlick.z)*.09,edge=length(spill*vec2(.75,1.2))/radius+noise(spill*.14)*.26;float oil=(1.-smoothstep(.67,1.,edge))*smoothstep(0.,60.,uDieselSlick.z);color=mix(color,vec3(.004,.005,.006),oil*.9);}
 outColor=vec4(finishColor(color,vWorld),1.);}`;
export const meshVertex=`#version 300 es
${common}
layout(location=0) in vec3 aPosition;layout(location=1) in vec3 aNormal;layout(location=2) in vec3 aColor;layout(location=3) in vec2 aSurface;
layout(location=4) in vec3 aInstance;uniform float uInstanced;uniform vec3 uRackScale;uniform mat4 uModel;out vec3 vWorld;out vec3 vNormal;out vec3 vColor;out vec2 vSurface;out vec3 vLocal;out vec3 vRelative;out vec4 vShadow;
void main(){vec4 local=vec4(aPosition*mix(vec3(1.),uRackScale,uInstanced)+aInstance*uInstanced,1.);vec4 p=uModel*local;vWorld=p.xyz;vNormal=transpose(inverse(mat3(uModel)))*(aNormal/mix(vec3(1.),uRackScale,uInstanced));vColor=aColor;vSurface=aSurface;vLocal=aPosition;vRelative=mat3(uModel)*local.xyz;vShadow=uShadowMVP*local;gl_Position=uMVP*local;}`;
export const meshFragment=`#version 300 es
${common}
in vec3 vWorld;in vec3 vNormal;in vec3 vColor;in vec2 vSurface;in vec3 vLocal;in vec3 vRelative;in vec4 vShadow;uniform sampler2D uShadow;out vec4 outColor;
const float PI=3.14159265;
vec3 brdf(vec3 base,vec3 f0,float rough,vec3 n,vec3 v,vec3 l){vec3 h=normalize(l+v);float nv=max(.02,dot(n,v)),nl=max(0.,dot(n,l)),nh=max(0.,dot(n,h)),vh=max(0.,dot(v,h)),a=rough*rough,a2=a*a,d=a2/(PI*pow(nh*nh*(a2-1.)+1.,2.)+.00001),k=pow(rough+1.,2.)/8.,g=nv/(nv*(1.-k)+k)*nl/(nl*(1.-k)+k);vec3 F=f0+(1.-f0)*pow(1.-vh,5.);return ((1.-F)*base/PI+F*d*g/max(.08,4.*nv*nl))*nl;}
float filteredGrain(vec2 p){float footprint=max(length(dFdx(p)),length(dFdy(p)));return mix(noise(p),.5,smoothstep(.35,1.2,footprint));}
void main(){if(uReflectionPass>.5&&vWorld.y<.04)discard;
 vec3 n=normalize(vNormal),v=normalize(uRelativeEye-vRelative),localN=abs(normalize(cross(dFdx(vLocal),dFdy(vLocal))));
 vec2 uv=localN.y>.65?vLocal.xz:localN.x>.65?vLocal.zy:vLocal.xy;
 float grain=filteredGrain(uv*48.),macro=fbm(uv*.7),vertical=1.-abs(n.y),painted=step(.34,vColor.r),glass=1.-step(.145,vSurface.x),detail=step(.5,uKind)*(1.-glass);
 float rust=0.,seam=0.,height=0.;vec3 base=pow(vColor,vec3(2.2));float rough=clamp(vSurface.x,.08,.98);float lowerHull=(uKind>.5&&uKind<1.5&&vLocal.y<1.65)?1.:0.;if(lowerHull>.5)rough=max(rough,.84);if(uKind>4.5&&distance(vColor,vec3(.72,.29,.065))<.03)base=pow(uCraneColor,vec3(2.2));
 if(vSurface.y< -1.5){base=pow(vColor,vec3(2.2))*(.82+.28*noise(vWorld.xz*8.));rough=.98;height=(grain-.5)*.001;
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
  // Coastal turf breaks into exposed rock on steeper slopes and wet shoreline.
  float turf=fbm(vWorld.xz*.055),rock=smoothstep(.12,.55,1.-n.y);
  vec3 grass=mix(vec3(.065,.105,.047),vec3(.13,.17,.075),turf);
  vec3 stone=mix(vec3(.09,.10,.095),vec3(.22,.21,.18),fbm(vWorld.xz*.19));
  base=mix(grass,stone,max(rock,1.-smoothstep(2.,9.,vWorld.y)));
  height=(noise(vWorld.xz*1.8)-.5)*.035;rough=.96;
 }else if(uKind>2.5){height=grain*.001;rough=max(.58,rough);base*=.91+grain*.1;}
 base=mix(base,vec3(.23,.085,.032),rust);base*=1.-seam*.22;
 float wet=clamp(uWeather.z*.6+(.48-macro)*.5,0.,.8)*detail;rough=max(.085,rough*(1.-wet*.55));base*=1.-wet*.13;
 if(detail>.5){vec3 dx=dFdx(vRelative),dy=dFdy(vRelative),r1=cross(dy,n),r2=cross(n,dx);float det=dot(dx,r1);n=normalize(n-sign(det)*(dFdx(height)*r1+dFdy(height)*r2)/max(abs(det),.0001));}
 vec3 l=sunDir(),f0=mix(vec3(.045),base*.5,(1.-painted)*.3);float shade=shadowAt(vShadow,uShadow),skyVisibility=.75+.25*n.y,contact=1.;
 if(uKind>.5&&uKind<1.5&&n.y>.5&&vLocal.y<2.){float cabin=length(max(abs(vLocal.xz-vec2(3.4,0.))-vec2(3.3,2.65),0.));contact=.5+.5*smoothstep(0.,1.6,cabin);}
 vec3 ambient=mix(vec3(.14,.21,.27),vec3(.43,.49,.5),n.y*.5+.5)*(.11+.89*uDaylight);
 vec3 c=base*ambient*contact*skyVisibility+brdf(base,f0,rough,n,v,l)*vec3(2.9,2.65,2.25)*shade*(1.-uWeather.w*.65)*uDaylight;
 vec3 reflected=sky(reflect(-v,n));vec3 F=f0+(1.-f0)*pow(1.-max(.01,dot(n,v)),5.);c+=reflected*F*(1.-rough*.65)*contact*mix(1.,.08,lowerHull);
 if(glass>.5){float interior=.25+.25*noise(vLocal.xz*5.);c=base*ambient*interior*.2+reflected*(.07+.72*pow(1.-max(0.,dot(n,v)),4.));}
 // Negative surface emission marks matte earth/shore banks; buildings keep their own materials.
 if(vSurface.y< -1.5||(uKind>3.5&&vSurface.y<-.5))c=base*(ambient+vec3(1.1)*max(0.,dot(n,l))*uDaylight*(1.-uWeather.w*.65));
 c+=base*directLamps(vWorld,n,v);c+=vColor*max(0.,vSurface.y)*2.*((vSurface.y>1.1&&uKind<1.5)?uLampUpgrade.y:1.)*(uKind>1.5&&uKind<2.5?max(.12,1.-uDaylight):uLights);
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
