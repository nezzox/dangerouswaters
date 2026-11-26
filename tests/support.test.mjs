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

test('responsive HUD tracks the toolbar, weather header and deck hint',async()=>{
 const saved={document:globalThis.document,ResizeObserver:globalThis.ResizeObserver};
 const sizes={'footer':70,'header':96,'#pot-action':38},callbacks=new Map(),values=new Map();
 const elements=Object.fromEntries(Object.keys(sizes).map(selector=>[selector,{selector,getBoundingClientRect:()=>({height:sizes[selector]})}]));
 globalThis.document={querySelector:selector=>elements[selector],documentElement:{style:{setProperty(name,value){values.set(name,value);}}}};
 globalThis.ResizeObserver=class{constructor(fn){this.resize=fn;}observe(target){callbacks.set(target.selector,this.resize);}};
 try{
  await import('../support.mjs?test-hud');
  assert.deepEqual([...values],[['--toolbar-height','70px'],['--hud-header-height','96px'],['--pot-action-height','38px']]);
  sizes.footer=108.5;sizes.header=114;sizes['#pot-action']=52;
  for(const resize of callbacks.values())resize();
  assert.deepEqual([...values],[['--toolbar-height','109px'],['--hud-header-height','114px'],['--pot-action-height','52px']]);
 }finally{Object.assign(globalThis,saved);}
});
