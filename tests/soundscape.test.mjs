import {test} from 'node:test';import assert from 'node:assert/strict';import {ambientMix} from '../soundscape.mjs';
const state={x:160,y:80,throttle:.5,paused:false},weather={wind:30,waves:4,rain:1};
test('ambient mix adds louder diesel, weather and harbor layers with bounded levels',()=>{const m=ambientMix(state,weather);assert(m.engine>.05);assert(m.sea>0);assert(m.rain>0);assert(m.harbor>0);for(const [key,v]of Object.entries(m))if(key!=='near')assert(v>=0&&v<=.2);});
test('all ambient layers mute when paused or sound is disabled',()=>{for(const m of [ambientMix({...state,paused:true},weather),ambientMix(state,weather,false)])for(const [key,v]of Object.entries(m))if(key!=='near')assert.equal(v,0);});
test('industrial harbor ambience fades out at sea',()=>{const m=ambientMix({...state,x:10000,y:10000},weather);assert.equal(m.harbor,0);assert.equal(m.near,0);assert(m.sea>0);});
