import {iceLevel} from './vessel-ice.mjs?v=0.18.90';
import {chooseBerth, nearestQuay, quayPoint, QUAY} from './harbor.mjs?v=0.18.90';
import {MATTHEW_QUAY} from './world.mjs?v=0.18.90';
import {ensureRareState,rareCount} from './rare-catch.mjs?v=0.18.90';
import {INCIDENT_INTERVAL_SCALE,INCIDENT_SCHEDULE_VERSION} from './balance.mjs?v=0.18.90';
import {SKILLS,PARTS,BOATS,SKILL_SYSTEMS,PART_SYSTEMS,boatById} from './catalog.mjs?v=0.18.90';
const finite=(n,f=0)=>Number.isFinite(n)?n:f,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const inHarbor=s=>Math.hypot(s.x-160,s.y-80)<230||Math.hypot(s.x-MATTHEW_QUAY.x,s.y-MATTHEW_QUAY.y)<230;
export const shopReady=s=>inHarbor(s)&&(!s.career?.requiresDock||!!s.moored)&&Math.abs(s.speed)<1&&!s.deckJob&&!s.incident&&!s.tow&&!s.overboard;
const ranks=(raw,systems)=>Object.fromEntries(systems.filter(d=>finite(raw?.[d.key])>0).map(d=>[d.key,clamp(Math.floor(raw[d.key]),0,d.maxRank||5)]));
export function ensureCareer(s){
 const c=s.career||{};
 c.storedBoats=Array.isArray(c.storedBoats)?c.storedBoats.filter(b=>typeof b?.id==='string'&&boatById(b.boat).id===b.boat&&['deck','fuel','hull','capacity'].every(k=>Number.isFinite(b[k])&&b[k]>=0)).slice(0,100).map(b=>({
  ...b,parts:ranks(b.parts,PART_SYSTEMS),deck:clamp(Math.floor(b.deck),0,200),
  hull:clamp(b.hull,0,100),ice:iceLevel(b.ice),capacity:clamp(b.capacity,900,1e6),
  lostPots:clamp(Math.floor(finite(b.lostPots)),0,200),
 })):[];
 c.skills=ranks(c.skills,SKILL_SYSTEMS);c.parts=ranks(c.parts,PART_SYSTEMS);c.boat=boatById(c.boat).id;c.debt=clamp(finite(c.debt),0,1e9);c.borrowed=clamp(finite(c.borrowed),0,1e9);c.repaid=clamp(finite(c.repaid),0,1e9);c.autoDeploy=!!c.autoDeploy&&!!c.skills.autoDeploy;c.autoHaul=!!c.autoHaul&&!!c.skills.autoHaul;c.intelligentAutoSet=!!c.intelligentAutoSet&&!!c.skills.intelligentAutoSet&&!!c.skills.autoDeploy;if(c.intelligentAutoSet)c.autoDeploy=false;c.potSpacing=[80,160,220].includes(c.potSpacing)?c.potSpacing:80;c.fishing=c.fishing==='salmon'&&boatById(c.boat).salmon?'salmon':'crab';c.seed=(finite(c.seed,7319281)>>>0)||7319281;c.nextIncident=Math.max(0,finite(c.nextIncident,360));if(c.incidentScheduleVersion!==INCIDENT_SCHEDULE_VERSION){c.nextIncident=c.incidentScheduleVersion===2?c.nextIncident/2:Math.max(270,c.nextIncident)*INCIDENT_INTERVAL_SCALE;c.incidentScheduleVersion=INCIDENT_SCHEDULE_VERSION;}c.fleet=Array.isArray(c.fleet)?c.fleet.filter(b=>b&&typeof b.id==='string'&&['x','y','fuel','hull'].every(k=>Number.isFinite(b[k]))).slice(0,100):[];c.nextFleet=Math.max(1,Math.floor(finite(c.nextFleet,1)));c.fleet=c.fleet.map((b,i)=>{const hull=boatById(b.boat);return {...b,boat:hull.id,name:hull.name,parts:ranks(b.parts,PART_SYSTEMS),engine:clamp(finite(b.engine),0,3),hold:clamp(finite(b.hold),0,3),gear:clamp(finite(b.gear),0,3),capacity:clamp(finite(b.capacity,hull.capacity),900,1000000),fishing:b.fishing==='salmon'&&hull.salmon?'salmon':'crab',heading:finite(b.heading),fuel:clamp(b.fuel,0,Math.max(10000,hull.tank+750)),hull:clamp(b.hull,0,100),phase:['outbound','deploy','soak','haul','net','netHaul','return','landing','service'].includes(b.phase)?b.phase:'service',timer:Math.max(0,finite(b.timer)),waypoint:clamp(Math.floor(finite(b.waypoint)),0,b.phase==='outbound'?1:2),pots:Array.isArray(b.pots)?b.pots.filter(p=>p&&['id','x','y','setAt'].every(k=>Number.isFinite(p[k]))).slice(0,200):[],cargo:Math.max(0,finite(b.cargo)),salmon:Math.max(0,finite(b.salmon)),expenses:Math.max(0,finite(b.expenses)),earnings:finite(b.earnings),trips:Math.max(0,finite(b.trips)),color:['#70c9df','#cda0ed','#ea859d','#91c97a'][i%4],autoService:!!b.autoService,salePending:!!b.salePending,upgradeRequest:PARTS.some(p=>p.id===b.upgradeRequest?.itemId&&p.rank===((b.parts?.[p.key]||0)+1))?{itemId:b.upgradeRequest.itemId,status:b.upgradeRequest.status==='approved'?'approved':'pending'}:null,nextUpgradeTrip:Math.max(0,finite(b.nextUpgradeTrip,3)),request:b.request&&['cost','fuel','repair','bait'].every(k=>Number.isFinite(b.request[k])&&b.request[k]>=0)?{...b.request,status:b.request.status==='declined'?'declined':'pending'}:null};});if(!['ready','pending','claimed','legacy'].includes(c.firstBoatReward))c.firstBoatReward=c.boat==='nordvind'&&!c.fleet.length&&c.nextFleet===1?'ready':'legacy';s.career=c;s.salmon=clamp(finite(s.salmon),0,1e6);s.nets=Array.isArray(s.nets)?s.nets.filter(n=>n&&['id','x','y','setAt'].every(k=>Number.isFinite(n[k]))).slice(0,1):[];return ensureRareState(s);
}
export function vesselStats(s){
 const c=s.career||{},b=boatById(c.boat),k=c.skills||{},p=c.parts||{},crew=b.crew+(p.quarters||0),v=key=>(k[key]||0),part=key=>(p[key]||0);
 return {...b,droneSurvey:!!part('droneSurvey'),lightRank:part('lights'),highSpeedHaul:!!v('highSpeedHaul'),maxSpeedHauling:!!v('maxSpeedHauling'),intelligentAutoSet:!!v('intelligentAutoSet'),pickupAll:!!v('pickupAll'),crew,capacity:Math.max(s.capacity||0,b.capacity+(s.hold||0)*400+part('hold')*250),potCapacity:b.pots+(s.gear||0)*4+part('racks')*4,tank:b.tank+part('tank')*150,
 top:b.top+(s.engine||0)*1.1+part('engine')*.45,work:1+v('work')*.08+part('crane')*.1+Math.max(0,crew-3)*.035,
 deploy:1+v('deploy')*.1+part('lights')*.05,haul:1+v('haul')*.09+v('sort')*.07+part('winch')*.1,repair:1+v('repair')*.15+part('pumps')*.1,
 fuelUse:Math.max(.35,1-v('fuel')*.04-part('propeller')*.05),crabYield:1+v('crab')*.06+part('sonar')*.05,salmonYield:1+v('salmon')*.08+part('nets')*.08,
 autoSetRate:1+Math.max(0,v('autoDeploy')-1)*.1,baitRank:v('bait'),
 priceBonus:1+v('price')*.025+part('chiller')*.02,baitCost:Math.round(150*Math.max(.3,1-part('freezer')*.05)),
 protection:b.protection/(Math.max(.25,1-v('hull')*.04-part('hull')*.07)),risk:Math.max(.3,1-v('risk')*.05-part('radio')*.04),steer:1+v('steer')*.07+part('rudder')*.08,
 netWork:1+v('net')*.1,unload:1+v('unload')*.1+part('landing')*.08,crewShare:.3-v('fleet')*.01,
 serviceCost:Math.max(.4,1-v('service')*.04-part('workshop')*.05),roll:Math.max(.3,1-v('stability')*.05-part('stabilizer')*.07),spacing:[80,160,220].includes(c.potSpacing)?c.potSpacing:80,minSoak:2-(Math.max(1,v('autoHaul'))-1)*.2};
}
const result=(ok,message)=>({ok,message});
// Crab knowledge is company-wide; the sounder has to be installed on this hull.
export function droneRequirement(s){
 const crab=(s.career?.skills?.crab??0)<5,sonar=(s.career?.parts?.sonar??0)<1;
 if(crab&&sonar)return 'Requires Crab Grounds Knowledge V and Bottom Sounder I on this boat.';
 if(crab)return 'Requires Crab Grounds Knowledge V.';
 if(sonar)return 'Requires Bottom Sounder I on this boat.';
 return '';
}
export function buyItem(s,category,id){ensureCareer(s);const item=(category==='skills'?SKILLS:category==='parts'?PARTS:[]).find(x=>x.id===id);if(!item)return result(false,'Unknown item.');if(!shopReady(s))return result(false,'Stop in harbor and finish all work before purchasing.');const owned=category==='skills'?s.career.skills:s.career.parts,current=owned[item.key]||0;if(current!==item.rank-1)return result(false,current>=item.rank?'Already owned.':'Purchase the previous rank first.');if(item.key==='intelligentAutoSet'&&!s.career.skills.autoDeploy)return result(false,'Purchase Auto Set I first.');const requirement=item.key==='droneSurvey'&&droneRequirement(s);if(requirement)return result(false,requirement);if(item.key==='nets'&&!vesselStats(s).salmon)return result(false,'A salmon-capable hull is required.');if(s.money<item.price)return result(false,'Insufficient funds.');s.money-=item.price;owned[item.key]=item.rank;s.capacity=vesselStats(s).capacity;if(category==='parts'&&item.key==='racks')s.deck+=4;return result(true,`${item.name} acquired.`);}
export function toggleAutomation(s,key){ensureCareer(s);if(!['autoDeploy','autoHaul','intelligentAutoSet'].includes(key)||!s.career.skills[key])return result(false,'Purchase this skill in the harbor shop first.');if(key==='intelligentAutoSet'&&!s.career[key]&&!s.career.parts.sonar)return result(false,'Install a sonar before enabling Intelligent Auto Set.');s.career[key]=!s.career[key];if(key==='intelligentAutoSet'||key==='autoDeploy'&&s.career[key])s.intelligentSetRunout=0;if(key==='intelligentAutoSet'&&s.career[key])s.career.autoDeploy=false;if(key==='autoDeploy'&&s.career[key])s.career.intelligentAutoSet=false;return result(true,`${key==='intelligentAutoSet'?'Intelligent Auto Set':key==='autoDeploy'?'Auto set':'Auto haul'} ${s.career[key]?'enabled':'disabled'}.`);}
export function installedVesselValue(vessel){
 return boatById(vessel.boat).price+PARTS.filter(p=>p.rank<=(vessel.parts?.[p.key]||0)).reduce((total,p)=>total+p.price,0)
  +18000*(vessel.engine||0)+12000*(vessel.hold||0)+8000*(vessel.gear||0);
}
export function tradeValue(s){
 return Math.round(installedVesselValue({...s.career,engine:s.engine,hold:s.hold,gear:s.gear})*.65);
}
function vesselSnapshot(s){
 return {boat:s.career.boat,parts:{...s.career.parts},engine:s.engine,hold:s.hold,gear:s.gear,
  capacity:s.capacity,deck:s.deck,fuel:s.fuel,hull:s.hull,ice:iceLevel(s.ice),lostPots:s.lostPots||0,fishing:s.career.fishing};
}
function emptyVessel(s){
 return !s.cargo&&!s.salmon&&!rareCount(s)&&!s.pots.length&&!s.nets.length;
}
function activateVessel(s,vessel,berth){
 delete s.fleetCommand;
 const harbor=nearestQuay(s);
 const position=berth||{...quayPoint(0,-110,harbor),heading:harbor.heading};
 const {boat,parts={},engine=0,hold=0,gear=0,capacity,deck,fuel,hull,ice,lostPots=0}=vessel;
 Object.assign(s,position,{engine,hold,gear,capacity,deck,fuel,hull,ice:iceLevel(ice),lostPots,
  speed:0,desiredKnots:0,throttle:0,rudder:0,autopilot:null,skipperMission:null,
  intelligentSetRunout:0,moored:berth?{...berth}:null});
 Object.assign(s.career,{boat,parts,requiresDock:true,fishing:vessel.fishing==='salmon'&&boatById(boat).salmon?'salmon':'crab',
  autoDeploy:false,autoHaul:false,intelligentAutoSet:false});
}
function hireCaptain(s,vessel){
 const n=s.career.nextFleet++,hull=boatById(vessel.boat);
 const harbor=nearestQuay(s);
 const berth=harbor===QUAY?{x:270,y:40+(n%3)*20}:quayPoint(0,-160,harbor);
 s.career.fleet.push({...vessel,id:`fleet-${n}`,name:hull.name,...berth,heading:0,
  phase:'outbound',timer:0,pots:[],cargo:0,salmon:0,expenses:0,earnings:0,trips:0,request:null,
  fishing:vessel.fishing==='salmon'&&hull.salmon?'salmon':'crab',color:['#70c9df','#cda0ed','#ea859d','#91c97a'][n%4]});
}
export function buyBoat(s,id,disposition){
 ensureCareer(s);
 const b=BOATS.find(x=>x.id===id);
 if(!b||!['sell','captain','keep','dispatch'].includes(disposition))return result(false,'Choose an acquisition option.');
 if(!shopReady(s))return result(false,'Dock before buying or switching vessels.');
 if(disposition!=='dispatch'&&s.fleetCommand?.upgradeRequest?.status==='approved')return result(false,'Wait for the prepaid upgrade to be installed.');
 if(disposition!=='dispatch'&&!emptyVessel(s))return result(false,'Unload all catch and retrieve all fishing gear before changing vessels.');
 if(disposition!=='dispatch'&&b.id===s.career.boat)return result(false,'This is your current vessel.');
 const hiring=disposition==='captain'||disposition==='dispatch';
 const cost=b.price-(disposition==='sell'?tradeValue(s):0)+(hiring?25000:0);
 if(s.money<cost)return result(false,'Insufficient funds for this exchange.');
 if(hiring&&s.career.fleet.length>=100)return result(false,'Your fleet already has 100 vessels.');
 if(disposition==='keep'&&s.career.storedBoats.length>=100)return result(false,'Your storage already has 100 vessels.');
 const newVessel={boat:b.id,parts:{},engine:0,hold:0,gear:0,capacity:b.capacity,deck:b.pots,fuel:b.tank,hull:100,lostPots:0};
 s.money-=cost;
 if(disposition==='dispatch'){
  hireCaptain(s,newVessel);
  return result(true,`${b.name} commissioned with a hired captain.`);
 }
 if(disposition==='captain')hireCaptain(s,vesselSnapshot(s));
 if(disposition==='keep')s.career.storedBoats.push({...vesselSnapshot(s),id:`stored-${s.career.nextFleet++}`});
 if(s.career.firstBoatReward==='ready')s.career.firstBoatReward='pending';
 activateVessel(s,newVessel,null);
 return result(true,`${b.name} commissioned. Dock before using the harbor shop.`);
}
export function captainAvailable(s,boat){
 return boat.phase==='service'&&inHarbor(boat)&&nearestQuay(s)===nearestQuay(boat)
  &&!boat.salePending&&!boat.cargo&&!boat.salmon&&!boat.pots.length
  &&!rareCount(boat)&&boat.upgradeRequest?.status!=='approved';
}
export function switchOwnedBoat(s,id){
 ensureCareer(s);
 if(s.fleetCommand?.upgradeRequest?.status==='approved')return result(false,'Wait for the prepaid upgrade to be installed.');
 if(!shopReady(s)||!s.moored||!emptyVessel(s))return result(false,'Dock, unload all catch and retrieve all fishing gear before switching.');
 const index=s.career.storedBoats.findIndex(b=>b.id===id);
 const captain=index<0?s.career.fleet.find(b=>b.id===id):null;
 if(captain&&!captainAvailable(s,captain))return result(false,'The captain must be idle in this harbor before you take command.');
 const next=s.career.storedBoats[index]||captain;
 if(!next)return result(false,'Unknown stored vessel.');
 if(captain&&s.career.storedBoats.length>=100)return result(false,'Your storage already has 100 vessels.');
 const berth=chooseBerth({...s,career:{...s.career,boat:next.boat}},
  [...s.career.fleet.filter(b=>b!==captain),...(s.remotePlayers||[])]);
 if(!berth)return result(false,'No berth available.');
 const previous={...vesselSnapshot(s),id:captain?`stored-${s.career.nextFleet++}`:id};
 if(captain){
  s.career.fleet=s.career.fleet.filter(b=>b!==captain);
  s.career.storedBoats.push(previous);
 }else s.career.storedBoats[index]=previous;
 const equipped=captain?vesselStats({...captain,career:{...s.career,boat:captain.boat,parts:captain.parts}}):null;
 activateVessel(s,equipped?{...next,deck:Math.max(0,equipped.potCapacity-(next.lostPots||0))}:next,berth);
 return result(true,`Now aboard ${boatById(next.boat).name}.`);
}
export function creditLimit(s){return Math.min(2000000,Math.max(50000,Math.round(boatById(s.career?.boat).price*.5)));}
export function takeLoan(s,amount){ensureCareer(s);if(!Number.isFinite(amount)||amount<1000||Math.round(amount*1.1)>creditLimit(s)-s.career.debt)return result(false,'Loan exceeds available credit (including existing debt).');s.money+=amount;s.career.debt+=Math.round(amount*1.1);s.career.borrowed+=amount;return result(true,`Loan ${Math.round(amount).toLocaleString('en-US')} kr received. Fixed 10% fee; 15% of landings repays debt.`);}
export function settleLanding(s,gross){if(!s.career)ensureCareer(s);gross=Math.max(0,finite(gross));const repaid=Math.min(s.career.debt,gross*.15);s.career.debt-=repaid;s.career.repaid+=repaid;s.money+=gross-repaid;return {gross,repaid,net:gross-repaid};}
