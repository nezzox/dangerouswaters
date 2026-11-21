import {vesselStats} from './career.mjs?v=0.18.25';
import {hullContact} from './vessel-collision.mjs?v=0.18.25';
import {clearWater} from './world.mjs?v=0.18.25';
import {vesselIntersectsHarbor} from './harbor.mjs?v=0.18.25';
// Short, low-speed contact recovery takes priority over routing, work and port requests.
// Keep heading fixed initially: turning a long hull while touching would sweep into the player.
export function recoverFleetContact(s,b,stats,dt){
 const player=vesselStats(s),near=hullContact(s,{...player,length:player.length+4,beam:player.beam+4},b,stats);
 let escape=b.contactEscape;
 if(escape&&(![escape.x,escape.y,escape.moved].every(Number.isFinite)||Math.hypot(escape.x,escape.y)<.5)){b.contactEscape=null;escape=null;}
 if(!escape){if(!near||!(b.fuel>0))return false;const distance=Math.hypot(b.x-s.x,b.y-s.y);escape=b.contactEscape={x:distance>.01?(b.x-s.x)/distance:-near.normal.x,y:distance>.01?(b.y-s.y)/distance:-near.normal.y,moved:0};b.avoidPoint=null;b.navigation=null;}
 if(!near&&escape.moved>=12){b.contactEscape=null;b.navigation=null;return false;}
 if(!(b.fuel>0)||dt<=0)return true;
 const travel=Math.min(.85*dt,Math.max(.1,20-escape.moved));
 for(const angle of [0,.35,-.35,.7,-.7]){const c=Math.cos(angle),n=Math.sin(angle),x=b.x+(escape.x*c-escape.y*n)*travel,y=b.y+(escape.x*n+escape.y*c)*travel,candidate={...b,x,y,career:{boat:b.boat,parts:b.parts,skills:s.career.skills}};if(!clearWater(x,y,Math.max(3,stats.beam*.45))||vesselIntersectsHarbor(candidate))continue;
 const contact=hullContact(s,player,b,stats),next=hullContact(s,player,candidate,stats);if(next&&contact&&next.depth>contact.depth+.0001)continue;if(next&&!contact)continue;
 b.x=x;b.y=y;escape.moved+=travel;b.fuel=Math.max(0,b.fuel-dt*.002);return true;}
 return true;
}
