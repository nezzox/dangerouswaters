import test from 'node:test';
import assert from 'node:assert/strict';
import {buyItem} from '../career.mjs';
import {PARTS} from '../catalog.mjs';
import {formatMoney} from '../i18n.mjs';
import {createGame} from '../simulation.mjs';
import {restoreSeason,seasonJSON} from '../saves.mjs';
import {clearWater,inWorld} from '../world.mjs';
import {crabAbundance,crabHotspot,groundsAt} from '../fishing-grounds.mjs';
import {DRONE_RADIUS,DRONE_DURATION,scanCrab,droneCameraFollow,dronePose,readSurvey} from '../drone-survey.mjs';

test('Drone Survey is a single Electronics upgrade that costs $500,000 and survives save/restore',()=>{
 const items=PARTS.filter(p=>p.key==='droneSurvey');
 assert.equal(items.length,1);
 const [item]=items,s=createGame();
 assert.equal(item.group,'Electronics');
 assert.equal(formatMoney(item.price,'en'),'$500,000');
 s.money=item.price;
 s.career.parts.sonar=1;s.career.skills.crab=4;
 assert.match(buyItem(s,'parts',item.id).message,/Crab Grounds Knowledge V/);
 assert.equal(s.money,item.price);
 s.career.skills.crab=5;s.career.parts.sonar=0;
 assert.match(buyItem(s,'parts',item.id).message,/Bottom Sounder I/);
 assert.equal(s.money,item.price);
 s.career.parts.sonar=1;
 assert(buyItem(s,'parts',item.id).ok);
 assert.equal(s.money,0);
 assert.equal(restoreSeason(JSON.parse(seasonJSON(s))).career.parts.droneSurvey,1);
});
test('the survey ranks separated open-water points by real crab abundance within a ten kilometre circuit',()=>{
 const hour=44,core=crabHotspot(groundsAt(hour)[0],5,hour),center={x:core.x+900,y:core.y};
 const points=scanCrab(center,hour,8);
 assert.equal(points.length,8);
 assert.deepEqual(points,scanCrab(center,hour,8));
 assert.deepEqual(scanCrab(center,hour,2),points.slice(0,2));
 assert.deepEqual(scanCrab(center,hour,0),[]);
 assert.deepEqual(scanCrab(center,hour,8,()=>false),[]);
 assert(points.some(p=>Math.hypot(p.x-center.x,p.y-center.y)>318));
 assert(Math.abs(2*Math.PI*DRONE_RADIUS-10000)<25);
 for(const [i,p] of points.entries()){
  assert(Math.hypot(p.x-center.x,p.y-center.y)<=DRONE_RADIUS);
  assert(inWorld(p.x,p.y)&&clearWater(p.x,p.y,45));
  assert.equal(p.score,crabAbundance(p.x,p.y,hour));
  if(i)assert(p.score<=points[i-1].score);
  for(const other of points.slice(0,i))assert(Math.hypot(p.x-other.x,p.y-other.y)>=140);
 }
 assert.deepEqual(scanCrab({x:Infinity,y:0},hour,8),[]);
});
test('crab markers survive reload but invalid or implausible entries do not',()=>{
 const hour=44,core=crabHotspot(groundsAt(hour)[0],5,hour),origin={x:core.x+200,y:core.y},points=scanCrab(origin,hour,8);
 assert.equal(points.length,8);
 const report={origin,points,hour},s=createGame();
 s.droneSurvey=report;
 assert.deepEqual(restoreSeason(JSON.parse(seasonJSON(s))).droneSurvey,report);
 assert.deepEqual(readSurvey({...report,points:[{x:core.x+1e6,y:core.y,score:1},...points]}),report);
 assert.equal(readSurvey({...report,hour:NaN}),null);
});
test('one quick flight lifts from the deck, circles the launch site and lands at the moving deck',()=>{
 const flight={origin:{x:0,y:0},heading:0,elapsed:0},dock={x:-6,y:2,height:3};
 assert.deepEqual(dronePose(flight,dock),{...dock,heading:0,phase:'launch'});
 assert(dronePose({...flight,elapsed:1},dock).height>dock.height);
 const scanned=dronePose({...flight,elapsed:5},dock);
 assert.equal(scanned.phase,'scan');
 assert(Math.abs(Math.hypot(scanned.x,scanned.y)-DRONE_RADIUS)<1e-8);
 const moving={x:21,y:14,height:4};
 assert.deepEqual(dronePose({...flight,elapsed:DRONE_DURATION},moving),{...moving,heading:0,phase:'return'});
 assert(DRONE_DURATION<=12);
});
test('the survey camera stays with the deck at takeoff and follows the drone out on the circuit',()=>{
 assert.equal(droneCameraFollow(7),0);
 assert(droneCameraFollow(45)>0&&droneCameraFollow(45)<1);
 assert.equal(droneCameraFollow(DRONE_RADIUS),1);
});
