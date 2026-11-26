import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SWELL,seaAmplitude,seaHeight,directionalSpectrum} from '../sea-spectrum.mjs';

test('wave energy matches the weather significant height in world meters',()=>{
 for(const height of [0,.5,2,8,20]){
  const amplitude=seaAmplitude(height);
  assert(Math.abs(4*Math.sqrt(SWELL.reduce((s,w)=>s+(amplitude*w.w)**2/2,0))-height)<1e-10);
  assert(Math.abs(seaHeight(28,-16,7,0))<1e-10);
 }
});

test('the actual displaced surface has the reported significant height across different sea states',()=>{
 let seed=7121666;
 const next=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const samples=20000;
 for(const [waves,wavePeriod] of [[.5,5],[2,8],[8,12],[20,16]]){
  let sum=0,squares=0;
  const weather={windDirection:30,waveDirection:320,wavePeriod};
  for(let i=0;i<samples;i++){
   const h=seaHeight(next()*6000,next()*6000,next()*600,waves,weather);
   sum+=h;squares+=h*h;
  }
  const measured=4*Math.sqrt(squares/samples-(sum/samples)**2);
  assert(Math.abs(measured/waves-1)<.035,`target ${waves} m; measured ${measured} m`);
 }
});

test('longer-period swell lengthens as well as slowing, without changing wave energy',()=>{
 const a=directionalSpectrum({wavePeriod:8})[0],b=directionalSpectrum({wavePeriod:16})[0];
 assert(Math.abs(b.omega/a.omega-.5)<1e-10);
 assert(Math.abs(b.k/a.k-.25)<1e-10);
 assert.equal(a.w,b.w);
});
