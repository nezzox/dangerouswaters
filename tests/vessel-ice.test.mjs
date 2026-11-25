import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,handlePot,weatherAt} from '../simulation.mjs';
import {createCrew,commandCrew,stepCrew,crewPose} from '../crew.mjs';
import {vesselStats} from '../career.mjs';
import {restoreSeason,seasonJSON} from '../saves.mjs';
import {DEICE_SECONDS,iceRate} from '../vessel-ice.mjs';
const storm={temperature:-7,wind:37,waves:4,rain:0,snow:.7,fog:0,front:.8};
function atSea(){
 const s=createGame();
 Object.assign(s,{x:1000,y:500,heading:0,paused:false,realWeather:{value:storm},ice:.71,speed:5,desiredKnots:11});
 s.career.nextIncident=1e9;
 return s;
}
test('freezing spray accumulates faster in seas, while warm air melts ice and shelter prevents buildup',()=>{
 assert(iceRate(storm,5)>iceRate({...storm,wind:5,waves:.5,snow:0},1));
 assert(iceRate({...storm,temperature:2},5)<0);
 assert.equal(iceRate(storm,5,true),0);
 assert(Number.isFinite(weatherAt(6).temperature));
 const s=atSea();s.realWeather={value:{...storm,temperature:6}};
 step(s,1);assert(s.ice<.71);assert.equal(s.deckJob,null);
});
test('vessel stops before chipping, blocks fishing, clears ice and keeps the same autopilot route',()=>{
 const s=atSea(),route=[{x:4000,y:500},{x:5000,y:500}];
 s.autopilot={...route[1],route,index:0};
 for(let i=0;i<4;i++)step(s,1);
 assert.equal(s.deckJob.kind,'deice');assert.equal(s.deckJob.elapsed,0);assert(s.speed>0);assert.equal(s.throttle,0);
 const pots=s.deck;handlePot(s);assert.equal(s.deck,pots);
 for(let i=0;i<40&&s.deckJob;i++){step(s,1);if(s.deckJob?.elapsed>0)assert.equal(s.speed,0);}
 assert.equal(s.deckJob,null);assert.equal(s.ice,0);assert.equal(s.autopilot.route,route);assert.equal(s.autopilot.index,0);
 step(s,1);assert(s.speed>0);assert.equal(s.desiredKnots,11);
});
test('old saves default to an ice-free boat, and valid de-icing resumes after loading',()=>{
 const s=atSea();
 for(let i=0;i<24;i++)step(s,1);
 const raw=JSON.parse(seasonJSON(s)),loaded=restoreSeason(raw);
 assert.equal(loaded.ice,s.ice);assert.equal(loaded.deckJob.duration,DEICE_SECONDS);assert.equal(loaded.deckJob.elapsed,s.deckJob.elapsed);
 raw.deckJob.initialIce=2;assert.equal(restoreSeason(raw).deckJob,null);
 delete raw.ice;assert.equal(restoreSeason(raw).ice,0);
});
test('deckhands find reachable ice stations and swing ice hammers',()=>{
 const s=atSea(),crew=createCrew(),job={kind:'deice',duration:DEICE_SECONDS,elapsed:8};
 const work={design:vesselStats(s),deck:s.deck,operation:job};
 assert(commandCrew(crew,'deice',work));
 for(let i=0;i<15;i++)stepCrew(crew,1,3,work);
 const workers=crew.members.filter(m=>m.working);
 assert(workers.length>=2);
 assert(workers.every(m=>crewPose(m,crew.elapsed,3,job).action==='ice'));
});
