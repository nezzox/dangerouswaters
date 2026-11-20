import {createCrew,commandCrew} from '../crew.mjs';
import {BOATS} from '../catalog.mjs';
// Local CPU microbenchmark, not a GPU or whole-game FPS measurement.
for(const boat of [BOATS[0],BOATS.find(b=>b.name==='Swift 01'),BOATS.at(-1)]){
 const samples=[];
 for(let i=0;i<40;i++){const crew=createCrew(),start=performance.now();commandCrew(crew,'haul',{design:boat,deck:Math.min(200,boat.pots),operation:{kind:'haul',duration:32,elapsed:0}});samples.push(performance.now()-start);}
 samples.sort((a,b)=>a-b);console.log(`${boat.name}: median ${samples[20].toFixed(2)} ms, p95 ${samples[38].toFixed(2)} ms, max ${samples[39].toFixed(2)} ms`);
}
