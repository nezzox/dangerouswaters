import {createWeatherMusic} from './weather-music.mjs?v=0.18.78';
import {replacementProgress} from './man-overboard.mjs?v=0.18.78';
// Procedural Web Audio: music and effects have independent gain before the limiter.
export function ambientMix(state,weather,enabled=true){const near=Math.max(0,1-Math.hypot(state.x-160,state.y-80)/1800),drive=Math.min(1,Math.abs(state.throttle||0)),on=enabled&&!state.paused?1:0;return{engine:on*(.065+drive*.075)*(state.electricDrive?.18:1),wind:on*Math.min(.20,.035+weather.wind*.0035),sea:on*Math.min(.19,.045+weather.waves*.025),rain:on*Math.min(.12,Math.max(0,weather.rain||0)*.10),harbor:on*near*.035,creak:on*Math.min(.045,weather.waves*.007),near};}
export function createSoundscape(Context=globalThis.AudioContext){const ac=new Context(),master=ac.createGain(),limiter=ac.createDynamicsCompressor();let volume=1,music=null;master.gain.value=.8;limiter.threshold.value=-14;limiter.knee.value=18;limiter.ratio.value=5;master.connect(limiter).connect(ac.destination);
 const source=(type,frequency,cutoff)=>{const osc=ac.createOscillator(),filter=ac.createBiquadFilter(),gain=ac.createGain();osc.type=type;osc.frequency.value=frequency;filter.type='lowpass';filter.frequency.value=cutoff;gain.gain.value=0;osc.connect(filter).connect(gain).connect(master);osc.start();return{osc,gain,filter};};
 const motor=source('sawtooth',32,180),diesel=source('triangle',17,80),machine=source('sine',83,240);
 const buffer=ac.createBuffer(1,ac.sampleRate*5,ac.sampleRate),samples=buffer.getChannelData(0);let brown=0;for(let i=0;i<samples.length;i++){brown=(brown+(Math.random()*2-1)*.02)/1.02;samples[i]=brown*3.5;}
 const noise=(type,cutoff,rate)=>{const node=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();node.buffer=buffer;node.loop=true;node.playbackRate.value=rate;filter.type=type;filter.frequency.value=cutoff;gain.gain.value=0;node.connect(filter).connect(gain).connect(master);node.start();return{gain,filter};};
 const wind=noise('lowpass',850,.87),sea=noise('lowpass',440,1.13),rain=noise('highpass',1500,1.7);
 const rotor=noise('lowpass',430,1.3),winch=source('triangle',120,310);
 const bladePulse=ac.createOscillator(),pulseDepth=ac.createGain(),rotorEnvelope=ac.createGain();
 bladePulse.frequency.value=14;
 pulseDepth.gain.value=.47;rotorEnvelope.gain.value=.53;
 rotor.filter.disconnect();
 rotor.filter.connect(rotorEnvelope).connect(rotor.gain);
 bladePulse.connect(pulseDepth).connect(rotorEnvelope.gain);
 bladePulse.start();
 const swell=ac.createOscillator(),swellGain=ac.createGain();swell.frequency.value=.16;swellGain.gain.value=.035;swell.connect(swellGain).connect(sea.gain.gain);swell.start();
 let nextBird=ac.currentTime+10,nextCreak=ac.currentTime+5,nextHorn=ac.currentTime+50,muted=true;
 const tone=(frequency,end,volume,duration,type='sine')=>{const osc=ac.createOscillator(),gain=ac.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(end,ac.currentTime+duration);gain.gain.setValueAtTime(0,ac.currentTime);gain.gain.linearRampToValueAtTime(volume,ac.currentTime+.08);gain.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+duration);osc.connect(gain).connect(master);osc.start();osc.stop(ac.currentTime+duration+.05);};
 return{ac,updateMusic(weather,enabled){if(enabled)music??=createWeatherMusic(ac,limiter);music?.update(weather,enabled,volume);},greet(){tone(104,100,.10,1.6,'triangle');tone(156,151,.04,1.55);},setVolume(value){volume=Math.max(0,Math.min(1,Number.isFinite(value)?value:1));master.gain.setTargetAtTime(muted?0:.8*volume,ac.currentTime,.08);},resume:()=>ac.resume(),update(state,weather,enabled){const mix=ambientMix(state,weather,enabled),now=ac.currentTime;master.gain.setTargetAtTime(enabled&&!state.paused?.8*volume:0,now,.18);muted=!enabled||state.paused;const set=(param,v)=>param.setTargetAtTime(v,now,.45);
 set(motor.gain.gain,mix.engine);set(diesel.gain.gain,mix.engine*.55);set(motor.osc.frequency,state.electricDrive?90+Math.abs(state.throttle||0)*180:28+Math.abs(state.throttle||0)*30);set(diesel.osc.frequency,14+Math.abs(state.throttle||0)*15);set(wind.gain.gain,mix.wind);set(wind.filter.frequency,550+weather.wind*15);set(sea.gain.gain,mix.sea);set(rain.gain.gain,mix.rain);set(machine.gain.gain,mix.harbor);
 const event=state.overboard,flight=!muted&&event?.phase==='flight';
 const remaining=flight?(1-replacementProgress(event,state))*Math.hypot(state.x-event.x,state.y-event.y):Infinity;
 const rotorLevel=flight?.31/(1+(remaining/52)**2):0;
 set(rotor.gain.gain,rotorLevel);
 set(rotor.filter.frequency,240+rotorLevel*1500);
 set(winch.gain.gain,flight&&event.elapsed>=event.flightSeconds&&event.elapsed<event.flightSeconds+10?.035:0);
 if(!muted&&now>nextBird){if(mix.near>.25){tone(950,640,.035*mix.near,.55);tone(1150,740,.022*mix.near,.8);}nextBird=now+18+Math.random()*24;}
 if(!muted&&now>nextCreak){tone(95,49,mix.creak,1.4,'triangle');nextCreak=now+9+Math.random()*17;}
 if(!muted&&now>nextHorn){if(mix.near>.1){tone(104,102,.035*mix.near,3.5,'triangle');tone(155,153,.015*mix.near,3.5);}nextHorn=now+65+Math.random()*55;}
 }};
}
