import {resolveFleetContact} from './vessel-collision.mjs?v=0.17.15';
import {potCatchAt} from './pot-soak.mjs?v=0.17.15';
import {fuelBurnRate} from './fuel-economy.mjs?v=0.17.15';
import {prepareRareCatch,awardRareCatch,rareValue,rareById} from './rare-catch.mjs?v=0.17.15';
import {SEA_WEAR_SCALE} from './balance.mjs?v=0.17.15';
import {crabAbundance,salmonAbundance} from './fishing-grounds.mjs?v=0.17.15';
export {groundsAt} from './fishing-grounds.mjs?v=0.17.15';
import {WORLD_VERSION,WORLD_BOUNDS,FISHING_GROUNDS,isLand,inWorld} from './world.mjs?v=0.17.15';
import {planSeaRoute} from './navigation.mjs?v=0.17.15';
import {tickFleet} from './fleet.mjs?v=0.17.15';
import {ensureCareer,vesselStats,settleLanding} from './career.mjs?v=0.17.15';
import {tickIncidents,blocksDeck} from './incidents.mjs?v=0.17.15';
import {BERTH,buildDockRoute,dockRouteDuration,dockingPose,vesselIntersectsHarbor,castOffPosition,buildCastOffRoute} from './harbor.mjs?v=0.17.15';
export {BERTH} from './harbor.mjs?v=0.17.15';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const PORT={x:BERTH.x,y:BERTH.y};
export const DECK_LIMIT_KNOTS=5;
export const grounds=FISHING_GROUNDS;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function createGame(){return ensureCareer({version:1,worldVersion:WORLD_VERSION,x:180,y:100,heading:-Math.PI/2,speed:0,throttle:0,rudder:0,hour:6.4,money:48000,fuel:500,hull:100,cargo:0,capacity:900,deck:8,pots:[],nextPot:1,engine:0,hold:0,gear:0,paused:true,desiredKnots:0,deckJob:null,autopilot:null,lights:true,moored:null,weatherOverride:null,weatherMode:'live',message:'Welcome aboard F/V Nordvind.',log:[],landed:0});}
function crewActivity(s,kind){s.activity={id:(s.activity?.id||0)+1,kind};}
export const POT_RANGE=80;
export function potBearing(s,p){const dx=p.x-s.x,dy=p.y-s.y;return {along:dx*Math.cos(s.heading)+dy*Math.sin(s.heading),starboard:-dx*Math.sin(s.heading)+dy*Math.cos(s.heading)};}
export function workingSide(s,p){const bearing=potBearing(s,p),layout=vesselStats(s).hauler;return layout==='both'?Math.abs(bearing.starboard)>1:layout==='stern'?bearing.along< -1&&Math.abs(bearing.starboard)<Math.max(8,-bearing.along):bearing.starboard>1;}
export function potAction(s,accept=()=>true){const sorted=s.pots.filter(accept).sort((a,b)=>distance(s,a)-distance(s,b)),eligible=sorted.find(p=>distance(s,p)<POT_RANGE&&workingSide(s,p)),nearest=eligible||sorted[0]||null,meters=nearest?distance(s,nearest):Infinity,starboard=nearest?potBearing(s,nearest).starboard:0;return {pot:nearest,meters,inRange:meters<POT_RANGE,canHaul:meters<POT_RANGE&&workingSide(s,nearest),starboard,kind:meters<POT_RANGE?'haul':'deploy',busy:!!s.deckJob};}
export function setRudder(s,degrees){s.rudder=clamp(Number.isFinite(degrees)?degrees:0,-35,35)/35;s.autopilot=null;}
export function setAutopilot(s,x,y,append=false){if(!inWorld(x,y))return false;const departure=s.moored?castOffPosition(s):s.deckJob?.kind==='undock'?{x:s.deckJob.targetX,y:s.deckJob.targetY,heading:s.deckJob.targetHeading}:null;if(s.moored&&!departure)return false;const current=append?s.autopilot:null,from=current?{x:current.x,y:current.y}:departure||s,leg=planSeaRoute(from,{x,y});if(!leg)return false;if(s.moored&&!undock(s))return false;const existing=current?.route|| (current?[{x:current.x,y:current.y}]:[]),waypoints=current?.waypoints||(current?[{x:current.x,y:current.y}]:[]);s.moored=null;s.autopilot={x,y,route:[...existing,...leg],index:current?.index||0,waypoints:[...waypoints,{x,y}]};if(s.desiredKnots<=0)s.desiredKnots=6;notify(s,current?'Waypoint added to autopilot route.':'Autopilot engaged. Steer with A/D or cancel on the chart.');return true;}
export function releasePoint(s){const stern=vesselStats(s).hauler==='stern',x=stern?-13:-3.1,z=stern?0:4.6,scale=vesselStats(s).length/24;return {x:s.x+(x*Math.cos(s.heading)-z*Math.sin(s.heading))*scale,y:s.y+(x*Math.sin(s.heading)+z*Math.cos(s.heading))*scale};}
export function jobProgress(s){return s.deckJob?Math.min(1,s.deckJob.elapsed/s.deckJob.duration):0;}
export function notify(s,text){s.message=text;s.log.unshift({hour:s.hour,text});s.log=s.log.slice(0,8);return text;}
export function weatherAt(hour){
 // ponytail: smooth deterministic fronts, replace with a seeded pressure-field model if a larger world needs regional weather.
 const front=(Math.sin(hour*.53-3.4)+1)/2, gust=Math.sin(hour*1.71)*2.5;
 return {wind:clamp(7+front*34+gust,4,48),waves:.4+front*4.7,fog:clamp((Math.sin(hour*.31+1.1)-.25)*1.25,0,.92),rain:clamp((front-.35)*1.5,0,1),front};
}
export function conditions(s){if(s.weatherMode!=='dynamic'&&!s.weatherOverride&&s.realWeather?.value&&['wind','waves','rain','fog','front'].every(k=>Number.isFinite(s.realWeather.value[k])))return s.realWeather.value;return s.weatherOverride==='calm'?{wind:7,waves:.5,fog:0,rain:0,front:0}:s.weatherOverride==='rough'?{wind:42,waves:5.5,fog:.13,rain:.95,front:1}:s.weatherOverride==='fog'?{wind:12,waves:1.1,fog:.9,rain:.15,front:.2}:weatherAt(s.hour);}
export function depthAt(x,y){return Math.round(55+Math.min(180,Math.hypot(x,y)*.055)+24*Math.sin(x*.002)*Math.cos(y*.003));}
export function abundanceAt(x,y,hour=0){return crabAbundance(x,y,hour);}
export const catchAt=potCatchAt;
export function nearPort(s){return distance(s,PORT)<230;}
export function step(s,dt){if(s.paused)return;const start={x:s.x,y:s.y,heading:s.heading},prior=new Map((s.career?.fleet||[]).map(b=>[b.id,{x:b.x,y:b.y,heading:b.heading}]));stepSimulation(s,dt);const hit=resolveFleetContact(s,start,prior);if(hit&&s.message!==`Hull contact with ${hit.name}. Engines stopped. Maneuver clear.`)notify(s,`Hull contact with ${hit.name}. Engines stopped. Maneuver clear.`);}
function stepSimulation(s,dt){
 if(s.paused)return;
 dt=clamp(dt,0,1);s.hour+=dt/45;const stats=vesselStats(s);tickIncidents(s,dt,stats,conditions(s));if(s.career)tickFleet(s,dt,conditions(s));
 if(s.deckJob?.kind==='undock'){const j=s.deckJob;j.route??=buildCastOffRoute({x:j.x,y:j.y,heading:j.startHeading},{x:j.targetX,y:j.targetY,heading:j.targetHeading});j.elapsed=Math.min(j.duration,j.elapsed+dt);Object.assign(s,dockingPose(j.route,j.elapsed));s.throttle=0;s.rudder=0;if(j.elapsed>=j.duration){s.deckJob=null;s.speed=0;notify(s,'Clear of the quay. Manual helm or autopilot ready.');}return;}
 if(s.deckJob?.kind==='unload'){const j=s.deckJob;if(!j.route){j.route=buildDockRoute({x:j.x,y:j.y,heading:j.startHeading,career:s.career});j.approach=Math.max(.01,dockRouteDuration(j.route));j.duration=j.approach+clamp(j.unloadSeconds??22,1,120);}j.elapsed+=dt;Object.assign(s,dockingPose(j.route,Math.min(j.elapsed,j.approach)));s.throttle=0;s.desiredKnots=0;s.rudder=0;s.autopilot=null;if(j.elapsed>=j.duration){const kg=Math.min(j.cargoKg,s.cargo);s.cargo-=kg;const fish=Math.min(j.salmonKg||0,s.salmon||0);s.salmon-=fish;const bonus=rareValue(s),receipt=settleLanding(s,(kg*65+fish*42)*stats.priceBonus+bonus);s.rareHold={};s.landed+=kg+fish;s.deckJob=null;s.speed=0;s.moored={x:s.x,y:s.y,heading:s.heading};notify(s,kg||fish||bonus?`${kg} kg crab + ${fish} kg salmon landed.${bonus?` Special catch bonus ${bonus.toLocaleString('en-US')} kr.`:''} Net +${Math.round(receipt.net).toLocaleString('en-US')} kr${receipt.repaid?`; loan repaid ${Math.round(receipt.repaid)} kr`:''}.`:'Secured alongside. Hold empty. Ready for service.');}return;}
 if(s.moored){if(Math.abs(s.desiredKnots||0)>.01||s.autopilot){if(!undock(s)){s.desiredKnots=0;}return;}else{Object.assign(s,s.moored);s.speed=0;s.throttle=0;s.rudder=0;return;}}
 const w=conditions(s),power=s.fuel>0&&s.hull>0&&s.incident?.system!=='engine'?1:0,top=stats.top/(1+w.waves*.06);
 let command=s.desiredKnots||0;
 if(s.autopilot){const target=s.autopilot.route?.[s.autopilot.index||0]||s.autopilot,dx=target.x-s.x,dy=target.y-s.y,d=Math.hypot(dx,dy);if(d<18&&s.autopilot.route&&(s.autopilot.index||0)<s.autopilot.route.length-1){s.autopilot.index++;}else if(d<14){s.autopilot=null;s.desiredKnots=0;command=0;s.rudder=0;notify(s,'Autopilot: destination reached. Slowing down.');}else{const error=Math.atan2(Math.sin(Math.atan2(dy,dx)-s.heading),Math.cos(Math.atan2(dy,dx)-s.heading));s.rudder=clamp(error/.55,-1,1);command=Math.min(Math.max(0,command),Math.sqrt(Math.max(0,d-12)*.45)*1.94384)*Math.max(.25,Math.cos(error));}}
 if(s.incident?.system==='steering')s.rudder=0;if(s.incident?.system==='navigation')command=clamp(command,-3,3);
 const requested=(s.deckJob?clamp(command,-4.9,4.9):command)/1.94384,target=clamp(requested,-top*.35,top)*power;
 s.throttle=clamp(requested/top,-.35,1)*power;s.speed+=(target-s.speed)*(1-Math.exp(-dt*.24));
 if(s.deckJob&&!blocksDeck(s)&&!(s.incident?.system==='net'&&s.deckJob.kind.startsWith('net'))){const j=s.deckJob;j.elapsed+=dt*(s.incident?.system==='crew'?.5:1);if(j.kind==='deploy'&&!j.released&&j.elapsed>=j.duration*.9)j.released={...releasePoint(s),at:s.hour};if(j.elapsed>=j.duration){
 if(j.kind==='deploy'){const drop=j.released||{...releasePoint(s),at:s.hour};s.pots.push({id:s.nextPot++,x:drop.x,y:drop.y,setAt:drop.at});notify(s,'Pot deployed. Clear the range ring before setting another.');}
 else if(j.kind==='netSet'){s.nets.push({id:s.nextPot++,x:j.x,y:j.y,setAt:s.hour});notify(s,'Salmon net set. Let it soak, then return within 120 meters.');}
 else if(j.kind==='netHaul'){const net=s.nets.find(n=>n.id===j.netId);if(net){const kg=Math.min(j.catchKg,Math.max(0,stats.capacity-s.cargo-s.salmon));s.salmon+=kg;s.lastHaul={kg,species:'salmon'};s.nets=s.nets.filter(n=>n.id!==j.netId);notify(s,`${kg} kg salmon sorted into the hold.`);revealRare(s,j.rareId,'salmon');}}
 else {const p=s.pots.find(p=>p.id===j.potId);if(p){const kg=Math.min(j.catchKg,Math.max(0,stats.capacity-s.cargo-(s.salmon||0)));s.cargo+=kg;s.lastHaul={kg,species:'crab'};s.deck++;s.pots=s.pots.filter(p=>p.id!==j.potId);notify(s,`Pot ${j.potId} emptied. ${kg} kg of crab sorted into the hold.`);revealRare(s,j.rareId,'crab');}}s.deckJob=null;}}
 const previous={x:s.x,y:s.y,heading:s.heading,career:s.career};
 s.heading+=s.rudder*stats.steer*dt*(.07+Math.abs(s.speed)*.024)*(s.speed<0?-1:1);
 s.x+=Math.cos(s.heading)*s.speed*dt;s.y+=Math.sin(s.heading)*s.speed*dt;
 if(!nearPort(s)){s.x+=Math.sin(s.hour*.6)*dt*.16*w.waves;s.y+=dt*.055*w.waves;}
 if((!vesselIntersectsHarbor(previous)&&vesselIntersectsHarbor(s))||(!vesselOnLand(previous)&&vesselOnLand(s))){const impact=Math.abs(s.speed);s.x=previous.x;s.y=previous.y;s.heading=previous.heading;s.speed*=.15;s.hull=Math.max(0,s.hull-Math.max(0,impact-.8)*.08);}
 s.fuel=Math.max(0,s.fuel-dt*fuelBurnRate(s.throttle,stats.fuelUse)*power);
 if(w.waves>3.5&&Math.abs(s.speed)>3)s.hull=Math.max(0,s.hull-dt*(w.waves-3.5)*.016*(Math.abs(s.speed)-3)/stats.protection*SEA_WEAR_SCALE);
 if(!inWorld(s.x,s.y)){s.x=clamp(s.x,WORLD_BOUNDS.left,WORLD_BOUNDS.right);s.y=clamp(s.y,WORLD_BOUNDS.top,WORLD_BOUNDS.bottom);s.speed=0;s.desiredKnots=0;}
 tickAutomation(s);
 if(s.hull===0){s.paused=true;notify(s,'Vessel disabled. Request a tow from the harbor panel.');}
}
export function handlePot(s,potId=null){
 if(s.career?.fishing==='salmon')return handleNet(s);
 if(blocksDeck(s))return notify(s,'Deck hydraulics/electrics unavailable. Crew are repairing.');
 const stats=vesselStats(s);
 if(s.deckJob)return notify(s,'Deck crew working. Wait for this operation to finish.');
 if(Math.abs(s.speed)*1.94384>=DECK_LIMIT_KNOTS)return notify(s,'Slow below 5 knots before setting or hauling pots.');
 if(nearPort(s))return notify(s,'Leave the harbor area before setting pots.');
 const action=potAction(s,p=>potId===null||p.id===potId);
 if(action.inRange){if(!action.canHaul)return notify(s,`Bring the buoy to the ${stats.hauler==='both'?'port or starboard':stats.hauler} working area.`);if(s.cargo+(s.salmon||0)>=stats.capacity)return notify(s,'The hold is full. Return to unload.');const p=action.pot;s.deckJob={kind:'haul',grapple:true,elapsed:0,duration:32/(stats.work*stats.haul),side:potBearing(s,p).starboard<0?-1:1,layout:stats.hauler,potId:p.id,catchKg:catchAt(p,s.hour,stats.crabYield),x:p.x,y:p.y};s.deckJob.rareId=prepareRareCatch(s,p,'crab',s.deckJob.catchKg);crewActivity(s,'haul');return notify(s,`Hauling pot ${p.id}. Throwing the hook, retrieving the buoy and lifting at the starboard hauler.`);}
 if(s.deck<=0)return notify(s,'All pots are at sea. Return to a buoy to haul.');
 if(s.money<stats.baitCost)return notify(s,`You need ${stats.baitCost} kr for bait.`);
 crewActivity(s,'deploy');s.money-=stats.baitCost;s.deck--;s.deckJob={kind:'deploy',baitCost:stats.baitCost,layout:stats.hauler,elapsed:0,duration:14/(stats.work*stats.deploy),x:s.x,y:s.y};notify(s,'Deck crew rigging the line and lowering the pot.');
}
export function canUndock(s){return !s.deckJob&&nearPort(s)&&Math.abs(s.speed)<1&&!!castOffPosition(s);}
export function undock(s){if(s.deckJob||!nearPort(s)||Math.abs(s.speed)>=1)return false;const at=castOffPosition(s);if(!at)return false;const route=buildCastOffRoute(s,at);s.deckJob={kind:'undock',elapsed:0,duration:dockRouteDuration(route),x:s.x,y:s.y,startHeading:s.heading,targetX:at.x,targetY:at.y,targetHeading:at.heading,route};s.moored=null;s.speed=0;s.throttle=0;s.rudder=0;s.autopilot=null;crewActivity(s,'undock');notify(s,'Casting off. Crew letting go the mooring lines.');return true;}
export function dock(s){if(s.deckJob)return notify(s,'Finish the deck operation first.');if(!nearPort(s))return notify(s,'You must be inside the harbor service area.');if(Math.abs(s.speed)>1)return notify(s,'Slow below 2 knots to dock.');if(vesselIntersectsHarbor(s))return notify(s,'Move clear of the pier before requesting the harbor pilot.');const route=buildDockRoute(s);if(!route.length&&Math.hypot(s.x-BERTH.x,s.y-BERTH.y)>.1)return notify(s,'No clear approach to the service quay. Move farther offshore.');const approach=Math.max(.01,dockRouteDuration(route)),unloadSeconds=(s.cargo+(s.salmon||0)>0||rareValue(s)>0)?40/(vesselStats(s).work*vesselStats(s).unload):1;s.moored=null;s.deckJob={kind:'unload',quayVersion:2,route,unloadSeconds,elapsed:0,duration:approach+unloadSeconds,approach,x:s.x,y:s.y,startHeading:s.heading,cargoKg:s.cargo,salmonKg:s.salmon||0};s.autopilot=null;s.desiredKnots=0;s.throttle=0;crewActivity(s,'unload');notify(s,'Harbor pilot aboard. Approaching the berth, then unloading by crane.');}
export const upgrades={engine:{label:'Engine',cost:18000},hold:{label:'Hold',cost:12000},gear:{label:'Pots',cost:8000}};
export function upgrade(s,type){const u=upgrades[type];if(s.deckJob||!u||!nearPort(s)||Math.abs(s.speed)>1||s[type]>=3||s.money<u.cost*(s[type]+1))return false;s.money-=u.cost*(s[type]+1);s[type]++;crewActivity(s,'upgrade');if(type==='hold')s.capacity+=400;if(type==='gear')s.deck+=4;notify(s,`${u.label} upgraded to level ${s[type]}.`);return true;}
export function service(s,type){if(s.deckJob)return notify(s,'Finish the deck operation first.');if(!nearPort(s)||Math.abs(s.speed)>1)return notify(s,'Dock in harbor first.');const stats=vesselStats(s),needed=type==='fuel'?stats.tank-s.fuel:100-s.hull,price=(type==='fuel'?9.5:160)*stats.serviceCost,amount=Math.max(0,Math.min(needed,s.money/price));if(amount>0)crewActivity(s,type==='fuel'?'fuel':'repair');s.money-=amount*price;if(type==='fuel')s.fuel+=amount;else s.hull+=amount;notify(s,type==='fuel'?`${Math.round(amount)} liters of diesel bunkered.`:'Hull repaired.');}
export function rescue(s){const fee=Math.min(Math.max(0,s.money),12000);s.money-=fee;s.moored=null;s.x=PORT.x;s.y=PORT.y;if(s.deckJob?.kind==='deploy'){s.deck++;s.money+=s.deckJob.baitCost??150;}s.deckJob=null;s.autopilot=null;s.speed=0;s.throttle=0;s.desiredKnots=0;s.hull=Math.max(s.hull,35);s.fuel=Math.max(s.fuel,80);s.paused=false;notify(s,`Towed to harbor. Cost ${fee.toLocaleString('en-US')} kr.`);}

export function salmonCatch(net,hour,stats){const soak=Math.max(0,hour-net.setAt),ground=net.legacyAbundance??salmonAbundance(net.x,net.y,hour);return Math.round((80+ground*190)*(1-Math.exp(-soak/1.2))*Math.exp(-Math.max(0,soak-5)*.15)*stats.salmonYield);}
export function handleNet(s){const stats=vesselStats(s);if(!stats.salmon)return notify(s,'This vessel cannot fish salmon. Buy a salmon-capable hull.');if(s.deckJob||blocksDeck(s)||s.incident?.system==='net')return notify(s,'Net equipment busy or under repair.');if(Math.abs(s.speed)*1.94384>=5)return notify(s,'Slow below 5 knots for net work.');if(nearPort(s))return notify(s,'Leave harbor before deploying a net.');if(s.cargo+s.salmon>=stats.capacity)return notify(s,'The hold is full.');const net=s.nets[0];if(net){if(distance(s,net)>=120)return notify(s,'Return within 120 meters of your salmon net.');s.deckJob={kind:'netHaul',elapsed:0,duration:52/(stats.work*stats.netWork),netId:net.id,catchKg:salmonCatch(net,s.hour,stats),x:net.x,y:net.y};s.deckJob.rareId=prepareRareCatch(s,net,'salmon',s.deckJob.catchKg);}else{s.deckJob={kind:'netSet',elapsed:0,duration:28/(stats.work*stats.netWork),x:s.x,y:s.y};}crewActivity(s,'haul');notify(s,net?'Retrieving salmon net.':'Setting salmon net.');}
export function tickAutomation(s){const c=s.career;if(!c||c.fishing!=='crab'||s.deckJob||nearPort(s)||blocksDeck(s)||Math.abs(s.speed)*1.94384>=5)return;const stats=vesselStats(s),action=potAction(s,p=>s.hour-p.setAt>=stats.minSoak);if(c.autoHaul&&c.skills.autoHaul&&action.canHaul&&s.hour-action.pot.setAt>=stats.minSoak&&s.cargo+s.salmon<stats.capacity){handlePot(s,action.pot.id);return;}if(c.autoDeploy&&c.skills.autoDeploy&&s.deck>0&&s.money>=stats.baitCost&&s.pots.every(p=>distance(s,p)>=stats.spacing)&&Math.abs(s.speed)>.15)handlePot(s);}

export function vesselOnLand(s){const stats=vesselStats(s),c=Math.cos(s.heading),n=Math.sin(s.heading),length=stats.length*.52,width=stats.beam*.49;for(const x of [-length,0,length])for(const z of [-width,0,width])if(isLand(s.x+c*x-n*z,s.y+n*x+c*z))return true;return false;}

function revealRare(s,id,species){const r=rareById(id);if(r?.species===species&&awardRareCatch(s,s,id))notify(s,`SPECIAL CATCH · ${r.name} · ${r.tier} · Bonus ${r.value.toLocaleString('en-US')} kr on landing!`);}

export function setWeatherMode(s,mode){s.weatherMode=mode==='dynamic'?'dynamic':'live';s.weatherOverride=null;if(s.weatherMode==='dynamic'){s.realWeather=null;s.weatherStatus='dynamic';}}
