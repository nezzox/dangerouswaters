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
