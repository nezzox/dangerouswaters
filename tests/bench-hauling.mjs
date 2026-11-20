// Run manually: node tests/bench-hauling.mjs. CPU-only; does not measure browser/GPU FPS.
import {performance}from 'node:perf_hooks';import{createCrew,stepCrew,commandCrew}from '../crew.mjs';import{BOATS}from '../catalog.mjs';import{rackPositions}from '../vessel-style.mjs';
const boat=BOATS.find(b=>b.name==='Kodiak 01');
function median(name,fn){const times=[];for(let i=0;i<5;i++){const start=performance.now();fn();times.push(performance.now()-start);}times.sort((a,b)=>a-b);console.log(`${name}: ${times[2].toFixed(2)} ms median (5 runs, ${process.version})`);}
median('Haul command and deck count 13→14',()=>{const c=createCrew();stepCrew(c,.016,2,{deck:13,design:boat});commandCrew(c,'haul');stepCrew(c,.016,2,{deck:14,design:boat});});
median('Cage instance positions',()=>{const groups=[[],[],[]];rackPositions(14,boat).forEach((p,i)=>groups[i%3].push(p.x,p.y,p.z));groups.map(g=>new Float32Array(g));});
