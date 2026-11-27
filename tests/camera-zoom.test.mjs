import {test} from 'node:test';
import assert from 'node:assert/strict';
import {zoomCamera} from '../scene.mjs';

test('the voyage camera zooms out at least three times farther and can return to deck view',()=>{
 let zoom=.74;
 for(let step=0;step<36;step++)zoom=zoomCamera(zoom,1.1);
 assert(zoom>=2.15*3);
 assert.equal(zoomCamera(zoom,1.1),zoom);
 for(let step=0;step<40;step++)zoom=zoomCamera(zoom,1/1.1);
 assert.equal(zoom,.38);
});

test('camera zoom factors are neutral at one and reversible away from the limits',()=>{
 assert.equal(zoomCamera(.74,1),.74);
 assert(Math.abs(zoomCamera(zoomCamera(.74,1.1),1/1.1)-.74)<1e-12);
});
