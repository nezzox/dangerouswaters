// Keep distant fleet geometry out of the local renderer; chart visibility is unchanged.
export function visibleFleet(s,range=900){return [...(s.career?.fleet||[]),...(s.remotePlayers||[])].map(b=>({boat:b,visible:Math.hypot(b.x-s.x,b.y-s.y)<range,pots:(b.pots||[]).filter(p=>Math.hypot(p.x-s.x,p.y-s.y)<range)})).filter(v=>v.visible||v.pots.length);}
export function fleetColor(hex){return /^#[0-9a-f]{6}$/i.test(hex||'')?[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255):[.44,.79,.87];}
