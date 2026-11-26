import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step} from '../simulation.mjs';
import {rollOverboard,settleOverboard,dispatchReplacement,stepOverboard} from '../man-overboard.mjs';
test('rare casualty stops the ship, covers only the shortfall and releases the helm after replacement',()=>{
 const state={x:1000,y:500,money:50000,speed:3,career:{borrowed:0,debt:0}};
 assert.equal(rollOverboard(state,1,()=>1/2500),false);
 assert(rollOverboard(state,-1,()=>0));
 assert.equal(state.speed,0);
 stepOverboard(state,5);
 assert.equal(state.overboard.phase,'film');
 settleOverboard(state);
 settleOverboard(state);
 assert.equal(state.money,0);
 assert.equal(state.career.borrowed,100000);
 assert.equal(state.career.debt,110000);
 dispatchReplacement(state,{x:0,y:0});
 assert(stepOverboard(state,state.overboard.flightSeconds));
 assert.equal(state.overboard.phase,'flight');
 stepOverboard(state,12);
 assert.equal(state.overboard,null);
});


test('live wind and waves increase the overboard risk once per completed pot operation',()=>{
 const run=(kind,wind,waves,draw=.0009)=>{
  const s=createGame();
  const weather={wind,waves,rain:0,fog:0,front:0,temperature:4};
  Object.assign(s,{x:1000,y:500,paused:false,realWeather:{value:weather},pots:kind==='haul'?[{id:1,x:1005,y:500,setAt:0}]:[],deckJob:{kind,duration:2,elapsed:0,potId:1,catchKg:10,side:-1}});
  s.career.nextIncident=1e9;
  let rolls=0;
  const random=()=>{rolls++;return draw;};
  step(s,1,random);
  assert.equal(rolls,0);
  step(s,1,random);
  assert.equal(rolls,1);
  assert.equal(s.deckJob,null);
  assert.equal(s.pots.length,kind==='haul'?0:1);
  return s.overboard;
 };
 for(const kind of ['deploy','haul']){
  assert(!run(kind,7,.5));
  assert.equal(run(kind,42,.5)?.side,-1);
  assert.equal(run(kind,7,5.5)?.side,-1);
  assert.equal(run(kind,42,5.5,.0018)?.side,-1);
  assert(!run(kind,150,20,.002));
 }
});

test('rough weather does not roll for an overboard event while cruising',()=>{
 const s=createGame();
 Object.assign(s,{x:1000,y:500,paused:false,speed:2,desiredKnots:5,weatherOverride:'rough'});
 step(s,1,()=>assert.fail('rolled without handling a pot'));
 assert(!s.overboard);
});
