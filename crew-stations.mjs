import {workX} from './vessel-profile.mjs?v=0.18.77';
export function crewStations(design={},job={}){const stern=design.hauler==='stern',side=design.hauler==='port'||design.hauler==='both'&&job.side<0?-1:1;
 const stations=[{task:'crane',target:stern?[-7.15,2.55]:[-2.3,side*2.1],face:stern?[-8.1,1.6]:[-1.7,side*2.1]}, {task:job.kind?.startsWith('net')?'net':'winch',target:job.kind?.startsWith('net')?[-7.75,.85]:stern?[-10,1.15]:[-3.8,side*2.65],face:job.kind?.startsWith('net')?[-7.75,-1]:stern?[-10,0]:[-3,side*2.7]}, {task:'lash',target:[-4,1.25],face:[-4,0]}];if(design.forwardWork){
  for(const station of stations){
   station.target[0]=workX(design,station.target[0]);
   station.face[0]=workX(design,station.face[0]);
  }
  stations[2].target=[-3.2,1.25];
 }
 return stations;}
export function crewAction(task,job){if(!job||task==='watch')return 'watch';const p=job.elapsed/job.duration,q=job.grapple?Math.max(0,(p-.3)/.7):p;if(task==='crane')return 'controls';if(task==='winch')return job.kind==='haul'?(job.grapple&&p<.12?'throw':q<.4?'pull':'watch'):job.kind==='deploy'&&p<.35?'rig':'watch';if(task==='net')return 'pull';return task==='lash'&&(job.kind==='secure'||job.kind==='deploy'&&p<.2||job.kind==='haul'&&q>.8||job.kind==='netHaul'&&p>.7)?'lash':'watch';}
