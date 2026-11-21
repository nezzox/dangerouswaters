import {buildGeography} from './geography-mesh.mjs?v=0.18.37';
export function createTerrainLoader(WorkerClass=globalThis.Worker){let worker=null,next=0,pending=new Map();try{if(WorkerClass)worker=new WorkerClass(new URL('./terrain-worker.mjs?v=0.18.37',import.meta.url),{type:'module'});}catch{}
 const fallback=job=>new Promise(resolve=>{const run=()=>resolve(buildGeography(job.x,job.y));if(globalThis.requestIdleCallback)requestIdleCallback(run,{timeout:1000});else setTimeout(run,0);});
 if(worker){worker.onmessage=({data})=>{const job=pending.get(data.id);if(!job)return;pending.delete(data.id);if(data.error)fallback(job).then(job.resolve);else job.resolve(data.vertices);};worker.onerror=()=>{worker?.terminate();worker=null;for(const job of pending.values())fallback(job).then(job.resolve);pending.clear();};}
 return {load(x,y){const job={id:++next,x,y};if(!worker)return fallback(job);return new Promise(resolve=>{pending.set(job.id,{...job,resolve});worker.postMessage(job);});},close(){worker?.terminate();pending.clear();}};
}
