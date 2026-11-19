// Load the film only for a new season, after a user gesture permits audio playback.
export function createIntro({dialog,video,skip,onFinish}){
 let active=false;
 function finish(){if(!active)return;active=false;video.pause();video.removeAttribute('src');video.load();dialog.close();onFinish();}
 skip.onclick=finish;video.addEventListener('ended',finish);video.addEventListener('error',finish);
 dialog.addEventListener('cancel',e=>{e.preventDefault();finish();});
 return {start(){if(active)return;active=true;dialog.showModal();skip.focus();video.src=new URL('./intro.mp4',import.meta.url).href;video.play().catch(()=>{/* Native controls allow retry if playback is blocked. */});}};
}
