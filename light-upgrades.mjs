// Bounded visual profiles. Rank zero preserves the standard five-light installation.
export function lightingProfile(value=0){const rank=Math.max(0,Math.min(5,Number.isFinite(value)?Math.floor(value):0));return {rank,intensity:1+rank*.22,range:1+rank*.15,spread:rank*.016,glow:1+rank*.08};}
export const LIGHTING_PROFILES=Array.from({length:6},(_,rank)=>Object.freeze(lightingProfile(rank)));
