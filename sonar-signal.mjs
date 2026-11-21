import {crabAbundance,salmonAbundance} from './fishing-grounds.mjs?v=0.18.36';
// Gameplay interpretation of a sounder, not a physical model of species identification.
export const SONAR_GRADES=[
 {radius:60,samples:12,error:30,interval:2,name:'Basic'},
 {radius:100,samples:20,error:23,interval:1.6,name:'Improved'},
 {radius:160,samples:28,error:16,interval:1.2,name:'Advanced'},
 {radius:240,samples:36,error:10,interval:.8,name:'Survey'},
 {radius:360,samples:48,error:5,interval:.5,name:'Precision'}
];
const clamp=n=>Math.max(0,Math.min(100,n));
export function sonarContact(s,species='crab'){const grade=Math.max(0,Math.min(5,Math.floor(s.career?.parts?.sonar||0)));if(!grade)return null;const spec=SONAR_GRADES[grade-1],tick=Math.floor(s.hour*45/spec.interval),truth=(species==='salmon'?salmonAbundance:crabAbundance)(s.x,s.y,s.hour)*100,jitter=Math.sin(tick*.37+s.x*.003+s.y*.002+(species==='salmon'?2:0))*spec.error*.35,mid=Math.round((truth+jitter)/5)*5;return {low:clamp(mid-spec.error),high:clamp(mid+spec.error),strength:clamp(mid)};}
export const isStrongCrabSignal=contact=>!!contact&&contact.low>50;
export const intelligentSetSignal=s=>isStrongCrabSignal(sonarContact(s));
