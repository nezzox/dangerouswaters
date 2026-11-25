import {droneCameraFollow,dronePose} from './drone-survey.mjs?v=0.18.83';
import {replacementProgress} from './man-overboard.mjs?v=0.18.83';
import {createAntialias} from './antialias.mjs?v=0.18.83';
import {LIGHTING_PROFILES} from './light-upgrades.mjs?v=0.18.83';
import {deckFrame,deckSign,workX,HIGHWATER_SEARCHLIGHT} from './vessel-profile.mjs?v=0.18.83';
import {createTerrainLoader} from './terrain-loader.mjs?v=0.18.83';
import {craneColor} from './crane-style.mjs?v=0.18.83';
import {rackScale} from './vessel-style.mjs?v=0.18.83';
import {createRackInstances} from './rack-instances.mjs?v=0.18.83';
import {lineHaulerMounts,haulerRunning} from './line-hauler.mjs?v=0.18.83';
import {netWorkPose} from './deck-work.mjs?v=0.18.83';
import {visibleFleet,fleetColor} from './fleet-visuals.mjs?v=0.18.83';
import {fleetStats} from './fleet.mjs?v=0.18.83';
import {buildPortScenery,buildPortBoom,MATTHEW_FLOODLIGHTS} from './port-scenery.mjs?v=0.18.83';
import {buildGeography} from './geography-mesh.mjs?v=0.18.83';
import {createDeckWater,stepDeckWater} from './deck-water.mjs?v=0.18.83';
import {dockingStage,QUAY,BERTH,PORT_QUAYS,berthsAt,quayPoint} from './harbor.mjs?v=0.18.83';
import {vesselStats} from './career.mjs?v=0.18.83';
import {boatById} from './catalog.mjs?v=0.18.83';
import {createBuoyancy,stepBuoyancy} from './buoyancy.mjs?v=0.18.83';
import {buildFoam} from './foam.mjs?v=0.18.83';
import {fenderPose,createFenderMotion,stepFenderMotion,ropePoints} from './fenders.mjs?v=0.18.83';
import {inverseTransform,multiply,transform,perspective,lookAt,identity,project} from './math3d.mjs?v=0.18.83';
import {geometry,buildRackPot,buildDeckWash,buildVessel,buildBuoy,buildOceanGrid,buildCrewParts,buildDeckEquipment,buildArticulatedCrane} from './geometry.mjs?v=0.18.83';
import {deckWorkPose} from './deck-work.mjs?v=0.18.83';
import {createCrew,commandCrew,stepCrew,crewPose} from './crew.mjs?v=0.18.83';
import * as shaders from './scene-shaders.mjs?v=0.18.83';
export {seaHeight as surfaceHeight} from './sea-spectrum.mjs?v=0.18.83';
import {seaHeight,seaSettings,directionalSpectrum} from './sea-spectrum.mjs?v=0.18.83';
function ortho(l,r,b,t,n,f){return new Float64Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);}
export function createScene(canvas,{preview=false}={}){
 let currentSea={},haulerAngle=0;const surfaceHeight=(x,z,t,waves)=>seaHeight(x,z,t,waves,currentSea);
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance'});if(!gl)return null;
 const matrixScratch=new Float32Array(16),clipScratch=new Float64Array(16),inverseScratch=new Float64Array(16);let lampProfile=LIGHTING_PROFILES[0];
 function matrix(location,value){matrixScratch.set(value);gl.uniformMatrix4fv(location,false,matrixScratch);}
 function modelMatrices(p,model){matrix(p.u.uModel,model);if(p.view)matrix(p.u.uMVP,multiply(p.view,model,clipScratch));if(p.light&&p.u.uShadowMVP)matrix(p.u.uShadowMVP,multiply(p.light,model,clipScratch));if(p.eye)gl.uniform3f(p.u.uRelativeEye,p.eye[0]-model[12],p.eye[1]-model[13],p.eye[2]-model[14]);}
 const resources=[],programs=[];let running=true;
 function program(vs,fs){const p=gl.createProgram();for(const [kind,code] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const shader=gl.createShader(kind);gl.shaderSource(shader,code);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(message);}gl.attachShader(p,shader);gl.deleteShader(shader);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));programs.push(p);const names=['uVP','uLightVP','uModel','uMVP','uShadowMVP','uRelativeEye','uLampUpgrade','uHullOrigin','uHullOffset','uTime','uDetailTime','uWeather','uSea','uWavePhase[0]','uBoat','uEye','uShadow','uCenter','uRemoteLights[0]','uQuayLights[0]','uDieselSlick','uPixelRatio','uDaylight','uLights','uHullY','uWake[0]','uWakeInfo[0]','uWakeCount','uWakeTime','uHullRamp','uDeckSign','uRoofSearchlight','uCraneColor','uKind','uInstanced','uRackScale','uReflectionPass','uReflection','uReflectionVP','uHullInverse','uDeckWater','uVesselIce'];return {p,u:Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(p,n)]))};}
 function mesh(data,stride=11,kind=0){const vao=gl.createVertexArray(),buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);const sizes=stride===11?[3,3,3,2]:[3];let offset=0;for(let i=0;i<sizes.length;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,sizes[i],gl.FLOAT,false,stride*4,offset*4);offset+=sizes[i];}const m={vao,buffer,count:data.length/stride,kind};resources.push(m);return m;}
 function destroyMesh(m){gl.deleteVertexArray(m.vao);gl.deleteBuffer(m.buffer);if(m.instances)gl.deleteBuffer(m.instances);resources.splice(resources.indexOf(m),1);}
 let ocean,solid,depth,spray,foam,vessel,harbor,matthewHarbor,buoy,water,shadowTexture,shadowFrame;
 try{ocean=program(shaders.oceanVertex,shaders.oceanFragment);solid=program(shaders.meshVertex,shaders.meshFragment);depth=program(shaders.depthVertex,shaders.depthFragment);spray=program(shaders.sprayVertex,shaders.sprayFragment);foam=program(shaders.meshVertex,shaders.foamFragment);vessel=mesh(buildVessel(0),11,1);harbor=mesh(buildPortScenery(),11,2);matthewHarbor=mesh(buildPortScenery(PORT_QUAYS[1],true),11,6);buoy=mesh(buildBuoy());water=mesh(buildOceanGrid(),3);
  shadowTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,2048,2048,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  shadowFrame=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFrame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowTexture,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Unable to create shadow framebuffer');gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }catch(error){for(const m of resources){gl.deleteBuffer(m.buffer);gl.deleteVertexArray(m.vao);}for(const p of programs)gl.deleteProgram(p);throw error;}
 const reflectionTexture=gl.createTexture(),reflectionDepth=gl.createRenderbuffer(),reflectionFrame=gl.createFramebuffer();let reflectionWidth=0,reflectionHeight=0;
 const antialias=createAntialias(gl,program);
 function resizeReflection(width,height){const w=Math.min(1536,width),h=Math.max(1,Math.round(w*height/width));if(w===reflectionWidth&&h===reflectionHeight)return;reflectionWidth=w;reflectionHeight=h;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,reflectionTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.bindRenderbuffer(gl.RENDERBUFFER,reflectionDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);gl.bindFramebuffer(gl.FRAMEBUFFER,reflectionFrame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,reflectionTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,reflectionDepth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Unable to create water reflection framebuffer');gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.activeTexture(gl.TEXTURE0);}
 let crew=createCrew(),lastCrewState=null,buoyancy=null,fenderMotion=createFenderMotion();const crewMeshes=[0,1,2].map(role=>Object.fromEntries(Object.entries(buildCrewParts(role)).map(([key,data])=>[key,mesh(data,11,3)])));const foamMesh=mesh(new Float32Array(0));let foamKey='';
 const washProgram=program(shaders.deckWashVertex,shaders.deckWashFragment),deckWater=createDeckWater();let washMesh=mesh(buildDeckWash());let currentInverse=identity();
 const equipment=Object.fromEntries(Object.entries(buildDeckEquipment()).map(([key,data])=>[key,mesh(data,11,key==='boom'?5:0)]));const crane=Object.fromEntries(Object.entries(buildArticulatedCrane()).map(([key,data])=>[key,mesh(data,11,5)]));const portBoom=mesh(buildPortBoom(),11,5);let deckVisual=null,currentBoat=identity(),daylight=1,lightEnabled=true,crewPitch=0,crewRoll=0,currentWaves=0,wakeCount=0,wakeTime=0;const wakePositions=new Float32Array(48*4),wakeInfo=new Float32Array(48*4);
 const particles=[],particleData=new Float32Array(1200*5),particleVAO=gl.createVertexArray(),particleBuffer=gl.createBuffer();gl.bindVertexArray(particleVAO);gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);gl.bufferData(gl.ARRAY_BUFFER,particleData.byteLength,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,20,12);
 let revision=0,terrain=null,terrainKey='',terrainModel=identity();const matthewModel=transform(PORT_QUAYS[1].x,0,PORT_QUAYS[1].y);const terrainLoader=preview?null:createTerrainLoader();
 let vesselKey='',currentDesign=boatById(),lastTime=0,spawnDebt=0,seed=7629,zoom=.74,cameraTilt=1,viewProjection=identity(),size={width:1,height:1},lastHullY=0;
 const quayLights=new Float32Array(16),noQuayLights=new Float32Array(16);
 const matthew=PORT_QUAYS[1];
 MATTHEW_FLOODLIGHTS.forEach((u,i)=>{const p=quayPoint(u,4.3,matthew);quayLights.set([p.x,p.y,matthew.heading-Math.PI/2,1],i*4);});
 const iceShape=geometry(),malletShape=geometry();
 for(let i=0;i<22;i++){
  const z=-2.72+i*.255,reach=.09+.24*(.5+.5*Math.sin(i*1.91))**2;
  iceShape.ellipsoid(-12,3.015,z,.10,.066+reach*.17,.16,[.83,.9,.93],.52);
  iceShape.tube([-12,2.99,z],[-12.035,2.99-reach,z+.047*Math.sin(i*4)],.062, [.75,.84,.9],5,.36,.07);
 }
 malletShape.tube([0,0,0],[0,-.52,0],.026,[.48,.32,.16],6);
 malletShape.roundedBox(0,-.51,0,.23,.10,.095,.018,[.24,.27,.29],.42);
 const railIce=mesh(iceShape.array()),mallet=mesh(malletShape.array());
 const droneHull=geometry(),droneBlades=geometry(),droneMotors=[];
 const droneMetal=[.28,.33,.35],droneCase=[.76,.81,.79],droneLamp=[.29,.76,.7];
 droneHull.roundedBox(0,0,0,.88,.30,.65,.10,droneCase,.39);
 droneHull.box(.16,-.21,0,.33,.17,.29,[.1,.15,.17],.42);
 for(const x of [-.76,.76])for(const z of [-.72,.72]){
  droneHull.tube([0,0,0],[x,.1,z],.066,droneMetal,8);
  droneHull.tube([x,0,z],[x,.17,z],.12,droneMetal,10);
  droneHull.box(x,.13,z,.13,.06,.13,droneLamp,.35,2.6);
  droneMotors.push([x,.18,z]);
 }
 for(const z of [-.26,.26])droneHull.tube([-.35,-.25,z],[.43,-.25,z],.035,droneMetal,8);
 droneBlades.box(0,0,0,.65,.016,.070,droneMetal,.45);
 const droneMesh=mesh(droneHull.array()),dronePropeller=mesh(droneBlades.array());
 let dronePosition=null;
 function drawDrone(p,flight){
  if(!flight||!dronePosition)return;
  const {x,y,height,heading,phase}=dronePosition;
  const model=transform(x,height,y,heading,0,phase==='scan'?.10:0);
  drawMesh(p,droneMesh,model);
  for(const [i,[x,y,z]] of droneMotors.entries())drawMesh(p,dronePropeller,multiply(model,transform(x,y,z,flight.elapsed*(i%2?49:-49)+i*.8)));
 }
 const aircraft=geometry(),blades=geometry();
 aircraft.ellipsoid(0,0,0,3.1,1.15,1.12,[.73,.21,.08]);
 aircraft.ellipsoid(1.4,.24,0,1.35,.8,1.08,[.11,.19,.23]);
 aircraft.tube([-1.7,.18,0],[-6,.55,0],.28,[.72,.24,.10],10);
 aircraft.box(-5.7,1.05,0,.7,1.5,.15,[.73,.21,.08]);
 for(const side of [-1,1]){
  aircraft.tube([-1.8,-1.45,side], [2,-1.45,side],.085,[.13,.16,.17],8);
  aircraft.tube([0,-.72,side*.6], [0,-1.45,side],.085,[.13,.16,.17],8);
 }
 blades.box(0,1.4,0,9,.055,.22,[.13,.15,.16]);
 blades.box(0,1.4,0,.22,.055,9,[.13,.15,.16]);
 aircraft.roundedBox(-.45,.97,0,2.15,.65,1.35,.24,[.48,.23,.12],.65);
 aircraft.tube([-.1,1.15,0],[-.1,1.54,0],.12,[.18,.22,.23],10);
 aircraft.box(-4.75,.65,0,1.05,.12,2.25,[.69,.27,.12],.6);
 aircraft.box(-5.74,.96,.19,1.85,.14,.14,[.17,.21,.24],.67);
 aircraft.box(-5.74,.96,.19,.14,1.85,.14,[.17,.21,.24],.67);
 for(const side of [-1,1]){
  aircraft.roundedBox(.05,.32,1.04*side,1.44,.55,.09,.04,[.10,.18,.22],.24);
  aircraft.box(-.94,-.06,1.05*side,.42,.55,.08,[.77,.48,.24],.64);
  aircraft.box(-.18,-.63,1.02*side,2.45,.15,.10,[.72,.67,.48],.62);
 }
 aircraft.ellipsoid(1.95,-.68,0,.22,.15,.24,[.9,.92,.75],.25);
 const helicopter=mesh(aircraft.array()),rotors=mesh(blades.array());
 const tugShape=geometry();
 const sections=[[-6.6,1.6],[-5.5,2.25],[-2,2.52],[2.8,2.48],[5,1.85],[6.55,.25]];
 const hull=[.13,.20,.23],trim=[.71,.36,.14],cabin=[.64,.64,.56],rubber=[.075,.085,.084],window=[.10,.19,.22];
 for(let i=1;i<sections.length;i++){
  const [x,a]=sections[i-1],[end,b]=sections[i];
  tugShape.quad([x,1.25,-a],[x,1.25,a],[end,1.25,b],[end,1.25,-b],[.27,.30,.27],.86);
  for(const side of [-1,1]){
   const q=(y,z,w)=>[y[0],z,y[1]*side*w];
   const first=[x,a],last=[end,b];
   const face=(low,high,scale,color)=>{
    const verts=[q(first,low,scale),q(last,low,scale),q(last,high,1),q(first,high,1)];
    tugShape.quad(...(side>0?verts:verts.reverse()),color,.7);
   };
   face(-1.25,.68,.72,hull);face(.68,1.25,1,trim);
   tugShape.tube([x,.87,a*side],[end,.87,b*side],.14,rubber,8);
   tugShape.tube([x,1.94,a*side*.95],[end,1.94,b*side*.95],.039,[.63,.65,.61],6);
   tugShape.tube([x,1.26,a*side*.95],[x,1.94,a*side*.95],.043,[.63,.65,.61],6);
  }
 }
 tugShape.quad([-6.6,-1.25,-1.15],[-6.6,-1.25,1.15],[-6.6,1.25,1.6],[-6.6,1.25,-1.6],hull,.73);
 tugShape.roundedBox(.85,2.24,0,4.5,2.06,3.16,.22,cabin,.7);
 tugShape.roundedBox(1.38,3.61,0,3.68,1.2,3.52,.26,cabin,.65);
 tugShape.roundedBox(1.39,4.29,0,4.15,.31,3.91,.14,trim,.67);
 for(const side of [-1,1]){
  for(const x of [.16,1.37,2.59])tugShape.box(x,3.71,1.768*side,.91,.53,.055,window,.27);
  tugShape.box(-.45,2.23,1.58*side,.64,1.7,.05,[.24,.30,.30],.66);
  for(const x of [-4.7,-2.5,.3,3.59]){
   const z=side*(x>3?2.20:2.48);
   tugShape.tube([x,.66,z],[x,.66,z+side*.15],.38,rubber,14,.91);
   tugShape.tube([x,1.33,z*.93],[x,.9,z],.032,[.42,.39,.29],6);
  }
 }
 for(const z of [-1.08,0,1.08])tugShape.box(3.22,3.7,z,.055,.52,.78,window,.23);
 tugShape.tube([-1.7,2.3,0],[-1.93,5.07,0],.29,[.23,.26,.26],10);
 tugShape.tube([-1.93,4.68,0],[-1.97,5.09,0],.30,trim,10);
 tugShape.tube([1.28,4.43,0],[1.28,6.02,0],.068,[.68,.69,.65],8);
 tugShape.box(1.28,5.68,0,1.08,.11,.20,[.68,.69,.65],.57);
 tugShape.box(-3.7,1.55,0,1.48,.57,1.45,[.27,.31,.30],.7);
 tugShape.tube([-3.7,1.93,-.66],[-3.7,1.93,.66],.26,[.39,.31,.21],12);
 tugShape.box(2.77,4.1,-1.58,.22,.16,.17,[.87,.12,.07],.35,1.3);
 tugShape.box(2.77,4.1,1.58,.22,.16,.17,[.15,.88,.27],.35,1.3);
 tugShape.box(-1.2,3.01,0,.26,.21,.35,[.94,.84,.57],.35,1.4);
 const tugMesh=mesh(tugShape.array(),11,6),towLineShape=geometry();
 towLineShape.tube([0,0,0],[0,1,0],.065,[.94,.11,.064],8,.78,.17);
 const towLineMesh=mesh(towLineShape.array());

 const remoteLights=new Float32Array(32);
 const fleetMeshes=new Map();let nearbyFleet=[];
 function prepareFleet(s,w,t,dt){const active=new Set();nearbyFleet=visibleFleet(s).map(v=>{const b=v.boat,stats=fleetStats(s,b),deck=Math.max(0,stats.potCapacity-b.pots.length),key=stats.id+'/'+b.color;active.add(b.id);let entry=fleetMeshes.get(b.id);if(!entry||entry.key!==key){if(entry){destroyMesh(entry.vessel);destroyMesh(entry.buoy);}entry={key,vessel:mesh(buildVessel(0,stats),11,1),buoy:mesh(buildBuoy(fleetColor(b.color))),body:entry?.body||createBuoyancy(surfaceHeight(b.x,b.y,t,w.waves))};fleetMeshes.set(b.id,entry);}const bow=surfaceHeight(b.x+Math.cos(b.heading)*stats.length*.35,b.y+Math.sin(b.heading)*stats.length*.35,t,w.waves),stern=surfaceHeight(b.x-Math.cos(b.heading)*stats.length*.35,b.y-Math.sin(b.heading)*stats.length*.35,t,w.waves);stepBuoyancy(entry.body,{height:surfaceHeight(b.x,b.y,t,w.waves),pitch:Math.atan2(stern-bow,stats.length*.7),roll:Math.sin(t*.65+b.x*.01)*Math.min(.12,w.waves*.02)},s.paused?0:dt);const model=transform(b.x,entry.body.height-.25,b.y,b.heading,entry.body.pitch,entry.body.roll);for(let k=0;k<3;k++){model[k]*=stats.length/24;model[4+k]*=1+(stats.length-24)*.012;model[8+k]*=stats.beam/7.6;}return {...v,entry,model,stats,deck};});for(const [id,entry] of fleetMeshes)if(!active.has(id)){destroyMesh(entry.vessel);destroyMesh(entry.buoy);fleetMeshes.delete(id);}}
 function drawFleet(p,w,t){for(const v of nearbyFleet){if(v.visible){drawMesh(p,v.entry.vessel,v.model);const deck=deckFrame(v.model,v.stats);
 drawRack(p,deck,v.deck,v.stats);
 if(v.stats.id!=='nordvind'){
  gl.uniform3fv(p.u.uCraneColor,craneColor(v.stats));
  for(const side of v.stats.hauler==='both'?[-1,1]:[1])drawArticulatedCrane(p,deck,[workX(v.stats,-1.5),5.1,side*2.1],[workX(v.stats,-3.1),6.2,side*5.6]);
  gl.uniform3fv(p.u.uCraneColor,craneColor(currentDesign));
 }}for(const pot of v.pots)drawMesh(p,v.entry.buoy,transform(pot.x,surfaceHeight(pot.x,pot.y,t,w.waves),pot.y,0,Math.sin(t+pot.id)*.1,Math.cos(t*.7+pot.id)*.08));}}
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;terrainLoader?.close();rackInstances.close();canvas.style.display='none';canvas.dispatchEvent(new Event('scenelost'));});
 function uniforms(p,state,weather,t,eye,vp,light){p.view=vp;p.light=light;p.eye=eye;gl.useProgram(p.p);gl.uniform4fv(p.u['uRemoteLights[0]'],remoteLights);gl.uniform4fv(p.u['uQuayLights[0]'],Math.hypot(state.x-matthew.x,state.y-matthew.y)<450?quayLights:noQuayLights);inverseScratch.set(currentInverse);inverseScratch[12]=inverseScratch[13]=inverseScratch[14]=0;matrix(p.u.uHullInverse,inverseScratch);gl.uniform3f(p.u.uHullOrigin,currentBoat[12],currentBoat[13],currentBoat[14]);gl.uniform4f(p.u.uLampUpgrade,lampProfile.rank,lampProfile.intensity,lampProfile.range,lampProfile.spread);gl.uniform2f(p.u.uDeckWater,deckWater.port,deckWater.starboard);gl.uniform1f(p.u.uReflectionPass,0);matrix(p.u.uVP,vp);matrix(p.u.uLightVP,light);gl.uniform1f(p.u.uTime,t);gl.uniform1f(p.u.uHullRamp,currentDesign.rampBow?1:0);gl.uniform1f(p.u.uDeckSign,deckSign(currentDesign)*(currentDesign.forwardWork?2:1));gl.uniform3fv(p.u.uRoofSearchlight,HIGHWATER_SEARCHLIGHT);gl.uniform3fv(p.u.uCraneColor,craneColor(currentDesign));gl.uniform3fv(p.u.uSea,seaSettings(weather));gl.uniform1fv(p.u['uWavePhase[0]'],weather.wavePhases||new Float32Array(8));gl.uniform4f(p.u.uWeather,weather.waves,weather.fog,weather.rain,weather.front);gl.uniform4f(p.u.uBoat,state.x,state.y,state.heading,state.speed);gl.uniform3fv(p.u.uEye,eye);gl.uniform1i(p.u.uShadow,0);gl.uniform1f(p.u.uDaylight,daylight);gl.uniform1f(p.u.uLights,lightEnabled?1:0);gl.uniform1f(p.u.uHullY,lastHullY);gl.uniform4fv(p.u['uWake[0]'],wakePositions);gl.uniform4fv(p.u['uWakeInfo[0]'],wakeInfo);gl.uniform1i(p.u.uWakeCount,wakeCount);gl.uniform1f(p.u.uWakeTime,wakeTime);}
 const rackMeshes=[0,1,2].map(i=>mesh(buildRackPot(i),11,1)),rackInstances=createRackInstances(gl,rackMeshes);
 function drawIcedVessel(p,model,s,stats){
  gl.uniform1f(p.u.uVesselIce,s.ice||0);drawMesh(p,vessel,model);drawRack(p,currentBoat,s.deck,stats);
  gl.uniform1f(p.u.uVesselIce,0);
  if(s.ice>.22){const scale=Math.min(1,(s.ice-.22)/.48),at=transform(0,3*(1-scale),0);at[5]=scale;drawMesh(p,railIce,multiply(model,at));}
 }
 function drawRack(p,model,count,design){const entry=rackInstances.get(count,design);gl.uniform1f(p.u.uInstanced,1);gl.uniform3fv(p.u.uRackScale,entry.scale);gl.uniform1f(p.u.uKind,1);modelMatrices(p,model);for(let i=0;i<3;i++){const group=entry.groups[i];if(group.count){gl.bindVertexArray(group.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,rackMeshes[i].count,group.count);}}gl.uniform1f(p.u.uInstanced,0);}
 function drawMesh(p,m,model){gl.uniform1f(p.u.uInstanced,0);gl.uniform1f(p.u.uKind,m.kind);modelMatrices(p,model);gl.bindVertexArray(m.vao);gl.drawArrays(gl.TRIANGLES,0,m.count);}
 function updateParticles(s,w,t,dt){
  const f=[Math.cos(s.heading),Math.sin(s.heading)],right=[-f[1],f[0]],motion=Math.abs(s.speed),lengthScale=currentDesign.length/24,beamScale=currentDesign.beam/7.6,impact=Math.max(0,(surfaceHeight(s.x+f[0]*10*lengthScale,s.y+f[1]*10*lengthScale,t,w.waves)-lastHullY-crewPitch*10+.12)*1.2);
  const splash=deckVisual&&((deckVisual.job.kind==='deploy'&&deckVisual.progress>.65&&deckVisual.progress<.85)||(deckVisual.job.kind==='haul'&&deckVisual.progress<.18));const rate=motion*12+Math.max(0,w.waves-1.3)*impact*35+(splash?100:0);spawnDebt+=dt*rate;
  while(spawnDebt>=1&&particles.length<1200){spawnDebt--;const workSplash=splash&&random()<.4,stern=!workSplash&&motion>1.2&&random()<.22,side=workSplash?1:random()<.5?-1:1,along=(stern?-11+random():8+random()*3)*lengthScale,offset=(stern?(random()-.5)*1.5:side*(1.5+random()*1.5))*beamScale,up=stern?.5+random()*.6:workSplash?1+random()*2:.8+random()*(1.+w.waves*.6)+impact*w.waves*.45;const origin=workSplash?multiply(currentBoat,transform(...deckVisual.position)):null;particles.push({x:origin?origin[12]:s.x+f[0]*along+right[0]*offset,y:origin?Math.max(lastHullY+.1,origin[13]):lastHullY+.25,z:origin?origin[14]:s.y+f[1]*along+right[1]*offset,vx:f[0]*s.speed*.65+right[0]*side*(1+random()*3),vy:up,vz:f[1]*s.speed*.65+right[1]*side*(1+random()*3),age:0,life:.5+random()*.8,size:.25+random()*.65});}
  spawnDebt=Math.min(spawnDebt,1);let n=0;for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;p.vx*=Math.exp(-dt*.5);p.vz*=Math.exp(-dt*.5);const windAngle=(w.windDirection??240)*Math.PI/180;p.vx+=(-Math.sin(windAngle)*w.wind*.5144*.22-p.vx)*dt*.18;p.vz+=(Math.cos(windAngle)*w.wind*.5144*.22-p.vz)*dt*.18;p.vy-=9.81*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.age>p.life||p.y<surfaceHeight(p.x,p.z,t,w.waves)-.1){particles.splice(i,1);continue;}const fade=(1-p.age/p.life)*.38;particleData.set([p.x,p.y,p.z,fade,p.size],n*5);n++;}
  if(s.deckJob?.kind==='deice')for(const m of crew.members){
   if(!m.working||!m.face)continue;
   const phase=(crew.elapsed*2.1+m.role*1.7+Math.PI/2)/(2*Math.PI),age=phase-Math.floor(phase);
   if(age>.17)continue;
   const origin=multiply(currentBoat,transform(m.face[0],2.55,m.face[1]));
   for(let i=0;i<11&&n<1200;i++){const spread=age*(2+i%4);particleData.set([origin[12]+Math.sin(i*2)*spread,origin[13]+age*(2+i%7)-age*age*16,origin[14]+Math.cos(i*2)*spread,.85*(1-age/.17),.15+(i%5)*.053],n++*5);}
  }
  const target=s.hoseTarget,crewMember=target&&crew.members.find(m=>!m.hidden&&!m.working&&!m.sick);
  if(crewMember){const origin=multiply(currentBoat,transform(crewMember.x,3.05,crewMember.z));for(let i=0;i<44&&n<1200;i++){const u=(i+t*30)%44/44,spread=Math.sin(i*21+t*8)*u*.7;particleData.set([origin[12]+(target.x-origin[12])*u+spread,origin[13]+(surfaceHeight(target.x,target.y,t,w.waves)+2-origin[13])*u+12*u*(1-u),origin[14]+(target.y-origin[14])*u-spread,.55*(1-u*.65),.19+u*.25],n++*5);}}
  return n;
 }
 function drawTow(p,s,w,t,model){
  if(s.tow?.phase!=='hook'&&s.tow?.phase!=='travel')return;
  const bow=multiply(model,transform(11,1.9,0));
  const offset=23+Math.sin(t*.72)*.85,x=bow[12]+Math.cos(s.heading)*offset,y=bow[14]+Math.sin(s.heading)*offset;
  const height=surfaceHeight(x,y,t,w.waves);
  const tug=transform(x,height,y,s.heading,Math.sin(t*1.4)*.025,Math.cos(t*1.8)*.035);
  drawMesh(p,tugMesh,tug);
  const stern=multiply(tug,transform(-5.5,1.56,0)),start=[stern[12],stern[13],stern[14]];
  const progress=s.tow.phase==='hook'?Math.max(0,Math.min(1,(s.tow.elapsed-.5)/2)):1;
  if(!progress)return;
  const end=[bow[12],bow[13],bow[14]];
  const tension=Math.min(1,Math.abs(s.speed)*1.94384/13);
  const casting=s.tow.phase==='hook'&&progress<1;
  const sag=casting?-3.8*Math.sin(Math.PI*progress):2.6-1.15*tension+Math.sin(t*1.12)*.35;
  const dx=end[0]-start[0],dz=end[2]-start[2],length=Math.hypot(dx,dz)||1;
  let previous=start;
  for(let i=1;i<=18;i++){
   const u=progress*i/18,envelope=4*u*(1-u);
   const sway=Math.sin(t*1.8-u*6)*envelope*(.95-.55*tension);
   const point=[start[0]+dx*u-dz/length*sway,start[1]+(end[1]-start[1])*u-sag*envelope,start[2]+dz*u+dx/length*sway];
   cable(p,identity(),previous,point,towLineMesh);
   previous=point;
  }
 }
 function drawReplacement(p,s,t){
  const event=s.overboard;
  if(event?.phase!=='flight')return;
  const u=replacementProgress(event,s),lowering=Math.max(0,event.elapsed-event.flightSeconds);
  const x=event.x+(s.x-event.x)*u,y=event.y+(s.y-event.y)*u;
  if(Math.hypot(x-s.x,y-s.y)>1000)return;
  const hook=multiply(currentBoat,transform(-4,1.8,0)),hx=x+(hook[12]-s.x)*u,hy=y+(hook[14]-s.y)*u;
  const altitude=hook[13]+19+Math.min(25,(1-u)*140);
  const heading=Math.atan2(s.y-event.y,s.x-event.x);
  drawMesh(p,helicopter,transform(hx,altitude,hy,heading));
  drawMesh(p,rotors,transform(hx,altitude,hy,t*22));
  if(u<1)return;
  const height=altitude-1.5+(hook[13]-altitude+1.5)*Math.min(1,lowering/10);
  cable(p,identity(),[hx,altitude-1,hy],[hx,height+1.35,hy],equipment.softRope);
  const root=transform(hx,height,hy,s.heading),parts=crewMeshes[0];
  drawMesh(p,parts.torso,root);drawMesh(p,parts.head,root);
  for(const side of [-1,1]){
   drawMesh(p,parts.arm,multiply(root,transform(0,1.34,side*.32,0,-.55)));
   const leg=multiply(root,transform(0,.78,side*.15));
   drawMesh(p,parts.thigh,leg);drawMesh(p,parts.shin,multiply(leg,transform(0,-.36,0)));
  }
 }
 function drawCrew(p,boat,w){for(const m of crew.members){
 const event=lastCrewState?.overboard,victim=!!event&&m===crew.members[0];
 if(victim&&event.phase!=='fall'||!victim&&m.hidden)continue;
const parts=crewMeshes[m.role],pose=crewPose(m,crew.elapsed,w.waves,lastCrewState?.deckJob||(crew.job?{kind:crew.job.kind,elapsed:crew.workTime,duration:crew.job.duration}:null)),root=victim?multiply(boat,transform(-4,1.77+Math.sin(Math.PI*Math.min(1,event.elapsed/2.4))*.9-Math.max(0,event.elapsed-1.8)**2*.9,event.side*(2.6+event.elapsed*.85),event.side*Math.PI/2,event.elapsed*.65)):multiply(boat,transform(m.x,1.77+pose.bob,m.z,m.heading,pose.lean-crewPitch*.55,crewRoll*.35));
  for(const offset of [0,4,8]){const len=Math.hypot(root[offset],root[offset+1],root[offset+2]);for(let k=0;k<3;k++)root[offset+k]/=len;}
  if(m.sick==='retching'&&m.sickTime%2.2<.65)for(let i=0;i<7;i++){const age=(m.sickTime%2.2+i*.055)% .65,drop=transform(.35+age*.9,1.55-age*age*4.5,Math.sin(i*2)*.05);drawMesh(p,equipment.retch,multiply(root,drop));}
  if(m.task==='lash'&&m.working&&m.face)cable(p,boat,[m.x,2.8,m.z],[m.face[0],2.65,m.face[1]],equipment.softRope);
  drawMesh(p,parts.torso,root);drawMesh(p,parts.head,root);
  for(const side of [-1,1]){const legAngle=pose.leg*side,leg=multiply(root,transform(0,.78,side*(.15+w.waves*.012),0,legAngle,0));drawMesh(p,parts.thigh,leg);const lower=multiply(leg,transform(0,-.36,0,0,Math.max(0,-legAngle)*1.1,0));drawMesh(p,parts.shin,lower);
   const active=m.working&&pose.action!=='watch',angle=active?pose.arm+(side<0?.18:0):pose.arm*side+pose.brace;const upper=multiply(root,transform(0,1.34,side*.32,0,angle,side*pose.brace*.4));drawMesh(p,parts.arm,upper);const forearm=multiply(upper,transform(0,-.32,0,0,active?.65:.18,0));drawMesh(p,parts.forearm,forearm);
   if(active&&pose.action==='ice'&&side===1)drawMesh(p,mallet,multiply(forearm,transform(0,-.29,0,0,-.65,0)));}
 }}
 function drawArticulatedCrane(p,boat,base,tip){
  const dx=tip[0]-base[0],dz=tip[2]-base[2],reach=Math.hypot(dx,dz);
  const elbow=[base[0]+dx*.43,Math.max(base[1]+1.9,tip[1]+1.35)+reach*.08,base[2]+dz*.43];
  for(const [part,a,b] of [[crane.primary,base,elbow],[crane.outer,elbow,tip]]){
   const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],horizontal=Math.hypot(dx,dz);
   const joint=transform(...a,Math.atan2(dz,dx),Math.atan2(dy,horizontal));
   const length=Math.hypot(horizontal,dy);
   for(let k=0;k<3;k++)joint[k]*=length;
   drawMesh(p,part,multiply(boat,joint));
  }
  const angle=Math.atan2(dz,dx);
  drawMesh(p,crane.hinge,multiply(boat,transform(...elbow,angle)));
  drawMesh(p,crane.hinge,multiply(boat,transform(...tip,angle)));
 }
 function drawEquipment(p,boat){const controlSide=lastCrewState?.deckJob?.side<0&&currentDesign.hauler==='both'?-1:1,control=[workX(currentDesign,-1.7),2.85,controlSide*2.1],controlRoot=multiply(boat,transform(...control));drawMesh(p,equipment.craneControls,controlRoot);for(const z of [-.13,.13])drawMesh(p,equipment.controlLever,multiply(controlRoot,transform(0,.12,z,0,crew.members[0].working?Math.sin(crew.elapsed*1.5+z)*.12:0,0)));for(const at of lineHaulerMounts(currentDesign)){drawMesh(p,equipment.haulerRotor,multiply(boat,transform(...at,0,haulerAngle,0)));if(haulerRunning(lastCrewState?.deckJob)){const [x,y,z]=at,side=z<0?-1:1,points=[[x,y+.38,z+side*.7],[x,y+.38,z],[x-.38,y,z],[x,y-.38,z],[x-.3,1.86,z-side*.75]];for(let i=1;i<points.length;i++)cable(p,boat,points[i-1],points[i],equipment.softRope);}}const pose=deckVisual,stern=currentDesign.hauler==='stern',side=pose?.job?.side<0&&currentDesign.hauler==='both'?-1:1,position=(pose?.craneActive===false?null:pose?.position)||(stern?[-13.5,1.4,0]:[workX(currentDesign,-3.1),1.4,5.6]),pivot=[workX(currentDesign,-1.5),5.1,side*2.1],angle=Math.atan2(position[2]-pivot[2],position[0]-pivot[0]),length=Math.hypot(position[0]-pivot[0],position[2]-pivot[2]);const tipHeight=Math.max(6.2,position[1]+1.7*rackScale(currentDesign)[1]),boom=transform(...pivot,angle);for(const i of [0,1,2])boom[i]*=length/3;boom[1]=(tipHeight-6.2)/3;if(currentDesign.id==='nordvind')drawMesh(p,equipment.boom,multiply(boat,boom));else drawArticulatedCrane(p,boat,pivot,[position[0],tipHeight,position[2]]);
  const tip=[position[0],tipHeight,position[2]],end=[position[0],pose?position[1]+1.1*rackScale(currentDesign)[1]:1.4,position[2]],rope=identity();rope[5]=Math.max(.01,tip[1]-end[1]);rope[12]=end[0];rope[13]=end[1];rope[14]=end[2];drawMesh(p,equipment.rope,multiply(boat,rope));
  if(currentDesign.hauler==='both'){const idleSide=-side,base=[-1.5,5.1,idleSide*2.1],target=[-3.1,6.2,idleSide*5.6];drawArticulatedCrane(p,boat,base,target);cable(p,boat,target,[target[0],1.4,target[2]]);}
  drawMesh(p,equipment.lid,multiply(boat,transform(workX(currentDesign,-1.9),2.025,-1.4,0,0,-(pose?.hatch||(lastCrewState?.deckJob?.kind==='unload'&&lastCrewState.deckJob.elapsed>lastCrewState.deckJob.approach?Math.min(1,(lastCrewState.deckJob.elapsed-lastCrewState.deckJob.approach)/2)*1.35:0)))));
  if(pose?.hook){const yaw=Math.atan2(boat[2],boat[0]),toSea=local=>{const at=multiply(boat,transform(local[0],0,local[2])),x=at[12],z=at[14];return [x,surfaceHeight(x,z,lastTime,currentWaves)+local[1],z];},origin=multiply(boat,transform(...(pose.hand||[-3.8,3.1,2.65]))),anchor=[origin[12],origin[13],origin[14]],end=toSea(pose.hook);drawMesh(p,equipment.hook,transform(...end,yaw,.4,0));for(let i=0;i<8;i++){const at=t=>{const v=anchor.map((x,k)=>x+(end[k]-x)*t);v[1]-=Math.sin(t*Math.PI)*.3;return v;};const a=at(i/8),b=at((i+1)/8),dy=b.map((v,k)=>v-a[k]),len=Math.hypot(...dy);if(len<.001)continue;const y=dy.map(v=>v/len),base=Math.abs(y[1])>.9?[1,0,0]:[0,1,0],x=[base[1]*y[2]-base[2]*y[1],base[2]*y[0]-base[0]*y[2],base[0]*y[1]-base[1]*y[0]],xl=Math.hypot(...x);for(let k=0;k<3;k++)x[k]/=xl;const z=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]],m=new Float32Array([x[0],x[1],x[2],0,dy[0],dy[1],dy[2],0,z[0],z[1],z[2],0,...a,1]);drawMesh(p,equipment.throwLine,m);}
   if(pose.dragBuoy)drawMesh(p,buoy,transform(...toSea(pose.dragBuoy),yaw));}

  if(pose?.visible){const cage=multiply(boat,transform(...position,0,pose.tip,Math.sin(crew.elapsed*1.8)*.05));for(const offset of [0,4,8]){const length=Math.hypot(cage[offset],cage[offset+1],cage[offset+2]);for(let k=0;k<3;k++)cage[offset+k]/=length;}drawMesh(p,equipment.pot,cage);if(pose.job.kind==='haul'){const q=pose.sequence,remaining=q<.48?1:Math.max(0,1-(q-.48)/.3),count=Math.ceil(Math.min(18,Math.ceil((pose.job.catchKg||0)/3))*remaining);for(let i=0;i<count;i++){const x=((i%4)-1.5)*.34,z=(Math.floor(i/4)%4-1.5)*.32,y=-.42+Math.floor(i/16)*.15;drawMesh(p,equipment.crab,multiply(cage,transform(x,y,z,i*2.1+Math.sin(crew.elapsed*1.5+i)*.07)));}}}
  if(pose?.crabs){const count=Math.min(14,Math.ceil((pose.job.catchKg||0)/4));for(let i=0;i<count;i++){const phase=(pose.sequence*16+i*.13)%1,sorting=pose.sequence<.66,x=workX(currentDesign,-1.9)+Math.sin(i*2.3)*.55,z=-.45+Math.cos(i*1.8)*.55,y=sorting?3.2-phase*.8:2.3-phase*2.2;drawMesh(p,equipment.crab,multiply(boat,transform(x,y,z,i*2.1,sorting?phase*.3:phase*2)));}}
 }
 function cable(p,boat,a,b,which=equipment.rope){const y=b.map((v,i)=>v-a[i]),len=Math.hypot(...y);if(len<.001)return;const axis=y.map(v=>v/len),ref=Math.abs(axis[1])>.9?[1,0,0]:[0,1,0],x=[ref[1]*axis[2]-ref[2]*axis[1],ref[2]*axis[0]-ref[0]*axis[2],ref[0]*axis[1]-ref[1]*axis[0]],xl=Math.hypot(...x);for(let i=0;i<3;i++)x[i]/=xl;const z=[x[1]*axis[2]-x[2]*axis[1],x[2]*axis[0]-x[0]*axis[2],x[0]*axis[1]-x[1]*axis[0]],m=new Float64Array([...x,0,...y,0,...z,0,...a,1]);drawMesh(p,which,multiply(boat,m));}
 function fittings(p,boat,s,w,t){drawMesh(p,equipment.door,multiply(currentBoat,transform(workX(currentDesign,.02),1.82,currentDesign.forwardWork?2.18:1.12,currentDesign.forwardWork?Math.PI*(1-crew.door/2):crew.door*Math.PI/2)));if(currentDesign.id!=='nordvind')return;for(const side of [-1,1])for(let i=0;i<5;i++){const pose=fenderPose(i,side,t,w.waves,crewPitch,crewRoll,s.speed,currentDesign),body=fenderMotion[i+(side>0?5:0)],m=transform(pose.x,pose.y,pose.z,0,body.fore,body.swing);drawMesh(p,equipment.fender,multiply(boat,m));const top=multiply(m,transform(0,.12,0)),end=[top[12],top[13],top[14]],points=ropePoints(pose.anchor,end,t,i+side*3);for(let j=1;j<points.length;j++)cable(p,boat,points[j-1],points[j],equipment.softRope);}}
 function drawNets(p,s,t,w){const job=s.deckJob,pose=netWorkPose(job),nets=[...(s.nets||[])];if(job?.kind==='netSet')nets.push({x:job.x,y:job.y});const outlet=multiply(currentBoat,transform(-11.2,2.6,-1.1)),end=[outlet[12],outlet[13],outlet[14]];for(const n of nets){const active=pose&&(job.kind==='netSet'||n.id===job.netId),fraction=active?pose.deployed:1,span=36*fraction,anchor=active&&job.kind==='netHaul'?{x:n.x+(end[0]-n.x)*pose.progress,y:n.y+(end[2]-n.y)*pose.progress}:n,point=(x,z)=>[x,surfaceHeight(x,z,t,w.waves)+.12+(active?pose.lift:0),z];if(fraction<.01)continue;for(const z of [-2.5,2.5]){let prior=point(anchor.x-span/2,anchor.y+z);for(let i=1;i<=12;i++){const next=point(anchor.x-span/2+span*i/12,anchor.y+z);cable(p,identity(),prior,next,equipment.softRope);prior=next;}}for(let i=0;i<=12;i++){const x=anchor.x-span/2+span*i/12;cable(p,identity(),point(x,anchor.y-2.5),point(x,anchor.y+2.5),equipment.softRope);if(i%3===0)drawMesh(p,buoy,transform(x,point(x,anchor.y)[1],anchor.y));}if(active){const near=point(anchor.x,anchor.y);for(const side of [-1,1])cable(p,identity(),[near[0],near[1],near[2]+side*2.5],[end[0],end[1],end[2]+side*.45],equipment.softRope);for(let i=0;i<8;i++){const u=i/8,a=[near[0]+(end[0]-near[0])*u,near[1]+(end[1]-near[1])*u,near[2]+(end[2]-near[2])*u];cable(p,identity(),[a[0],a[1],a[2]-(2.5-u*2)],[a[0],a[1],a[2]+(2.5-u*2)],equipment.softRope);}const marker=multiply(currentBoat,transform(-7.75+Math.cos(pose.drumAngle)*.74,2.8+Math.sin(pose.drumAngle)*.74,-1));cable(p,identity(),[marker[12],marker[13],marker[14]-.5],[marker[12],marker[13],marker[14]+.5]);}}}

 function harborPeople(p,s,t){const quay=Math.hypot(s.x-matthew.x,s.y-matthew.y)<650?matthew:QUAY;
 if(Math.hypot(s.x-quay.x,s.y-quay.y)>650)return;
 const unloading=s.deckJob?.kind==='unload'&&s.deckJob.elapsed>s.deckJob.approach;const berth=s.deckJob?.berth||s.moored||quay;
 const along=Math.max(-270,Math.min(55,(berth.x-quay.x)*quay.tx+(berth.y-quay.y)*quay.ty));
 for(let i=0;i<6;i++){const phase=t*(unloading?.075:.043)+i*2.1,walking=i<2||i>3,u=i<2?-20+12*Math.sin(phase):i===2?13:i===3?20:25+8*Math.sin(phase),v=i<4?4:11,at=quayPoint(u+along,v,quay),heading=quay.heading+(walking?(Math.cos(phase)>0?0:Math.PI):Math.PI/2),m={role:i%3,moving:walking,working:!walking,phase:t*4.4+i},pose=crewPose(m,t,.3),root=transform(at.x,quay.deck+pose.bob,at.y,heading,pose.lean),parts=crewMeshes[i%3],carrying=i<2&&unloading&&Math.cos(phase)<0;
  drawMesh(p,parts.torso,root);drawMesh(p,parts.head,root);for(const side of [-1,1]){const leg=multiply(root,transform(0,.78,side*.15,0,pose.leg*side));drawMesh(p,parts.thigh,leg);drawMesh(p,parts.shin,multiply(leg,transform(0,-.36,0,0,Math.max(0,-pose.leg*side)*1.1)));const arm=multiply(root,transform(0,1.34,side*.32,0,carrying||i===4?.9:walking?pose.arm*side:1.));drawMesh(p,parts.arm,arm);drawMesh(p,parts.forearm,multiply(arm,transform(0,-.32,0,0,.4)));}
  if(carrying)drawMesh(p,equipment.tote,multiply(root,transform(.4,.85,0)));if(i===4){drawMesh(p,equipment.trolley,multiply(root,transform(.8,0,0)));drawMesh(p,equipment.tote,multiply(root,transform(.9,.55,0)));}
 }}
 function drawHarborCrane(p,s){for(const quay of PORT_QUAYS){if(Math.hypot(s.x-quay.x,s.y-quay.y)>1200)continue;for(const berth of berthsAt(quay)){const j=s.deckJob?.kind==='unload'&&Math.hypot((s.deckJob.berth||BERTH).x-berth.x,(s.deckJob.berth||BERTH).y-berth.y)<1?s.deckJob:null,q=j?Math.max(0,Math.min(1,(j.elapsed-j.approach)/Math.max(1,j.duration-j.approach))):0,phase=Math.min(.999999,q),active=j&&j.elapsed>=j.approach,e=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);},swing=!active?0:phase<.38?0:phase<.6?e((phase-.38)/.22):phase<.9?1:1-e((phase-.9)/.1),along=(berth.x-quay.x)*quay.tx+(berth.y-quay.y)*quay.ty,mast=quayPoint(along,8,quay),drop=quayPoint(along-14,21,quay),target={x:berth.x+(drop.x-berth.x)*swing,y:berth.y+(drop.y-berth.y)*swing},angle=Math.atan2(target.y-mast.y,target.x-mast.x),tip=[target.x,25.1,target.y],arm=transform(mast.x,24,mast.y,angle);for(const k of [0,1,2])arm[k]*=Math.hypot(target.x-mast.x,target.y-mast.y)/3;drawMesh(p,quay===QUAY?portBoom:equipment.boom,arm);const low=Math.max(3,lastHullY+3),height=!active?18:phase<.2?18-e(phase/.2)*(18-low):phase<.38?low+e((phase-.2)/.18)*(18-low):phase<.6?18:phase<.76?18-e((phase-.6)/.16)*9:phase<.81?9:phase<.9?9+e((phase-.81)/.09)*9:18,sway=active?Math.sin(lastTime*1.7)*.12*Math.sin(phase*Math.PI):0,end=[tip[0]+sway,height,tip[2]+sway*.5];cable(p,identity(),tip,[end[0],end[1]+1.1,end[2]]);if(active&&j.cargoKg>0){const cage=transform(...end,0,phase>.76&&phase<.81?.65:0);for(const offset of [0,4,8]){const length=Math.hypot(cage[offset],cage[offset+1],cage[offset+2]);for(let k=0;k<3;k++)cage[offset+k]/=length;}drawMesh(p,equipment.pot,cage);if(phase>.2&&phase<.79)for(let i=0;i<12;i++)drawMesh(p,equipment.crab,multiply(cage,transform((i%4-1.5)*.35,-.4,(Math.floor(i/4)-1)*.4,i*2.1)));}}}}
 return {label:'3D · WEBGL2',get revision(){return revision;},get dronePosition(){return dronePosition;},get crewDiagnostics(){return {deckWater:{...deckWater},hullY:lastHullY,elapsed:crew.elapsed,cruise:crew.cruise,door:crew.door,members:crew.members.map(m=>({x:m.x,z:m.z,hidden:m.hidden,resting:m.resting,route:m.route.length,blocked:m.blocked,target:m.target}))};},get crewStatus(){return lastCrewState?.moored?'Moored alongside':lastCrewState?.deckJob?.kind==='netSet'?'Setting salmon net':lastCrewState?.deckJob?.kind==='netHaul'?'Retrieving salmon net':lastCrewState?.deckJob?.kind==='unload'?(lastCrewState.deckJob.elapsed<lastCrewState.deckJob.approach?`${dockingStage(lastCrewState.deckJob.route||[],lastCrewState.deckJob.elapsed)} · ${Math.ceil(lastCrewState.deckJob.duration-lastCrewState.deckJob.elapsed)} s`:'Harbor crane unloading the hold'):deckVisual?.stage||crew.label;},lightPositions(){if(!lightEnabled)return [];const lights=currentDesign.forwardWork?[[...HIGHWATER_SEARCHLIGHT,true]]:[[7.24,5.3,0,true],[0,5.4,-2.82,true],[0,5.4,2.82,true]];return lights.map(([x,y,z,warm])=>{const local=multiply(currentBoat,transform(x,y,z)),p=project(viewProjection,[local[12],local[13],local[14]],size.width,size.height);return {...p,warm,radius:(8+(1-daylight)*19)*lampProfile.glow};});},setZoom(value){zoom=Math.max(.22,Math.min(2.15,value));},setTilt(value){cameraTilt=value;},seaPoint(x,y){
 const m=viewProjection,nx=2*x/size.width-1,ny=1-2*y/size.height;
 const a=m[0]-nx*m[3],b=m[8]-nx*m[11],c=nx*m[15]-m[12];
 const d=m[1]-ny*m[3],e=m[9]-ny*m[11],f=ny*m[15]-m[13],det=a*e-b*d;
 if(Math.abs(det)<1e-8)return null;
 const point={x:(c*e-b*f)/det,y:(a*f-c*d)/det};
 const depth=m[3]*point.x+m[11]*point.y+m[15];
 return depth>0&&depth<1500?point:null;
 },project(x,y,z=0){return project(viewProjection,[x,z,y],size.width,size.height);},
 draw(s,w,t,width,height,dpr,wake,flight){if(!running)return;const atMatthew=Math.hypot(s.x-PORT_QUAYS[1].x,s.y-PORT_QUAYS[1].y)<1600;
  currentSea=w;const dt=Math.min(Math.max(0,t-lastTime),1.5);lastTime=t;if(!s.paused&&haulerRunning(s.deckJob))haulerAngle+=dt*5;size={width,height};daylight=Math.max(.035,Math.sin((((s.worldHour??s.hour)%24)-6)/12*Math.PI));lightEnabled=s.lights!==false;wakeCount=wake?.points.length||0;wakeTime=wake?.time||0;for(let i=0;i<wakeCount;i++){const point=wake.points[i];wakePositions.set([point.x,point.z,0,0],i*4);wakeInfo.set([Math.cos(point.heading),Math.sin(point.heading),point.energy,point.born],i*4);}const rw=Math.round(width*Math.min(dpr,1.25)),rh=Math.round(height*Math.min(dpr,1.25));if(canvas.width!==rw||canvas.height!==rh){canvas.width=rw;canvas.height=rh;}
  const tk=Math.floor(s.x/500)+'/'+Math.floor(s.y/500);if(tk!==terrainKey){terrainKey=tk;if(terrainLoader){const {x,y}=s;terrainLoader.load(x,y,true).then(data=>{if(!running||terrainKey!==tk)return;const next=mesh(data,11,4);if(terrain)destroyMesh(terrain);terrain=next;terrainModel=transform(x,0,y);revision++;});}}const stats=vesselStats(s);lampProfile=LIGHTING_PROFILES[Math.max(0,Math.min(5,stats.lightRank||0))];currentDesign=stats;const key=stats.id;if(vesselKey!==key){destroyMesh(vessel);vessel=mesh(buildVessel(0,stats),11,1);vesselKey=key;destroyMesh(washMesh);washMesh=mesh(buildDeckWash(stats));}
  const f=[Math.cos(s.heading),Math.sin(s.heading)],centerHeight=surfaceHeight(s.x,s.y,t,w.waves);lastHullY=centerHeight;
  const pitch=(surfaceHeight(s.x+f[0]*9,s.y+f[1]*9,t,w.waves)-surfaceHeight(s.x-f[0]*9,s.y-f[1]*9,t,w.waves))/18;
  const roll=(surfaceHeight(s.x-f[1]*3,s.y+f[0]*3,t,w.waves)-surfaceHeight(s.x+f[1]*3,s.y-f[0]*3,t,w.waves))/6;
  if(lastCrewState!==s){buoyancy=createBuoyancy(centerHeight,pitch,-roll*.65);fenderMotion=createFenderMotion();}stepBuoyancy(buoyancy,{height:centerHeight,pitch,roll:-roll*.65*stats.roll},s.paused?0:dt);if(stats.id==='nordvind')stepFenderMotion(fenderMotion,s.paused?0:dt,buoyancy.roll,buoyancy.pitch,w.waves,t);
  const model=transform(s.x,buoyancy.height-.25,s.y,s.heading,buoyancy.pitch,buoyancy.roll);for(let k=0;k<3;k++){model[k]*=stats.length/24;model[4+k]*=1+(stats.length-24)*.012;model[8+k]*=stats.beam/7.6;}currentBoat=deckFrame(model,stats);currentInverse=inverseTransform(model);for(const side of [-1,1]){let excess=0;for(const x of [-10,-6,-2]){const edge=multiply(model,transform(x*deckSign(stats),2.25,side*3.5));excess=Math.max(excess,surfaceHeight(edge[12],edge[14],t,w.waves)-edge[13]);}if(side<0)stepDeckWater(deckWater,excess,deckWater.starboard/.055,s.paused?0:dt);else stepDeckWater(deckWater,deckWater.port/.055,excess,s.paused?0:dt);}currentWaves=w.waves;crewPitch=buoyancy.pitch;crewRoll=buoyancy.roll;lastHullY=buoyancy.height;deckVisual=deckWorkPose(s.deckJob,s);if(deckVisual)deckVisual.job=s.deckJob;
  if(lastCrewState!==s){crew=createCrew();lastCrewState=s;}
  const workOptions={design:stats,deck:s.deck,operation:s.deckJob};if(s.activity&&s.activity.id!==crew.lastActivity){commandCrew(crew,s.activity.kind,workOptions);crew.lastActivity=s.activity.id;}const operation=s.deckJob?.kind==='deice'&&Math.abs(s.speed)>.01?null:s.deckJob;workOptions.operation=operation;const crewKind=s.incident?'repair':operation?.kind;if(crewKind&&(crew.job?.kind!==crewKind||crew.job?.operation!==operation))commandCrew(crew,crewKind,workOptions);stepCrew(crew,s.paused?0:dt,w.waves,{speed:s.speed,pace:stats.work,...workOptions});
  dronePosition=null;
  if(flight){const [x,z]=flight.deck,deck=multiply(currentBoat,transform(x,2,z));dronePosition=dronePose(flight,{x:deck[12],y:deck[14],height:deck[13]});}
  const dx=dronePosition?dronePosition.x-s.x:0,dy=dronePosition?dronePosition.y-s.y:0,span=Math.hypot(dx,dy);
  const follow=droneCameraFollow(span),fit=dronePosition?Math.min(zoom,1.05):zoom,viewScale=width<760?1.2:1;
  const target=[s.x+dx*follow,dronePosition?Math.max(1.8,dronePosition.height*(.48+.52*follow)):1.8,s.y+dy*follow];
  const eye=[target[0]+36*fit*viewScale,62*fit*cameraTilt+target[1]-1.8,target[2]+62*fit*viewScale];
  viewProjection=multiply(perspective(Math.PI/4,width/height,.3,1500),lookAt(eye,target));
  prepareFleet(s,w,t,dt);
  remoteLights.fill(0);
  if(daylight<.65){
   const nearbyLights=nearbyFleet.filter(v=>v.visible&&v.boat.lights!==false);
   nearbyLights.sort((a,b)=>Math.hypot(a.boat.x-s.x,a.boat.y-s.y)-Math.hypot(b.boat.x-s.x,b.boat.y-s.y));
   for(let i=0;i<Math.min(4,nearbyLights.length);i++){
    const {model,stats:design}=nearbyLights[i],f=deckSign(design)*(design.forwardWork?-1:1);
    const [x,y,z]=design.forwardWork?HIGHWATER_SEARCHLIGHT:[7.24,5.3,0];
    const lamp=multiply(model,transform(x*deckSign(design),y,z));
    remoteLights.set([lamp[12],lamp[13],lamp[14],1,
     model[0]*f/design.length*24-model[4]*.12,
     model[1]*f/design.length*24-model[5]*.12,
     model[2]*f/design.length*24-model[6]*.12,0],i*8);
   }
  }

  const light=multiply(ortho(-75,75,-75,75,1,260),lookAt([s.x-100,95,s.y-75],[s.x,0,s.y]));
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFrame);gl.viewport(0,0,2048,2048);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.5,3);gl.useProgram(depth.p);depth.view=light;depth.light=light;matrix(depth.u.uLightVP,light);drawMesh(depth,harbor,identity());if(atMatthew)drawMesh(depth,matthewHarbor,matthewModel);if(terrain)drawMesh(depth,terrain,terrainModel);drawHarborCrane(depth,s);harborPeople(depth,s,t);drawFleet(depth,w,t);drawMesh(depth,vessel,model);drawRack(depth,currentBoat,s.deck,stats);drawCrew(depth,currentBoat,w);drawEquipment(depth,currentBoat);fittings(depth,model,s,w,t);drawNets(depth,s,t,w);
  gl.disable(gl.POLYGON_OFFSET_FILL);resizeReflection(rw,rh);const reflectionEye=[eye[0],-eye[1],eye[2]],reflectionVP=multiply(perspective(Math.PI/4,width/height,.3,1500),lookAt(reflectionEye,[target[0],-target[1],target[2]],[0,-1,0]));
  gl.bindFramebuffer(gl.FRAMEBUFFER,reflectionFrame);gl.viewport(0,0,reflectionWidth,reflectionHeight);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);uniforms(solid,s,w,t,reflectionEye,reflectionVP,light);gl.uniform1f(solid.u.uReflectionPass,1);drawMesh(solid,harbor,identity());if(atMatthew)drawMesh(solid,matthewHarbor,matthewModel);if(terrain)drawMesh(solid,terrain,terrainModel);drawHarborCrane(solid,s);harborPeople(solid,s,t);drawFleet(solid,w,t);drawIcedVessel(solid,model,s,stats);drawCrew(solid,currentBoat,w);drawReplacement(solid,s,t);drawTow(solid,s,w,t,model);gl.uniform1f(solid.u.uVesselIce,s.ice||0);drawEquipment(solid,currentBoat);gl.uniform1f(solid.u.uVesselIce,0);fittings(solid,model,s,w,t);drawNets(solid,s,t,w);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,reflectionTexture);gl.generateMipmap(gl.TEXTURE_2D);gl.activeTexture(gl.TEXTURE0);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,rw,rh);gl.clearColor(.12,.2,.25,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);
  const seaX=Math.floor(s.x/20)*20,seaY=Math.floor(s.y/20)*20,seaOrigin=transform(seaX,0,seaY);
  uniforms(ocean,s,w,0,eye,multiply(viewProjection,seaOrigin),multiply(light,seaOrigin));
  const phases=directionalSpectrum(w).map((wave,i)=>(seaX*wave.kx+seaY*wave.kz-t*wave.omega+(w.wavePhases?.[i]||0))%(2*Math.PI));
  gl.uniform1fv(ocean.u['uWavePhase[0]'],phases);
  gl.uniform1f(ocean.u.uDetailTime,t);
  const slick=s.dieselSlick;gl.uniform4f(ocean.u.uDieselSlick,slick?.x||0,slick?.y||0,slick?.remaining||0,0);
  gl.uniform1i(ocean.u.uReflection,1);matrix(ocean.u.uReflectionVP,multiply(reflectionVP,seaOrigin));
  gl.uniform2f(ocean.u.uCenter,seaX,seaY);gl.uniform3f(ocean.u.uHullOffset,s.x-seaX,currentBoat[13],s.y-seaY);gl.bindVertexArray(water.vao);gl.drawArrays(gl.TRIANGLES,0,water.count);
  uniforms(solid,s,w,t,eye,viewProjection,light);drawMesh(solid,harbor,identity());if(atMatthew)drawMesh(solid,matthewHarbor,matthewModel);if(terrain)drawMesh(solid,terrain,terrainModel);drawHarborCrane(solid,s);harborPeople(solid,s,t);drawFleet(solid,w,t);drawIcedVessel(solid,model,s,stats);drawCrew(solid,currentBoat,w);drawReplacement(solid,s,t);drawTow(solid,s,w,t,model);gl.uniform1f(solid.u.uVesselIce,s.ice||0);drawEquipment(solid,currentBoat);gl.uniform1f(solid.u.uVesselIce,0);fittings(solid,model,s,w,t);drawNets(solid,s,t,w);drawDrone(solid,flight);for(const p of s.pots)if(!(s.deckJob?.kind==='haul'&&s.deckJob.potId===p.id&&deckVisual.progress>(s.deckJob.grapple ? .12 : .2)))drawMesh(solid,buoy,transform(p.x,surfaceHeight(p.x,p.y,t,w.waves),p.y,0,Math.sin(t)*.12,Math.cos(t*.7)*.1));
  if(deckWater.port+deckWater.starboard>.001){uniforms(washProgram,s,w,t,eye,viewProjection,light);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);drawMesh(washProgram,washMesh,model);gl.depthMask(true);gl.disable(gl.BLEND);}
  const nextFoamKey=[t,w.waves,s.x,s.y,wake?.time,wake?.points.length].join('/');if(nextFoamKey!==foamKey){const data=buildFoam(wake,s,w,t);foamMesh.count=data.length/11;gl.bindBuffer(gl.ARRAY_BUFFER,foamMesh.buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);foamKey=nextFoamKey;}if(foamMesh.count){uniforms(foam,s,w,t,eye,viewProjection,light);modelMatrices(foam,identity());gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.bindVertexArray(foamMesh.vao);gl.drawArrays(gl.TRIANGLES,0,foamMesh.count);gl.depthMask(true);gl.disable(gl.BLEND);}
  let count=0;const particleSteps=Math.max(1,Math.ceil(dt/.05));for(let i=0;i<particleSteps;i++)count=updateParticles(s,w,t-dt+dt*(i+1)/particleSteps,s.paused?0:dt/particleSteps);if(count){gl.useProgram(spray.p);matrix(spray.u.uVP,viewProjection);gl.uniform1f(spray.u.uPixelRatio,dpr);gl.uniform1f(spray.u.uDaylight,daylight);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.bindVertexArray(particleVAO);gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,particleData.subarray(0,count*5));gl.drawArrays(gl.POINTS,0,count);gl.depthMask(true);gl.disable(gl.BLEND);}
  antialias(rw,rh);
 },get running(){return running;}};
}
