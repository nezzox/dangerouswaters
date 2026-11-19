import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,handlePot,dock,upgrade,catchAt,weatherAt,potAction,POT_RANGE} from '../simulation.mjs';
test('boat accelerates gradually and coasts after throttle is released',()=>{
 const s=createGame();s.paused=false;s.desiredKnots=12;step(s,1);assert(s.speed>0&&s.speed<6);const v=s.speed;s.desiredKnots=0;step(s,.1);assert(s.speed>0&&s.speed<v);
});
test('a deployed pot costs bait, soaks, returns catch and can be sold only in port',()=>{
 const s=createGame();s.paused=false;s.x=800;s.y=-400;let money=s.money;handlePot(s);assert.equal(s.pots.length,0);assert(s.deckJob);for(let i=0;i<14;i++)step(s,1);assert.equal(s.pots.length,1);assert.equal(s.deck,7);assert(s.money<money);
 const pot=s.pots[0];pot.legacyAbundance=1;s.hour=pot.setAt+3;handlePot(s);assert.equal(s.cargo,0);for(let i=0;i<32;i++)step(s,1);assert.equal(s.pots.length,0);assert.equal(s.deck,8);assert(s.cargo>0);
 const load=s.cargo;dock(s);assert.equal(s.cargo,load);s.x=160;s.y=80;money=s.money;dock(s);assert.equal(s.cargo,load);for(let i=0;i<400;i++)step(s,1);assert.equal(s.cargo,0);assert(s.money>money);
});
test('fast deployment and purchases without funds are rejected without losing money or equipment',()=>{
 const s=createGame();s.speed=4;const money=s.money;handlePot(s);assert.equal(s.deck,8);assert.equal(s.money,money);s.money=0;assert.equal(upgrade(s,'hold'),false);assert.equal(s.capacity,900);
});
test('weather is repeatable, bounded, and catch rewards soaking at viable depth',()=>{
 assert.deepEqual(weatherAt(10),weatherAt(10));for(let h=0;h<72;h+=.5){const w=weatherAt(h);assert(w.wind>=0&&w.wind<60);assert(w.fog>=0&&w.fog<=1);}
 assert.equal(catchAt({x:800,y:-400,setAt:5,legacyAbundance:1},5),0);assert(catchAt({x:800,y:-400,setAt:5,legacyAbundance:1},8)>0);
});
test('empty fuel cannot propel boat and simulation stays finite',()=>{
 const s=createGame();s.paused=false;s.fuel=0;s.desiredKnots=12;for(let i=0;i<100;i++)step(s,.05);assert(s.speed<.1);assert(Number.isFinite(s.x)&&Number.isFinite(s.heading));
});

test('pot interaction uses the exact displayed range and cannot overlap deck operations',()=>{const s=createGame();s.x=800;s.y=0;s.pots=[{id:1,x:800+POT_RANGE-1,y:0,setAt:1}];assert(potAction(s).inRange);s.pots[0].x=800+POT_RANGE+1;assert(!potAction(s).inRange);handlePot(s);const before=JSON.stringify(s.deckJob),money=s.money;handlePot(s);assert.equal(JSON.stringify(s.deckJob),before);assert.equal(s.money,money);});
test('speed governor approaches the requested knots without instant acceleration',()=>{const s=createGame();s.paused=false;s.weatherOverride='calm';s.x=-32000;s.y=-44000;s.career.nextIncident=1e6;s.desiredKnots=6;for(let i=0;i<400;i++)step(s,1);assert(Math.abs(s.speed*1.94384-6)<.01);});
