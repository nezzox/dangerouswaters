import {DRONE_RADIUS,DRONE_DURATION,droneCameraFollow,dronePose,scanCrab} from './drone-survey.mjs?v=0.18.82';
import {deckSign} from './vessel-profile.mjs?v=0.18.82';
import {canStand} from './deck-layout.mjs?v=0.18.82';
import {drawPrecipitation} from './precipitation.mjs?v=0.18.82';
import {replaceLostPots,LOST_POT_PRICE} from './simulation.mjs?v=0.18.82';
import {shopReady} from './career.mjs?v=0.18.82';
import {salmonMarket} from './salmon-market.mjs?v=0.18.82';
import {OVERBOARD_NOTICE,settleOverboard,dispatchReplacement} from './man-overboard.mjs?v=0.18.82';
import {seaLane} from './navigation.mjs?v=0.18.82';
import {newWorldCode,newPlayerToken,cleanPlayerName,createMultiplayer,createPeerSmoother,createWorldClock} from './multiplayer.mjs?v=0.18.82';
import {startWaypointTravel,advanceWaypointTravel} from './time-to-waypoint.mjs?v=0.18.82';
import {CRAB_SPECIES,crabSpeciesName} from './crab-species.mjs?v=0.18.82';
import {LIGHTING_PROFILES} from './light-upgrades.mjs?v=0.18.82';
import {claimFirstBoatGrant,firstBoatNotice} from './first-boat.mjs?v=0.18.82';
import {crabPriceAt,crabHoldValue} from './catch-value.mjs?v=0.18.82';
import {watchDonations,appendDonation} from './donation-feed.mjs?v=0.18.82';
import {DONATION_FEED_URL} from './donation-config.mjs?v=0.18.82';
import {watchUpdates,formatUpdateNotice} from './update-check.mjs?v=0.18.82';
import {energyPrice} from './energy.mjs?v=0.18.82';
import {createMessageQueue} from './message-queue.mjs?v=0.18.82';
import {visibleFleet} from './fleet-visuals.mjs?v=0.18.82';
import {transitionWeather} from './weather-transition.mjs?v=0.18.82';
import {ownedUpgrades,createRadioFeed,createLastHaul} from './hud-status.mjs?v=0.18.82';
import {createIntro} from './intro.mjs?v=0.18.82';
import {fleetNoticeCount} from './fleet.mjs?v=0.18.82';
import {redeemDeveloperCode} from './developer-code.mjs?v=0.18.82';
import {potSoakStage} from './pot-soak.mjs?v=0.18.82';
import {createLiveWeather} from './live-weather.mjs?v=0.18.82';
import {dockingStage,PORT_QUAYS,nearestQuay} from './harbor.mjs?v=0.18.82';
import {fuelEconomy,fuelToGround} from './fuel-economy.mjs?v=0.18.82';
import {scanSonar,drawSonar} from './sonar.mjs?v=0.18.82';
import {rareCount,rareValue} from './rare-catch.mjs?v=0.18.82';
import {clipChartWater} from './chart-water.mjs?v=0.18.82';
import {groundsAt,groundReport,crabHotspot,groundMotion} from './fishing-grounds.mjs?v=0.18.82';
import {createSoundscape} from './soundscape.mjs?v=0.18.82';
import {WORLD_LAND,WORLD_CENTER,WORLD_BOUNDS,PLACES,worldToGeo,clearWater,ST_PAUL_DIESEL} from './world.mjs?v=0.18.82';
import {getLanguage,setLanguage,translateText,localizeTree} from './i18n.mjs?v=0.18.82';
import {createShop} from './shop.mjs?v=0.18.82';
import {restoreSeason,seasonJSON} from './saves.mjs?v=0.18.82';
import {vesselStats,toggleAutomation,droneRequirement} from './career.mjs?v=0.18.82';
import {pickupAllPots,skipperCommand,createGame,step,notify,startDroneSet,cancelDroneSet,conditions,depthAt,PORT,distance,nearPort,handlePot,dock,undock,canUndock,service,beginTow,towDestination,towFee,atDieselStation,getUnstuck,clamp,potAction,POT_RANGE,jobProgress,setAutopilot,autopilotRouteStart,applyAutopilotRoute,setRudder,potBearing,workingSide} from './simulation.mjs?v=0.18.82';
import {createOcean,drawFallback} from './ocean.mjs?v=0.18.82';
import {createScene} from './scene.mjs?v=0.18.82';
import {drawGroundMotion,createChartView,chartPoint,chartWorld,panChart,zoomChart,followVessel,fitPots,updateChartFollow} from './chart.mjs?v=0.18.82';
import {createWake} from './wake.mjs?v=0.18.82';
import {advanceVoyage} from './voyage.mjs?v=0.18.82';
let sonarFrame='';const radioFeed=createRadioFeed(),messageQueue=createMessageQueue();let ownedSignature='';const lastHaulDisplay=createLastHaul();
const wake=createWake();
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d'),sea=$('ocean'),chart=$('chart'),map=chart.getContext('2d');
const sandbox=document.body.dataset.sandbox==='true';
let state=createGame(),saved=false,saveAvailable=true,droneFlight=null;const multiplayer=createMultiplayer(),peerSmoother=createPeerSmoother();
if(sandbox){state.money=9000000;state.hour=11;if(document.body.dataset.layoutCheck==='true')state.career.parts.sonar=3;state.message='Isolated career test: your real season is untouched.';}
else try{const loaded=restoreSeason(JSON.parse(localStorage.getItem('dangerous-waters-v1')));if(loaded){state=loaded;saved=true;}}catch{}
let preferredLanguage=state.language||'en';if(!sandbox)try{preferredLanguage=localStorage.getItem('dangerous-waters-language')||preferredLanguage;}catch{}setLanguage(preferredLanguage);state.language=getLanguage();
for(const context of [ctx,map]){const drawText=context.fillText.bind(context);context.fillText=(text,...args)=>drawText(translateText(text),...args);}
const chartView=createChartView(state.x,state.y);
const keys=new Set();let width=innerWidth,height=innerHeight,dpr=1,view={x:state.x,y:state.y,scale:1.55,dpr:1},clock=0,last=performance.now(),fps=60,uiTimer=0,saveTimer=0,timeSpeed=3,started=false,toastAge=0,lastMessage='',harborWasPaused=false;
let visualWeather={...conditions(state)};let weatherPoll=0,weatherStorage=null;try{if(!sandbox)weatherStorage=localStorage;}catch{}const liveWeather=createLiveWeather({storage:weatherStorage});
let scene3D=null,sceneError='';try{scene3D=createScene($('scene'));}catch(error){sceneError=error.message;$('renderer').title='3D could not start: '+error.message;}
const renderer=scene3D?{gpu:false,label:scene3D.label}:await createOcean(sea);let gpu=renderer.gpu;$('renderer').textContent=renderer.label;
if(scene3D){sea.style.display='none';$('scene').addEventListener('scenelost',()=>{scene3D=null;gpu=false;$('renderer').textContent='FALLBACK · 2D';});}
let lastRenderKey='';
let cameraZoom=.74,cameraOverhead=false;
$('camera-mode').onclick=()=>{cameraOverhead=!cameraOverhead;scene3D?.setTilt(cameraOverhead?1.9:1);$('camera-mode').textContent=cameraOverhead?'CAMERA · OVERHEAD':'CAMERA · ANGLED';};
canvas.addEventListener('wheel',e=>{if(!scene3D)return;e.preventDefault();cameraZoom=clamp(cameraZoom+Math.sign(e.deltaY)*.06,.38,2.15);scene3D.setZoom(cameraZoom);},{passive:false});
sea.addEventListener('oceanlost',()=>{gpu=false;$('renderer').textContent='FALLBACK · 2D';});
function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);for(const c of [sea,canvas]){c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);view.scale=width<760?1.2:1.65;view.dpr=dpr;}
addEventListener('resize',resize);resize();
const pos=(x,y)=>({x:(x-view.x)*view.scale+width*.5,y:(y-view.y)*view.scale+height*.53});
const money=v=>Math.round(v).toLocaleString('en-US')+' kr';
const hh=h=>`${String(Math.floor(h)%24).padStart(2,'0')}:${String(Math.floor((h%1)*60)).padStart(2,'0')}`;
function save(){state.language=getLanguage();if(sandbox)return;try{const snapshot={...state};delete snapshot.remotePlayers;delete snapshot.multiplayerOnline;delete snapshot.hoseTarget;localStorage.setItem('dangerous-waters-v1',seasonJSON(snapshot));}catch{saveAvailable=false;}}
addEventListener('beforeunload',save);
function togglePause(){if(!started||state.tow||$('harbor').open||$('career').open||$('chart-dialog').open)return;state.paused=!state.paused;keys.clear();save();updateUI();}
function keyboardCode(e){return ({a:'KeyA',d:'KeyD',w:'KeyW',s:'KeyS',x:'KeyX',e:'KeyE',u:'KeyU'})[e.key?.toLowerCase()]||e.code||e.key;}
function centerRudder(){for(const code of ['KeyA','KeyD','ArrowLeft','ArrowRight'])keys.delete(code);setRudder(state,0);}
addEventListener('keydown',e=>{const code=keyboardCode(e);if(state.tow||$('owned-dialog').open||$('intro').open||$('code-dialog').open||$('save-confirm').open||$('message-popup').open||$('refuel-prompt').open)return;if(($('career').open||$('harbor').open||$('chart-dialog').open)&&code!=='Escape')return;if(code!=='Escape'&&(e.target.closest('select,textarea,input:not([type=range]),[contenteditable=true]')||(e.target.closest('button')&&code==='Enter')))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code))e.preventDefault();if(e.repeat)return;if(code==='Escape'){if($('chart-dialog').open){e.preventDefault();$('chart-dialog').close();}else if($('career').open)$('career').close();else if($('harbor').open)$('harbor').close();else togglePause();return;}if(!started||state.paused||$('harbor').open||$('career').open)return;keys.add(code);if(['KeyA','KeyD','ArrowLeft','ArrowRight'].includes(code))setRudder(state,state.rudder*35+(['KeyA','ArrowLeft'].includes(code)?-2:2));if(code==='KeyX')centerRudder();if(code==='Space'){handlePot(state);save();}if(code==='KeyE'){dock(state);save();}if(code==='KeyU')castOffFromControls();});
addEventListener('keyup',e=>keys.delete(keyboardCode(e))); addEventListener('blur',()=>keys.clear());
if(sandbox)document.querySelector('.intro-foot').textContent='ISOLATED CAREER CHECK · NO SAVING';
$('start').textContent=saved?'CONTINUE YOUR SEASON →':'TAKE COMMAND →';
function ensureWorldIdentity(){const fresh=!state.ownWorldId||!state.worldId||!state.playerToken;state.ownWorldId||=newWorldCode();state.worldId||=state.ownWorldId;state.playerToken||=newPlayerToken();$('world-id').textContent=state.worldId;if(fresh)save();}
let nameWasPaused=false;function requestPlayerName(){if(!cleanPlayerName(state.playerName)){nameWasPaused=state.paused;state.paused=true;localizeTree($('player-name-dialog'));$('player-name-dialog').showModal();}}
$('player-name-save').onclick=()=>{const name=cleanPlayerName($('player-name-input').value);if(!name)return;state.playerName=name;ensureWorldIdentity();save();$('player-name-dialog').close();state.paused=nameWasPaused;updateUI();};
$('join-world').onclick=()=>{if(!cleanPlayerName(state.playerName)){requestPlayerName();return;}$('world-input').value='';$('world-error').textContent='';localizeTree($('join-world-dialog'));$('join-world-dialog').showModal();};
$('join-world-confirm').onclick=async()=>{const id=$('world-input').value.trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(id)){$('world-error').textContent=translateText('Enter a six-character World ID.');return;}ensureWorldIdentity();const old=state.worldId;state.worldId=id;multiplayer.reset();peerSmoother.reset();await multiplayer.sync(state,id===state.ownWorldId);if(multiplayer.status!=='online'){state.worldId=old;multiplayer.reset();peerSmoother.reset();$('world-error').textContent=translateText('World not found or server unavailable.');return;}save();$('world-id').textContent=id;$('join-world-dialog').close();};
const intro=createIntro({dialog:$('intro'),video:$('intro-video'),skip:$('intro-skip'),onFinish:()=>{started=true;state.paused=false;canvas.setAttribute('tabindex','0');canvas.focus();updateUI();requestPlayerName();}});
$('start').onclick=()=>{enableSound();$('welcome').close();if(saved){started=true;state.paused=false;canvas.setAttribute('tabindex','0');canvas.focus();updateUI();requestPlayerName();}else intro.start();};$('welcome').showModal();
$('pause').onclick=togglePause;
const chartPanel=document.querySelector('.chart-panel'),chartHome=document.createComment('chart-home');chartPanel.before(chartHome);
const focusChartTarget=()=>($('chart-dialog').open?chart:canvas).focus({preventScroll:true});
function resizeChart(){const r=chart.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.round(r.width*ratio)),h=Math.max(1,Math.round(r.height*ratio));if(chart.width!==w||chart.height!==h){chart.width=w;chart.height=h;}drawChart();}
new ResizeObserver(resizeChart).observe(chart);
$('chart-expand').onclick=()=>{const dialog=$('chart-dialog');if(dialog.open){dialog.close();return;}keys.clear();$('chart-dialog-body').append(chartPanel);dialog.showModal();$('chart-expand').textContent='MINIMIZE';$('chart-expand').setAttribute('aria-label','Minimize chart');$('chart-expand').setAttribute('aria-expanded','true');resizeChart();chart.focus();updateUI();};
$('chart-focus-pots').onclick=()=>{if(fitPots(chartView,state.pots,chart.width,chart.height))drawChart();};
$('chart-dialog-close').onclick=()=>$('chart-dialog').close();$('chart-dialog').addEventListener('close',()=>{chartHome.after(chartPanel);$('chart-expand').textContent='EXPAND';$('chart-expand').setAttribute('aria-label','Enlarge chart');$('chart-expand').setAttribute('aria-expanded','false');resizeChart();save();updateUI();canvas.focus();});
const chartCursor=e=>{const r=chart.getBoundingClientRect();return {x:(e.clientX-r.left)*chart.width/r.width,y:(e.clientY-r.top)*chart.height/r.height};};
let chartDrag=null;
chart.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();const p=chartCursor(e);zoomChart(chartView,Math.exp(-clamp(e.deltaY,-150,150)*.003),p.x,p.y,chart.width,chart.height);drawChart();},{passive:false});
chart.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();chartDrag=chartCursor(e);chart.setPointerCapture(e.pointerId);chart.dataset.dragging='true';});
chart.addEventListener('pointermove',e=>{if(!chartDrag)return;const p=chartCursor(e);panChart(chartView,p.x-chartDrag.x,p.y-chartDrag.y);chartDrag=p;drawChart();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])chart.addEventListener(event,()=>{chartDrag=null;chart.dataset.dragging='false';if(event==='pointerup')focusChartTarget();});
const waypointWorkers=new Set();
let planningWaypoint=false;
function cancelWaypointSearch(){
 for(const worker of waypointWorkers)worker.terminate();
 waypointWorkers.clear();planningWaypoint=false;
}
function requestWaypoint(target,append){
 if(state.tow)return;
 cancelWaypointSearch();
 const vessel=state,previous=state.autopilot,start=autopilotRouteStart(state,append);
 const noRoute=()=>{state.message='No navigable route to destination. Choose a point in open water.';updateUI();};
 if(!target||!start){noRoute();return;}
 const from={x:start.x,y:start.y};
 function applyRoute(route){
  cancelWaypointSearch();
  if(state!==vessel||state.autopilot!==previous){updateUI();return;}
  const now=autopilotRouteStart(state,append);
  if(!now||!route?.length){noRoute();return;}
  if(Math.hypot(now.x-from.x,now.y-from.y)>2){
   if(!seaLane(now,from,28,{remaining:250,deadline:performance.now()+30})){noRoute();return;}
   route.unshift(from);
  }
  if(!applyAutopilotRoute(state,target.x,target.y,append,route)){noRoute();return;}
  save();updateUI();
 }
 function launch(start,end,grid,complete){
  let worker;
  try{
   worker=new Worker(new URL('./waypoint-worker.mjs?v=0.18.82',import.meta.url),{type:'module'});
   waypointWorkers.add(worker);
   const done=route=>{
    if(!waypointWorkers.delete(worker))return;
    worker.terminate();
    complete(route);
   };
   worker.onmessage=({data})=>done(data);
   worker.onerror=()=>done(null);
   worker.postMessage({from:start,target:end,grid});
   return true;
  }catch{
   if(worker){waypointWorkers.delete(worker);worker.terminate();}
   return false;
  }
 }
 function searchWholeRoute(){
  const grids=[{}, {resolution:105,margin:.45,maxNodes:35000}, {resolution:65,margin:.8,maxNodes:35000}];
  for(const grid of grids)launch(from,target,grid,route=>{
   if(route?.length||!waypointWorkers.size)applyRoute(route);
  });
 }
 const dx=target.x-from.x,dy=target.y-from.y;
 const joins=[1/3,2/3].map(f=>({x:from.x+dx*f,y:from.y+dy*f}));
 if(Math.hypot(dx,dy)>120000&&joins.every(p=>clearWater(p.x,p.y,100))){
  const points=[from,...joins,target],legs=new Array(3);
  let complete=0;
  for(let i=0;i<3;i++){
   if(!launch(points[i],points[i+1],{},route=>{
    if(!route?.length){
     cancelWaypointSearch();searchWholeRoute();
     planningWaypoint=waypointWorkers.size>0;
     if(!planningWaypoint)noRoute();
     return;
    }
    legs[i]=route;
    if(++complete===3)applyRoute(legs.flat());
   })){
    cancelWaypointSearch();searchWholeRoute();break;
   }
  }
 }else searchWholeRoute();
 if(!waypointWorkers.size){
  if(!setAutopilot(state,target.x,target.y,append,{remaining:60000,deadline:performance.now()+180}))noRoute();
  else{save();updateUI();}
  return;
 }
 planningWaypoint=true;
 updateUI();
}
canvas.addEventListener('contextmenu',e=>{
 if(!started||document.querySelector('dialog[open]'))return;
 e.preventDefault();
 const bounds=canvas.getBoundingClientRect(),x=e.clientX-bounds.left,y=e.clientY-bounds.top;
 const target=scene3D?scene3D.seaPoint(x,y):{x:view.x+(x-width*.5)/view.scale,y:view.y+(y-height*.53)/view.scale};
 requestWaypoint(target,e.shiftKey);
});
chart.addEventListener('contextmenu',e=>{e.preventDefault();const p=chartCursor(e),target=chartWorld(chartView,p.x,p.y,chart.width,chart.height);requestWaypoint(droneMarkerAt(p)||target,e.shiftKey);});
chart.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home','Enter'].includes(e.key))return;e.stopPropagation();const pan=35;if(e.key==='ArrowLeft')panChart(chartView,pan,0);else if(e.key==='ArrowRight')panChart(chartView,-pan,0);else if(e.key==='ArrowUp')panChart(chartView,0,pan);else if(e.key==='ArrowDown')panChart(chartView,0,-pan);else if(e.key==='+'||e.key==='=')zoomChart(chartView,1.3,chart.width/2,chart.height/2,chart.width,chart.height);else if(e.key==='-')zoomChart(chartView,1/1.3,chart.width/2,chart.height/2,chart.width,chart.height);else if(e.key==='Home'){followVessel(chartView,state);}else if(e.key==='Enter')requestWaypoint({x:chartView.x,y:chartView.y},e.shiftKey);else return;e.preventDefault();drawChart();});
for(const b of document.querySelectorAll('[data-chart-area]'))b.onclick=()=>{chartView.follow=false;if(b.dataset.chartArea==='harbor'){chartView.x=0;chartView.y=-1000;chartView.scale=.035;}else if(b.dataset.chartArea==='matthew'){const harbor=PORT_QUAYS[1];chartView.x=harbor.x;chartView.y=harbor.y;chartView.scale=.035;}else if(b.dataset.chartArea==='region'){chartView.x=-15000;chartView.y=5000;chartView.scale=.0012;}else{chartView.x=WORLD_CENTER.x;chartView.y=WORLD_CENTER.y;chartView.scale=Math.min(chart.width/(WORLD_BOUNDS.right-WORLD_BOUNDS.left),chart.height/(WORLD_BOUNDS.bottom-WORLD_BOUNDS.top))*.88;}drawChart();focusChartTarget();};
$('chart-center').onclick=()=>{followVessel(chartView,state);drawChart();};
let waypointTravel=null;
$('time-to-waypoint').onclick=()=>{if(state.tow)return;if(waypointTravel){waypointTravel=null;state.message='Time to waypoint cancelled.';updateUI();return;}if($('chart-dialog').open)$('chart-dialog').close();waypointTravel=startWaypointTravel(state);if(!waypointTravel){state.message='Set an autopilot waypoint and finish any active work or repairs first.';updateUI();return;}keys.clear();state.message=state.deckJob?.kind==='undock'?'Casting off, then skipping to the next waypoint…':'Travelling to next waypoint…';updateUI();};
$('ap-cancel').onclick=()=>{if(state.tow)return;cancelWaypointSearch();if(!cancelDroneSet(state)){state.autopilot=null;state.rudder=0;state.message='Autopilot disengaged. Manual helm control.';}updateUI();save();};
$('speed-target').addEventListener('pointerup',()=>canvas.focus({preventScroll:true}));
$('renderer').onclick=()=>{$('code-input').value='';$('code-dialog').returnValue='';keys.clear();$('code-dialog').showModal();$('code-input').focus();};
$('code-cancel').onclick=()=>$('code-dialog').close('cancel');
$('code-dialog').addEventListener('close',()=>{
 const code=$('code-input').value;
 if($('code-dialog').returnValue==='redeem'&&redeemDeveloperCode(state,code)){
  if(code==='Go to harbor'){
   cancelWaypointSearch();waypointTravel=null;Object.assign(wake,createWake());
   view.x=state.x;view.y=state.y;followVessel(chartView,state);
  }
  save();updateUI();
 }
 canvas.focus();
});
$('speed-target').oninput=e=>{state.desiredKnots=Number(e.target.value);};
$('rudder-target').oninput=e=>{setRudder(state,Number(e.target.value));updateUI();save();};$('rudder-center').onclick=()=>{centerRudder();updateUI();save();canvas.focus();};
$('lights').textContent=state.lights===false?'WORK LIGHTS OFF':'WORK LIGHTS ON';$('lights').setAttribute('aria-pressed',String(state.lights!==false));
$('lights').onclick=()=>{state.lights=state.lights===false;$('lights').textContent=state.lights?'WORK LIGHTS ON':'WORK LIGHTS OFF';$('lights').setAttribute('aria-pressed',String(state.lights));};
function setTimeSpeed(value){timeSpeed=value;for(const button of document.querySelectorAll('[data-time-speed]'))button.setAttribute('aria-pressed',String(Number(button.dataset.timeSpeed)===value));}
for(const button of document.querySelectorAll('[data-time-speed]'))button.onclick=()=>setTimeSpeed(Number(button.dataset.timeSpeed));
$('harbor-toggle').onclick=()=>{harborWasPaused=state.paused;state.paused=true;keys.clear();$('harbor').showModal();updateUI();};$('harbor-close').onclick=()=>$('harbor').close();$('harbor').addEventListener('close',()=>{state.paused=harborWasPaused;canvas.focus();});
function castOffFromControls(){if(undock(state)){state.paused=false;keys.clear();save();updateUI();canvas.focus();}}
$('undock-quick').onclick=castOffFromControls;$('unstuck').onclick=()=>{if(getUnstuck(state)===true){save();updateUI();}canvas.focus();};
$('undock').onclick=()=>{if(undock(state)){harborWasPaused=false;$('harbor').close();}save();updateUI();};
$('sell').onclick=()=>{dock(state);if(state.deckJob?.kind==='unload'){harborWasPaused=false;$('harbor').close();}save();updateUI();};for(const b of document.querySelectorAll('[data-service]'))b.onclick=()=>{service(state,b.dataset.service);save();updateUI();};
$('new-season').onclick=()=>{state=createGame();multiplayer.reset();peerSmoother.reset();firstBoatAcknowledgement=false;radioFeed.reset();messageQueue.reset();saved=false;harborWasPaused=false;setTimeSpeed(3);view.x=state.x;view.y=state.y;followVessel(chartView,state);save();$('harbor').close();started=false;state.paused=true;intro.start();updateUI();};
$('st-paul-refuel').onclick=()=>{service(state,'fuel');save();updateUI();};
$('rescue').onclick=()=>{
 if(state.tow||state.overboard)return;
 cancelWaypointSearch();waypointTravel=null;keys.clear();
 state.tow={phase:'film'};
 harborWasPaused=false;$('harbor').close();save();updateUI();
};
let towPlanning=null;
function planTow(){
 const vessel=state,tow=state.tow;
 if(towPlanning===tow)return;
 towPlanning=tow;
 const from={x:state.x,y:state.y},target=towDestination();
 const grids=[{}, {resolution:105,margin:.45,maxNodes:35000}, {resolution:65,margin:.8,maxNodes:35000}];
 const workers=new Set();
 function complete(route){
  for(const worker of workers)worker.terminate();
  workers.clear();
  if(state!==vessel||state.tow!==tow)return;
  if(!beginTow(state,route)){state.tow=null;state.message='No navigable tow route to Dutch Harbor.';}
  save();updateUI();
 }
 for(const grid of grids)try{
  const worker=new Worker(new URL('./waypoint-worker.mjs?v=0.18.82',import.meta.url),{type:'module'});
  workers.add(worker);
  const done=route=>{
   if(!workers.delete(worker))return;
   worker.terminate();
   if(route?.length||!workers.size)complete(route);
  };
  worker.onmessage=({data})=>done(data);worker.onerror=()=>done(null);
  worker.postMessage({from,target,grid});
 }catch{}
 if(!workers.size)complete(null);
}

function changeSeason(action,data){if(action==='boat'&&state.career.firstBoatReward==='pending'){$('career').close();save();return;}if(action==='export'){const url=URL.createObjectURL(new Blob([seasonJSON(state)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='dangerous-waters-season.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}else if(action==='import'){const loaded=restoreSeason(data);if(!loaded){company.status('Invalid or incompatible season. Your current save is unchanged.');return;}state=loaded;multiplayer.reset();peerSmoother.reset();requestPlayerName();firstBoatAcknowledgement=false;radioFeed.reset();messageQueue.reset();followVessel(chartView,state);company.render();company.status('Season imported.');}save();updateUI();}
const company=createShop(()=>state,changeSeason);
let pendingSeason=null;
$('save-download').onclick=()=>{changeSeason('export');canvas.focus();};
$('save-upload').onclick=()=>{$('save-file').value='';$('save-file').click();};
$('save-file').onchange=async()=>{const file=$('save-file').files?.[0];if(!file)return;pendingSeason=null;keys.clear();state.paused=true;$('save-import-confirm').disabled=true;$('save-file-status').textContent='Reading save file…';$('save-confirm').showModal();try{if(file.size>2000000)throw Error('Save file is too large.');const data=JSON.parse(await file.text());if(!restoreSeason(data))throw Error('Invalid or incompatible season. Your current save is unchanged.');pendingSeason=data;$('save-file-status').textContent=file.name;$('save-import-confirm').disabled=false;}catch(error){$('save-file-status').textContent=error instanceof SyntaxError?'Invalid JSON file.':error.message;}localizeTree($('save-confirm'));};
$('save-import-cancel').onclick=()=>{$('save-confirm').close();pendingSeason=null;canvas.focus();};
$('save-import-confirm').onclick=()=>{if(!pendingSeason)return;changeSeason('import',pendingSeason);state.paused=true;save();$('save-confirm').close();pendingSeason=null;canvas.focus();};
$('rare-catch-open').onclick=()=>company.open('collection');
for(const select of document.querySelectorAll('[data-language]')){select.value=getLanguage();select.onchange=()=>{setLanguage(select.value);state.language=getLanguage();document.documentElement.lang=getLanguage();for(const other of document.querySelectorAll('[data-language]'))other.value=getLanguage();if(!sandbox)try{localStorage.setItem('dangerous-waters-language',getLanguage());}catch{}company.refresh();updateUI();save();};}
const ownedDialog=$('owned-dialog'),ownedToggle=$('owned-toggle');let ownedWasPaused;
ownedToggle.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();e.stopPropagation();if(!e.repeat)ownedToggle.click();}});
ownedToggle.onclick=()=>{ownedWasPaused=state.paused;keys.clear();state.paused=true;ownedDialog.showModal();updateUI();};
ownedDialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();ownedDialog.close();}});
ownedDialog.addEventListener('close',()=>{state.paused=ownedWasPaused;updateUI();ownedToggle.focus({preventScroll:true});});
$('shop-toggle').onclick=()=>{keys.clear();company.open('skills');};$('fleet-toggle').onclick=()=>{keys.clear();company.open('fleet');};
for(const [id,key] of [['auto-deploy','autoDeploy'],['auto-haul','autoHaul'],['intelligent-auto-set','intelligentAutoSet']])$(id).onclick=()=>{state.message=toggleAutomation(state,key).message;save();updateUI();canvas.focus();};
$('pickup-all').onclick=()=>{keys.clear();pickupAllPots(state);save();updateUI();canvas.focus();};
const droneFree=()=>started&&!state.paused&&!state.deckJob&&!state.tow&&!state.overboard&&!waypointTravel;
const droneColor='#9be8df';
function droneMarkerAt(p){
 const points=state.droneSurvey?.points||[];
 if(chartView.scale<.02)return null;
 const mapDistance=q=>{const t=chartPoint(chartView,q.x,q.y,chart.width,chart.height);return Math.hypot(t.x-p.x,t.y-p.y);};
 const nearest=[...points].sort((a,b)=>mapDistance(a)-mapDistance(b))[0];
 return nearest&&mapDistance(nearest)<10?nearest:null;
}
function droneDock(){
 const stats=vesselStats(state),[localX,localZ]=droneFlight.deck;
 const x=localX*deckSign(stats)*stats.length/24,z=localZ*stats.beam/7.6,c=Math.cos(state.heading),s=Math.sin(state.heading);
 return {x:state.x+x*c-z*s,y:state.y+x*s+z*c,height:2};
}
function advanceDrone(dt){
 if(!droneFlight)return;
 if(droneFlight.state!==state||droneFlight.boat!==state.career.boat||state.tow||state.overboard){droneFlight=null;return;}
 if(state.paused||$('intro').open||document.hidden)return;
 droneFlight.elapsed=Math.min(DRONE_DURATION,droneFlight.elapsed+dt);
 if(droneFlight.elapsed<DRONE_DURATION)return;
 const {origin,hour}=droneFlight;
 if(!state.deck){droneFlight=null;notify(state,'Drone Survey needs at least one pot on board.');save();updateUI();return;}
 const points=scanCrab(origin,hour,state.deck,p=>!nearPort(p));
 state.droneSurvey={origin,hour,points};droneFlight=null;
 if(points.length){cancelWaypointSearch();startDroneSet(state,points);}
 else notify(state,'Drone landed. No promising crab signals in this area.');
 save();updateUI();
}
$('drone-survey').onclick=()=>{
 const stats=vesselStats(state);
 if(cancelDroneSet(state)){save();updateUI();return;}
 if(droneFlight||!stats.droneSurvey||!droneFree()||droneRequirement(state))return;
 if(!state.deck){notify(state,'Drone Survey needs at least one pot on board.');updateUI();return;}
 const deck=[[-9.5,0],[-8,-1.4],[-10,1.3],[-6,-2],[-5,1.8]].find(([x,z])=>canStand(x,z,state.deck,false,stats))||[-6,0];
 droneFlight={origin:{x:state.x,y:state.y},heading:state.heading,hour:watchHour(),elapsed:0,deck,state,boat:state.career.boat};
 Object.assign(chartView,{...droneFlight.origin,follow:false,scale:Math.min(.35,Math.min(chart.width,chart.height)*.8/(2*DRONE_RADIUS))});
 notify(state,'Drone launching. Surveying the water around the vessel.');
 updateUI();canvas.focus();
};

for(const [id,kind]of [['skipper-home','home'],['skipper-pot','pot']])$(id).onclick=()=>{keys.clear();skipperCommand(state,kind);save();updateUI();canvas.focus();};
$('pot-spacing').onchange=e=>{state.career.potSpacing=Number(e.target.value);save();updateUI();canvas.focus();};
$('fishery').onchange=e=>{if(state.deckJob){e.target.value=state.career.fishing;return;}state.career.fishing=e.target.value==='salmon'&&vesselStats(state).salmon?'salmon':'crab';save();updateUI();canvas.focus();};
// Sound is synthesized after an explicit gesture; no sound files or network requests.
let audio=null,soundOn=true,musicOn=false,volume=100;try{if(!sandbox){volume=Number(localStorage.getItem('dangerous-waters-volume')??100);musicOn=localStorage.getItem('dangerous-waters-music')==='on';}}catch{}if(!Number.isFinite(volume))volume=100;volume=clamp(volume,0,100);$('volume').value=volume;$('volume-value').textContent=volume+'%';
function enableSound(){if(!soundOn&&!musicOn)return;try{audio??=createSoundscape();audio.setVolume(volume/100);void audio.resume().catch(()=>{});}catch{}}
$('sound').textContent='SOUND ON';$('sound').setAttribute('aria-pressed','true');
$('volume').oninput=e=>{volume=clamp(Number(e.target.value),0,100);$('volume-value').textContent=volume+'%';try{if(!sandbox)localStorage.setItem('dangerous-waters-volume',String(volume));}catch{}if(audio)audio.setVolume(volume/100);};
function showMusicControl(){const button=$('music');button.textContent=translateText(musicOn?'MUSIC ON':'MUSIC OFF');button.setAttribute('aria-pressed',String(musicOn));}
$('music').onclick=()=>{musicOn=!musicOn;try{if(!sandbox)localStorage.setItem('dangerous-waters-music',musicOn?'on':'off');}catch{}enableSound();showMusicControl();};
$('sound').onclick=()=>{soundOn=!soundOn;enableSound();$('sound').textContent=soundOn?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-pressed',String(soundOn));};
let activeMessageKind='',firstBoatAcknowledgement=false,firstBoatWasPaused=false;
$('message-popup').addEventListener('cancel',e=>e.preventDefault());
$('message-popup-ok').onclick=()=>{if(activeMessageKind==='firstBoat')claimFirstBoatGrant(state);if(activeMessageKind==='overboard')dispatchReplacement(state,PORT);$('message-popup').close();keys.clear();canvas.focus();save();updateUI();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio?.updateMusic(visualWeather,false);});
const stopDonations=watchDonations({url:DONATION_FEED_URL,receive:text=>appendDonation(state,text)});addEventListener('pagehide',event=>{if(!event.persisted)stopDonations();},{once:true});
const stopUpdateChecks=watchUpdates({currentVersion:new URL(import.meta.url).searchParams.get('v'),notify:(version,notes)=>messageQueue.enqueue({kind:'update',version,notes,text:formatUpdateNotice(version,notes,getLanguage())})});addEventListener('pagehide',event=>{if(!event.persisted)stopUpdateChecks();},{once:true});
function showQueuedMessage(){messageQueue.collect(state);if(!started||document.querySelector('dialog[open]'))return;if(state.tow?.phase==='film'){
 intro.start({source:'./tow.mp4?v=0.18.82',onFinish:()=>{state.tow.phase='planning';save();updateUI();}});return;
}
if(state.tow?.phase==='planning'){planTow();return;}
if(state.tow)return;
if(state.specialCatchFilm){
 intro.start({source:'./special-catch.mp4?v=0.18.82',onFinish:()=>{state.specialCatchFilm=false;save();updateUI();}});return;
}
if(state.overboard?.phase==='film'){save();intro.start({source:state.crewLosses>1?'./another-lost.mp4?v=0.18.82':'./man-overboard.mp4?v=0.18.82',onFinish:()=>{settleOverboard(state);save();updateUI();}});return;}
if(state.overboard?.phase==='notice'){activeMessageKind='overboard';keys.clear();$('message-popup-title').textContent='MAN OVERBOARD';$('message-popup-text').textContent=OVERBOARD_NOTICE;localizeTree($('message-popup'));$('message-popup').showModal();$('message-popup-ok').focus();return;}if(state.career.firstBoatReward==='pending'&&!firstBoatAcknowledgement){firstBoatWasPaused=state.paused;state.paused=true;save();$('intro').setAttribute('aria-label',translateText('First boat celebration'));$('intro-video').setAttribute('aria-label',translateText('First boat celebration video'));intro.start({source:'./new-boat.mp4',onFinish:()=>{firstBoatAcknowledgement=true;state.paused=firstBoatWasPaused;messageQueue.enqueue({kind:'firstBoat',text:firstBoatNotice(getLanguage())});updateUI();}});return;}const entry=messageQueue.next();if(!entry)return;activeMessageKind=entry.kind;keys.clear();if(entry.kind==='update')save();$('message-popup-title').textContent=entry.kind==='firstBoat'?'YOUR FIRST BOAT':entry.kind==='update'?'GAME UPDATE AVAILABLE':entry.kind==='incident'?'REPAIR & VESSEL ALERT':'FLEET RADIO';$('message-popup-text').textContent=entry.kind==='update'&&entry.version?formatUpdateNotice(entry.version,entry.notes,getLanguage()):entry.text;localizeTree($('message-popup'));$('message-popup').showModal();$('message-popup-ok').focus();}
let offeredMooring=state.moored;
const refuelPrompt=$('refuel-prompt');
const replacePotsButton=$('replace-lost-pots');
replacePotsButton.onclick=()=>{
 if(state.moored!==offeredMooring||!replaceLostPots(state))return;
 replacePotsButton.hidden=true;
 if($('refuel-accept').hidden)refuelPrompt.close();
 else updateDockOptions();
 save();updateUI();
};
function updateDockOptions(){
 const stats=vesselStats(state),needed=Math.max(0,stats.tank-state.fuel);
 const electric=stats.powertrain==='electric',cost=needed*energyPrice(stats)*stats.serviceCost;
 const count=state.lostPots||0,potCost=count*LOST_POT_PRICE,affordable=state.money>=cost-1e-6;
 $('refuel-prompt-title').textContent=needed<1?'Dock services':electric?'Recharge after docking?':'Refuel after docking?';
 $('refuel-accept').textContent=electric?'Charge battery':'Fill tank';
 $('refuel-accept').hidden=needed<1;
 $('refuel-accept').disabled=!affordable;
 $('refuel-prompt-text').textContent=needed<1?'':(electric?'Full charge: ':'Full tank: ')+money(cost)+(affordable?'':' · Insufficient funds.');
 replacePotsButton.hidden=!count;
 replacePotsButton.disabled=state.money<potCost;
 replacePotsButton.textContent=`Replace lost pots (${count}) · ${money(potCost)}`;
 localizeTree(refuelPrompt);
}
$('refuel-decline').onclick=()=>refuelPrompt.close();
$('refuel-accept').onclick=()=>{
 if(state.moored===offeredMooring)service(state,'fuel');
 if(state.lostPots)updateDockOptions();else refuelPrompt.close();
 save();updateUI();
};
refuelPrompt.addEventListener('close',()=>canvas.focus());
function offerDockRefuel(){
 if(!started||!state.moored||state.moored===offeredMooring||document.querySelector('dialog[open]'))return;
 offeredMooring=state.moored;
 if(vesselStats(state).tank-state.fuel<1&&!state.lostPots)return;
 updateDockOptions();keys.clear();refuelPrompt.showModal();
}
function updateUI(){
 showMusicControl();
 const towing=!!state.tow;
 for(const element of document.querySelectorAll('header, .left-panel, .right-panel > :not(.chart-panel), footer .controls, footer .simulation > :not(#renderer), .side-instruments, #kofi-support'))element.inert=towing;

 showQueuedMessage();
 offerDockRefuel();
 updateSonar();
 const stats=vesselStats(state);state.electricDrive=stats.powertrain==='electric';$('scene').setAttribute('aria-label',`Three-dimensional view of the sea and ${stats.name}`);canvas.setAttribute('aria-label',`Sea and fishing vessel ${stats.name}`);$('speed-target').max=Math.ceil(stats.top*1.94384);$('vessel-name').textContent='F/V '+stats.name.toUpperCase();$('watermark-name').textContent='F/V '+stats.name.toUpperCase();$('vessel-type').textContent=`${stats.length.toFixed(1)} M · ${stats.type.toUpperCase()} · ${stats.crew} CREW`;
 const w=conditions(state),heading=((state.heading*180/Math.PI+90)%360+360)%360;
 const iceJob=state.deckJob?.kind==='deice',iceTask=iceJob?(state.incident?'DE-ICING WAITING FOR REPAIRS':Math.abs(state.speed)>.01?'SLOWING FOR DE-ICING':'CHIPPING ICE'):null;
 const crewStatus=iceTask?translateText(iceTask):state.deckJob?.kind==='undock'?(state.deckJob.route?dockingStage(state.deckJob.route,state.deckJob.elapsed):'Letting go mooring lines'):state.moored?'Secured alongside. Hold empty. Ready for service.':state.incident?`${state.incident.name} · repair ${Math.ceil(state.incident.remaining/stats.repair)}s`:scene3D?.crewStatus||'Deck crew standing by';if($('crew-status').textContent!==crewStatus)$('crew-status').textContent=crewStatus;
 $('speed').textContent=(Math.abs(state.speed)*1.94384).toFixed(1);$('heading').textContent=String(Math.round(heading)%360).padStart(3,'0')+'°';$('watch').textContent=`DAY ${String(Math.floor(watchHour()/24)+1).padStart(2,'0')} · ${hh(watchHour())}`;$('pause').textContent=state.paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',state.paused?'Resume game':'Pause game');
 $('crab-price').textContent=money(state.cargo?crabHoldValue(state)/state.cargo:crabPriceAt(state))+' / KG';$('hull').textContent=Math.round(state.hull)+'%';$('hull-meter').value=state.hull;$('fuel').textContent=Math.round(state.fuel)+(stats.powertrain==='electric'?' kWh':' L');$('energy-label').textContent=stats.powertrain==='electric'?'BATTERY':'DIESEL';$('energy-service').textContent=stats.powertrain==='electric'?'SHORE CHARGE':'REFUEL DIESEL';$('energy-service-detail').textContent=stats.powertrain==='electric'?`2 kr / kWh · fill to ${stats.tank} kWh`:`9.50 kr / liter · fill to ${stats.tank} L`;$('fuel-meter').max=stats.tank;$('fuel-meter').value=state.fuel;$('rudder-angle').textContent=(state.rudder>0?'+':'')+Math.round(state.rudder*35)+'°';if(document.activeElement!==$('rudder-target'))$('rudder-target').value=Math.round(state.rudder*35);$('throttle').textContent=(state.desiredKnots||0).toFixed(1)+' KN';if(document.activeElement!==$('speed-target'))$('speed-target').value=state.desiredKnots||0;
 const action=potAction(state);const potText=state.tow?(state.tow.phase==='travel'?`BEING TOWED TO DUTCH HARBOR · ${(state.speed*1.94384).toFixed(1)} KN`:'WAITING FOR TOW') :state.overboard?'WAITING FOR REPLACEMENT CREW':iceJob?translateText(iceTask)+' · '+Math.round(jobProgress(state)*100)+'%':state.deckJob?.kind==='undock'?`UNDOCKING · ${Math.round(jobProgress(state)*100)}%`:state.moored?'MOORED · UNDOCK OR SET TARGET SPEED TO CAST OFF':state.deckJob?.kind==='unload'?`DOCKING / UNLOADING · ${Math.round(jobProgress(state)*100)}%`:state.career.fishing==='salmon'?(state.deckJob?`NET WORK · ${Math.round(jobProgress(state)*100)}%`:state.nets.length?`SPACE · RETRIEVE SALMON NET · ${Math.round(distance(state,state.nets[0]))} / 120 M · ${(state.hour-state.nets[0].setAt).toFixed(1)} H SOAK`:'SPACE · SET SALMON NET'):state.deckJob?`${state.deckJob.kind==='unload'?'DOCKING / UNLOADING':state.deckJob.kind==='haul'?'HAULING':'SETTING'} · ${Math.round(jobProgress(state)*100)}%`:action.inRange&&!action.canHaul?`BUOY ${action.pot.id} · APPROACH ${stats.hauler.toUpperCase()} WORKING AREA`:action.inRange?`SPACE · HAUL POT ${action.pot.id} · ${Math.round(action.meters)} / ${POT_RANGE} M`:`SPACE · SET NEW POT${action.pot?' · NEAREST '+Math.round(action.meters)+' M':''}`;if($('pot-action').textContent!==potText)$('pot-action').textContent=potText;$('pot-action').dataset.mode=state.deckJob?'busy':action.inRange&&!action.canHaul?'blocked':action.inRange?'haul':'deploy';
 const watchTemp=$('watch-temperature');watchTemp.textContent=Number.isFinite(w.temperature)?w.temperature.toFixed(1)+' °C':'– °C';watchTemp.dataset.freezing=String(w.temperature<0);watchTemp.title=translateText('Air temperature');
 const wind=translateText('Wind'),seas=translateText('Seas');
 const precip=(w.snow||0)>.05?translateText('Snow'):(w.rain||0)>.05?translateText('Rain'):w.fog>.65?translateText('Dense fog'):'';
 $('watch-conditions').textContent=[precip,wind+' '+Math.round(w.wind)+' kn',seas+' '+w.waves.toFixed(1)+' m'].filter(Boolean).join(' · ');
 const live=state.realWeather;
 $('weather-source').textContent=live?.status==='cached'?'Cached weather':live?.value?.marineEstimated?'Estimated waves':live?'Live weather':state.weatherStatus==='fallback'?'Live weather unavailable · simulated conditions':'Connecting to live weather · simulated conditions';
 const iceDisplay=$('weather-ice');iceDisplay.hidden=!iceJob&&!(state.ice>.01);iceDisplay.textContent=translateText('VESSEL ICE')+' · '+Math.round((state.ice||0)*100)+'%';
 const economy=fuelEconomy(state,stats,w);$('fuel-economy-value').textContent=economy.litersPerNm!==null?`${economy.litersPerNm.toFixed(2)} ${stats.powertrain==='electric'?'kWh':'L'}/NM`:economy.rate>0?'IDLE':'ENGINE OFF';$('fuel-burn-meter').value=economy.burn;$('fuel-burn-label').textContent=economy.burn>.75?'HIGH BURN':economy.burn>.4?'MODERATE BURN':'LOW BURN';$('fuel-economy').dataset.band=economy.burn>.75?'high':economy.burn>.4?'moderate':'low';
 $('rare-catch-open').textContent=`SPECIAL CATCHES · ${rareCount(state)} ABOARD · ${money(rareValue(state))}`;
 $('cargo').textContent=state.cargo+state.salmon;$('catch-split').textContent=`${state.cargo} / ${state.salmon} kg`;$('cargo-meter').max=stats.capacity;$('cargo-capacity').textContent=stats.capacity.toLocaleString(getLanguage()==='sv'?'sv-SE':'en-US')+' KG';const haul=lastHaulDisplay(state.lastHaul,performance.now());$('last-haul').hidden=!haul;if(haul){$('last-haul').textContent='+'+haul.kg+' KG';$('last-haul').title=state.lastHaul?.crabSpecies?crabSpeciesName(state.lastHaul.crabSpecies,getLanguage()):'';$('last-haul').style.opacity=haul.opacity;}$('cargo-meter').value=state.cargo+state.salmon;$('deck').textContent=`${state.deck} / ${stats.potCapacity}`;$('pots').textContent=state.pots.length;$('money').textContent=money(state.money);$('depth').textContent=`DEPTH ${depthAt(state.x,state.y)} M`;const geo=worldToGeo(state.x,state.y);$('coordinates').textContent=`${geo.lat.toFixed(4)}° N ${Math.abs(geo.lon).toFixed(4)}° ${geo.lon<0?'W':'E'}`;$('sea-position').textContent=`${depthAt(state.x,state.y)} M DEPTH · ${Math.round(distance(state,nearestQuay(state)))} M TO HARBOR`;
 const droneButton=$('drone-survey');const droneSetting=state.skipperMission?.kind==='droneSet',droneNeeded=droneRequirement(state);droneButton.disabled=!droneSetting&&(!stats.droneSurvey||!!droneFlight||!droneFree()||!!droneNeeded);droneButton.title=translateText(droneSetting?'Click to cancel automatic drone pot setting.':droneNeeded||'Launch a short drone survey and chart promising crab spots.');const droneHint=$('drone-requirement');droneHint.hidden=!stats.droneSurvey||!droneNeeded||droneSetting||!!droneFlight;droneHint.textContent=translateText(droneNeeded);droneButton.dataset.flying=String(!!droneFlight);droneButton.textContent=droneSetting?'CANCEL DRONE POT SETTING':droneFlight?'DRONE SURVEY · IN FLIGHT':stats.droneSurvey&&(!droneNeeded||droneFlight)?'DRONE SURVEY':'DRONE SURVEY · LOCKED';
 const collecting=state.skipperMission?.kind==='pickupAll',pickupUnlocked=!!state.career.skills.pickupAll;$('pickup-all').disabled=!pickupUnlocked||(!collecting&&(!!state.deckJob||!state.pots.length));$('pickup-all').textContent=collecting?'CANCEL PICKUP ALL':pickupUnlocked?'PICKUP ALL POTS':'PICKUP ALL POTS · LOCKED';$('pickup-all').setAttribute('aria-pressed',String(collecting));
 for(const [id,rank,label]of [['skipper-home',1,'RETURN & DOCK'],['skipper-pot',2,'OLDEST POT']]){const locked=(state.career.skills.steer||0)<rank;$(id).disabled=locked||!!state.deckJob||(id==='skipper-pot'&&!state.pots.length);$(id).textContent=label+(locked?' · LOCKED':'');}
 const atFuelStation=atDieselStation(state);
 $('st-paul-refuel').hidden=!atFuelStation;
 $('st-paul-refuel').disabled=Math.abs(state.speed)>1||!!state.deckJob||state.fuel>=stats.tank||state.money<=0;
 $('rescue').textContent='REQUEST TOW · '+money(towFee(state));
 const ready=nearPort(state)&&Math.abs(state.speed)<1&&!state.deckJob&&!state.incident;$('shop-toggle').hidden=!nearPort(state);$('shop-toggle').disabled=!shopReady(state);const notices=fleetNoticeCount(state);$('fleet-alert').textContent=notices?'✉ '+notices:'';$('fleet-alert').hidden=!notices;$('fleet-toggle').classList.toggle('has-fleet-message',notices>0);$('fleet-toggle').title=notices?(getLanguage()==='sv'?'Flottmeddelanden som kräver uppmärksamhet':'Fleet messages need attention'):'';$('pot-spacing').value=String(stats.spacing);$('pot-spacing').disabled=!state.career.skills.autoDeploy||state.career.fishing!=='crab';$('fishery').value=state.career.fishing;$('fishery').querySelector('[value=salmon]').disabled=!stats.salmon;$('fishery').disabled=!!state.deckJob;for(const [id,key,label] of [['auto-deploy','autoDeploy','AUTO SET'],['auto-haul','autoHaul','AUTO HAUL'],['intelligent-auto-set','intelligentAutoSet','INTELLIGENT AUTO SET']]){const b=$(id),unlocked=!!state.career.skills[key];b.disabled=!unlocked||state.career.fishing!=='crab';b.textContent=`${label} · ${!unlocked?'LOCKED':state.career[key]?((key==='autoHaul'&&state.autoHaulSlowing||key!=='autoHaul'&&state.autoSetSlowing)?(state.career.skills.maxSpeedHauling?'12.5 KN LIMIT':state.career.skills.highSpeedHaul?'6.5 KN LIMIT':'4.5 KN LIMIT'):'ON'):'OFF'}`;b.setAttribute('aria-pressed',String(state.career[key]));}$('dock-status').textContent=ready?`You are in the service area. Balance ${money(state.money)}.`:`${Math.round(distance(state,nearestQuay(state)))} meters to harbor. Slow below 2 knots for service.`;
 for(const b of document.querySelectorAll('[data-service]')){b.disabled=!ready;b.querySelector('small').textContent=b.dataset.service==='fuel'?`${(energyPrice(stats)*stats.serviceCost).toFixed(2)} kr / ${stats.powertrain==='electric'?'kWh':'liter'} · fill to ${stats.tank} ${stats.powertrain==='electric'?'kWh':'L'}`:`${Math.round(160*stats.serviceCost)} kr / percentage point`;}$('sell').disabled=!ready;const mayUndock=canUndock(state);$('undock').disabled=!mayUndock;$('undock-quick').hidden=false;$('undock-quick').disabled=!mayUndock;$('undock-quick').title=mayUndock?'Cast off and move clear of the quay.':state.deckJob?'Finish the deck operation first.':Math.abs(state.speed)>=1?'Slow below 2 knots to undock.':'Available alongside the service quay.';
 const upgrades=ownedUpgrades(state),signature=JSON.stringify(upgrades)+getLanguage();if(signature!==ownedSignature){ownedSignature=signature;for(const [id,items] of [['owned-skills',upgrades.skills],['owned-parts',[...upgrades.parts,...upgrades.legacy]]]){const host=$(id);host.replaceChildren();if(!items.length){const p=document.createElement('p');p.textContent='None purchased yet';host.append(p);}for(const item of items){const p=document.createElement('p'),name=document.createElement('span'),rank=document.createElement('b');name.textContent=item.name;rank.textContent=item.rank+' / '+(item.maxRank??(upgrades.legacy.includes(item)?3:5));p.title=item.description||'';p.append(name,rank);host.append(p);}}}
 $('log').replaceChildren();for(const entry of radioFeed.update(state.log,performance.now())){const p=document.createElement('p'),time=document.createElement('time');time.textContent=hh(entry.hour)+' ';p.style.opacity=entry.opacity;p.append(time,entry.text);$('log').append(p);}
 if(state.message!==lastMessage){$('toast').textContent=state.message;lastMessage=state.message;toastAge=0;}$('toast').style.opacity=toastAge<9?'1':'0';
 if(!saveAvailable){$('renderer').textContent='SAVING OFF';$('renderer').title='The browser does not allow local saving.';}
 drawChart();document.documentElement.lang=getLanguage();localizeTree(document.body);
}
function drawDroneChart(point,scale){
 const report=state.droneSurvey;
 map.save();map.strokeStyle=droneColor;map.fillStyle=droneColor;map.lineWidth=1;
 if(droneFlight){
  const center=point(droneFlight.origin.x,droneFlight.origin.y),drone=dronePose(droneFlight,droneDock()),p=point(drone.x,drone.y);
  map.setLineDash([3,4]);map.beginPath();map.arc(center.x,center.y,DRONE_RADIUS*scale,0,Math.PI*2);map.stroke();map.setLineDash([]);
  if(drone.phase==='scan'){map.globalAlpha=.55;map.beginPath();map.arc(p.x,p.y,3+droneFlight.elapsed*18%11,0,Math.PI*2);map.stroke();map.globalAlpha=1;}
  map.fillRect(p.x-2,p.y-2,4,4);
 }
 if(scale>=.02)for(const [i,p] of (report?.points||[]).entries()){
  const m=point(p.x,p.y),r=5;
  map.beginPath();map.moveTo(m.x,m.y-r);map.lineTo(m.x+r,m.y);map.lineTo(m.x,m.y+r);map.lineTo(m.x-r,m.y);map.closePath();
  map.fillStyle='#11272e';map.fill();map.stroke();map.fillStyle=droneColor;map.font='8px monospace';map.fillText('DS'+(i+1),m.x+7,m.y-4);
 }
 map.restore();
}
function drawChart(){
 const reports=$('ground-reports');
 if(reports.closest('details').open){
  const language=getLanguage(),stats=vesselStats(state),weather=conditions(state);
  for(const ground of groundsAt(watchHour())){
   let button=reports.querySelector(`[data-ground-id="${ground.id}"]`);
   if(!button){
    button=document.createElement('button');
    button.type='button';button.dataset.groundId=ground.id;
    button.addEventListener('click',()=>{
     const current=groundsAt(watchHour()).find(g=>String(g.id)===button.dataset.groundId);
     if(!current)return;
     chartView.follow=false;chartView.x=current.x;chartView.y=current.y;
     chartView.scale=Math.min(chart.width/(current.rx*3),chart.height/(current.ry*3));
     drawChart();chart.scrollIntoView({block:'nearest'});
    });
    reports.append(button);
   }
   const salmon=salmonMarket(ground);
   const crab=groundReport(ground,'crab',Math.max(1,state.career.skills.crab||0),watchHour());
   const fish=groundReport(ground,'salmon',Math.max(1,state.career.skills.salmon||0),watchHour());
   const fuel=fuelToGround(state,ground,stats,weather);
   const units=stats.powertrain==='electric'?'kWh':'L';
   const estimate=fuel===null?'':` · ≈${Math.ceil(fuel).toLocaleString(language==='sv'?'sv-SE':'en-US')} ${units} ${language==='sv'?'fågelvägen':'direct'}`;
   const text=`${ground.name} · ${crabSpeciesName(ground.species,language)} ${crab.low}–${crab.high}% · ${money(crabPriceAt({...ground,crabSpecies:ground.species,groundId:ground.id},state.hour))}/kg\n${salmon[language]} ${fish.low}–${fish.high}% · ${money(salmon.price)}/kg${estimate}`;
   if(button.textContent!==text)button.textContent=text;
  }
 }
 $('chart-focus-pots').disabled=!state.pots.length;updateChartFollow(chartView,state);$('chart-center').setAttribute('aria-pressed',String(chartView.follow));
 const cw=chart.width,ch=chart.height,scale=chartView.scale,point=(x,y)=>chartPoint(chartView,x,y,cw,ch);map.fillStyle='#11272e';map.fillRect(0,0,cw,ch);map.strokeStyle='#28424a';map.lineWidth=.5;const spacing=scale>.25?100:scale>.02?1000:scale>.001?10000:scale>.0002?100000:500000,lo=chartWorld(chartView,0,0,cw,ch),hi=chartWorld(chartView,cw,ch,cw,ch);
 for(let x=Math.floor(lo.x/spacing)*spacing;x<hi.x;x+=spacing){const p=point(x,0);map.beginPath();map.moveTo(p.x,0);map.lineTo(p.x,ch);map.stroke();}for(let y=Math.floor(lo.y/spacing)*spacing;y<hi.y;y+=spacing){const p=point(0,y);map.beginPath();map.moveTo(0,p.y);map.lineTo(cw,p.y);map.stroke();}
 map.fillStyle='#34433a';map.strokeStyle='#729082';map.lineWidth=.7;for(const land of WORLD_LAND){if(land.left>hi.x||land.right<lo.x||land.top>hi.y||land.bottom<lo.y)continue;map.beginPath();for(const ring of [land.outer,...land.holes]){ring.forEach((v,i)=>{const p=point(v.x,v.y);i?map.lineTo(p.x,p.y):map.moveTo(p.x,p.y);});map.closePath();}map.fill('evenodd');map.stroke();}
 const nw=point(WORLD_BOUNDS.left,WORLD_BOUNDS.top),se=point(WORLD_BOUNDS.right,WORLD_BOUNDS.bottom);map.strokeStyle='#8ba6a066';map.setLineDash([5,5]);map.strokeRect(nw.x,nw.y,se.x-nw.x,se.y-nw.y);map.setLineDash([]);
 for(const place of PLACES){if(place.name==='Dutch Harbor')continue;if(scale<.0004&&['Unalaska','Amaknak Island','Unalaska Island','Akutan','Akutan Island','Unimak Island'].includes(place.name))continue;if(scale>.001&&place.name!=='Dutch Harbor'&&Math.hypot(place.x-state.x,place.y-state.y)>20000)continue;const p=point(place.x,place.y);if(p.x<0||p.x>cw||p.y<0||p.y>ch)continue;map.fillStyle='#afc1b3';map.font='8px monospace';map.fillText(place.name,p.x+4,p.y-4);}
 const groundLabels=[];map.save();clipChartWater(map,point,cw,ch);for(const g of groundsAt(watchHour())){const p=point(g.x,g.y);map.strokeStyle=CRAB_SPECIES[g.species].color+'99';map.setLineDash([3,4]);map.beginPath();map.ellipse(p.x,p.y,g.rx*scale,g.ry*scale,g.angle,0,Math.PI*2);map.fillStyle=CRAB_SPECIES[g.species].color+'18';map.fill();map.stroke();map.setLineDash([]);if(g.rx*scale<8){map.fillStyle=CRAB_SPECIES[g.species].color;map.beginPath();map.arc(p.x,p.y,2,0,Math.PI*2);map.fill();}const core=crabHotspot(g,state.career.skills.crab,state.hour);if(core){const cp=point(core.x,core.y);map.beginPath();map.ellipse(cp.x,cp.y,core.rx*scale,core.ry*scale,core.angle,0,Math.PI*2);map.fillStyle=`rgba(16,65,49,${.3+core.potential*.35})`;map.fill();map.strokeStyle='#92c5a988';map.stroke();}drawGroundMotion(map,p,groundMotion(g,state.career.skills.crab,state.hour));map.fillStyle='#80a99b';map.font=($('chart-dialog').open?'11px':'9px')+' monospace';const label={x:p.x-35,y:p.y-5,w:Math.max(110,g.name.length*7),h:scale>.003?39:28};if(g.rx*scale>=18&&!groundLabels.some(r=>label.x<r.x+r.w&&label.x+label.w>r.x&&label.y<r.y+r.h&&label.y+label.h>r.y)){groundLabels.push(label);map.fillText(g.name,p.x-25,p.y+5);if(scale>.003)map.fillText(crabSpeciesName(g.species,getLanguage()),p.x-35,p.y+27);const reports=groundForecast(g);if(reports)map.fillText(reports,p.x-35,p.y+16);}}map.restore();
 const fuelDock=point(ST_PAUL_DIESEL.x,ST_PAUL_DIESEL.y);
 map.fillStyle='#efb763';map.fillRect(fuelDock.x-3,fuelDock.y-3,6,6);
 map.font='8px monospace';map.fillText(translateText('ST. PAUL DIESEL'),fuelDock.x+7,fuelDock.y+3);
 for(const quay of PORT_QUAYS){const port=point(quay.x,quay.y);map.fillStyle='#d8d9c8';map.fillRect(port.x-3,port.y-3,6,6);map.font='7px monospace';map.fillText((quay.name||'Dutch Harbor').toUpperCase(),port.x-28,port.y+13);}
 for(const pot of state.pots){const p=point(pot.x,pot.y),ready=distance(state,pot)<POT_RANGE&&workingSide(state,pot);map.strokeStyle=ready?'#9dd7ae':'#e4ac6477';map.beginPath();map.arc(p.x,p.y,POT_RANGE*scale,0,Math.PI*2);map.stroke();map.fillStyle=ready?'#9dd7ae':'#e4ac64';map.beginPath();map.arc(p.x,p.y,2.5,0,Math.PI*2);map.fill();if(scale>.12){map.font='8px monospace';map.fillText(String(pot.id),p.x+5,p.y-5);}}
 for(const fleet of [...state.career.fleet,...(state.remotePlayers||[])]){map.fillStyle=fleet.color;map.strokeStyle=fleet.color;for(const pot of fleet.pots){const p=point(pot.x,pot.y);map.beginPath();map.arc(p.x,p.y,2,0,Math.PI*2);map.fill();}const p=point(fleet.x,fleet.y);map.save();map.translate(p.x,p.y);map.rotate(fleet.heading);map.beginPath();map.moveTo(6,0);map.lineTo(-4,-3);map.lineTo(-4,3);map.closePath();map.fill();map.restore();if(scale>.08){map.font='8px monospace';map.fillText(fleet.name,p.x+7,p.y-5);}}
 for(const net of state.nets){const p=point(net.x,net.y);map.strokeStyle='#b3dec7';map.lineWidth=3;map.beginPath();map.moveTo(p.x-8,p.y);map.lineTo(p.x+8,p.y);map.stroke();map.lineWidth=1;map.font='8px monospace';map.fillStyle='#b3dec7';map.fillText('SALMON NET',p.x+10,p.y);}
 drawDroneChart(point,scale);
 const boat=point(state.x,state.y);if(state.autopilot){const nav=state.autopilot;map.strokeStyle='#e4ac64';map.setLineDash([4,4]);map.beginPath();map.moveTo(boat.x,boat.y);for(const node of (nav.route||[nav]).slice(nav.index||0)){const p=point(node.x,node.y);map.lineTo(p.x,p.y);}map.stroke();map.setLineDash([]);for(const [i,node] of (nav.waypoints||[nav]).entries()){const p=point(node.x,node.y);map.fillStyle='#11272e';map.beginPath();map.arc(p.x,p.y,8,0,Math.PI*2);map.fill();map.stroke();map.fillStyle='#f0c58a';map.font='9px monospace';map.textAlign='center';map.fillText(String(i+1),p.x,p.y+3);map.textAlign='start';}}

 map.save();map.translate(boat.x,boat.y);map.rotate(state.heading);map.fillStyle='#f0be7c';map.beginPath();map.moveTo(7,0);map.lineTo(-5,-4);map.lineTo(-3,0);map.lineTo(-5,4);map.closePath();map.fill();map.restore();map.fillStyle='#9db3b3';map.font='9px monospace';map.fillText('N ↑',cw-25,17);chart.setAttribute('aria-label',`Chart: ${vesselStats(state).name}; ${state.pots.length} own pots; ${state.career.fleet.map(b=>`${b.name} ${Math.round(b.x)}, ${Math.round(b.y)}, ${b.pots.length} fleet pots`).join('; ')||'no hired vessels'}`);
 $('chart-status').textContent=state.tow?'SCROLL: ZOOM · DRAG: PAN':planningWaypoint?'PLANNING ROUTE…':state.autopilot?`AUTOPILOT · ${state.autopilot.waypoints?.length||1} WAYPOINTS · ${Math.round(distance(state,state.autopilot))} M TO DESTINATION`:`SCROLL: ZOOM · DRAG: PAN · RIGHT CLICK: AP`;$('ap-cancel').disabled=!!state.tow||(!state.autopilot&&!planningWaypoint&&state.skipperMission?.kind!=='droneSet');$('time-to-waypoint').disabled=state.skipperMission?.kind==='droneSet'||!!droneFlight||!!state.tow||(!state.autopilot&&!waypointTravel);$('time-to-waypoint').textContent=waypointTravel?'CANCEL TRAVEL':'SKIP TO WAYPOINT';map.fillStyle='#9db3b3';map.font='7px monospace';const bar=Math.min(70,cw/3),meters=Math.round(bar/scale);map.fillRect(10,ch-12,bar,1);map.fillText(meters>=1852?`${(meters/1852).toFixed(1)} NM`:`${meters} M`,10,ch-17);
}
function drawHarbor(){ctx.fillStyle='#34433a';ctx.strokeStyle='#729082';for(const land of WORLD_LAND){ctx.beginPath();for(const ring of [land.outer,...land.holes]){ring.forEach((v,i)=>{const p=pos(v.x,v.y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();}ctx.fill('evenodd');ctx.stroke();}}
function drawGrounds(){ctx.save();clipChartWater(ctx,pos,width,height);for(const g of groundsAt(watchHour())){const p=pos(g.x,g.y);if(p.x< -200||p.x>width+200||p.y< -200||p.y>height+200)continue;ctx.save();ctx.strokeStyle='#8db8a626';ctx.setLineDash([3,15]);ctx.beginPath();ctx.ellipse(p.x,p.y,g.rx*view.scale,g.ry*view.scale,g.angle,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#b8d0bd77';ctx.textAlign='center';ctx.font='9px monospace';ctx.fillText(g.name,p.x,p.y);drawGroundMotion(ctx,p,groundMotion(g,state.career.skills.crab,state.hour));ctx.restore();}ctx.restore();}
function drawPots(t){for(const pot of state.pots){const p=pos(pot.x,pot.y);ctx.save();ctx.translate(p.x,p.y+Math.sin(t*2+pot.id)*2);ctx.save();ctx.strokeStyle=distance(state,pot)<POT_RANGE?'#a8dcb7aa':'#e4ac6455';ctx.setLineDash([5,6]);ctx.beginPath();ctx.arc(0,0,POT_RANGE*view.scale,0,Math.PI*2);ctx.stroke();ctx.restore();ctx.strokeStyle='#cdbd9b66';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-12,20);ctx.stroke();ctx.shadowBlur=8;ctx.shadowColor='#edb56d66';ctx.fillStyle='#e5a352';ctx.beginPath();ctx.ellipse(0,0,5,8,Math.sin(t)*.1,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f2e4bf';ctx.fillRect(-3,-2,6,3);ctx.fillStyle='#d3d9c8';ctx.font='8px monospace';ctx.fillText(`${String(pot.id).padStart(2,'0')} · ${(state.hour-pot.setAt).toFixed(1)} h`,10,-5);ctx.restore();}}
function drawWakeFallback(){for(const p of wake.points){const screen=pos(p.x,p.z),age=wake.time-p.born;ctx.save();ctx.translate(screen.x,screen.y);ctx.rotate(p.heading);ctx.strokeStyle=`rgba(190,215,217,${Math.max(0,1-age/42)*.2})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,10+age*.4,4+age*.6,0,0,Math.PI*2);ctx.stroke();ctx.restore();}}
function boatPath(){ctx.beginPath();ctx.moveTo(54,0);ctx.bezierCurveTo(43,-10,31,-15,13,-16);ctx.lineTo(-49,-16);ctx.lineTo(-55,-11);ctx.lineTo(-55,11);ctx.lineTo(-49,16);ctx.lineTo(13,16);ctx.bezierCurveTo(31,15,43,10,54,0);ctx.closePath();}
function drawFleetFallback(){for(const v of visibleFleet(state)){const b=v.boat;if(v.visible){const p=pos(b.x,b.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(b.heading);ctx.fillStyle=b.color||'#70c9df';ctx.strokeStyle='#d8e3dc';ctx.beginPath();ctx.moveTo(17*view.scale,0);ctx.lineTo(8*view.scale,4*view.scale);ctx.lineTo(-12*view.scale,4*view.scale);ctx.lineTo(-12*view.scale,-4*view.scale);ctx.lineTo(8*view.scale,-4*view.scale);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}for(const pot of v.pots){const p=pos(pot.x,pot.y);ctx.fillStyle=b.color||'#70c9df';ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();}}}
function drawBoat(w,t){
 const p=pos(state.x,state.y),scale=width<760?1:1.2;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(state.heading);const bob=Math.sin(t*1.4)*w.waves*.014;ctx.scale(scale,scale*(1+bob));

 ctx.save();ctx.translate(5,7);ctx.filter='blur(5px)';ctx.fillStyle='#03141baa';boatPath();ctx.fill();ctx.restore();
 ctx.shadowBlur=6;ctx.shadowColor='#030b0e';ctx.fillStyle='#142028';boatPath();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#8c9590';ctx.lineWidth=1;ctx.stroke();ctx.save();ctx.scale(.92,.83);boatPath();ctx.fillStyle='#51594b';ctx.fill();ctx.restore();
 // Working deck: timber planks, stacks of crab pots and hydraulic hauling gear.
 ctx.strokeStyle='#273b36';ctx.lineWidth=.8;for(let i=-10;i<=10;i+=4){ctx.beginPath();ctx.moveTo(-48,i);ctx.lineTo(1,i);ctx.stroke();}
 const count=state.deck,cols=Math.max(4,Math.ceil(Math.sqrt(count*2))),rows=Math.max(3,Math.ceil(count/cols)),cw=45/cols,ch=22/rows;for(let i=0;i<count;i++){const x=-46+(i%cols)*cw,y=-11+Math.floor(i/cols)*ch;ctx.fillStyle='#635a36';ctx.fillRect(x,y,cw*.8,ch*.75);ctx.strokeStyle='#a89257';ctx.lineWidth=.7;ctx.strokeRect(x,y,cw*.8,ch*.75);ctx.beginPath();ctx.moveTo(x+cw*.4,y);ctx.lineTo(x+cw*.4,y+ch*.75);ctx.moveTo(x,y+ch*.375);ctx.lineTo(x+cw*.8,y+ch*.375);ctx.stroke();}
 ctx.fillStyle='#c6c7b7';ctx.fillRect(4,-12,25,24);ctx.fillStyle='#e0ddd0';ctx.fillRect(8,-11,24,19);ctx.fillStyle='#243f4c';ctx.fillRect(27,-9,5,16);ctx.fillRect(11,-12,12,3);ctx.fillRect(11,9,12,3);ctx.fillStyle='#a4aca2';ctx.fillRect(9,-6,13,10);ctx.strokeStyle='#6b786f';ctx.lineWidth=1;ctx.strokeRect(9,-6,13,10);
 ctx.strokeStyle='#dda958';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-7,10);ctx.lineTo(-7,24);ctx.lineTo(4,29);ctx.stroke();ctx.strokeStyle='#292e29';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(4,29);ctx.lineTo(4,36);ctx.stroke();ctx.fillStyle='#c58b4e';ctx.fillRect(-5,-14,6,9);
 ctx.strokeStyle='#b1b7a4';ctx.lineWidth=.7;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(-49,side*16);ctx.lineTo(16,side*16);ctx.lineTo(46,side*6);ctx.stroke();for(let x=-46;x<20;x+=12){ctx.beginPath();ctx.moveTo(x,side*13);ctx.lineTo(x,side*17);ctx.stroke();}}
 if(state.ice>.01){
  ctx.save();boatPath();ctx.clip();
  for(let i=0;i<118;i++){
   const n=i*13.837,x=Math.sin(n*17)*54,y=Math.cos(n*9)*16,edge=Math.abs(y)/16;
   if((i*97%121)/121>state.ice*(.7+edge*.8))continue;
   const r=.6+(i%11)*.32;ctx.fillStyle=i%3?'#dbe9edc9':'#a2c2c9d5';ctx.beginPath();ctx.ellipse(x,y,r*1.85,r,Math.sin(n),0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 ctx.strokeStyle='#d4d6c5';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(23,0);ctx.lineTo(36,-21);ctx.stroke();ctx.strokeStyle='#657973';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(36,-21);ctx.stroke();ctx.fillStyle='#dfe1cd';ctx.fillRect(29,-23,16,2);ctx.fillStyle='#ad6243';ctx.fillRect(17,-3,4,6);
 for(const [y,color] of [[-13,'#e35e4e'],[13,'#8abb99']]){ctx.shadowBlur=10;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(26,y,1.5,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;
 if(state.lights!==false){const profile=LIGHTING_PROFILES[vesselStats(state).lightRank],radius=36*profile.range;ctx.globalCompositeOperation='screen';for(const y of [-10,10]){const light=ctx.createRadialGradient(-2,y,0,-2,y,radius);light.addColorStop(0,`rgba(239,201,123,${.2*profile.intensity})`);light.addColorStop(1,'#efc97b00');ctx.fillStyle=light;ctx.fillRect(-2-radius,y-radius,radius*2,radius*2);}}ctx.restore();
}
function atmosphere(w,t){
 drawPrecipitation(ctx,w,t,width,height);

 if(w.fog>.03&&!scene3D){const g=ctx.createRadialGradient(width*.5,height*.53,25,width*.5,height*.53,width*.6);g.addColorStop(0,`rgba(151,173,176,${w.fog*.03})`);g.addColorStop(1,`rgba(151,173,176,${w.fog*.66})`);ctx.fillStyle=g;ctx.fillRect(0,0,width,height);}
 const vignette=ctx.createRadialGradient(width*.5,height*.5,width*.1,width*.5,height*.5,width*.75);vignette.addColorStop(0,'#03151c00');vignette.addColorStop(1,'#03151c99');ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
 if(state.paused&&started&&!$('harbor').open&&!$('career').open){ctx.fillStyle='#0b1e2733';ctx.fillRect(0,0,width,height);ctx.fillStyle='#e7d5b5';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText('PAUSED · PRESS ESC TO RESUME',width*.5,height*.35);ctx.textAlign='left';}
}
function drawDroneOverlay(pose){
 const fallback=(x,y,h=0)=>{const p=pos(x,y);return {...p,y:p.y-h*view.scale*.6,visible:true};};
 const projection=scene3D?(x,y,h)=>scene3D.project(x,y,h):fallback,{x,y,height:h,phase}=pose,p=projection(x,y,h);
 if(!p.visible||p.x<0||p.x>width||p.y<0||p.y>height)return;
 ctx.save();ctx.strokeStyle=droneColor;ctx.fillStyle=droneColor;ctx.lineWidth=1;
 if(phase==='scan'){
  const surface=projection(x,y,0);
  ctx.globalAlpha=.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(surface.x,surface.y);ctx.stroke();ctx.setLineDash([]);
  const r=8+droneFlight.elapsed*30%19;ctx.beginPath();ctx.ellipse(surface.x,surface.y,r,r*.42,0,0,2*Math.PI);ctx.stroke();ctx.globalAlpha=1;
 }
 if(!scene3D){
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(pose.heading);ctx.fillStyle='#183039';ctx.fillRect(-4,-3,8,6);ctx.beginPath();ctx.moveTo(-7,-6);ctx.lineTo(7,6);ctx.moveTo(-7,6);ctx.lineTo(7,-6);ctx.stroke();
  for(const dx of [-7,7])for(const dy of [-6,6]){ctx.beginPath();ctx.arc(dx,dy,3,0,2*Math.PI);ctx.stroke();}ctx.restore();
 }else{ctx.beginPath();ctx.arc(p.x,p.y,8,0,2*Math.PI);ctx.stroke();}
 ctx.font='10px monospace';ctx.strokeStyle='#122b30';ctx.lineWidth=3;const label=translateText(phase==='scan'?'DRONE · SCANNING':phase==='return'?'DRONE · RETURNING':'DRONE · LAUNCHING');ctx.strokeText(label,p.x+12,p.y-8);ctx.fillText(label,p.x+12,p.y-8);ctx.restore();
}
function drawLightGlows(){if(state.lights===false)return;ctx.save();ctx.globalCompositeOperation='screen';for(const p of scene3D.lightPositions()){if(!p.visible)continue;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.radius);g.addColorStop(0,p.warm?'#ffe3a0cc':'#d9edffcc');g.addColorStop(.15,p.warm?'#ffbf5a55':'#b9deff55');g.addColorStop(1,'#aaccff00');ctx.fillStyle=g;ctx.fillRect(p.x-p.radius,p.y-p.radius,p.radius*2,p.radius*2);}ctx.restore();}
function drawBuoyLabels(){const action=potAction(state);for(const p of state.pots){const inRange=distance(state,p)<POT_RANGE&&workingSide(state,p),selected=p===action.pot;ctx.save();ctx.strokeStyle=inRange?'#a8dcb7aa':selected?'#e4ac6488':'#e4ac6433';ctx.lineWidth=selected?1.5:1;ctx.setLineDash(inRange?[]:[5,6]);ctx.beginPath();let first=true;for(let i=0;i<=64;i++){const a=i*Math.PI/32,q=scene3D.project(p.x+Math.cos(a)*POT_RANGE,p.y+Math.sin(a)*POT_RANGE,.15);if(!q.visible)continue;if(first){ctx.moveTo(q.x,q.y);first=false;}else ctx.lineTo(q.x,q.y);}ctx.stroke();ctx.restore();}
for(const p of state.pots){if(state.deckJob?.kind==='haul'&&state.deckJob.potId===p.id&&jobProgress(state)>.12)continue;const screen=scene3D.project(p.x,p.y,2.7);if(!screen.visible)continue;ctx.font='9px monospace';ctx.fillStyle='#ebcf99';ctx.fillText(`POT ${String(p.id).padStart(2,'0')} · ${Math.round(distance(state,p))} M · ${(state.hour-p.setAt).toFixed(1)} H · ${potSoakStage(state.hour-p.setAt)}`,screen.x+9,screen.y-6);}}
// Let the normal harbor pilot finish casting off before jumping to the waypoint.
const canStepVoyage=()=>!waypointTravel||state.deckJob?.kind==='undock';
let backgroundLast=performance.now();
function backgroundTick(){const now=performance.now(),dt=Math.max(0,(now-backgroundLast)/1000);backgroundLast=now;if(document.hidden&&started&&!state.paused&&canStepVoyage()){let remaining=Math.min(dt,30);while(remaining>0&&!state.paused&&canStepVoyage()){const slice=Math.min(.1,remaining);clock+=advanceVoyage(state,wake,slice,timeSpeed);remaining-=slice;}saveTimer+=dt;if(saveTimer>10){save();saveTimer=0;}}}
setInterval(backgroundTick,1000);
document.addEventListener('visibilitychange',()=>{backgroundTick();last=performance.now();backgroundLast=last;});
const nearbyGreetings=new Map();
const worldClock=createWorldClock();
const watchHour=()=>state.worldHour??state.hour;
let leaderboardSort='earned';
$('leaderboard-sort').onclick=()=>{
 leaderboardSort=leaderboardSort==='earned'?'landed':'earned';
 $('leaderboard-sort').textContent=translateText(leaderboardSort==='earned'?'MONEY':'WEIGHT');
};
function frame(now){if(started&&state.playerName){ensureWorldIdentity();multiplayer.tick(state,now);state.multiplayerOnline=multiplayer.status==='online';const host=multiplayer.status==='online'&&state.worldId!==state.ownWorldId?multiplayer.peers.find(p=>p.isHost):null;
 state.worldHour=worldClock.update(state.worldId,host,now);const remoteVessels=multiplayer.peers.flatMap(p=>[p,...(p.fleet||[]).map(b=>({...b,id:p.id+'-fleet-'+b.id}))]);state.remotePlayers=peerSmoother.update(remoteVessels,now).map(p=>({...p,id:'remote-'+p.id,parts:{},engine:0,hold:0,gear:0,color:'#d496ee'}));const close=state.remotePlayers.find(p=>!p.id.includes('-fleet-')&&Math.hypot(p.x-state.x,p.y-state.y)<160);
if(!state.paused&&close&&!nearbyGreetings.has(close.id)){nearbyGreetings.set(close.id,now);if(soundOn)audio?.greet();}
for(const id of nearbyGreetings.keys())if(!state.remotePlayers.some(p=>p.id===id&&Math.hypot(p.x-state.x,p.y-state.y)<190))nearbyGreetings.delete(id);
state.hoseTarget=close&&!state.paused&&!state.deckJob&&!state.incident&&now-(nearbyGreetings.get(close.id)??-Infinity)<3200?close:null;$('world-id').textContent=state.worldId;const rows=[{name:state.playerName,landed:state.totalLanded||state.landed||0,earned:state.totalEarned||0},...multiplayer.peers];const board=rows.sort((a,b)=>(b[leaderboardSort]||0)-(a[leaderboardSort]||0)).map(p=>`${p.name} · ${Math.round(p.landed)} kg · ${translateText(money(p.earned))}`).join('\n');if($('leaderboard-list').textContent!==board)$('leaderboard-list').textContent=board;$('world-status').textContent=multiplayer.status;}if(waypointTravel){const before=waypointTravel.elapsed,result=advanceWaypointTravel(state,waypointTravel);clock+=result.elapsed-before;if(result.done){waypointTravel=null;state.message=result.reason==='arrived'?'Next waypoint reached.':result.reason==='fuel'?'Not enough fuel to skip to the waypoint.':'Cannot skip: check the vessel or route.';save();updateUI();}}backgroundLast=now;weatherPoll+=1;if(weatherPoll===1||weatherPoll%60===0)void liveWeather.update(state);const wallDt=Math.max(0,(now-last)/1000),dt=Math.min(wallDt,.1);last=now;let elapsed=0;fps+=(1/Math.max(wallDt,.001)-fps)*.03;
 if(started&&!state.paused&&canStepVoyage()){if(!waypointTravel){if(!state.tow&&(keys.has('KeyW')||keys.has('ArrowUp')))state.desiredKnots=clamp((state.desiredKnots||0)+dt*2,-3,Math.ceil(vesselStats(state).top*1.94384));if(keys.has('KeyS')||keys.has('ArrowDown'))state.desiredKnots=clamp((state.desiredKnots||0)-dt*2.5,-3,Math.ceil(vesselStats(state).top*1.94384));const helm=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);if(helm)setRudder(state,state.rudder*35+helm*dt*12);}elapsed=advanceVoyage(state,wake,dt,timeSpeed);}
 clock+=started?elapsed:dt;
 advanceDrone(Math.min(wallDt,.25));const displayDrone=droneFlight?dronePose(droneFlight,droneDock()):null;
 const span=displayDrone?Math.hypot(displayDrone.x-state.x,displayDrone.y-state.y):0,baseScale=width<760?1.2:1.65;
 const follow=droneCameraFollow(span),targetX=state.x+(!scene3D&&displayDrone?(displayDrone.x-state.x)*follow:0),targetY=state.y+(!scene3D&&displayDrone?(displayDrone.y-state.y)*follow:0);
 if(!scene3D&&displayDrone){view.x=targetX;view.y=targetY;}else{view.x+=(targetX-view.x)*(1-Math.exp(-dt*2));view.y+=(targetY-view.y)*(1-Math.exp(-dt*2));}
 view.scale=baseScale;visualWeather=transitionWeather(visualWeather,conditions(state),dt,clock,state.x,state.y);const w=visualWeather;const renderKey=[scene3D?.revision||0,clock,width,height,cameraZoom,cameraOverhead,state.paused,state.x,state.y,state.heading,state.deck,state.career.boat,state.ice||0,state.lights,state.career.parts.lights||0,...[w.waves,w.fog,w.rain,w.snow,w.daylight||0,w.windDirection||0,w.waveDirection||0].map(n=>n.toFixed(2))].join('/');if(!state.paused||renderKey!==lastRenderKey){lastRenderKey=renderKey;ctx.clearRect(0,0,width,height);if(scene3D){scene3D.draw(state,w,clock,width,height,dpr,wake,droneFlight);for(const p of state.remotePlayers||[]){const q=scene3D.project(p.x,p.y,12);if(q.visible&&Math.hypot(p.x-state.x,p.y-state.y)<900){ctx.fillStyle="#f3dba9";ctx.font="12px monospace";ctx.fillText(p.name,q.x,q.y);}}drawBuoyLabels();drawLightGlows();}else{if(gpu)renderer.draw(state,w,clock,view);else drawFallback(ctx,w,clock,view,width,height);drawWakeFallback();if(state.dieselSlick){const slick=state.dieselSlick,p=pos(slick.x,slick.y);ctx.fillStyle="rgba(5,7,8,"+Math.min(.7,slick.remaining/20)+")";ctx.beginPath();ctx.ellipse(p.x,p.y,24*view.scale,15*view.scale,0,0,Math.PI*2);ctx.fill();}drawGrounds();drawHarbor();drawPots(clock);drawFleetFallback();drawBoat(w,clock);}if(displayDrone)drawDroneOverlay(scene3D?.dronePosition||displayDrone);atmosphere(w,clock);}
 if(audio){const inFilm=$('intro').open;audio.update(state,w,soundOn&&!inFilm);audio.updateMusic(w,musicOn&&started&&!state.paused&&!inFilm&&!document.hidden);}
 uiTimer+=dt;toastAge+=dt;saveTimer+=dt;if(uiTimer>.2){updateUI();uiTimer=0;$('renderer').title=`${sceneError||renderer.label} · ${Math.round(fps)} FPS`;}if(saveTimer>10&&started&&!document.hidden){save();saveTimer=0;}requestAnimationFrame(frame);
}
updateUI();requestAnimationFrame(frame);

function groundForecast(g){return ['crab','salmon'].map(species=>{const report=groundReport(g,species,state.career.skills[species]||0,state.hour);return report?`${species==='crab'?'C':'S'} EST. ${report.low}–${report.high}%`:'';}).filter(Boolean).join(' · ');}

function updateSonar(){const scan=scanSonar(state),panel=$('sonar-panel');panel.hidden=!scan;if(!scan)return;
 const key=[scan.grade,scan.tick,state.x.toFixed(1),state.y.toFixed(1),state.heading.toFixed(2)].join('/');if(key===sonarFrame)return;sonarFrame=key;drawSonar($('sonar-screen'),scan);$('sonar-grade').textContent=`${scan.grade}/5 · ${scan.name}`;$('sonar-depth').textContent=`DEPTH ${scan.depth} M · RANGE ±${scan.radius} M`;$('sonar-readings').textContent=`CRAB ${scan.crab.low}–${scan.crab.high}% · FISH ${scan.salmon.low}–${scan.salmon.high}%`;$('sonar-screen').setAttribute('aria-label',`Bottom sonar: ${scan.depth} meters deep. Crab signal ${scan.crab.low} to ${scan.crab.high} percent. Fish signal ${scan.salmon.low} to ${scan.salmon.high} percent.`);}
