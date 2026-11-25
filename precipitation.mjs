// Three apparent depths, with stable individual trajectories. Speeds are screen-space.
const wrap=(n,size)=>((n%size)+size)%size;
const limit=n=>Math.max(0,Math.min(1,n||0));
export function drawPrecipitation(ctx,w,t,width,height){
 const rain=limit(w.rain),snow=limit(w.snow);
 if(rain<.015&&snow<.015)return;
 const angle=(w.windDirection??250)*Math.PI/180,wind=Math.min(1.35,w.wind/42);
 const across=-Math.sin(angle)*wind,along=-Math.cos(angle)*wind;
 const density=Math.min(1.7,Math.max(.5,width*height/950000));
 ctx.save();
 // Far precipitation reduces contrast before the distinct near drops and flakes.
 if(rain>.08){
  const veil=ctx.createLinearGradient(0,0,width*.35,height);
  veil.addColorStop(0,`rgba(130,154,169,${rain*.135})`);
  veil.addColorStop(1,`rgba(97,126,144,${rain*.035})`);
  ctx.fillStyle=veil;ctx.fillRect(0,0,width,height);
 }
 for(let layer=0;layer<3;layer++){
  const depth=.52+layer*.43;
  if(rain>=.015){
   const vx=across*340*depth,vy=(470+along*80)*depth;
   ctx.strokeStyle=`rgba(175,206,223,${(.05+rain*.13)*(1+layer*.36)})`;
   ctx.lineWidth=.38+layer*.27;ctx.lineCap='round';ctx.beginPath();
   for(let i=0,count=Math.ceil((.035+rain)*density*(240+layer*60));i<count;i++){
    const n=i+(layer+1)*347,variation=.82+(n%17)*.022,shutter=.026+(n%7)*.008;
    const x=wrap(n*253.57+t*vx*variation,width+160)-80;
    const y=wrap(n*331.31+t*vy*variation,height+160)-80;
    ctx.moveTo(x,y);ctx.lineTo(x+vx*shutter,y+vy*shutter);
   }
   ctx.stroke();
  }
  if(snow>=.015){
   for(let group=0;group<3;group++){
    ctx.fillStyle=`rgba(226,239,243,${(.11+snow*.23)*(1+layer*.34)*(.73+group*.15)})`;
    ctx.beginPath();
    for(let i=0,count=Math.ceil((.025+snow)*density*(51+layer*21));i<count;i++){
     const n=i+layer*227+group*367,r=depth*(.39+group*.43+(n%5)*.13),phase=t*(.66+n%13*.08)+n*1.618;
     const x=wrap(n*283.19+t*across*(67+n%13*2)*depth+Math.sin(phase)*(3+wind*15)*depth,width+64)-32;
     const y=wrap(n*121.93+t*(31+n%11*3+along*12)*depth+Math.cos(phase*.87)*r*1.9,height+50)-25;
     const rotation=phase*.8,rx=r*(1+wind*.27),ry=r*(.47+(n%7)*.063);
     ctx.moveTo(x+Math.cos(rotation)*rx,y+Math.sin(rotation)*rx);
     ctx.ellipse(x,y,rx,ry,rotation,0,2*Math.PI);
    }
    ctx.fill();
   }
  }
 }
 ctx.restore();
}
