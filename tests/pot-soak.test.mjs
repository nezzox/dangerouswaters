import {test} from 'node:test';import assert from 'node:assert/strict';
import {effectiveSoakHours} from '../pot-soak.mjs';import {catchAt,createGame} from '../simulation.mjs';import {groundsAt} from '../fishing-grounds.mjs';import {restoreSeason,seasonJSON} from '../saves.mjs';
const pot={id:1,x:1000,y:500,setAt:0,legacyAbundance:1};
test('pot fill rates are 100%, 75%, 50%, then zero with continuous boundaries',()=>{assert.equal(effectiveSoakHours(0),0);assert.equal(effectiveSoakHours(6),6);assert.equal(effectiveSoakHours(24),19.5);assert.equal(effectiveSoakHours(36),25.5);assert.equal(effectiveSoakHours(96),25.5);for(const [t,rate] of [[3,1],[12,.75],[30,.5],[48,0]])assert(Math.abs((effectiveSoakHours(t+.01)-effectiveSoakHours(t))/.01-rate)<1e-9);});
test('long soaks build extra catch and never decay even after four days or longer',()=>{const six=catchAt(pot,6),day=catchAt(pot,24),full=catchAt(pot,36);assert.equal(six,22);assert.equal(day,70);assert.equal(full,90);assert(day>six);assert(full>day);for(const h of [36,48,96,240,8760])assert.equal(catchAt(pot,h),full);assert.equal(catchAt(pot,-1),0);});
test('moving grounds cannot remove crab already accumulated in a pot',()=>{const g=groundsAt(0)[4],p={id:1,x:g.x+1000,y:g.y,setAt:0};let last=0;for(let h=0;h<=96;h+=.25){const kg=catchAt(p,h);assert(kg>=last,`${h}h dropped ${last} to ${kg}`);last=kg;}assert.equal(catchAt(p,96),catchAt(p,36));});
test('existing soaked gear keeps its set time across save and uses the new non-decaying model',()=>{const s=createGame();s.pots=[{...pot}];s.hour=96;const restored=restoreSeason(JSON.parse(seasonJSON(s)));assert.equal(restored.pots[0].setAt,0);assert.equal(catchAt(restored.pots[0],restored.hour),catchAt(pot,36));});
test('hired captains use the same pot fill curve and keep long-soaked catch',async()=>{const {tickFleet}=await import('../fleet.mjs');const s=createGame();s.hour=96;const b={id:'fleet-1',boat:'boat-1-1',name:'Test vessel',parts:{},x:1000,y:500,heading:0,fuel:500,hull:100,started:true,phase:'haul',timer:0,pots:[{...pot,haul:1000}],cargo:0,salmon:0,expenses:0,earnings:0,trips:0,fishing:'crab'};s.career.fleet=[b];tickFleet(s,1,{waves:0});assert.equal(b.pots.length,0);assert.equal(b.cargo,catchAt(pot,36));});

test("poor habitat fills much slower and bonuses never exceed 90 kg",()=>{const poor={...pot,legacyAbundance:.1},medium={...pot,legacyAbundance:.5};assert.equal(catchAt(poor,36),1);assert.equal(catchAt(medium,36),23);assert.equal(catchAt({...pot,legacyAbundance:0},36),0);assert.equal(catchAt(pot,6,100),90);assert.equal(catchAt(pot,96,100),90);});
test('bait quality follows the pot through a save and preserves the capacity limit',()=>{
 const s=createGame();
 s.pots=[{...pot,legacyAbundance:.7,baitRank:5}];
 const saved=restoreSeason(JSON.parse(seasonJSON(s))).pots[0];
 assert.equal(saved.baitRank,5);
 assert.equal(catchAt(saved,24),43);
 assert.equal(catchAt({...saved,baitRank:0},24),34);
 assert.equal(catchAt({...saved,legacyAbundance:1},36),90);
});
