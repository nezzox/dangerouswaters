export const seaShader=/* wgsl */`
struct Sea { screen:vec4<f32>, boat:vec4<f32>, weather:vec4<f32>, camera:vec4<f32> }
@group(0) @binding(0) var<uniform> u:Sea;
struct VOut { @builtin(position) position:vec4<f32> }
@vertex fn vs(@builtin(vertex_index) i:u32)->VOut {
 let p=array<vec2<f32>,3>(vec2<f32>(-1.,-1.),vec2<f32>(3.,-1.),vec2<f32>(-1.,3.));
 var o:VOut;o.position=vec4<f32>(p[i],0.,1.);return o;
}
fn height(p:vec2<f32>,t:f32)->f32{
 return sin(dot(p,vec2<f32>(.052,.025))-t*1.3)*.62+sin(dot(p,vec2<f32>(-.032,.071))-t*.95)*.35+sin(dot(p,vec2<f32>(.14,.09))-t*2.1)*.14+sin(dot(p,vec2<f32>(.31,-.18))+t*1.7)*.055;
}
@fragment fn fs(@builtin(position) frag:vec4<f32>)->@location(0) vec4<f32>{
 let p=(frag.xy-u.screen.xy*vec2<f32>(.5,.53))/u.camera.z+u.camera.xy;
 let t=u.screen.z;let strength=u.weather.x;let h=height(p,t);let eps=.7;
 let n=normalize(vec3<f32>((h-height(p+vec2<f32>(eps,0.),t))*(1.+strength*.85),eps*.7,(h-height(p+vec2<f32>(0.,eps),t))*(1.+strength*.85)));
 let light=normalize(vec3<f32>(-.5,.8,-.4));let shade=max(0.,dot(n,light));
 let sparkle=pow(max(0.,dot(reflect(-light,n),normalize(vec3<f32>(.1,1.,.4)))),32.);
 let coast=1.-smoothstep(-230.,180.,p.x);
 var color=mix(vec3<f32>(.025,.105,.145),vec3<f32>(.09,.24,.26),shade*.85+coast*.15);
 color+=vec3<f32>(.39,.49,.43)*sparkle*(.14+strength*.055);
 let fine=sin(p.x*.73+p.y*.31+t*2.)*sin(p.y*.64-p.x*.19-t*1.4);
 let foam=smoothstep(.84,1.1,h)*smoothstep(.25,.8,fine)*(.08+strength*.035);
 color+=vec3<f32>(.33,.43,.43)*foam;
 let delta=p-u.boat.xy;let along=dot(delta,vec2<f32>(cos(u.boat.z),sin(u.boat.z)));let side=abs(dot(delta,vec2<f32>(-sin(u.boat.z),cos(u.boat.z))));
 let behind=(1.-smoothstep(-22.,-6.,along))*(1.-smoothstep(25.,220.,-along));let spread=6.+(-along)*.13;
 let wake=exp(-pow((side-spread)/3.5,2.))*behind*u.boat.w*.025;
 color+=vec3<f32>(.36,.46,.46)*wake*(.5+.5*sin(p.x*.9+p.y*.7-t*5.));
 color=mix(color,vec3<f32>(.105,.15,.18),clamp(strength*.055,0.,.3));
 color=mix(color,vec3<f32>(.33,.41,.42),u.weather.y*.55);
 let uv=frag.xy/u.screen.xy;let vignette=1.-.38*dot((uv-.5)*1.3,(uv-.5)*1.3);return vec4<f32>(color*vignette,1.);
}`;
export async function createOcean(canvas){
 let stopped=false;
 try{
  if(!navigator.gpu)throw Error('WebGPU saknas');
  const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});if(!adapter)throw Error('Ingen WebGPU-adapter');
  const device=await adapter.requestDevice(),context=canvas.getContext('webgpu'),format=navigator.gpu.getPreferredCanvasFormat();
  const shader=device.createShaderModule({code:seaShader});const diagnostics=await shader.getCompilationInfo();if(diagnostics.messages.some(m=>m.type==='error'))throw Error('Shadern kunde inte kompileras');
  const pipeline=device.createRenderPipeline({layout:'auto',vertex:{module:shader,entryPoint:'vs'},fragment:{module:shader,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list'}});
  const buffer=device.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer}}]});
  context.configure({device,format,alphaMode:'opaque'});
  const fail=()=>{stopped=true;canvas.style.opacity='0';canvas.dispatchEvent(new Event('oceanlost'));};device.lost.then(fail);device.addEventListener('uncapturederror',fail);
  return {label:'WEBGPU',gpu:true,draw(s,w,t,view){if(stopped)return;const data=new Float32Array([canvas.width,canvas.height,t,0,s.x,s.y,s.heading,Math.abs(s.speed),w.waves,w.fog,w.rain,0,view.x,view.y,view.scale*view.dpr,0]);device.queue.writeBuffer(buffer,0,data);const encoder=device.createCommandEncoder(),pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:.03,g:.1,b:.13,a:1},loadOp:'clear',storeOp:'store'}]});pass.setPipeline(pipeline);pass.setBindGroup(0,bind);pass.draw(3);pass.end();device.queue.submit([encoder.finish()]);}};
 }catch{return {label:'RESERV · 2D',gpu:false,draw(){}};}
}
let grainCanvas;
export function drawFallback(ctx,w,t,view,width,height){
 const grad=ctx.createLinearGradient(0,0,width,height);grad.addColorStop(0,w.fog>.6?'#3a565d':'#153b46');grad.addColorStop(.45,'#10333f');grad.addColorStop(1,'#092630');ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
 if(!grainCanvas){grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=128;const g=grainCanvas.getContext('2d'),image=g.createImageData(128,128);let seed=391;for(let i=0;i<image.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const c=seed>>>24;image.data[i]=c*.62;image.data[i+1]=c*.85;image.data[i+2]=c;image.data[i+3]=24;}g.putImageData(image,0,0);}
 ctx.save();ctx.translate(-(view.x*view.scale)%128,-(view.y*view.scale)%128);ctx.fillStyle=ctx.createPattern(grainCanvas,'repeat');ctx.fillRect(-128,-128,width+256,height+256);ctx.restore();
 const size=26+w.waves*3,shiftX=view.x*view.scale,shiftY=view.y*view.scale;
 for(let row=-5;row<height/size+6;row++){
  const baseline=row*size-((shiftY*.75)%(size));ctx.beginPath();
  for(let x=-25;x<width+25;x+=12){const wx=x+shiftX,y=baseline+Math.sin(wx*.012+row*.73-t*.7)*(3+w.waves*1.8)+Math.sin(wx*.039-row*.41+t*.3)*2; if(x===-25)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
  ctx.strokeStyle=`rgba(117,170,174,${.07+Math.sin(row*2.3)**2*.09})`;ctx.lineWidth=1+Math.sin(row*.5)**2;ctx.stroke();
  if(row%3===0){ctx.beginPath();const x=((row*349.7-shiftX*.4+t*8)%(width+400)+width+400)%(width+400)-200;ctx.moveTo(x,baseline+4);ctx.bezierCurveTo(x+22,baseline-2,x+48,baseline+8,x+84,baseline+2);ctx.strokeStyle=`rgba(184,208,200,${.12+w.waves*.015})`;ctx.lineWidth=1;ctx.stroke();}
 }
}
