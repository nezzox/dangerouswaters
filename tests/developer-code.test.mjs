import {test} from 'node:test';import assert from 'node:assert/strict';import {redeemDeveloperCode} from '../developer-code.mjs';import {createGame} from '../simulation.mjs';import {restoreSeason,seasonJSON} from '../saves.mjs';
test('the exact developer phrase gives 50000 USD and can be reused',()=>{const s=createGame(),before=s.money;assert(redeemDeveloperCode(s,'Nezzox is king'));assert.equal(s.money-before,500000);assert(redeemDeveloperCode(s,'Nezzox is king'));assert.equal(s.money-before,1000000);assert.equal(restoreSeason(JSON.parse(seasonJSON(s))).money,s.money);});
test('cancelled, empty or incorrect codes do not change the balance',()=>{const s=createGame(),before=s.money;for(const code of [null,'','nezzox is king','Nezzox is king ','hello'])assert(!redeemDeveloperCode(s,code));assert.equal(s.money,before);});
test('Give me a chance grants 75000 USD only once per saved season',()=>{const s=createGame(),before=s.money;assert(redeemDeveloperCode(s,'Give me a chance'));assert.equal(s.money-before,750000);assert(!redeemDeveloperCode(s,'Give me a chance'));const copy=restoreSeason(JSON.parse(seasonJSON(s)));assert(!redeemDeveloperCode(copy,'Give me a chance'));assert.equal(copy.money,s.money);const other=createGame();assert(redeemDeveloperCode(other,'Give me a chance'));});
test('Ge mig grants the chosen positive whole amount in the active currency',()=>{
 const s=createGame(),before=s.money;
 assert(redeemDeveloperCode(s,'Ge mig 350','sv'));
 assert.equal(s.money-before,350);
 assert(redeemDeveloperCode(s,'Ge mig 40','en'));
 assert.equal(s.money-before,750);
 for(const code of ['Ge mig','Ge mig 0','Ge mig -1','Ge mig 1e3','Ge mig 99999999999999999'])assert(!redeemDeveloperCode(s,code));
 assert.equal(s.money-before,750);
});
test('Go to harbor ends towing in clear water while preserving resources',async()=>{
 const {towDestination,vesselOnLand,nearPort}=await import('../simulation.mjs');
 const s=createGame(),arrival=towDestination();
 s.career.boat='boat-10-7';
 Object.assign(s,{x:5000,y:5000,tow:{phase:'travel'},speed:5,fuel:13,hull:20,cargo:50,
  autopilot:{x:123,y:456},remotePlayers:[{...arrival,boat:'boat-10-7'}]});
 const balance=s.money;
 assert(redeemDeveloperCode(s,'Go to harbor'));
 assert(nearPort(s)&&!vesselOnLand(s));
 assert(Math.hypot(s.x-arrival.x,s.y-arrival.y)>50);
 assert.equal(s.tow,null);
 assert.equal(s.autopilot,null);
 assert.equal(s.speed,0);
 assert.deepEqual([s.money,s.fuel,s.hull,s.cargo],[balance,13,20,50]);
});
