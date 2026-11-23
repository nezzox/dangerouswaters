// Rank zero preserves the standard five-light installation.
export function lightingProfile(value=0){
 const rank=Math.max(0,Math.min(5,Number.isFinite(value)?Math.floor(value):0));
 return {rank,intensity:1+rank*.42+rank**2*.07,range:1+rank*.25,spread:rank*.024,glow:1+rank*.17};
}
export const LIGHTING_PROFILES=Array.from({length:6},(_,rank)=>Object.freeze(lightingProfile(rank)));
