const colors=[[.72,.29,.065],[.74,.57,.18],[.26,.31,.29],[.48,.19,.14],[.32,.38,.41],[.64,.65,.57]];
export const craneColor=design=>colors[design?.id==='nordvind'||!design?.id?0:(Number(/^boat-(\d+)/.exec(design.id)?.[1]||1)%colors.length)];
export const potDropLocal=layout=>layout==='stern'?[-13.5,0,0]:[-3.1,0,5.6];
