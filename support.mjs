// Keep the scrollable HUD clear of the responsive bottom toolbar.
const footer=document.querySelector('footer');
function measure(){document.documentElement.style.setProperty('--toolbar-height',`${Math.ceil(footer.getBoundingClientRect().height)}px`);}
new ResizeObserver(measure).observe(footer);
measure();
