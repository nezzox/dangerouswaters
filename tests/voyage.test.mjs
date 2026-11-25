import {test} from 'node:test';import assert from 'node:assert/strict';
import {createGame,handlePot,startDroneSet,cancelDroneSet} from '../simulation.mjs';import {createWake} from '../wake.mjs';import {advanceVoyage} from '../voyage.mjs';
test('15x advances boat, season, fishing work and wake on the same timeline as fifteen normal steps',()=>{const a=createGame();Object.assign(a,{paused:false,x:800,y:300,heading:0,desiredKnots:2,speed:1,weatherOverride:'calm'});handlePot(a);const b=structuredClone(a),wa=createWake(),wb=createWake();let visual=0;for(let i=0;i<20;i++)visual+=advanceVoyage(a,wa,.05,15);for(let i=0;i<300;i++)advanceVoyage(b,wb,.05,1);assert.equal(visual,15);for(const k of ['x','y','hour','speed','fuel'])assert(Math.abs(a[k]-b[k])<1e-8,k);assert.equal(a.pots.length,1);assert.deepEqual(wa,wb);});
test('pause freezes every simulation clock at every multiplier',()=>{const s=createGame(),w=createWake(),before=JSON.stringify(s);assert.equal(advanceVoyage(s,w,.05,15),0);assert.equal(JSON.stringify(s),before);assert.equal(w.time,0);});
test('threefold speed advances the same voyage, fuel, clock and wake as three ordinary intervals',()=>{const a=createGame();Object.assign(a,{paused:false,x:1200,y:500,heading:0,desiredKnots:4,speed:2,weatherOverride:'calm'});a.career.nextIncident=1e9;const b=structuredClone(a),wa=createWake(),wb=createWake();for(let i=0;i<30;i++)advanceVoyage(a,wa,.05,3);for(let i=0;i<90;i++)advanceVoyage(b,wb,.05,1);for(const key of ['x','y','hour','fuel','speed'])assert(Math.abs(a[key]-b[key])<1e-8,key);assert(Math.abs(wa.time-wb.time)<1e-8);assert.equal(wa.points.length,wb.points.length);});

test('a drone survey uses the same shared voyage pacing before, during and after its route',()=>{
 const s=createGame(),w=createWake();
 Object.assign(s,{paused:false,x:1200,y:500,heading:0,weatherOverride:'calm'});
 s.career.nextIncident=1e9;
 const rateBefore=advanceVoyage(s,w,.05,3);
 assert(Math.abs(rateBefore-.15)<1e-9);
 const mark={x:1480,y:500};
 s.career.parts.droneSurvey=1;s.career.parts.sonar=1;s.career.skills.crab=5;
 assert(startDroneSet(s,[mark]));
 s.multiplayerOnline=true;s.worldHour=44;
 assert(Math.abs(advanceVoyage(s,w,.05,3)-rateBefore)<1e-9);
 assert.equal(s.worldHour,44);
 s.incident={system:'steering',remaining:30};
 assert(Math.abs(advanceVoyage(s,w,.05,3)-.15)<1e-9);
 s.incident=null;
 assert(cancelDroneSet(s));
 assert(Math.abs(advanceVoyage(s,w,.05,3)-.15)<1e-9);
});

test('an eight-mark survey completes all drops on normal voyage time',()=>{
 const s=createGame(),w=createWake();
 Object.assign(s,{paused:false,x:1200,y:500,heading:0,weatherOverride:'calm'});
 Object.assign(s.career.parts,{droneSurvey:1,sonar:1});
 s.career.skills.crab=5;s.career.nextIncident=1e9;
 const marks=Array.from({length:8},(_,i)=>({x:1400+180*i,y:500}));
 s.droneSurvey={origin:{x:s.x,y:s.y},hour:s.hour,points:marks};
 assert(startDroneSet(s,marks));
 let ticks=0;
 while(s.skipperMission&&ticks++<3000)advanceVoyage(s,w,.1,3);
 assert.equal(s.pots.length,8);
 assert.equal(s.droneSurvey.points.length,0);
 assert.equal(s.skipperMission,null);
 assert(Math.abs(advanceVoyage(s,w,.1,3)-.3)<1e-9);
});
