import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('the support link sits with the harbor controls below, not inside, the leader panel',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const group=html.match(/id="leaderboard"[\s\S]+?<\/section><div class="leaderboard-actions">([\s\S]+?)<\/div>/)?.[1];
 assert(group);
 for(const id of ['harbor-toggle','fleet-toggle','shop-toggle','kofi-support'])assert(group.includes(`id="${id}"`));
 assert.match(group,/id="kofi-support"[^>]+href="https:\/\/ko-fi\.com\/nezzox"[\s\S]+Support the game<\/a>/);
 assert(!html.includes('id="drone-markers"'));
});

test('scrollable HUD tracks the responsive toolbar height',async()=>{
 const saved={document:globalThis.document,ResizeObserver:globalThis.ResizeObserver};
 let height=70,resize,property;
 const footer={getBoundingClientRect:()=>({height})};
 globalThis.document={querySelector:()=>footer,documentElement:{style:{setProperty(name,value){property=[name,value];}}}};
 globalThis.ResizeObserver=class{constructor(fn){resize=fn;}observe(target){assert.equal(target,footer);}};
 try{
  await import('../support.mjs?test-toolbar');
  assert.deepEqual(property,['--toolbar-height','70px']);
  height=100;resize();
  assert.deepEqual(property,['--toolbar-height','100px']);
 }finally{Object.assign(globalThis,saved);}
});
