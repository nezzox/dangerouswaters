import {routeOnDeck,canStand,CREW_SPACING,CABIN_DOOR} from './deck-layout.mjs?v=0.17.19';
const jobs={
 undock:{label:'Letting go mooring lines',duration:30,targets:[[-10.8,2.8],[-3.8,2.8],[-.45,1.1]]},
 deploy:{label:'Setting pot',duration:14,targets:[[-3.8,2.65],[-5.2,1.5],[-.45,1.2]]},
 haul:{label:'Hauling and sorting',duration:32,targets:[[-3.8,2.65],[-3.4,1.2],[-.45,1.05]]},
 unload:{label:'Unloading catch',duration:11,targets:[[-10.8,1.5],[-7.8,1.5],[-3.6,1.5]]},
 fuel:{label:'Bunkering diesel',duration:9,targets:[[-.7,2.9],[-3.4,1.5],[-6.2,1.5]]},
 repair:{label:'Repairing hull',duration:12,targets:[[-3.8,2.8],[-10.8,1.6],[-2.5,-2.9]]},
 upgrade:{label:'Installing equipment',duration:12,targets:[[-.45,1.0],[-4.5,1.5],[-2.5,-2.9]]}
};
const homes=[[-6,1.5],[-4,1.5],[-2.5,-2.9]],doorOutside=[-.35,CABIN_DOOR.z],inside=[.75,CABIN_DOOR.z];
export function createCrew(){return {members:homes.map(([x,z],i)=>({x,z,heading:i?Math.PI:0,velocity:0,phase:i*2.1,moving:false,working:false,route:[],home:[x,z],role:i,idle:0,patrol:0,hidden:false,resting:false,restUntil:0,nextRest:65+i*22,blocked:0,sick:null,sickTime:0})),pots:8,job:null,elapsed:0,cruise:0,rough:0,nextSick:150,sickCount:0,door:0,workTime:0,label:'Deck crew standing by',lastActivity:0};}
function assign(crew,m,target,avoid=false){if(!canStand(target[0],target[1],crew.pots,m.hidden||m.resting||target===inside,crew.design||{})){let nearest=null;for(let x=-11;x<-.3;x+=.25)for(let z=-2.75;z<3;z+=.25)if(canStand(x,z,crew.pots,false,crew.design||{})){const d=Math.hypot(x-target[0],z-target[1]);if(!nearest||d<nearest.d)nearest={x,z,d};}if(nearest)target=[nearest.x,nearest.z];}m.target=target;m.route=routeOnDeck([m.x,m.z],target,crew.pots,avoid?crew.members.filter(p=>p!==m&&!p.hidden):[],m.hidden||m.resting||m.exiting||target===inside,crew.design||{});m.blocked=0;}
export function commandCrew(crew,kind){const job=jobs[kind];if(!job)return false;crew.job={...job,kind};crew.workTime=0;crew.label=job.label;crew.cruise=0;crew.members.forEach((m,i)=>{m.exiting=m.hidden;m.resting=false;m.sick=null;m.working=false;assign(crew,m,job.targets[i]);});return true;}
function tick(crew,dt,waves,options){
 if(crew.layoutKey!==((options.design?.id||'')+'/'+(options.deck??crew.pots))){crew.layoutKey=(options.design?.id||'')+'/'+(options.deck??crew.pots);crew.design=options.design||{};crew.pots=options.deck??crew.pots;for(const m of crew.members){if(!m.hidden&&!canStand(m.x,m.z,crew.pots,false,crew.design)){let best=null;for(let x=-11;x<-.3;x+=.25)for(let z=-2.75;z<3;z+=.25)if(canStand(x,z,crew.pots,false,crew.design)&&!crew.members.some(p=>p!==m&&Math.hypot(p.x-x,p.z-z)<CREW_SPACING)){const d=Math.hypot(m.x-x,m.z-z);if(!best||d<best.d)best={x,z,d};}if(best){m.x=best.x;m.z=best.z;m.route=[];}}if(m.target)assign(crew,m,m.target);}}
 crew.elapsed+=dt;const speed=Math.abs(options.speed||0),cruising=!crew.job&&speed>2;
 if(crew.pots!==(options.deck??crew.pots)){crew.pots=options.deck;for(const m of crew.members)if(m.target)assign(crew,m,m.target);}
 crew.cruise=cruising?crew.cruise+dt:0;crew.rough=waves>4&&speed>1&&!crew.job?crew.rough+dt:0;
 const pace=2.1*Math.min(2,options.pace||1)/(1+waves*.11);
 for(const m of crew.members){
  if(!crew.job&&!m.sick){
   if(m.hidden&&m.resting&&m.restUntil>0&&crew.elapsed>=m.restUntil){m.exiting=true;m.resting=false;assign(crew,m,m.home);}
   if(cruising&&crew.cruise>m.nextRest&&!m.resting&&!m.hidden&&crew.members.filter(p=>p.resting).length<2&&!crew.members.some(p=>p.exiting||(p.resting&&!p.hidden))){m.resting=true;m.restUntil=0;m.nextRest=crew.cruise+120+m.role*19;assign(crew,m,inside);}
   if(!m.resting&&!m.hidden&&!m.route.length){m.idle+=dt;if(m.idle>10+m.role*3){m.idle=0;m.patrol++;const stops=[[-9.5,1.5],[-4,2.5],[-.35,1.1],m.home];assign(crew,m,stops[(m.patrol+m.role)%stops.length],true);}}
  }
  if(!crew.job&&crew.rough>=crew.nextSick&&!crew.members.some(p=>p.sick)&&!m.hidden&&!m.resting&&m.role===crew.sickCount%3){m.sick='walking';crew.sickCount++;crew.nextSick=crew.rough+240+m.role*31;assign(crew,m,[-10.9,2.9]);}
  if(m.sick==='retching'){m.sickTime+=dt;m.heading=Math.PI/2;if(m.sickTime>=7){m.sick=null;m.sickTime=0;assign(crew,m,m.home);}}
  if(!m.route.length&&m.target&&Math.hypot(m.x-m.target[0],m.z-m.target[1])>.25){m.blocked+=dt;if(m.blocked>.65)assign(crew,m,m.target,true);}
  m.moving=false;const targetPace=m.route.length?Math.min(pace,Math.max(.35,Math.hypot(m.route.at(-1)[0]-m.x,m.route.at(-1)[1]-m.z)*2.5)):0;m.velocity+=(targetPace-m.velocity)*(1-Math.exp(-dt*6));let budget=m.velocity*dt;
  while(m.route.length&&budget>0){if((m.resting||m.exiting)&&m.x>-.85&&Math.abs(m.z-CABIN_DOOR.z)<.5&&crew.door<.9)break;const [x,z]=m.route[0],dx=x-m.x,dz=z-m.z,d=Math.hypot(dx,dz);if(d<.015){m.route.shift();continue;}const travel=Math.min(d,budget),nx=m.x+dx/d*travel,nz=m.z+dz/d*travel,visible=nx<.3;
   if(visible&&crew.members.some(p=>p!==m&&!p.hidden&&Math.hypot(p.x-nx,p.z-nz)<CREW_SPACING)){m.blocked+=dt;break;}
   if(!canStand(nx,nz,crew.pots,m.hidden||m.resting||m.exiting,crew.design||{})){m.blocked+=dt;break;}
   const turn=Math.atan2(dz,dx)-m.heading;m.heading+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*9);m.x=nx;m.z=nz;if(m.x<-.9)m.exiting=false;m.hidden=!visible;m.phase+=travel*3.8;budget-=travel;m.moving=true;m.blocked=0;if(travel===d)m.route.shift();
  }
  if(m.blocked>.65&&m.target)assign(crew,m,m.target,true);
  if(m.resting&&m.x>.6&&!m.route.length){if(!m.hidden)m.hidden=true;if(!m.restUntil||m.restUntil<crew.elapsed)m.restUntil=crew.elapsed+40+m.role*12;}
  if(m.sick==='walking'&&!m.route.length&&Math.hypot(m.x+10.9,m.z-2.9)<.2){m.sick='retching';m.sickTime=0;}
  m.working=!!crew.job&&!m.hidden&&!m.route.length&&!m.moving&&m.target&&Math.hypot(m.x-m.target[0],m.z-m.target[1])<.25;if(m.working)m.heading=crew.job.kind==='repair'&&m.role===2?-Math.PI/2:Math.PI/2;
 }
 const doorWanted=crew.members.some(m=>(m.exiting||(m.resting&&m.restUntil===0))&&m.x>-1.2&&Math.abs(m.z-CABIN_DOOR.z)<1.1);crew.door+=(Number(doorWanted)-crew.door)*(1-Math.exp(-dt*6));
 if(crew.job&&crew.members.every(m=>!m.route.length&&!m.hidden)){crew.workTime+=dt;if(crew.workTime>=crew.job.duration){crew.job=null;crew.label='Clearing the deck';for(const m of crew.members){assign(crew,m,m.home);m.working=false;}}}
 if(!crew.job){const resting=crew.members.filter(m=>m.hidden).length;crew.label=crew.members.some(m=>m.sick==='retching')?'A deckhand is seasick':resting?`${resting} resting in the cabin · watch on deck`:waves>3.5?'Bracing in heavy seas':'Deck crew standing by';}
}
export function stepCrew(crew,dt,waves=0,options={}){dt=Math.max(0,Math.min(dt,1.5));const count=Math.ceil(dt/.05);for(let i=0;i<count;i++)tick(crew,dt/count,waves,options);return crew;}
export function crewPose(m,time,waves,job=null){const swing=m.moving?Math.sin(m.phase):0,phase=job?job.elapsed/job.duration:0,sequence=job?.grapple?Math.max(0,(phase-.3)/.7):phase,sorting=job?.kind==='haul'&&sequence>.45&&sequence<.8,work=m.working?Math.sin(time*(sorting?2.7:2.1)+m.role*1.7):0,sick=m.sick==='retching';return {bob:m.moving?Math.abs(Math.sin(m.phase))*.035:Math.sin(time*.9+m.role)*.008,lean:sick?-.65-Math.max(0,Math.sin(m.sickTime*3))*.16:m.moving?-.09:m.working?-(sorting?.26:.12)-work*.045:Math.sin(time*.8+m.role)*waves*.009,leg:swing*.48,knee:m.moving?Math.max(0,-swing)*.6:0,arm:sick?.85:m.working?(job?.grapple&&phase<.12&&m.role===0?-.4+phase/.12*2.7:(sorting?.85:1.1)+work*(m.role===0?.32:.2)):-swing*.42,brace:!m.moving&&!m.working?Math.min(.55,waves*.08):0};}
