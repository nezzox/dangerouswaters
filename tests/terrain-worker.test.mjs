import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {createTerrainLoader} from '../terrain-loader.mjs';
import {BERTH} from '../harbor.mjs';
class BrowserWorker {
 constructor(url){this.worker=new Worker(new URL('./terrain-worker-runner.mjs',import.meta.url),{workerData:{url:url.href}});this.worker.on('message',data=>this.onmessage?.({data}));this.worker.on('error',error=>this.onerror?.(error));}
 postMessage(data){this.worker.postMessage(data);}
 terminate(){return this.worker.terminate();}
}
test('production terrain worker transfers mesh while main thread remains responsive',async()=>{const loader=createTerrainLoader(BrowserWorker);let ticks=0;const timer=setInterval(()=>ticks++,5);try{const vertices=await loader.load(BERTH.x,BERTH.y);assert(vertices instanceof Float32Array);assert(vertices.byteLength>100000);assert(vertices.every(Number.isFinite));assert(ticks>2,'terrain work must yield the main thread');}finally{clearInterval(timer);loader.close();}});
test('terrain remains available where workers cannot be created',async()=>{class Disabled{constructor(){throw Error('disabled');}}const loader=createTerrainLoader(Disabled);const data=await loader.load(100000,100000);assert(data instanceof Float32Array);loader.close();});
