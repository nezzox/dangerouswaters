import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startDroneSet,step,setRudder,handlePot,releasePoint} from '../simulation.mjs';
const setup=()=>{
 const s=createGame();
 Object.assign(s,{x:1200,y:500,heading:0,paused:false,weatherOverride:'calm'});
 s.career.parts.droneSurvey=1;s.career.parts.sonar=1;s.career.skills.crab=5;s.career.nextIncident=1e9;
 return s;
};
const fixed=()=>1;
test('Drone Survey sails to every mark and sets one normal baited pot per mark',()=>{
 const s=setup(),marks=[{x:1480,y:500},{x:1810,y:550}],money=s.money,deck=s.deck;
 s.droneSurvey={origin:{x:s.x,y:s.y},hour:s.hour,points:marks};
 assert(startDroneSet(s,marks));
 assert.deepEqual(s.autopilot.waypoints,marks);
 assert.equal(s.autopilot.route.filter(p=>p.surveyMark).length,2);
 assert.equal(s.droneSurvey.points.length,2);
 let steps=0,observedSetting=false; const releaseSpeeds=[]; let lastRelease;
 const tick=()=>{step(s,.25,fixed);const released=s.deckJob?.released;if(released&&released!==lastRelease){releaseSpeeds.push(s.speed);lastRelease=released;}};
 while(!s.pots.length&&steps++<5000){tick();if(s.deckJob?.kind==='deploy'&&!s.pots.length){observedSetting=true;assert.equal(s.droneSurvey.points.length,2);}}
 assert(observedSetting);
 assert.equal(s.pots.length,1);
 assert.equal(s.droneSurvey.points.length,1);
 while(s.skipperMission&&steps++<8000)tick();
 assert.equal(releaseSpeeds.length,2);
 assert(releaseSpeeds.every(speed=>speed>.6),String(releaseSpeeds));
 assert(!s.skipperMission,s.message);
 assert.equal(s.pots.length,2,s.message);
 assert.equal(s.droneSurvey.points.length,0);
 assert.equal(s.deck,deck-2);assert(s.money<money);assert.equal(s.autopilot,null);
 for(const mark of marks)assert.equal(s.pots.filter(p=>Math.hypot(p.x-mark.x,p.y-mark.y)<24).length,1);
});
test('the survey stops when out of pots, and manual helm cancels without an extra drop',()=>{
 const mark={x:1500,y:580},s=setup();s.deck=0;
 assert(!startDroneSet(s,[mark]));assert(!s.autopilot);assert.equal(s.pots.length,0);
 s.deck=2;assert(startDroneSet(s,[mark]));setRudder(s,8);
 for(let i=0;i<100;i++)step(s,.2,fixed);
 assert.equal(s.pots.length,0);assert.equal(s.skipperMission,null);
});


test('an unavailable pot leaves the unvisited mark and an ordinary manual drop clears its own mark',()=>{
 const s=setup(),marks=[{x:1380,y:500},{x:1610,y:550}];
 s.deck=1;s.droneSurvey={origin:{x:s.x,y:s.y},hour:s.hour,points:marks};
 assert(startDroneSet(s,marks));
 for(let i=0;i<5000&&s.skipperMission;i++)step(s,.25,fixed);
 assert.equal(s.pots.length,1,s.message);assert.deepEqual(s.droneSurvey.points,[marks[1]]);
 assert.match(s.message,/out of pots/);
 const m=setup(),target=releasePoint(m),other={x:target.x+300,y:target.y};
 m.droneSurvey={origin:{x:m.x,y:m.y},hour:m.hour,points:[target,other]};
 handlePot(m);for(let i=0;i<80&&m.deckJob;i++)step(m,.25,fixed);
 assert.equal(m.pots.length,1);assert.deepEqual(m.droneSurvey.points,[other]);
});

test('a restored owned drone cannot launch without a sounder on the active vessel',async()=>{
 const {seasonJSON,restoreSeason}=await import('../saves.mjs');
 const s=setup();s.career.parts.sonar=0;s.career.storedBoats=[{id:'stored-1',boat:s.career.boat,parts:{sonar:2},deck:8,fuel:500,hull:100,capacity:900}];
 const loaded=restoreSeason(JSON.parse(seasonJSON(s))),mark={x:1480,y:500};
 assert.equal(loaded.career.parts.droneSurvey,1);
 assert.equal(loaded.career.storedBoats[0].parts.sonar,2);
 assert.equal(startDroneSet(loaded,[mark]),false);
 loaded.career.parts.sonar=1;
 assert.equal(startDroneSet(loaded,[mark]),true);
});

test('eight survey marks are cleared by actual moving releases on one plotted route',async()=>{
 const {crabHotspot,groundsAt}=await import('../fishing-grounds.mjs');
 const {scanCrab}=await import('../drone-survey.mjs');
 const s=setup(),hour=44,core=crabHotspot(groundsAt(hour)[0],5,hour);
 Object.assign(s,{x:core.x+180,y:core.y+120,hour,heading:3,deck:8});
 const points=scanCrab(s,hour,s.deck);
 assert.equal(points.length,8);
 s.droneSurvey={origin:{x:s.x,y:s.y},hour,points};
 assert(startDroneSet(s,points));
 const releases=new Set();
 for(let i=0;i<7000&&s.skipperMission;i++){
  step(s,.25,fixed);
  const job=s.deckJob;
  if(job?.released&&!releases.has(job)){
   releases.add(job);
   assert(s.speed>.6,'crew dropped a pot while stationary');
   assert(s.speed*1.94384<=5,'crew exceeded the normal setting speed');
   assert(Math.hypot(job.released.x-job.surveyTarget.x,job.released.y-job.surveyTarget.y)<24);
  }
 }
 assert.equal(releases.size,8);
 assert.equal(s.pots.length,8);
 assert.equal(s.droneSurvey.points.length,0);
 assert.equal(s.skipperMission,null);
});
