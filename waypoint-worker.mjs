import {planSeaRoute} from './navigation.mjs?v=0.18.69';
self.onmessage=({data:{from,target,grid}})=>{
 const budget={remaining:2500000,deadline:performance.now()+12000};
 self.postMessage(planSeaRoute(from,target,false,budget,grid));
};
