import {addSalmonCatch,salmonHoldRate,salmonCatch} from './salmon-market.mjs?v=0.18.92';
import {crabHoldValue,addCrabCatch,captureCrabSpecies} from './catch-value.mjs?v=0.18.92';
import {PARTS,boatById} from './catalog.mjs?v=0.18.92';
import {solarCharge,electricBurn,energyPrice} from './energy.mjs?v=0.18.92';
import {recoverFleetContact} from './fleet-recovery.mjs?v=0.18.92';
import {nearbyGreeting} from './fleet-greetings.mjs?v=0.18.92';
import {potCatchAt} from './pot-soak.mjs?v=0.18.92';
import {prepareRareCatch,awardRareCatch,rareValue} from './rare-catch.mjs?v=0.18.92';
import {FUEL_SCALE,SEA_WEAR_SCALE} from './balance.mjs?v=0.18.92';
import {groundsAt,crabHotspot} from './fishing-grounds.mjs?v=0.18.92';
import {nearestWater,clearWater} from './world.mjs?v=0.18.92';
import {planSeaRoute,seaLane} from './navigation.mjs?v=0.18.92';
import {vesselStats,settleLanding,tradeValue,inHarbor} from './career.mjs?v=0.18.92';
import {nextPotNumber} from './pot-numbers.mjs?v=0.18.92';
import {iceLevel} from './vessel-ice.mjs?v=0.18.92';
import {buildCastOffRoute,dockRouteDuration,dockingPose} from './harbor.mjs?v=0.18.92';
import {hullContact} from './vessel-collision.mjs?v=0.18.92';

const hullFields=['x','y','heading','engine','hold','gear','capacity','deck','fuel','hull','ice','lostPots',
 'pots','nets','cargo','crabValue','salmon','salmonRate','rareHold','droneSurvey','moored','lights'];
const tripFields=['id','color','phase','timer','waypoint','groundTarget','groundId','groundName',
 'expenses','earnings','trips','lastLanding','upgradeRequest','nextUpgradeTrip'];
const fields=(source,keys)=>Object.fromEntries(keys.map(key=>[key,source[key]]));
const tripStamp=b=>[b.x,b.y,b.deck,b.cargo,b.salmon,rareValue(b),(b.pots||[]).map(p=>p.id+':'+p.setAt).join(','),(b.nets||[]).map(n=>n.id+':'+n.setAt).join(',')].join('/');
const hasCatch=b=>b.cargo||b.salmon||rareValue(b);
export function fleetCommandBlock(s,b){
 if(!b||b.salePending)return 'Vessel is unavailable or being sold.';
 if(s.deckJob||s.tow||s.overboard||s.incident)return 'Finish deck work, repairs or the emergency before changing vessels.';
 if(b.castOff)return 'Wait until the captain is clear of the quay.';
 return '';
}
export function takeFleetCommand(s,id){
 const c=s.career,index=c.fleet.findIndex(b=>b.id===id),target=c.fleet[index],blocked=fleetCommandBlock(s,target);
 if(blocked)return {ok:false,message:blocked};
 const prior=s.fleetCommand,resume=prior?.stamp===tripStamp(s),stats=fleetStats(s,target);
 s.totalLanded??=s.landed||0;
 const old={...fields(prior||{},tripFields),...fields(s,hullFields),
  id:prior?.id||`fleet-${c.nextFleet++}`,color:prior?.color||target.color,boat:c.boat,name:boatById(c.boat).name,parts:c.parts,
  fishing:c.fishing,requiresDock:!!c.requiresDock,started:true,inventoryTracked:true,autoService:!!target.autoService,
  expenses:prior?.expenses||0,earnings:prior?.earnings||0,trips:prior?.trips||0,request:null};
 // Preserve an AI trip if the player did not change it; otherwise secure any gear and catch first.
 if(!resume){
  old.phase=old.pots.length?'haul':old.nets?.length?'netHaul':hasCatch(old)?'return':inHarbor(old)?'service':'outbound';
  old.timer=0;old.waypoint=old.phase==='outbound'?1:0;
 }
 if(old.phase==='service')old.timer=0;
 if(old.phase==='netHaul'&&!old.nets?.length){old.phase='return';old.waypoint=0;}
 const deck=target.inventoryTracked?target.deck:stats.potCapacity-target.pots.length-(target.lostPots||0);
 Object.assign(s,fields(target,hullFields),{
  deck:Math.max(0,deck),nets:target.nets||[],lostPots:target.lostPots||0,ice:iceLevel(target.ice),
  lights:target.lights!==false,rareHold:target.rareHold||{},moored:target.moored||null,
  throttle:0,rudder:0,speed:0,desiredKnots:0,autopilot:null,skipperMission:null,activity:null,lastHaul:null,
  autoHaulSlowing:false,autoSetSlowing:false,intelligentSetRunout:0,dieselSlick:null,hoseTarget:null,
 });
 Object.assign(c,{boat:target.boat,parts:target.parts,fishing:target.fishing,requiresDock:target.requiresDock??true,
  autoDeploy:false,autoHaul:false,intelligentAutoSet:false});
 s.nextPot=nextPotNumber([...s.pots,...s.nets]);
 s.fleetCommand={...fields(target,tripFields),stamp:tripStamp(s)};
 c.fleet[index]=old;
 return {ok:true,message:`Now aboard ${target.name}.`};
}
export function fleetStats(s,b){return vesselStats({...b,career:{boat:b.boat,parts:b.parts,skills:s.career.skills}});}
export const fleetNoticeCount=s=>(s.career?.fleet||[]).filter(b=>b.upgradeRequest?.status==='pending'||!b.autoService&&(b.unreadMessage||b.request?.status==='pending')).length;
export function readFleetMessages(s){for(const b of s.career?.fleet||[])b.unreadMessage=false;}
function radio(s,b,text,attention=true,popup=true){if(attention)b.unreadMessage=true;s.message=text;const entry={hour:s.hour,text,kind:popup?'fleet':'fleet-info'};s.log.unshift(entry);(s.popupEvents??=[]).push(entry);s.log=s.log.slice(0,8);}
export function chooseFleetGround(s,b){const stats=fleetStats(s,b),speed=stats.top/1.2,rate=stats.powertrain==='electric'?electricBurn(.75,stats,1):.06*stats.fuelUse*FUEL_SCALE,maxDistance=stats.tank/Math.max(.0001,rate)*speed*.32,all=groundsAt(s.worldHour??s.hour).sort((a,b)=>Math.hypot(a.x-180,a.y-80)-Math.hypot(b.x-180,b.y-80)),reachable=all.filter(g=>Math.hypot(g.x-180,g.y-80)<maxDistance),pool=reachable.length?reachable:all.slice(0,1),number=Math.max(0,Number(/(\d+)$/.exec(b.id)?.[1]||1)-1);return pool[(number+(b.trips||0))%pool.length];}
function proposeUpgrade(s,b){if(b.upgradeRequest||b.salePending||(b.trips||0)<(b.nextUpgradeTrip??3))return;const keys=['engine','sonar','propeller','hull','crane','tank','hold','winch','pumps'],choices=keys.map(key=>PARTS.find(p=>p.key===key&&p.rank===(b.parts[key]||0)+1)).filter(Boolean);b.nextUpgradeTrip=(b.trips||0)+3;if(!choices.length)return;const item=choices[((b.trips||0)+Number(/(\d+)$/.exec(b.id)?.[1]||0))%choices.length];b.upgradeRequest={itemId:item.id,status:'pending'};radio(s,b,`Captain of ${b.name}: requesting ${item.name} for ${item.price.toLocaleString('en-US')} kr. Upgrade approval is separate from trip supplies.`);}
function serviceQuote(b,stats){const fuel=Math.max(0,stats.tank-b.fuel),repair=Math.max(0,100-b.hull),bait=b.fishing==='salmon'?0:stats.potCapacity*stats.baitCost,cost=Math.ceil((fuel*energyPrice(stats)+repair*160)*stats.serviceCost+bait);return {cost,fuel,repair,bait,status:'pending'};}
function installUpgrade(s,b){const r=b.upgradeRequest,item=PARTS.find(p=>p.id===r?.itemId);if(r?.status!=='approved'||!item)return;b.parts[item.key]=item.rank;b.capacity=fleetStats(s,b).capacity;b.upgradeRequest=null;if(b.request)b.request={...serviceQuote(b,fleetStats(s,b)),status:b.request.status};radio(s,b,`${b.name}: ${item.name} installed in harbor.`,false,false);}
export function answerFleetUpgrade(s,id,approve){const b=s.career?.fleet.find(b=>b.id===id);if(!b?.upgradeRequest||b.salePending||b.upgradeRequest.status!=='pending')return {ok:false,message:'No upgrade request.'};if(!approve){b.upgradeRequest=null;b.unreadMessage=false;return {ok:true,message:'Upgrade declined. Trip supplies remain separate.'};}const item=PARTS.find(p=>p.id===b.upgradeRequest.itemId);if(!item||(b.parts[item.key]||0)!==item.rank-1)return {ok:false,message:'Upgrade request is no longer valid.'};if(s.money<item.price)return {ok:false,message:'Insufficient funds for this upgrade.'};s.money-=item.price;b.upgradeRequest.status='approved';b.unreadMessage=false;if(b.phase==='service')installUpgrade(s,b);return {ok:true,message:`${b.name}: ${item.name} approved; installation in harbor.`};}
export function fleetSaleValue(s,b){const refund=b.upgradeRequest?.status==='approved'?(PARTS.find(p=>p.id===b.upgradeRequest.itemId)?.price||0):0;return tradeValue({...b,career:{boat:b.boat,parts:b.parts}})+refund;}
function completeSale(s,b){const value=fleetSaleValue(s,b);s.money+=value;s.career.fleet=s.career.fleet.filter(v=>v.id!==b.id);radio(s,b,`${b.name} sold for ${value.toLocaleString('en-US')} kr. Vessel and captain removed from the fleet.`);return {ok:true,message:`${b.name} sold for ${value.toLocaleString('en-US')} kr.`};}
export function sellFleetVessel(s,id){const b=s.career?.fleet.find(b=>b.id===id);if(!b||b.salePending)return {ok:false,message:'Vessel is unavailable or already being sold.'};b.request=null;if(b.upgradeRequest?.status!=='approved')b.upgradeRequest=null;b.salePending=true;b.navigation=null;b.avoidPoint=null;if(!b.pots.length&&!b.nets?.length&&!hasCatch(b)&&Math.hypot(b.x-180,b.y-80)<230)return completeSale(s,b);b.phase=b.pots.length?'haul':b.nets?.length?'netHaul':'return';b.waypoint=0;b.timer=0;return {ok:true,message:`${b.name}: recovering gear, returning and unloading before sale.`};}
export function toggleFleetService(s,id){const b=s.career?.fleet.find(b=>b.id===id);if(!b||b.salePending)return {ok:false,message:'Vessel unavailable.'};b.autoService=!b.autoService;if(b.autoService&&!b.upgradeRequest)b.unreadMessage=false;if(b.autoService&&b.request&&s.money>=b.request.cost)answerCaptain(s,id,true);return {ok:true,message:b.autoService?'Routine trip supplies approved automatically. Upgrades always need approval.':'Automatic trip supplies disabled.'};}
function requestService(s,b,stats){installUpgrade(s,b);stats=fleetStats(s,b);proposeUpgrade(s,b);b.phase='service';b.request=serviceQuote(b,stats);const cost=b.request.cost;if(b.autoService&&s.money>=cost){answerCaptain(s,b.id,true);return;}radio(s,b,`Captain of ${b.name}: permission for ${cost.toLocaleString('en-US')} kr of ${stats.powertrain==='electric'?'shore charging':'fuel'}, repairs and trip supplies? Open Fleet & finance.`,!b.autoService,!b.autoService);}
export function answerCaptain(s,id,approve){const b=s.career?.fleet.find(b=>b.id===id);if(!b?.request||b.salePending)return {ok:false,message:'No outstanding request.'};if(!approve){b.request.status='declined';return {ok:true,message:`${b.name} holding in harbor. You can approve later.`};}if(s.money<b.request.cost)return {ok:false,message:'Insufficient funds. Captain remains in harbor.'};const cost=b.request.cost;s.money-=cost;b.expenses=(b.expenses||0)+cost;const stats=fleetStats(s,b);b.fuel=stats.tank;b.hull=100;b.request=null;b.phase='outbound';b.groundTarget=null;b.waypoint=0;b.timer=0;return {ok:true,message:`${b.name}: supplies authorized. Departing for the grounds.`};}
const move=(b,x,y,speed,dt)=>{const dx=x-b.x,dy=y-b.y,d=Math.hypot(dx,dy);if(d<.01)return true;b.heading=Math.atan2(dy,dx);const travel=Math.min(d,speed*dt);b.x+=dx/d*travel;b.y+=dy/d*travel;return travel>=d;};
function navigate(s,b,x,y,speed,dt){const target=nearestWater(x,y),key=target.x.toFixed(1)+'/'+target.y.toFixed(1);if(b.navigation?.key!==key){const route=planSeaRoute(b,target);b.navigation=route?{key,route,index:0}:null;if(!route)return false;}const n=b.navigation,p=n.route[n.index];
 const obstacles=[s,...s.career.fleet.filter(o=>o!==b)].filter(o=>Number.isFinite(o.x)&&Number.isFinite(o.y));
 if(b.avoidPoint){const a=b.avoidPoint;if(Math.hypot(a.x-b.x,a.y-b.y)<5){b.avoidPoint=null;b.navigation=null;return false;}if(!seaLane(b,a,18)){b.avoidPoint=null;return false;}const desired=Math.atan2(a.y-b.y,a.x-b.x),delta=Math.atan2(Math.sin(desired-b.heading),Math.cos(desired-b.heading));b.heading+=Math.max(-dt*.45,Math.min(dt*.45,delta));const travel=Math.min(Math.hypot(a.x-b.x,a.y-b.y),speed*.55*dt)*(Math.abs(delta)>1.2?.15:1);b.x+=Math.cos(b.heading)*travel;b.y+=Math.sin(b.heading)*travel;return false;}
 const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy),ux=dx/Math.max(d,.01),uy=dy/Math.max(d,.01),own=fleetStats(s,b);if(d<.01){if(n.index<n.route.length-1){n.index++;return false;}return true;}for(const o of obstacles){const other=o===s?vesselStats(s):fleetStats(s,o),clearance=(own.length+other.length)*.55+10,ox=o.x-b.x,oy=o.y-b.y,along=ox*ux+oy*uy,across=Math.abs(ox*uy-oy*ux);if(along< -clearance||along>Math.min(d,clearance+speed*7)||across>clearance)continue;if(Math.hypot(target.x-o.x,target.y-o.y)<clearance*.65)return false;for(const side of [1,-1]){const a={x:o.x+ux*clearance-uy*clearance*side,y:o.y+uy*clearance+ux*clearance*side};if(clearWater(a.x,a.y,20)&&seaLane(b,a,18)){b.avoidPoint=a;break;}}return false;}
 if(move(b,p.x,p.y,b.fuel>0?speed:0,dt)){if(n.index<n.route.length-1)n.index++;else return true;}return false;}
export function tickFleet(s,dt,w){
 const active=s.fleetCommand;
 if(s.moored&&active?.upgradeRequest?.status==='approved'){
  // A prepaid part follows the hull even while the player is at the helm.
  const vessel={...active,boat:s.career.boat,parts:s.career.parts,name:boatById(s.career.boat).name,capacity:s.capacity};
  installUpgrade(s,vessel);s.capacity=vessel.capacity;active.upgradeRequest=vessel.upgradeRequest;
 }
 for(const [i,b] of s.career.fleet.entries()){
 const stats=fleetStats(s,b);if(stats.powertrain==='electric')b.fuel=Math.min(stats.tank,b.fuel+solarCharge(stats,s.worldHour??s.hour,w,dt));if(b.moored&&['outbound','deploy','haul','net','netHaul','return'].includes(b.phase)&&!b.request&&b.fuel>0){
  const route=b.castOff?.route||buildCastOffRoute({...b,career:{boat:b.boat,parts:b.parts,skills:s.career.skills}});
  if(!route.length)continue;
  const elapsed=(b.castOff?.elapsed||0)+dt,pose=dockingPose(route,elapsed);
  if([s,...s.career.fleet.filter(v=>v!==b)].some(v=>hullContact(pose,stats,v,v===s?vesselStats(s):fleetStats(s,v))))continue;
  Object.assign(b,pose);b.castOff={route,elapsed};
  if(elapsed>=dockRouteDuration(route)){b.moored=null;b.castOff=null;}
  continue;
 }
 if(b.started){const greeting=nearbyGreeting(s,b);if(greeting)radio(s,b,greeting,false);}if(!b.moored&&recoverFleetContact(s,b,stats,dt))continue;if(b.request){if(b.autoService&&s.money>=b.request.cost)answerCaptain(s,b.id,true);else continue;}
 if(!b.started||b.phase==='service'){b.started=true;if(b.salePending){completeSale(s,b);continue;}requestService(s,b,stats);continue;}
 b.timer+=dt;if(!Number.isFinite(b.groundTarget?.x)||!Number.isFinite(b.groundTarget?.y)){const area=chooseFleetGround(s,b),base=b.fishing==='salmon'?area:{...area,...crabHotspot(area,5,s.worldHour??s.hour)};b.groundId=base.id;b.groundName=base.name;b.groundTarget=nearestWater(base.x+(i%4)*165,base.y+(Math.floor(i/4)%6)*180);}const ground=b.groundTarget,speed=stats.top/(1+w.waves*.06),fuelRate=(b.phase==='soak'?.008:.06)*stats.fuelUse*FUEL_SCALE;b.fuel=stats.powertrain==='electric'?Math.min(stats.tank,Math.max(0,b.fuel-electricBurn(b.phase==='soak'?0:.75,stats,dt))):Math.max(0,b.fuel-dt*fuelRate);if(w.waves>4)b.hull=Math.max(35,b.hull-dt*.0008/stats.protection*SEA_WEAR_SCALE);
 // Captains reserve enough fuel to return; no teleporting or unattended spending.
 if((b.fuel<Math.max(85,(Math.hypot(b.x-160,b.y-80)+4500)/Math.max(3,speed)*(stats.powertrain==='electric'?electricBurn(.75,stats,1):.07*stats.fuelUse*FUEL_SCALE))||b.hull<50)&&!['return','landing'].includes(b.phase)){b.phase=b.pots.length?'haul':b.nets?.length?'netHaul':'return';b.waypoint=0;b.timer=0;b.navigation=null;}
 if(b.phase==='outbound'){const points=[[350,80],[ground.x,ground.y]],p=points[b.waypoint||0];if(navigate(s,b,...p,speed,dt)){b.waypoint=(b.waypoint||0)+1;if(b.waypoint>=points.length){b.phase=b.fishing==='salmon'&&stats.salmon?'net':'deploy';b.timer=0;}}}
 else if(b.phase==='deploy'){const n=b.pots.length,target={x:ground.x+(n%10)*165,y:ground.y+Math.floor(n/10)*165};if(b.inventoryTracked&&b.deck<=0){b.phase=n?'soak':'return';b.waypoint=0;b.timer=0;}
 else if(navigate(s,b,target.x,target.y,Math.min(speed,2.3),dt)&&b.timer>=14/(stats.work*stats.autoSetRate)){if(b.inventoryTracked)b.deck--;b.pots.push({id:nextPotNumber(b.pots),x:b.x,y:b.y,setAt:s.hour,groundSetAt:s.worldHour??s.hour,baitRank:stats.baitRank,crabSpecies:captureCrabSpecies(b,s.worldHour??s.hour)});b.timer=0;if(b.pots.length>=stats.potCapacity||b.inventoryTracked&&b.deck<=0){b.phase='soak';b.timer=0;}}}
 else if(b.phase==='soak'){if(b.timer>=112.5){b.phase='haul';b.timer=0;}}
 else if(b.phase==='haul'){const pot=b.pots[0];if(!pot){b.phase=b.nets?.length?'netHaul':'return';b.waypoint=0;b.timer=0;}else if(navigate(s,b,pot.x,pot.y,Math.min(speed,2.3),dt)){pot.haul=(pot.haul||0)+dt;if(pot.haul>=32/(stats.work*stats.haul)){const kg=potCatchAt(pot,s.hour,stats.crabYield);const room=stats.capacity-b.cargo-b.salmon;addCrabCatch(b,Math.max(0,Math.min(room,kg)),pot,s.worldHour??s.hour);if(room>0)fleetRare(s,b,prepareRareCatch(s,pot,'crab',kg));b.pots.shift();if(b.inventoryTracked)b.deck++;}}}
 else if(b.phase==='netHaul'){
  const net=b.nets?.[0];
  if(!net){b.phase='return';b.waypoint=0;b.timer=0;}
  else if(navigate(s,b,net.x,net.y,Math.min(speed,2.3),dt)){
   net.haul=(net.haul||0)+dt;
   if(net.haul>=52/(stats.work*stats.netWork)){
    const kg=Math.min(Math.max(0,stats.capacity-b.cargo-b.salmon),salmonCatch(net,s.hour,stats));
    addSalmonCatch(b,kg,net,s.hour);fleetRare(s,b,prepareRareCatch(s,net,'salmon',kg));b.nets.shift();
   }
  }
 }
 else if(b.phase==='net'){if(b.timer>120/(stats.work*stats.netWork)){addSalmonCatch(b,Math.min(stats.capacity,Math.round(250*stats.salmonYield)),b,s.hour);fleetRare(s,b,prepareRareCatch(s,{},'salmon',b.salmon));b.phase='return';b.waypoint=0;b.timer=0;}}
 else if(b.phase==='return'&&(b.salePending&&Math.hypot(b.x-180,b.y-80)<180||navigate(s,b,180,80,speed,dt))){b.phase='landing';b.timer=0;}
 else if(b.phase==='landing'&&b.timer>=40/stats.unload){const gross=(crabHoldValue(b)+b.salmon*salmonHoldRate(b))*stats.priceBonus+rareValue(b),crew=Math.max(0,gross-b.expenses)*stats.crewShare,receipt=settleLanding(s,gross-crew);b.lastLanding={gross,crew,expenses:b.expenses,repaid:receipt.repaid,profit:gross-crew-b.expenses};s.totalLanded=(s.totalLanded||0)+b.cargo+b.salmon;s.totalEarned=(s.totalEarned||0)+Math.max(0,receipt.net);b.earnings+=b.lastLanding.profit;b.trips++;b.cargo=0;b.crabValue=0;b.salmon=0;b.salmonRate=null;b.rareHold={};b.expenses=0;b.phase='service';b.timer=0;if(b.salePending){completeSale(s,b);continue;}radio(s,b,`${b.name} landed catch: ${Math.round(gross).toLocaleString('en-US')} kr, crew ${Math.round(crew).toLocaleString('en-US')} kr. Captain preparing the next trip.`,!b.autoService,!b.autoService);}
}}

function fleetRare(s,b,id){const r=awardRareCatch(s,b,id);if(r)radio(s,b,`SPECIAL CATCH · ${b.name}: ${r.name}. Bonus ${r.value.toLocaleString('en-US')} kr on landing.`);}
