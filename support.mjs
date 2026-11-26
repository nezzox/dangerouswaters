// Track real HUD sizes when text wraps or the available screen changes.
const elements=[['footer','--toolbar-height'],['header','--hud-header-height'],['#pot-action','--pot-action-height']];
for(const [selector,property] of elements){
 const element=document.querySelector(selector);
 if(!element)continue;
 const measure=()=>document.documentElement.style.setProperty(property,`${Math.ceil(element.getBoundingClientRect().height)}px`);
 new ResizeObserver(measure).observe(element);
 measure();
}
