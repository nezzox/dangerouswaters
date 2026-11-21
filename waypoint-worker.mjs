import {planSeaRoute} from './navigation.mjs?v=0.18.34';
self.onmessage=({data:{from,target}})=>{
 const budget={remaining:1000000,deadline:performance.now()+8000};
 self.postMessage(planSeaRoute(from,target,false,budget));
};
