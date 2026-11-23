import {test} from 'node:test';import assert from 'node:assert/strict';
import {fuelBurnRate,fuelEconomy} from '../fuel-economy.mjs';import {createGame,step,conditions} from '../simulation.mjs';import {vesselStats} from '../career.mjs';
test('fuel preview uses the exact simulation fuel rate at the selected speed',()=>{const s=createGame();Object.assign(s,{x:1000,y:500,paused:false,weatherOverride:'calm',desiredKnots:8});s.career.nextIncident=1e9;const before=s.fuel,stats=vesselStats(s),estimate=fuelEconomy(s,stats,conditions(s));step(s,1);assert(Math.abs(before-s.fuel-estimate.rate)<1e-9);assert.equal(estimate.rate,fuelBurnRate(s.throttle,stats.fuelUse));assert(estimate.litersPerNm>0);});
test('economy handles idle, reverse, upgrades, top-speed limits and engine failure',()=>{const s=createGame(),stats=vesselStats(s),w=conditions(s);let e=fuelEconomy(s,stats,w);assert.equal(e.litersPerNm,null);assert.equal(e.load,0);s.desiredKnots=-2;e=fuelEconomy(s,stats,w);assert(e.litersPerNm>0);const old=e.rate;assert(fuelEconomy(s,{...stats,fuelUse:.5},w).rate<old);s.desiredKnots=100;assert.equal(fuelEconomy(s,stats,w).load,1);s.incident={system:'engine'};assert.equal(fuelEconomy(s,stats,w).rate,0);assert.equal(fuelEconomy(s,stats,w).litersPerNm,null);});
test('offshore diesel boats can reach the farthest grounds and return with a fuel reserve',async()=>{
 const {boatById}=await import('../catalog.mjs');
 const {fuelToGround}=await import('../fuel-economy.mjs');
 const {groundsAt}=await import('../fishing-grounds.mjs');
 const {QUAY}=await import('../harbor.mjs');
 const vessel={...QUAY,desiredKnots:12};
 const roundTrip=boat=>2*Math.max(...groundsAt(0).map(ground=>fuelToGround(vessel,ground,{...boat,fuelUse:1},{waves:4})));
 const starter=boatById('nordvind'),coastal=boatById('boat-1-1'),offshore=boatById('boat-10-7');
 assert.equal(starter.tank,500);
 assert(coastal.tank>starter.tank&&coastal.tank<roundTrip(coastal));
 assert(offshore.tank*.8>roundTrip(offshore));
});
