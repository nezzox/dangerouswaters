import {SKILL_SYSTEMS,PART_SYSTEMS} from './catalog.mjs?v=0.18.57';
export function ownedUpgrades(s){const list=(systems,ranks)=>systems.filter(d=>ranks?.[d.key]>0).map(d=>({...d,rank:ranks[d.key]}));return {skills:list(SKILL_SYSTEMS,s.career?.skills),parts:list(PART_SYSTEMS,s.career?.parts),legacy:[['engine','Engine'],['hold','Hold'],['gear','Pots']].filter(([key])=>s[key]>0).map(([key,name])=>({key,name,rank:s[key]}))};}
// Wall-clock lifetime: time compression never accelerates radio fading.
export function createRadioFeed(){let seen=new WeakSet(),rows=[];return {update(log,now){for(const entry of [...log].reverse())if(!seen.has(entry)){seen.add(entry);rows.unshift({entry,at:now});}rows=rows.filter(r=>now-r.at<30000).slice(0,8);return rows.map(r=>({...r.entry,opacity:Math.max(0,Math.min(1,(30000-(now-r.at))/6000))}));},reset(){seen=new WeakSet();rows=[];}};}

export function createLastHaul(){let previous=null,at=0;return (haul,now)=>{if(!haul){previous=null;return null;}if(haul!==previous){previous=haul;at=now;}const age=now-at;if(age>=45000)return null;return {...haul,opacity:Math.max(0,Math.min(1,(45000-age)/8000))};};}
