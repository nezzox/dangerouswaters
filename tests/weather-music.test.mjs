import {test} from 'node:test';
import assert from 'node:assert/strict';
import {musicMood,renderMusicLoop,createWeatherMusic} from '../weather-music.mjs';

test('weather chooses four cues and hysteresis keeps them from fluttering',()=>{
 assert.equal(musicMood({wind:8,waves:.6}),'calm');
 assert.equal(musicMood({wind:18,waves:1.6,rain:.4}),'rain');
 assert.equal(musicMood({wind:18,waves:2.4,snow:.5}),'snow');
 assert.equal(musicMood({wind:42,waves:5,snow:.8}),'storm');
 assert.equal(musicMood({wind:28,waves:3.8},'storm'),'storm');
 assert.equal(musicMood({wind:12,waves:1.6,snow:.16},'snow'),'snow');
 assert.equal(musicMood({wind:8,waves:.6,rain:.16}),'calm');
});
test('all four scores are distinct, quiet stereo loops with clean edges',()=>{
 const scores=['calm','rain','snow','storm'].map(id=>renderMusicLoop(id,16000));
 for(const [l,r] of scores){
  assert(l.length===r.length&&l.length>=16000*24);
  let power=0,peak=0,stereo=0;
  for(let i=0;i<l.length;i++){power+=l[i]**2;peak=Math.max(peak,Math.abs(l[i]),Math.abs(r[i]));stereo+=Math.abs(l[i]-r[i]);}
  assert(peak<.85&&peak>.09);assert(Math.sqrt(power/l.length)>.028);
  assert(stereo/l.length>.008);
  assert(Math.abs(l[0]-l.at(-1))<.09);
 }
 assert.equal(new Set(scores.map(([l])=>l[1800])).size,4);
});
test('music crossfades without restarting on every frame and can stop independently',()=>{
 const played=[],gains=[];
 const param=()=>({value:0,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}});
 const ac={currentTime:1,createGain(){const n={gain:param(),connect(){return this;}};gains.push(n);return n;},createBuffer(){return {copyToChannel(){}};},createBufferSource(){const n={connect(){return this;},start(){played.push(this);},stop(t){this.end=t;}};return n;}};
 const music=createWeatherMusic(ac,{});
 music.update({waves:1},false,1);assert.equal(played.length,0);
 music.update({waves:1},true,.8);music.update({waves:1},true,.8);assert.equal(played.length,1);assert(played[0].loop);
 ac.currentTime=8;music.update({waves:4.8},true,.8);assert.equal(played.length,2);assert(played[0].end>8);
 music.update({waves:4.8},false,.8);assert(played[1].end>8);assert.equal(gains[0].gain.value,0);
});
