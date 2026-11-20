import {step} from './simulation.mjs?v=0.18.1';
import {stepWake} from './wake.mjs?v=0.18.1';
// One scaled clock for movement, fishing, weather, wake and visual animation.
export function advanceVoyage(state,wake,realDt,multiplier=1){if(state.paused)return 0;const elapsed=Math.max(0,Math.min(realDt,.1))*Math.max(1,Math.min(multiplier,15)),count=Math.ceil(elapsed/.05);let advanced=0;for(let i=0;i<count;i++){if(state.paused)break;step(state,elapsed/count);stepWake(wake,state,elapsed/count);advanced++;}return count?elapsed*advanced/count:0;}
