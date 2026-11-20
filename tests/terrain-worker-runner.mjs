// Adapt the browser worker entry point to Node's worker transport for integration testing.
import {parentPort,workerData} from 'node:worker_threads';
globalThis.self={postMessage:(data,transfer)=>parentPort.postMessage(data,transfer)};
await import(workerData.url);
parentPort.on('message',data=>self.onmessage({data}));
