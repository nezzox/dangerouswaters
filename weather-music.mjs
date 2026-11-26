// The score follows wind and wave severity, not the type of precipitation.
const tracks={
 calm:['calm-sea-01.mp3','calm-sea-02.mp3'],
 medium:['medium-sea-01.mp3','medium-sea-02.mp3'],
 heavy:['heavy-sea-01.mp3']
};
export function musicMood({wind=0,waves=0},previous='calm'){
 if(wind>=(previous==='heavy'?28:34)||waves>=(previous==='heavy'?3.55:4.25))return 'heavy';
 if(wind>=(previous==='calm'?17:14)||waves>=(previous==='calm'?1.5:1.2))return 'medium';
 return 'calm';
}
const FADE_SECONDS=2.4,FADE_STEPS=12;
function fadeCue(param,now,from,fadeIn){
 param.cancelScheduledValues(now);
 param.setValueAtTime(from,now);
 // Matched sine/cosine curves keep the combined level steady at the midpoint.
 for(let i=1;i<=FADE_STEPS;i++){
  const progress=i/FADE_STEPS;
  const volume=fadeIn?Math.sin(progress*Math.PI/2):i===FADE_STEPS?0:from*Math.cos(progress*Math.PI/2);
  param.linearRampToValueAtTime(volume,now+progress*FADE_SECONDS);
 }
}
export function createWeatherMusic(ac,output,load=async(file,signal)=>{
 const response=await fetch(new URL(file,import.meta.url),{signal});
 if(!response.ok)throw Error('Music unavailable');
 return ac.decodeAudioData(await response.arrayBuffer());
}){
 const bus=ac.createGain();
 bus.gain.value=0;bus.connect(output);
 const cursors={calm:{index:0,offset:0},medium:{index:0,offset:0},heavy:{index:0,offset:0}};
 let wanted=null,current=null,pending=null,lastBuffer=null,level=0,retryAt=0;
 function retire(now=ac.currentTime){
  if(!current)return;
  const {mood,source,gain,started,offset}=current;
  cursors[mood].offset=(offset+Math.max(0,now-started))%source.buffer.duration;
  current=null;
  const elapsed=Math.max(0,now-started);
  fadeCue(gain.gain,now,Math.sin(Math.min(1,elapsed/FADE_SECONDS)*Math.PI/2),false);
  try{source.stop(now+FADE_SECONDS+.04);}catch{}
 }
 function start(mood,file,buffer){
  const started=ac.currentTime;retire(started);
  const cursor=cursors[mood],source=ac.createBufferSource(),gain=ac.createGain();
  const offset=cursor.offset<buffer.duration-.03?cursor.offset:0;
  source.buffer=buffer;source.loop=tracks[mood].length===1;gain.gain.value=0;
  source.connect(gain).connect(bus);
  const cue={mood,source,gain,started,offset};
  source.onended=()=>{
   source.disconnect();gain.disconnect();
   if(current!==cue)return;
   current=null;cursor.index=(cursor.index+1)%tracks[mood].length;cursor.offset=0;
  };
  source.start(0,offset);fadeCue(gain.gain,started,0,true);
  current=cue;lastBuffer={file,buffer};
 }
 return {update(w,enabled,volume){
  const target=enabled?.28*volume:0,now=ac.currentTime;
  if(level!==target){level=target;bus.gain.setTargetAtTime(target,now,.17);}
  const mood=target>0?musicMood(w,wanted??'calm'):null;
  if(mood!==wanted){
   wanted=mood;
   if(pending){pending.controller.abort();pending=null;}
   retryAt=0;
  }
  if(!mood){retire();return;}
  if(current?.mood===mood||pending||Date.now()<retryAt)return;
  const file=tracks[mood][cursors[mood].index];
  if(lastBuffer?.file===file){start(mood,file,lastBuffer.buffer);return;}
  const request={controller:new AbortController()};
  pending=request;
  void load(file,request.controller.signal).then(buffer=>{
   if(pending!==request||wanted!==mood)return;
   start(mood,file,buffer);pending=null;
  }).catch(()=>{
   if(pending!==request)return;
   pending=null;retryAt=Date.now()+15000;
  });
 }};
}
