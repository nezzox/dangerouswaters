// A conservative FXAA pass after the browser's native MSAA resolve.
export const vertex=`#version 300 es
precision highp float;
out vec2 uv;
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
export const fragment=`#version 300 es
precision highp float;
uniform sampler2D image;uniform vec2 pixel;
in vec2 uv;out vec4 color;
float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
void main(){vec3 c=texture(image,uv).rgb;
vec3 nw=texture(image,uv+vec2(-1.,-1.)*pixel).rgb,ne=texture(image,uv+vec2(1.,-1.)*pixel).rgb;
vec3 sw=texture(image,uv+vec2(-1.,1.)*pixel).rgb,se=texture(image,uv+pixel).rgb;
float m=luma(c),a=luma(nw),b=luma(ne),d=luma(sw),e=luma(se);
float lo=min(m,min(min(a,b),min(d,e))),hi=max(m,max(max(a,b),max(d,e)));
if(hi-lo<max(.045,hi*.16)){color=vec4(c,1.);return;}
vec2 dir=vec2(-((a+b)-(d+e)),(a+d)-(b+e));
float reduce=max((a+b+d+e)*.03125,.0078125);
dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+reduce),vec2(-4.),vec2(4.))*pixel;
vec3 narrow=.5*(texture(image,uv-dir/6.).rgb+texture(image,uv+dir/6.).rgb);
vec3 wide=narrow*.5+.25*(texture(image,uv-dir*.5).rgb+texture(image,uv+dir*.5).rgb);
float w=luma(wide);color=vec4(mix(c,w<lo||w>hi?narrow:wide,.65),1.);}`;
export function createAntialias(gl,program){const p=program(vertex,fragment).p,texture=gl.createTexture(),vao=gl.createVertexArray(),image=gl.getUniformLocation(p,'image'),pixel=gl.getUniformLocation(p,'pixel');let width=0,height=0;
return (w,h)=>{gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,texture);if(w!==width||h!==height){width=w;height=h;gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB8,w,h,0,gl.RGB,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,w,h);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.useProgram(p);gl.uniform1i(image,2);gl.uniform2f(pixel,1/w,1/h);gl.bindVertexArray(vao);gl.drawArrays(gl.TRIANGLES,0,3);gl.activeTexture(gl.TEXTURE0);};}
