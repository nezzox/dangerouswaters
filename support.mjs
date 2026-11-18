// Keep the external donation widget clear of the responsive game toolbar.
const footer=document.querySelector('footer');
const position=()=>document.documentElement.style.setProperty('--toolbar-height',`${Math.ceil(footer.getBoundingClientRect().height)}px`);
new ResizeObserver(position).observe(footer);position();
if(window.kofiWidgetOverlay)window.kofiWidgetOverlay.draw('nezzox',{
 type:'floating-chat',
 'floating-chat.donateButton.text':'Support me',
 'floating-chat.donateButton.background-color':'#0d1b22',
 'floating-chat.donateButton.text-color':'#fff'
});
