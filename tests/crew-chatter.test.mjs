import {test} from 'node:test';
import assert from 'node:assert/strict';
import {crewLine,crewTopics,createCrewChatter} from '../crew-chatter.mjs';
const sea={wind:9,waves:.4,temperature:6};
const state=()=>({speed:0,fuel:100,cargo:0,pots:[]});
const sample=(s,w=sea,extra={})=>({state:s,weather:w,active:true,dt:1,...extra});
const advance=(tick,input,seconds)=>{for(let i=0;i<seconds;i++){const line=tick(input);if(line)return {line,after:i+1};}};
test('more than ten thousand distinct English combinations stay short enough for a bubble',()=>{
 const all=new Set();
 for(const topic of crewTopics)for(let i=0;i<512;i++){
  const text=crewLine(topic,i);
  assert(text.length<=155,text);
  all.add(text);
 }
 assert(all.size>=10000);
});
test('play time controls pacing; a good haul takes priority in fair weather',()=>{
 const s=state(),tick=createCrewChatter(()=>0),input=sample(s);
 assert.equal(advance(tick,{...input,active:false},500),undefined);
 assert.equal(advance(tick,input,59),undefined);
 s.lastHaul={species:'crab',kg:89};
 assert.equal(tick(input).topic,'bigHaul');
 const first=tick({...input,dt:0});
 for(let i=0;i<59;i++){const line=tick(input);assert(line===first||line===null);}
 assert.equal(tick(input).topic,'idle');
});
test('rough sea overrides catch praise; operations and weather select their own topics',()=>{
 const cases=[
  [{lastHaul:{species:'crab',kg:89}},{wind:44,waves:5},'storm'],
  [{},{...sea,temperature:-3},'cold'], [{},{...sea,temperature:-3,snow:.8},'snow'],
  [{deckJob:{kind:'deice'}},sea,'icing'], [{deckJob:{kind:'deploy'}},sea,'setting'],
  [{deckJob:{kind:'haul'}},sea,'hauling'], [{},sea,'calm'],
  [{fuel:15},{...sea,wind:22},'lowFuel'], [{moored:{}},sea,'docked'],
 ];
 for(const [fields,w,topic] of cases){
  const s=state(),tick=createCrewChatter(()=>0);
  advance(tick,sample(s,w),59);
  Object.assign(s,fields);
  assert.equal(tick(sample(s,w)).topic,topic);
 }
});
test('shared world or changing save never carries chatter over, and a new haul is not read from disk',()=>{
 const tick=createCrewChatter(()=>0),a=state(),b={...state(),lastHaul:{species:'crab',kg:90}};
 advance(tick,sample(a),59);
 assert(!tick(sample(b)));
 advance(tick,sample(b),58);
 assert.equal(tick(sample(b)).topic,'calm');
 b.worldId='different';
 assert.equal(advance(tick,sample(b),59),undefined);
});


test('an almost empty pot can draw a jab, but a more recent haul replaces it',()=>{
 const s=state(),tick=createCrewChatter(()=>0),input=sample(s);
 advance(tick,input,58);
 s.lastHaul={species:'crab',kg:5};
 tick(input);
 s.lastHaul={species:'crab',kg:0};
 assert.match(tick(input).text,/Not one crab.*captain/i);
 s.lastHaul={species:'crab',kg:0,potKg:80};
 assert(!tick(input),'a newer result clears a previous bubble without skipping cooldown');
 for(let i=0;i<58;i++)assert(!tick(input));
 assert.equal(tick(input).topic,'bigHaul','judge the pot, not the remaining hold space');
});
test('a change of conditions hides an obsolete ambient line immediately',()=>{
 const s=state(),tick=createCrewChatter(()=>0);
 assert.equal(advance(tick,sample(s),60).line.topic,'calm');
 assert.equal(tick(sample(s,{wind:44,waves:5})),null);
});

test('the closest named player inside 600 m gets the territorial banter, not their fleet',()=>{
 const s={...state(),x:0,y:0};
 const far={id:'far',name:'Far Boat',x:600,y:0};
 const near={id:'near',name:'North Star',x:0,y:599,fleet:[{name:'Deck Tender',x:0,y:2}]};
 const closer={id:'closer',name:'June Gale',x:30,y:40};
 const tick=createCrewChatter(()=>0),input=sample(s,sea,{peers:[far,near,closer]});
 advance(tick,{...input,peers:[far]},59);
 const line=tick(input);
 assert.equal(line.topic,'rival');
 assert.match(line.text,/June Gale/);
 assert.match(line.text,/our patch/);
 assert.equal(tick({...input,peers:[far,near]}),null,'the departed rival’s bubble should disappear');
});

test('harbor chatter alternates factual weight and income leaders, including a tied lead',()=>{
 const s={...state(),x:0,y:0,moored:{}};
 const near={id:'near',name:'June Gale',x:10,y:0,landed:40,earned:50};
 const weight={id:'weight',name:'North Star',x:1000,y:0,landed:100,earned:20};
 const income={id:'income',name:'Deep Run',x:2000,y:0,landed:20,earned:200};
 const tick=createCrewChatter(()=>0);
 const input=sample(s,sea,{peers:[near,weight,income],selfStanding:{name:'Us',landed:100,earned:100},isInHarbor:()=>true});
 const a=advance(tick,input,60).line;
 assert.equal(a.topic,'harborBoard');
 assert.match(a.text,/June Gale/);
 assert.match(a.text,/tied for the lead in landed weight/);
 let b;for(let i=0;i<60;i++)b=tick(input);
 assert.equal(b.topic,'harborBoard');
 assert.match(b.text,/Deep Run leads in total earnings/);
});

test('zero harbor scores do not make up a leader, and storm warnings take priority at sea',()=>{
 const s={...state(),x:0,y:0};
 const peers=[{id:'near',name:'North Star',x:100,y:0,landed:0,earned:0}];
 const harbor=advance(createCrewChatter(()=>0),sample(s,sea,{peers,isInHarbor:()=>true}),60).line;
 assert.equal(harbor.topic,'harborRival');
 assert.match(harbor.text,/North Star/);
 assert.equal(advance(createCrewChatter(()=>0),sample(s,{...sea,wind:44},{peers}),60).line.topic,'storm');
 assert.equal(advance(createCrewChatter(()=>0),sample(s,sea,{peers:[{...peers[0],x:600}]}),60).line.topic,'calm');
});

test('an unchanged line is readable for nine seconds without adding extra messages',()=>{
 const s=state(),tick=createCrewChatter(()=>0),input=sample(s);
 const first=advance(tick,input,60).line;
 for(let i=0;i<8;i++)assert.equal(tick(input),first);
 assert.equal(tick(input),null);
});
