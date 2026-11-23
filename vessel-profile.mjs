const palette=[[.68,.7,.64],[.68,.69,.61],[.25,.32,.35],[.46,.21,.17],[.34,.4,.36],[.68,.62,.48],[.26,.31,.33],[.49,.52,.48],[.7,.72,.69],[.2,.29,.34],[.52,.57,.55]];
export const deckSign=design=>design?.deckSign===-1?-1:1;
const offshoreProfiles=[
 // Bow rise, stern rise, bridge height, glazing rake, topside and trim.
 [.18,.08,.91,.86,[.66,.65,.57],[.23,.34,.33]], // Ridge coastal
 [1.12,.52,1.06,.55,[.16,.24,.34],[.64,.64,.52]], // Kodiak heavy crabber
 [.76,.38,1.10,.42,[.32,.18,.15],[.70,.58,.42]], // Twin dual working sides
 [.91,.28,1.12,.68,[.16,.23,.25],[.55,.42,.18]], // Stern ramp
 [.37,.18,.92,1.02,[.53,.56,.51],[.21,.42,.47]], // Sockeye seiner
 [.97,.50,1.16,.70,[.18,.32,.42],[.67,.67,.56]], // Frontier multi-fishery
 [1.40,.72,1.11,.40,[.21,.29,.38],[.64,.68,.66]], // Icebound
 [.48,.13,.86,1.15,[.28,.38,.36],[.70,.68,.53]], // Swift low bridge
 [1.48,.83,1.25,.60,[.16,.23,.30],[.58,.59,.48]], // Atlas factory crabber
 [1.30,.61,1.19,.72,[.19,.31,.40],[.64,.41,.24]], // Oceanic
 [1.82,.49,1.18,.46,[.065,.20,.24],[.22,.35,.35]], // Classical Guppy
];
export function vesselExterior(design={}){
 const family=Number(/^boat-(\d+)-/.exec(design.id||'')?.[1]||0);
 if(!family)return null;
 const electric=design.powertrain==='electric';
 const [bow,stern,bridge,rake,hull,trim]=electric
  ?[1.65,.74,1.05,1.08,[.53,.57,.58],[.71,.73,.70]]
  :offshoreProfiles[family-1];
 return {family,bow,stern,bridge,rake,hull,trim,electric};
}
export const hullPaint=design=>design?.powertrain==='electric'?[.62,.67,.66]:design?.id?.startsWith('boat-11-')?[.80,.79,.71]:palette[Number(/^boat-(\d+)/.exec(design?.id||'')?.[1]||0)%palette.length];
export function deckFrame(matrix,design){if(deckSign(design)>0)return matrix;const out=new Float64Array(matrix);for(let i=0;i<4;i++)out[i]*=-1;return out;}
