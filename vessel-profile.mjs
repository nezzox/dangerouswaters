const palette=[[.68,.7,.64],[.68,.69,.61],[.25,.32,.35],[.46,.21,.17],[.34,.4,.36],[.68,.62,.48],[.26,.31,.33],[.49,.52,.48],[.7,.72,.69],[.2,.29,.34],[.52,.57,.55]];
export const deckSign=design=>design?.deckSign===-1?-1:1;
export const hullPaint=design=>design?.powertrain==='electric'?[.62,.67,.66]:palette[Number(/^boat-(\d+)/.exec(design?.id||'')?.[1]||0)%palette.length];
export function deckFrame(matrix,design){if(deckSign(design)>0)return matrix;const out=new Float32Array(matrix);for(let i=0;i<4;i++)out[i]*=-1;return out;}
