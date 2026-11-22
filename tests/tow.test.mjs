import {test} from 'node:test';
import assert from 'node:assert/strict';
import {beginTow,createGame,step,towDestination,towFee} from '../simulation.mjs';

test('the tow charges only the available balance and follows its route instead of helm inputs',()=>{
 const state=createGame(),destination=towDestination();
 Object.assign(state,{x:destination.x+180,y:destination.y+75,money:12,hull:0,fuel:0,tow:{phase:'planning'}});
 assert.equal(towFee(state),12);
 assert(beginTow(state,[destination]));
 assert.equal(state.money,0);
 for(let i=0;i<4;i++)step(state,1);
 state.desiredKnots=-8;state.rudder=1;
 step(state,1);
 assert.equal(state.rudder,0);
 assert.equal(state.desiredKnots,0);
 assert.equal(state.speed*1.94384,13);
 for(let i=0;i<100&&state.tow;i++)step(state,1);
 assert.equal(state.tow,null);
 assert.deepEqual([state.x,state.y],[destination.x,destination.y]);
 assert(state.hull>=35);
});
