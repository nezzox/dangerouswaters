import {test} from 'node:test';import assert from 'node:assert/strict';import {createGame,setAutopilot,BERTH,step} from '../simulation.mjs';import {startWaypointTravel,advanceWaypointTravel} from '../time-to-waypoint.mjs';
test('time travel follows autopilot, spends fuel and stops at the next waypoint',()=>{const s=createGame();Object.assign(s,{x:1200,y:500,heading:0,paused:false,weatherOverride:'calm',desiredKnots:6});s.career.nextIncident=1e9;assert(setAutopilot(s,2000,500));assert(setAutopilot(s,2600,500,true));const start=s.hour,fuel=s.fuel,travel=startWaypointTravel(s);assert(travel);let result;for(let i=0;i<100&&!result?.done;i++)result=advanceWaypointTravel(s,travel,100);assert.equal(result.reason,'arrived');assert.equal(s.hour,start);assert(s.fuel<fuel);assert(Math.hypot(s.x-2000,s.y-500)<30);assert(s.autopilot);assert.equal(s.autopilot.waypoints.length,1);});
test('time travel refuses absent route, pauses and active incidents',()=>{const s=createGame();assert.equal(startWaypointTravel(s),null);Object.assign(s,{paused:false,x:1200,y:500,heading:0,desiredKnots:6});assert(setAutopilot(s,2000,500));s.incident={system:'engine',remaining:50};assert.equal(startWaypointTravel(s),null);s.incident=null;const travel=startWaypointTravel(s);s.fuel=0;assert.equal(advanceWaypointTravel(s,travel).reason,'interrupted');});
test('skipping a Return and Dock route spends fuel and hands off to normal docking',async()=>{
 const {skipperCommand,step}=await import('../simulation.mjs');
 const s=createGame();
 Object.assign(s,{x:1200,y:500,paused:false,weatherOverride:'calm'});
 s.career.skills.steer=1;
 s.career.nextIncident=1e9;
 assert(skipperCommand(s,'home'));
 const fuel=s.fuel,hour=s.hour;
 const travel=startWaypointTravel(s);
 assert(travel);
 assert.equal(advanceWaypointTravel(s,travel).reason,'arrived');
 assert(s.fuel<fuel);
 assert.equal(s.hour,hour);
 assert.equal(s.skipperMission.stage,'berth');
 step(s,.1);
 assert.equal(s.deckJob?.kind,'unload');
});

function castOffToWaypoint(){
 const s=createGame();
 Object.assign(s,BERTH,{moored:{...BERTH},paused:false,weatherOverride:'calm'});
 s.career.nextIncident=1e9;
 assert(setAutopilot(s,1200,500));
 assert.equal(s.deckJob?.kind,'undock');
 return s;
}

test('skip queued from a docked route completes the cast-off before jumping to the first waypoint',()=>{
 const s=castOffToWaypoint();
 assert(setAutopilot(s,2000,500,true));
 const travel=startWaypointTravel(s),fuel=s.fuel;
 assert(travel);
 assert.deepEqual(advanceWaypointTravel(s,travel),{done:false,reason:'casting-off',elapsed:0});
 assert.equal(s.x,BERTH.x);
 assert.equal(s.fuel,fuel);
 for(let i=0;i<200&&s.deckJob;i++)step(s,.5);
 assert.equal(s.deckJob,null);
 assert(Math.hypot(s.x-1200,s.y-500)>100,'normal cast-off must not teleport the vessel');
 const hour=s.hour;
 assert.equal(advanceWaypointTravel(s,travel).reason,'arrived');
 assert.equal(s.hour,hour);
 assert(s.fuel<fuel);
 assert.deepEqual([s.x,s.y],[1200,500]);
 assert.deepEqual(s.autopilot.waypoints,[{x:2000,y:500}]);
});

test('queued skip interrupts if the route is canceled, and refuses other active deck jobs',()=>{
 const s=castOffToWaypoint(),travel=startWaypointTravel(s);
 assert(travel);
 s.autopilot=null;
 assert.equal(advanceWaypointTravel(s,travel).reason,'interrupted');
 const busy=castOffToWaypoint();
 busy.deckJob={kind:'haul'};
 assert.equal(startWaypointTravel(busy),null);
});
