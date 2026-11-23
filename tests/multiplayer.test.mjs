import {test} from 'node:test';import assert from 'node:assert/strict';import {newWorldCode,newPlayerToken,cleanPlayerName,playerPresence} from '../multiplayer.mjs';import {createGame} from '../simulation.mjs';import {seasonJSON,restoreSeason} from '../saves.mjs';
test('world and player identities remain in the owner save, remote boats do not',()=>{const s=createGame();s.worldId=s.ownWorldId=newWorldCode();s.playerToken=newPlayerToken();s.playerName=cleanPlayerName('  Captain  ');s.remotePlayers=[{name:'Other'}];const json=seasonJSON(s),copy=restoreSeason(JSON.parse(json));assert.match(copy.worldId,/^[A-Z0-9]{6}$/);assert.match(copy.playerToken,/^[0-9a-f]{32}$/);assert.equal(copy.playerName,'Captain');assert(!json.includes('Other'));});
test('presence publishes only necessary details, not private finances or save data',()=>{const s=createGame();s.playerName='Captain';s.money=123456;s.pots=[{id:1,x:2,y:3,setAt:42}];const p=playerPresence(s);assert.deepEqual(p.pots,[{id:1,x:2,y:3}]);assert(!('money' in p));assert(!('career' in p));});
test('remote boats interpolate snapshots, predict briefly and snap teleports',async()=>{const {createPeerSmoother}=await import('../multiplayer.mjs'),s=createPeerSmoother(),p={id:'one',x:0,y:0,heading:3.1},q={...p,x:30,heading:-3.1};s.update([p],0);s.update([q],800);const moved=s.update([q],1200)[0];assert(moved.x>0&&moved.x<30);assert(moved.heading>3.1&&moved.heading<3.2);assert(s.update([q],2000)[0].x>30);assert.equal(s.update([{...p,x:5000}],2100)[0].x,5000);});
test('presence shares fleet positions and pots without fleet finances',()=>{const s=createGame();s.playerName='Captain';s.career.fleet=[{id:'fleet-1',name:'Nordvind',boat:'nordvind',x:10,y:20,heading:1,money:999,pots:[{id:3,x:11,y:21,setAt:4}]}];const p=playerPresence(s);assert.equal(p.fleet.length,1);assert.deepEqual(p.fleet[0].pots,[{id:3,x:11,y:21}]);assert(!('money' in p.fleet[0]));});

test('presence refreshes do not add position samples for a remote boat',async()=>{
 const {createPeerSmoother}=await import('../multiplayer.mjs');
 const snapshot=(x)=>({id:'peer',x,y:0,heading:0,transport:'firebase',positionSample:[x,0,0]});
 const a=snapshot(0),b=snapshot(60),quiet=createPeerSmoother(),busy=createPeerSmoother();
 for(const track of [quiet,busy])track.update([a],0);
 for(const now of [300,600,900,1050,1200]){
  const state=now<600?a:b;
  const expected=quiet.update([state],now)[0];
  const actual=busy.update([{...state,earned:now}],now)[0];
  assert.equal(actual.x,expected.x);
 }
});

test('a silent position stream settles at the last received pose',async()=>{
 const {createPeerSmoother}=await import('../multiplayer.mjs'),track=createPeerSmoother();
 track.update([{id:'peer',x:0,y:0,heading:0}],0);
 const last={id:'peer',x:30,y:0,heading:0};
 track.update([last],600);
 assert(track.update([last],1300)[0].x>30);
 assert(Math.abs(track.update([last],3000)[0].x-30)<.01);
});
