import{test}from 'node:test';import assert from 'node:assert/strict';import{BOATS,STARTER}from '../catalog.mjs';import{deckWorkPose}from '../deck-work.mjs';import{releasePoint,createGame}from '../simulation.mjs';import{deckSign,hullPaint}from '../vessel-profile.mjs';import{craneColor}from '../crane-style.mjs';
test('all crane lowering paths clear the hull including half the pot width',()=>{for(const b of [STARTER,...BOATS])for(const p of [.5,.7,.9]){const pose=deckWorkPose({kind:'deploy',layout:b.hauler,elapsed:p*14,duration:14});if(b.hauler==='stern')assert(pose.position[0]+.9< -12,b.name);else assert(Math.abs(pose.position[2])-.9>3.7,b.name);const s=createGame();s.career.boat=b.id;s.heading=0;const point=releasePoint(s);if(b.hauler==='stern')assert((point.x-s.x)*deckSign(b)< -b.length*.5);else assert(point.y-s.y>b.beam*.5);}});
test('starter crane retains its original orange and hull colors remain muted',()=>{assert.deepEqual(craneColor(STARTER),[.72,.29,.065]);for(const b of BOATS){assert(hullPaint(b).every(c=>c>=.1&&c<=.8));assert(craneColor(b).every(c=>c>=.05&&c<=.8));}assert(BOATS.some(b=>b.deckSign===-1&&b.rampBow));assert(BOATS.some(b=>b.beam>10.8&&b.length<30));});
test('a loaded crane clears the taller bridge when moving a pot out of the forecastle rack',async()=>{
 const {rackPositions}=await import('../vessel-style.mjs');
 const b=BOATS.find(b=>b.name==='Icebound 05'),deck=rackPositions(120,b).findIndex(p=>p.x>0);
 assert(deck>=0);
 const s=createGame();s.deck=deck;s.career.boat=b.id;
 const pose=deckWorkPose({kind:'deploy',layout:b.hauler,elapsed:3,duration:10},s);
 assert(pose.position[1]>=14);
});
