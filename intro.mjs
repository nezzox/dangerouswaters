// Load the film only for a new season, after a user gesture permits audio playback.
export function createIntro({dialog,video,skip,onFinish}){
 let active=false,completed=onFinish;
 function finish(){if(!active)return;active=false;video.pause();video.removeAttribute('src');video.load();dialog.close();completed();}
 skip.onclick=finish;video.addEventListener('ended',finish);video.addEventListener('error',finish);
 dialog.addEventListener('cancel',e=>{e.preventDefault();finish();});
 return {start({source='./intro.mp4',onFinish:finishCallback=onFinish}={}){if(active)return;active=true;completed=finishCallback;dialog.showModal();skip.focus();video.src=new URL(source,import.meta.url).href;video.play().catch(()=>{/* Native controls allow retry if playback is blocked. */});}};
}
