import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorldClock} from '../multiplayer.mjs';
import {firebaseHostClock} from '../multiplayer-firebase.mjs';
import {daylightAt} from '../world.mjs';

test('the room owner, not the save world code or a peer claim, supplies the clock',()=>{
 const room={hostId:'owner',sdk:{uid:'visitor'},members:{owner:{hour:12},other:{hour:1,isHost:true}},links:new Map()};
 assert.deepEqual(firebaseHostClock(room,true),{id:'owner',hour:12});
 assert.deepEqual(firebaseHostClock(room,false),{id:'owner',hour:undefined});
 assert.equal(firebaseHostClock({...room,sdk:{uid:'owner'}},true),null);
 assert.deepEqual(firebaseHostClock({...room,members:{}},true),{id:'owner',hour:undefined});
});
test('a returning guest holds the last host time rather than jumping to local darkness',()=>{
 const clock=createWorldClock(),host={id:'owner',hour:12};
 const day=clock.update('WORLD1',host,1000);
 assert.equal(daylightAt(day),1);
 assert.equal(daylightAt(2),.035);
 assert.equal(clock.update('WORLD1',{id:'owner'},2000),day);
 assert.equal(clock.update('WORLD1',{id:'owner',hour:13},2500),13);
 assert.equal(clock.update('WORLD2',{id:'owner'},2600),undefined);
 assert.equal(clock.update('WORLD2',null,2700),undefined);
});

test('an existing world with its owner absent elects the same active clock for all guests',()=>{
 const first={hour:7},second={hour:14};
 const a={hostId:'owner',sdk:{uid:'alpha'},members:{zulu:second,alpha:first}};
 const b={hostId:'owner',sdk:{uid:'zulu'},members:{alpha:first,zulu:second}};
 assert.equal(firebaseHostClock(a,true),null);
 assert.deepEqual(firebaseHostClock(b,true),{id:'alpha',hour:7});
 assert.deepEqual(firebaseHostClock(b,false),{id:'alpha',hour:undefined});
 b.members.owner={hour:18};
 assert.deepEqual(firebaseHostClock(b,true),{id:'owner',hour:18});
 delete b.members.owner;
 delete b.members.alpha;
 assert.equal(firebaseHostClock(b,true),null);
});
