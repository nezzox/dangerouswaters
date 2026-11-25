import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildGeography} from '../geography-mesh.mjs';
import {buildPortScenery} from '../port-scenery.mjs';
import {DUTCH_QUAY as q,SERVICE_APRON as apron} from '../world.mjs';
const uv=(x,y)=>[(x-q.x)*q.tx+(y-q.y)*q.ty,(y-q.y)*q.tx-(x-q.x)*q.ty];
function triangles(mesh,material,bottom){
 const found=[];
 for(let i=0;i<mesh.length;i+=33){
  if(mesh[i+10]!==material||Math.min(mesh[i+1],mesh[i+12],mesh[i+23])!==bottom)continue;
  found.push([i,i+11,i+22].map(j=>uv(mesh[j],mesh[j+2])));
 }
 return found;
}
test('Dutch Harbor has one quay face, without an overlapping coast bank',()=>{
 const banks=triangles(buildGeography(q.x,q.y),-1,-8);
 const coastOverQuay=banks.filter(points=>points.every(([u,v])=>u>=apron.start-.001&&u<=apron.end+.001&&v>=-8.001&&v<=apron.depth+.001));
 assert.equal(coastOverQuay.length,0);
 assert(banks.some(points=>points.some(([u,v])=>Math.abs(u-apron.end)<.001&&Math.abs(v)<8)&&points.some(([u])=>u>apron.end+30)));
 const faces=triangles(buildPortScenery(),-3,-2).filter(points=>points.every(([,v])=>Math.abs(v)<.001));
 const edge=faces.flat().map(([u])=>u);
 assert(Math.abs(Math.min(...edge)-apron.start)<.001);
 assert(Math.abs(Math.max(...edge)-57.8)<.001);
});

test('Dutch Harbor’s outer quay end joins the shoreline instead of leaving a sideways step',()=>{
 const face=triangles(buildPortScenery(),-3,-2);
 const coast=triangles(buildGeography(q.x,q.y),-1,-8).find(points=>
  points.some(([u,v])=>Math.abs(u-apron.end)<.001&&v< -3)&&points.some(([u])=>u>apron.end+30));
 assert(coast);
 const end=coast.find(([u])=>Math.abs(u-apron.end)<.001);
 assert(face.some(points=>points.some(([u,v])=>Math.hypot(u-end[0],v-end[1])<.001)));
 const berthFace=face.flat().filter(([u,v])=>u>35&&u<=57.801&&Math.abs(v)<.001);
 assert(berthFace.length>0,'keep a straight wall along the main service quay');
});
