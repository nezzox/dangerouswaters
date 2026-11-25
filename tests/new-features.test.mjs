import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOATS} from '../catalog.mjs';
import {buyBoat,shopReady,switchOwnedBoat} from '../career.mjs';
import {createWorldClock} from '../multiplayer.mjs';
import {crabGroundAt,groundsAt} from '../fishing-grounds.mjs';
import {restoreSeason,seasonJSON} from '../saves.mjs';
import {
 BERTH,competingCatchMultiplier,createGame,handlePot,LOST_POT_PRICE,replaceLostPots,step,
} from '../simulation.mjs';

const load=state=>restoreSeason(JSON.parse(seasonJSON(state)));
const moor=s=>Object.assign(s,BERTH,{moored:{...BERTH},speed:0});
test('dispatch commissions the new hull and keeps the current vessel and cargo',()=>{
 const s=createGame(),b=BOATS[0];
 moor(s);s.money=1e8;s.cargo=12;s.career.parts.sonar=2;
 assert(buyBoat(s,b.id,'dispatch').ok);
 assert.equal(s.career.boat,'nordvind');
 assert.equal(s.cargo,12);
 assert.equal(s.career.parts.sonar,2);
 assert.equal(load(s).career.fleet[0].boat,b.id);
 assert.equal(s.money,1e8-b.price-25000);
});
test('stored hulls preserve upgrades, fuel and lost gear across switching and reloads',()=>{
 let s=createGame();moor(s);
 s.money=1e8;s.fuel=317;s.career.parts.sonar=2;s.deck=7;s.lostPots=1;
 assert(buyBoat(s,BOATS[0].id,'keep').ok);
 assert(!shopReady(s));
 s=load(s);
 const [stored]=s.career.storedBoats;
 assert(!switchOwnedBoat(s,stored.id).ok);
 moor(s);assert(switchOwnedBoat(s,stored.id).ok);
 assert.equal(s.career.boat,'nordvind');
 assert.equal(s.fuel,317);
 assert.equal(s.deck,7);
 assert.equal(s.lostPots,1);
 assert.equal(s.career.parts.sonar,2);
 assert.equal(s.career.storedBoats[0].boat,BOATS[0].id);
});
test('hold capacity is checked before starting a haul or rolling a line failure',()=>{
 const s=createGame();
 Object.assign(s,{x:1000,y:500,heading:0,hour:24,cargo:890,deck:7,
  pots:[{id:1,x:1000,y:520,setAt:0,legacyAbundance:1}]});
 assert.equal(handlePot(s,1,{lineRandom:()=>assert.fail('RNG consumed')}),false);
 assert.equal(s.deckJob,null);
 assert.equal(s.pots.length,1);
 assert.match(s.popupEvents[0].text,/Not enough room/);
});
test('a lost line survives save and reload, and replaces the pot exactly once in port',()=>{
 let s=createGame();
 Object.assign(s,{x:1000,y:500,heading:0,hour:24,deck:7,pots:[{id:1,x:1000,y:520,setAt:0,legacyAbundance:1}]});
 handlePot(s,1,{lineRandom:()=>.00499});
 assert(s.deckJob.lineLost);
 s=load(s);s.paused=false;s.career.nextIncident=1e9;
 for(let i=0;i<33;i++)step(s,1,()=>1);
 assert.equal(s.lostPots,1);
 assert.equal(s.pots.length,0);
 assert.equal(s.cargo,0);
 assert.equal(s.deck,7);
 s=load(s);
 assert(!replaceLostPots(s));
 moor(s);const balance=s.money;
 assert(replaceLostPots(s));
 assert(!replaceLostPots(s));
 assert.equal(s.deck,8);
 assert.equal(s.money,balance-LOST_POT_PRICE);
 assert.equal(load(s).lostPots,0);
});
test('two active competitors in the same zone multiply catch by 0.8 twice',()=>{
 const point=groundsAt(12)[0];
 assert(crabGroundAt(point,12));
 const rivals=[{...point,id:'a',pots:[point]},{...point,id:'b',pots:[point]},
  {...point,id:'idle',pots:[]},{...point,id:'a-fleet-1',pots:[point]}];
 assert.equal(competingCatchMultiplier(point,12),1);
 assert(Math.abs(competingCatchMultiplier(point,12,rivals)-.64)<1e-9);
});
test('host clock can move backward on reconnect and never leaks into a solo save',()=>{
 const clock=createWorldClock(),s=createGame();
 assert.equal(clock.update('ALPHA1',{id:'host',hour:18},0),18);
 assert(clock.update('ALPHA1',{id:'host',hour:18.1},1000)>=18.1);
 assert(clock.update('ALPHA1',{id:'host',hour:18.1},1500)>18.1);
 assert.equal(clock.update('ALPHA1',null,2500),undefined);
 assert.equal(clock.update('ALPHA1',{id:'host',hour:14},3000),14);
 assert.equal(clock.update('BRAVO2',{id:'host',hour:8},3100),8);
 s.worldHour=14;
 assert.equal(load(s).worldHour,undefined);
 assert.equal(load(s).hour,s.hour);
});
test('a captain can hand over an idle vessel in the same harbor',()=>{
 const s=createGame(),b=BOATS[0];
 moor(s);s.money=1e8;
 assert(buyBoat(s,b.id,'dispatch').ok);
 const [captain]=s.career.fleet;
 assert(!switchOwnedBoat(s,captain.id).ok);
 s.career.fleet[0].phase='service';s.career.fleet[0].parts.sonar=1;
 assert(switchOwnedBoat(s,captain.id).ok);
 assert.equal(s.career.boat,b.id);
 assert.equal(s.career.parts.sonar,1);
 assert.equal(s.career.fleet.length,0);
 assert.equal(s.career.storedBoats[0].boat,'nordvind');
});
