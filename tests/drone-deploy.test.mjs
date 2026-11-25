import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startDroneSet,step,setRudder,handlePot,releasePoint} from '../simulation.mjs';
const setup=()=>{
 const s=createGame();
 Object.assign(s,{x:1200,y:500,heading:0,paused:false,weatherOverride:'calm'});
 s.career.parts.droneSurvey=1;s.career.nextIncident=1e9;
 return s;
};
const fixed=()=>1;
test('Drone Survey sails to every mark and sets one normal baited pot per mark',()=>{
 const s=setup(),marks=[{x:1480,y:500},{x:1810,y:550}],money=s.money,deck=s.deck;
 s.droneSurvey={origin:{x:s.x,y:s.y},hour:s.hour,points:marks};
 assert(startDroneSet(s,marks));
 assert.equal(s.droneSurvey.points.length,2);
 let steps=0,observedSetting=false;
 while(!s.pots.length&&steps++<5000){step(s,.25,fixed);if(s.deckJob?.kind==='deploy'&&!s.pots.length){observedSetting=true;assert.equal(s.droneSurvey.points.length,2);}}
 assert(observedSetting);
 assert.equal(s.pots.length,1);
 assert.equal(s.droneSurvey.points.length,1);
 while(s.skipperMission&&steps++<8000)step(s,.25,fixed);
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
