import {workX} from './vessel-profile.mjs?v=0.18.92';
export function lineHaulerMounts(design={}){if(design.hauler==='stern')return [[-10,2.65,0]];return (design.hauler==='both'?[-1,1]:[design.hauler==='port'?-1:1]).map(side=>[workX(design,-3),2.65,side*(design.id&&design.id!=='nordvind'?3.04:2.7)]);}
export function haulerRunning(job){return job?.kind==='haul'&&job.elapsed/job.duration>.12&&job.elapsed/job.duration<.62;}
