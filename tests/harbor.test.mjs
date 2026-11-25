import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,dock,step,BERTH,service} from '../simulation.mjs';
test('docking moves to the berth, unloads after crane work, and pays exactly once across save resume',()=>{
 let s=createGame();s.paused=false;s.cargo=240;const money=s.money;dock(s);assert.equal(s.cargo,240);assert.equal(s.money,money);assert.equal(s.deckJob.kind,'unload');step(s,1);assert(s.deckJob.elapsed>0);const fuel=s.fuel;service(s,'fuel');assert.equal(s.fuel,fuel);
 for(let i=0;i<12;i++)step(s,1);s=JSON.parse(JSON.stringify(s));delete s.deckJob.route;for(let i=0;i<400;i++)step(s,1);assert.equal(s.deckJob,null);assert.equal(s.cargo,0);assert.equal(s.money,money+240*65);assert.equal(s.landed,240);assert(Math.abs(s.x-BERTH.x)<1);for(let i=0;i<20;i++)step(s,1);assert.equal(s.money,money+240*65);
});
test('paused docking never advances or pays early',()=>{const s=createGame();s.cargo=90;dock(s);const before=JSON.stringify(s);step(s,1);assert.equal(JSON.stringify(s),before);});

test('the retired dock location has no invisible pier hitbox',async()=>{const {vesselIntersectsHarbor}=await import('../harbor.mjs');assert(!vesselIntersectsHarbor({x:30,y:90,heading:0}));});

test('the full hull stays clear through docking turns and the final backing maneuver',async()=>{const {buildDockRoute,dockRouteDuration,dockingPose,vesselIntersectsHarbor}=await import('../harbor.mjs');for(const x of [5,60,125,180])for(const y of [-80,60,79,100,200])for(const heading of [0,Math.PI/4,Math.PI/2,Math.PI]){const start={x,y,heading};if(vesselIntersectsHarbor(start))continue;const route=buildDockRoute(start),duration=dockRouteDuration(route);for(let t=0;t<=duration;t+=.2)assert(!vesselIntersectsHarbor(dockingPose(route,t)),JSON.stringify({start,t,pose:dockingPose(route,t)}));}});
test('normal navigation can cross the old timber dock footprint',async()=>{const {vesselIntersectsHarbor}=await import('../harbor.mjs');const s=createGame();Object.assign(s,{paused:false,x:140,y:90,heading:Math.PI,speed:2,desiredKnots:4,weatherOverride:'calm'});for(let i=0;i<400;i++){step(s,.05);assert(!vesselIntersectsHarbor(s));}assert(s.x<100);});
test('every purchasable hull clears the harbor throughout its docking route',async()=>{const {BOATS}=await import('../catalog.mjs'),{buildDockRoute,dockRouteDuration,dockingPose,vesselIntersectsHarbor}=await import('../harbor.mjs');for(const boat of BOATS)for(const start of [{x:180,y:100,heading:-Math.PI/2},{x:60,y:40,heading:0}]){const career={boat:boat.id},s={...start,career};if(vesselIntersectsHarbor(s))continue;const route=buildDockRoute(s),end=dockRouteDuration(route);for(let t=0;t<=end;t+=.5)assert(!vesselIntersectsHarbor({...dockingPose(route,t),career}),`${boat.name} at ${t}`);}});
test('an aligned vessel closes directly onto the new geographic quay',async()=>{const {buildDockRoute,dockingPose,dockRouteDuration,quayPoint}=await import('../harbor.mjs');const start={...quayPoint(0,-30),heading:BERTH.heading},route=buildDockRoute(start);let prior=Infinity;for(let t=0;t<=dockRouteDuration(route);t+=.1){const p=dockingPose(route,t),d=Math.hypot(p.x-BERTH.x,p.y-BERTH.y);assert(d<=prior+.0001);assert(Math.abs(p.heading-BERTH.heading)<.001);prior=d;}});
test('completed docking secures position and heading until propulsion is requested',()=>{const s=createGame();s.paused=false;s.weatherOverride='rough';dock(s);while(s.deckJob)step(s,1);const at={x:s.x,y:s.y,heading:s.heading};s.rudder=1;for(let i=0;i<100;i++)step(s,1);assert.deepEqual({x:s.x,y:s.y,heading:s.heading},at);s.desiredKnots=3;step(s,1);assert.equal(s.deckJob?.kind,'undock');while(s.deckJob)step(s,1);step(s,1);assert(s.speed>0);assert(!s.moored);});
test('redocking at the exact berth survives save/restore without a zero-length approach',async()=>{const {restoreSeason,seasonJSON}=await import('../saves.mjs');let s=createGame();s.paused=false;dock(s);while(s.deckJob)step(s,1);s.cargo=10;dock(s);assert(s.deckJob.approach>0);s=restoreSeason(JSON.parse(seasonJSON(s)));assert(s.deckJob);s.paused=false;for(let i=0;i<60;i++)step(s,1);assert.equal(s.cargo,0);assert(s.moored);});

test('legacy moorings migrate onto the new quay without changing money or cargo',async()=>{const {restoreSeason,seasonJSON}=await import('../saves.mjs');const s=createGame();Object.assign(s,{x:61.9,y:79,heading:0,money:62495,cargo:120,moored:{x:61.9,y:79,heading:0}});const t=restoreSeason(JSON.parse(seasonJSON(s)));assert.equal(t.money,62495);assert.equal(t.cargo,120);assert.deepEqual(t.moored,BERTH);assert.equal(t.x,BERTH.x);assert.equal(t.heading,BERTH.heading);});

test('unfinished legacy unloading re-plans at the new quay and pays once',async()=>{const {restoreSeason,seasonJSON}=await import('../saves.mjs');let s=createGame();s.paused=false;s.cargo=100;dock(s);const raw=JSON.parse(seasonJSON(s));delete raw.deckJob.quayVersion;raw.deckJob.elapsed=10;raw.x=100;raw.y=79;raw.heading=0;s=restoreSeason(raw);assert.equal(s.deckJob.elapsed,0);assert.equal(s.deckJob.quayVersion,2);assert.equal(s.cargo,100);const money=s.money;s.paused=false;for(let i=0;i<500&&s.deckJob;i++)step(s,1);assert.equal(s.cargo,0);assert.equal(s.money,money+6500);s=restoreSeason(JSON.parse(seasonJSON(s)));s.paused=false;for(let i=0;i<10;i++)step(s,1);assert.equal(s.money,money+6500);});
test('six harbor berths choose a free clear location and survive saving',async()=>{const {BERTHS,chooseBerth,vesselIntersectsHarbor}=await import('../harbor.mjs'),{restoreSeason,seasonJSON}=await import('../saves.mjs');assert.equal(BERTHS.length,6);const s=createGame(),occupied=[];for(let i=0;i<6;i++){const berth=chooseBerth(s,occupied);assert(berth,`berth ${i}`);assert(!vesselIntersectsHarbor({...s,...berth}));occupied.push({...berth,boat:'nordvind'});const copy=restoreSeason(JSON.parse(seasonJSON({...s,...berth,moored:berth})));assert.deepEqual(copy.moored,berth);}assert.equal(chooseBerth(s,occupied),null);});
test('berth reservations prevent another vessel selecting an incoming berth',async()=>{const {chooseBerth,BERTHS}=await import('../harbor.mjs');const s=createGame();const berth=chooseBerth(s,[{x:1000,y:1000,boat:'nordvind',berth:BERTHS[0]}]);assert.notDeepEqual(berth,BERTHS[0]);});
test('get unstuck finds safe water without changing cargo or money',async()=>{const {getUnstuck}=await import('../simulation.mjs'),{vesselIntersectsHarbor}=await import('../harbor.mjs');const s=createGame();Object.assign(s,BERTH,{moored:{...BERTH},cargo:20,money:12345});s.remotePlayers=[{id:'remote-test',boat:'nordvind',...BERTH,parts:{},pots:[]}];assert.equal(getUnstuck(s),true);assert(!vesselIntersectsHarbor(s));assert(Math.hypot(s.x-BERTH.x,s.y-BERTH.y)>15);assert.equal(s.cargo,20);assert.equal(s.money,12345);assert.equal(s.moored,null);});
test('loading a docking job resumes toward its reserved berth',async()=>{const {BERTHS}=await import('../harbor.mjs'),{restoreSeason,seasonJSON}=await import('../saves.mjs');let s=createGame();s.paused=false;s.cargo=10;s.remotePlayers=[{...BERTHS[0],id:'remote-a',boat:'nordvind',parts:{},pots:[]}];dock(s);assert(s.deckJob);assert.notDeepEqual(s.deckJob.berth,BERTHS[0]);const berth=s.deckJob.berth;s.remotePlayers=[];s=restoreSeason(JSON.parse(seasonJSON(s)));s.paused=false;for(let i=0;i<1000&&s.deckJob;i++)step(s,1);assert(!s.deckJob);assert(Math.hypot(s.x-berth.x,s.y-berth.y)<1);});
test('both enlarged service quays can fit six of the largest vessels alongside',async()=>{
 const {PORT_QUAYS,berthsAt,chooseBerth,vesselIntersectsHarbor}=await import('../harbor.mjs');
 const {BOATS}=await import('../catalog.mjs');
 const largest=BOATS.reduce((a,b)=>b.length>a.length?b:a);
 for(const quay of PORT_QUAYS){
  const s=createGame();Object.assign(s,quay);s.career.boat=largest.id;
  const occupied=[];
  for(const berth of berthsAt(quay)){
   assert(!vesselIntersectsHarbor({...s,...berth}));
   const free=chooseBerth(s,occupied);
   assert(free);
   occupied.push({...free,boat:largest.id});
  }
  assert.equal(chooseBerth(s,occupied),null);
 }
});

test('bent Dutch Harbor quay moves the outer berth clear and restores its old coordinates',async()=>{
 const {BERTHS,quayPoint,buildDockRoute,dockRouteDuration,dockingPose,vesselIntersectsHarbor}=await import('../harbor.mjs');
 const {BOATS}=await import('../catalog.mjs');
 const {restoreSeason,seasonJSON}=await import('../saves.mjs');
 const former={...quayPoint(68,-12),heading:BERTH.heading},outer=BERTHS[1];
 assert.deepEqual({x:outer.x,y:outer.y},quayPoint(68,-17));
 for(const boat of BOATS){
  const s=createGame();s.career.boat=boat.id;Object.assign(s,former,{moored:former,cargo:12});
  const restored=restoreSeason(JSON.parse(seasonJSON(s)));
  assert.deepEqual(restored.moored,outer);
  assert.equal(restored.cargo,12);
  assert(!vesselIntersectsHarbor(restored),boat.id);
  const approach={...quayPoint(68,-40),heading:outer.heading,career:s.career};
  const route=buildDockRoute(approach,outer),end=dockRouteDuration(route);
  assert(end>0);
  for(let t=0;t<=end;t+=.5)assert(!vesselIntersectsHarbor({...dockingPose(route,t),career:s.career}),boat.id);
 }
});
