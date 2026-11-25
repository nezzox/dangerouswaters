import {buildGeography} from './geography-mesh.mjs?v=0.18.82';
self.onmessage=({data})=>{try{const vertices=buildGeography(data.x,data.y,2200,data.local);self.postMessage({id:data.id,vertices},[vertices.buffer]);}catch(error){self.postMessage({id:data.id,error:String(error)});}};
