export const CREW_RADIUS=.31,CREW_SPACING=.84;
export const CABIN_DOOR={x:.18,z:1.65};
export function potPositions(count){return Array.from({length:Math.min(count,20)},(_,i)=>({x:-10+Math.floor(i/6)*2,z:-2.05+(i%2)*2.05,y:2.4+Math.floor((i%6)/2)*1.25}));}
const rectangle=(x,z,a,b,c,d,r)=>Math.hypot(Math.max(a-x,0,x-b),Math.max(c-z,0,z-d))<r;
export function canStand(x,z,count=8,door=false){
 if(x< -11.25||x>-.3||Math.abs(z)>3){if(!(door&&x>=-.3&&x<=.85&&z>=1.3&&z<=2.0))return false;}
 if(rectangle(x,z,-2.95,-.85,-1.55,.65,CREW_RADIUS)||rectangle(x,z,-3.,-.8,.55,1.25,CREW_RADIUS))return false;
 if(Math.hypot(x+1.5,z-2.1)<.38+CREW_RADIUS||Math.hypot(x+3,z-3.1)<.42+CREW_RADIUS)return false;
 if(rectangle(x,z,-1.95,-1.05,-2.7,-1.9,CREW_RADIUS))return false;
 for(const p of potPositions(count))if(rectangle(x,z,p.x-.85,p.x+.85,p.z-.83,p.z+.83,CREW_RADIUS))return false;
 return true;
}
export function clearSegment(a,b,count=8,door=false){const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.025);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(!canStand(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,count,door))return false;}return true;}
// A small fixed deck grid routes around cage stacks, hatch, hauler, crane and people.
export function routeOnDeck(start,target,count=8,people=[],door=false){
 const free=(x,z)=>canStand(x,z,count,door)&&people.every(p=>Math.hypot(p.x-x,p.z-z)>=CREW_SPACING+.03);
 if(!free(...target))return [];
 const nodes=[];for(let ix=0;ix<=48;ix++)for(let iz=0;iz<=24;iz++){const x=-11.25+ix*.25,z=-3+iz*.25;if(free(x,z))nodes.push({x,z,key:ix*25+iz});}
 const nearest=p=>[...nodes].sort((a,b)=>Math.hypot(a.x-p[0],a.z-p[1])-Math.hypot(b.x-p[0],b.z-p[1])).find(n=>clearSegment(p,[n.x,n.z],count,door)),first=nearest(start),last=nearest(target);if(!first||!last)return [];
 const byKey=new Map(nodes.map(n=>[n.key,n])),open=[first.key],cost=new Map([[first.key,0]]),came=new Map(),closed=new Set();
 while(open.length){open.sort((a,b)=>cost.get(a)+Math.hypot(byKey.get(a).x-last.x,byKey.get(a).z-last.z)-cost.get(b)-Math.hypot(byKey.get(b).x-last.x,byKey.get(b).z-last.z));const key=open.shift(),n=byKey.get(key);if(key===last.key){const result=[];let at=key;while(at!==undefined){const v=byKey.get(at);result.unshift([v.x,v.z]);at=came.get(at);}if(free(...target))result.push(target);return result;}
  closed.add(key);for(const delta of [-26,-25,-24,-1,1,24,25,26]){const next=byKey.get(key+delta);if(!next||closed.has(next.key)||Math.hypot(next.x-n.x,next.z-n.z)>.36||!clearSegment([n.x,n.z],[next.x,next.z],count,door))continue;if(next.x!==n.x&&next.z!==n.z&&(!free(next.x,n.z)||!free(n.x,next.z)))continue;const c=cost.get(key)+Math.hypot(next.x-n.x,next.z-n.z);if(c<(cost.get(next.key)??Infinity)){came.set(next.key,key);cost.set(next.key,c);if(!open.includes(next.key))open.push(next.key);}}
 }return [];
}
