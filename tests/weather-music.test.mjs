import {test} from 'node:test';
import assert from 'node:assert/strict';
import {musicMood,createWeatherMusic} from '../weather-music.mjs';

test('music follows sea severity and holds steady around thresholds',()=>{
 assert.equal(musicMood({wind:8,waves:.6,rain:.6}),'calm');
 assert.equal(musicMood({wind:17,waves:.6}),'medium');
 assert.equal(musicMood({wind:8,waves:1.5}),'medium');
 assert.equal(musicMood({wind:42,waves:5}),'heavy');
 assert.equal(musicMood({wind:10,waves:4.25}),'heavy');
 assert.equal(musicMood({wind:30,waves:3},'heavy'),'heavy');
 assert.equal(musicMood({wind:15,waves:1.3},'medium'),'medium');
 assert.equal(musicMood({wind:12,waves:1.1},'medium'),'calm');
});
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function setup(load){
 const played=[],gains=[],calls=[];
 const ac={currentTime:1,createGain(){
  const n={gain:{value:0,ramps:[],setTargetAtTime(v){this.value=v;},cancelScheduledValues(){},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v,t){this.ramps.push([v,t]);}},connect(){return this;},disconnect(){}};
  gains.push(n);return n;
 },createBufferSource(){return {connect(){return this;},disconnect(){},start(){played.push(this);},stop(t){this.stopAt=t;}};}};
 const music=createWeatherMusic(ac,{},(file,signal)=>{
  calls.push(file);
  return load?load(file,signal):Promise.resolve({file,duration:180});
 });
 return {ac,music,gains,played,calls};
}
test('two calm and two medium tracks rotate, and heavy loops',async()=>{
 const {ac,music,played,calls}=setup();
 music.update({waves:.6},false,1);
 assert.equal(calls.length,0);
 for(let i=0;i<10;i++)music.update({waves:.6},true,.8);
 await settle();
 assert.deepEqual(calls,['calm-sea-01.mp3']);
 assert.equal(played[0].loop,false);
 played[0].onended();
 music.update({waves:.6},true,.8);
 await settle();
 assert.equal(played[1].buffer.file,'calm-sea-02.mp3');
 ac.currentTime=6;music.update({waves:2},true,.8);
 await settle();
 assert.equal(played[2].buffer.file,'medium-sea-01.mp3');
 assert(played[1].stopAt>6);
 played[2].onended();
 music.update({waves:2},true,.8);
 await settle();
 assert.equal(played[3].buffer.file,'medium-sea-02.mp3');
 music.update({waves:5},true,.8);
 await settle();
 assert.equal(played[4].buffer.file,'heavy-sea-01.mp3');
 assert.equal(played[4].loop,true);
});
test('obsolete asynchronous loads cannot start after a weather change or when music is turned off',async()=>{
 const pending=new Map();
 const {music,played,gains}=setup((file,signal)=>new Promise(resolve=>pending.set(file,{resolve,signal})));
 music.update({waves:.6},true,1);
 music.update({waves:5},true,1);
 assert(pending.get('calm-sea-01.mp3').signal.aborted);
 pending.get('calm-sea-01.mp3').resolve({duration:180});
 await settle();assert.equal(played.length,0);
 music.update({waves:5},false,1);
 assert.equal(gains[0].gain.value,0);
 pending.get('heavy-sea-01.mp3').resolve({duration:180});
 await settle();assert.equal(played.length,0);
});

test('muting music preserves the current cue without fetching it again',async()=>{
 const {ac,music,played,calls}=setup();
 music.update({waves:5},true,1);await settle();
 ac.currentTime=10;
 music.update({waves:5},true,0);assert(played[0].stopAt>10);
 music.update({waves:5},true,.4);
 assert.equal(played.length,2);
 assert.equal(played[1].buffer,played[0].buffer);
 assert.deepEqual(calls,['heavy-sea-01.mp3']);
});

test('weather crossfades over the same interval only after the new track is decoded',async()=>{
 let ready;
 const {ac,music,played,gains}=setup(file=>file.startsWith('calm')?
  Promise.resolve({duration:180}):new Promise(resolve=>{ready=resolve;}));
 music.update({waves:.7},true,.8);await settle();
 ac.currentTime=8;music.update({waves:5},true,.8);
 assert.equal(played[0].stopAt,undefined);
 ac.currentTime=9;ready({duration:180});await settle();
 assert.equal(played.length,2);
 const outgoing=gains[1].gain.ramps.slice(-12),incoming=gains[2].gain.ramps;
 assert.equal(outgoing.length,12);
 assert.deepEqual(outgoing.map(([,t])=>t),incoming.map(([,t])=>t));
 for(let i=0;i<12;i++)assert(Math.abs(outgoing[i][0]**2+incoming[i][0]**2-1)<1e-10);
 assert(played[0].stopAt>=incoming.at(-1)[1]);
});
