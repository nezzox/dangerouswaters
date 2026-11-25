// Original, locally synthesized scores. Phrases wrap over the loop boundary
// (including their tails), so weather transitions need no audio downloads.
const scores={
 calm:{bar:4.8,voice:'felt',chords:[[45,52,55,59],[41,48,52,55],[48,55,59,64],[43,50,55,57],[45,52,55,59],[41,48,52,55],[48,55,60,64],[43,50,55,62]],theme:[[69,64],[67],[71,67],[62],[69,67],[64],[72,67],[62]]},
 rain:{bar:4.2,voice:'felt',chords:[[50,57,60,65],[46,53,57,60],[48,55,60,62],[45,52,55,60],[50,57,60,65],[46,53,57,62],[43,50,53,58],[45,52,55,60]],theme:[[65,69,72],[65,60],[67,70,74],[64,60],[69,72,77],[69,65],[65,62,58],[60,64]]},
 snow:{bar:5.4,voice:'glass',chords:[[47,54,57,62],[43,50,54,57],[50,57,62,66],[45,52,57,59],[47,54,57,62],[43,50,54,59],[50,57,61,66],[45,52,55,59]],theme:[[78,74],[81],[78,76],[73],[74,78],[76],[81,78],[76]]},
 storm:{bar:3.8,voice:'brass',chords:[[38,45,50,53],[37,44,49,52],[38,45,48,53],[34,41,48,53],[38,45,50,53],[40,47,52,55],[34,41,46,50],[37,44,49,55]],theme:[[50,53,57],[49,52],[50,57,60],[46],[50,55,57],[52,55],[50,46],[49,55]]}
};
export function musicMood(w,previous='calm'){
 if((w.wind||0)>=(previous==='storm'?28:34)||(w.waves||0)>=(previous==='storm'?3.55:4.25))return 'storm';
 if((w.snow||0)>=(previous==='snow'?.13:.28)&&(w.snow||0)>=(w.rain||0)*.85)return 'snow';
 if((w.rain||0)>=(previous==='rain'?.13:.27))return 'rain';
 return 'calm';
}
const HARMONICS={pad:[1,.29,.13,.07,.034],felt:[1,.32,.24,.07,.045],glass:[1,.08,.24,.04,.13],brass:[1,.47,.24,.18,.08]};
const TAU=2*Math.PI,TABLE=1024;
const waves=Object.fromEntries(Object.entries(HARMONICS).map(([id,partials])=>[id,Float32Array.from({length:TABLE},(_,i)=>partials.reduce((s,a,k)=>s+a*Math.sin(i/TABLE*TAU*(k+1)),0))]));
export function renderMusicLoop(id,sampleRate=16000){
 const {bar,voice,chords,theme}=scores[id],length=Math.round(chords.length*bar*sampleRate);
 const left=new Float32Array(length),right=new Float32Array(length);
 function note(midi,start,seconds,amp,pan,instrument){
  const pad=instrument==='pad',table=waves[instrument],offset=Math.round(start*sampleRate),duration=Math.round(seconds*sampleRate);
  const step=440*2**((midi-69)/12)*TABLE/sampleRate;
  const attack=Math.round((pad?.87:instrument==='brass'?.09:.024)*sampleRate);
  const release=Math.round((pad?.9:.26)*sampleRate);
  const l=amp*Math.sqrt((1-pan)/2),r=amp*Math.sqrt((1+pan)/2);
  let phase=0,decay=1,index=offset;
  const fall=pad?1:Math.exp(-(instrument==='glass'?1.05:1.7)/sampleRate);
  for(let n=0;n<duration;n++){
   const envelope=Math.min(1,n/attack,(duration-n)/release);
   const a=phase|0,f=phase-a;
   const sample=(table[a]+(table[(a+1)&(TABLE-1)]-table[a])*f)*envelope*envelope*decay;
   left[index]+=sample*l;right[index]+=sample*r;
   if(++index===length)index=0;
   phase=(phase+step)%TABLE;decay*=fall;
  }
 }
 for(let i=0;i<chords.length;i++){
  const start=i*bar,chord=chords[i];
  note(chord[0]-12,start,bar+1.0,id==='storm'?.115:.067,0,'pad');
  chord.forEach((n,k)=>note(n,start+k*.10,bar+1.35,.047+(k%2)*.009,(k-1.5)*.38,'pad'));
  if(id==='rain'||id==='storm')for(let k=0;k<4;k++){
   note(chord[id==='storm'?0:k%3],start+bar*(.12+k*.23),id==='storm'?1.35:1.72,id==='storm'?.069:.075,(k%2?1:-1)*.24,voice);
  }
  theme[i].forEach((n,k)=>note(n,start+bar*(.18+k*.245),id==='snow'?3.45:2.95,.12+(k===0?.03:0),(k%2?1:-1)*.34,voice));
 }
 // Short stereo room tails; wrap taps to preserve continuity during looping.
 const dryL=left.slice(),dryR=right.slice(),a=Math.round(.27*sampleRate),b=Math.round(.49*sampleRate);
 let peak=0;
 for(let i=0;i<length;i++){
  const j=(i+length-a)%length,k=(i+length-b)%length;
  left[i]+=dryR[j]*.21+dryL[k]*.12;right[i]+=dryL[j]*.21+dryR[k]*.12;
  peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
 }
 for(let i=0;i<length;i++){left[i]*=.53/peak;right[i]*=.53/peak;}
 return [left,right];
}
export function createWeatherMusic(ac,output){
 const bus=ac.createGain(),buffers=new Map();bus.gain.value=0;bus.connect(output);
 let current=null,level=0;
 return {update(w,enabled,volume){
  const now=ac.currentTime,target=enabled?.32*volume:0;
  if(level!==target){level=target;bus.gain.setTargetAtTime(target,now,.17);}
  const next=enabled?musicMood(w,current?.id):null;
  if((current?.id??null)===next)return;
  if(current){current.gain.gain.setTargetAtTime(0,now,.58);current.source.stop(now+2.8);current=null;}
  if(!next)return;
  if(!buffers.has(next)){
   const rate=16000,[left,right]=renderMusicLoop(next,rate),buffer=ac.createBuffer(2,left.length,rate);
   buffer.copyToChannel(left,0);buffer.copyToChannel(right,1);buffers.set(next,buffer);
  }
  const source=ac.createBufferSource(),gain=ac.createGain();
  source.buffer=buffers.get(next);source.loop=true;gain.gain.value=0;
  source.connect(gain).connect(bus);source.onended=()=>{source.disconnect();gain.disconnect();};
  source.start();gain.gain.setTargetAtTime(1,ac.currentTime,.82);current={id:next,source,gain};
 }};
}
