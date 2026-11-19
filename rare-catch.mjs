// Fictional collector variants, not a biological species list. Prices use saved SEK units.
const variants=[
 ['crab','Amber King','Honey-colored shell with dark amber joints.',0],
 ['crab','Blue Lantern','Cobalt shell with pale speckling.',0],
 ['crab','Copper Crown','A copper sheen and a crown of shell spines.',0],
 ['crab','Ivory Snow','An unusually pale snow crab.',1],
 ['crab','Scarlet Giant','A deep scarlet collector specimen.',1],
 ['crab','Jade Claw','Green-tinted claws and a mottled shell.',1],
 ['crab','Silverback','A broad silver stripe across the carapace.',2],
 ['crab','Obsidian King','A nearly black shell with crimson joints.',2],
 ['crab','Ghost of Unalaska','A translucent-looking pearl-white variant.',2],
 ['crab','Aurora Crown','Blue-green iridescence across the shell.',3],
 ['crab','Glacier Sapphire','An intense sapphire-blue collector specimen.',3],
 ['crab','Bering Emperor','A spectacular old king with oversized claws.',3],
 ['crab','Golden Sovereign','A brilliant golden shell with ivory markings.',4],
 ['crab','Midnight Diamond','A black shell flecked with silver.',4],
 ['crab','Phantom of the Deep','A pearl-black king with pale, glassy markings.',4],
 ['salmon','Copper Runner','Warm copper scales along the flanks.',0],
 ['salmon','Silver Comet','A striking silver fish with a long tail.',0],
 ['salmon','Rosefin','Rose-colored fins and bright silver scales.',1],
 ['salmon','Frostfire','Pale scales with a fiery red stripe.',1],
 ['salmon','Moonlit Chinook','A luminous-looking silver king salmon.',2],
 ['salmon','Jade Sockeye','An unusual jade-green and crimson pattern.',2],
 ['salmon','Aurora King','Iridescent blue, violet and green flanks.',3],
 ['salmon','Stormglass','A steely blue collector specimen.',3],
 ['salmon','Golden Tsar','A rare golden king salmon.',4],
 ['salmon','White Leviathan','An immense ivory-colored collector salmon.',4]
];
const odds=[10000,20000,40000,70000,100000],prices=[25000,60000,150000,400000,1000000],tiers=['Rare','Exceptional','Epic','Legendary','Mythic'];
export const RARE_CATCHES=variants.map(([species,name,description,tier],i)=>Object.freeze({id:`rare-${i+1}`,species,name,description,odds:odds[tier],value:prices[tier]*10,tier:tiers[tier]}));
export const rareById=id=>RARE_CATCHES.find(r=>r.id===id)||null;
const clean=raw=>Object.fromEntries(RARE_CATCHES.filter(r=>Number.isFinite(raw?.[r.id])&&raw[r.id]>0).map(r=>[r.id,Math.min(100000,Math.floor(raw[r.id]))]));
export function ensureRareState(s){s.career??={};s.career.rareSeed=(s.career.rareSeed>>>0)||((s.career.seed^0xa341316c)>>>0)||1;s.career.rareCollection=clean(s.career.rareCollection);s.rareHold=clean(s.rareHold);for(const b of s.career.fleet||[])b.rareHold=clean(b.rareHold);return s;}
// A single exclusive categorical roll: each type has its own exact probability per haul.
export function rareAtRoll(species,roll){if(!Number.isFinite(roll)||roll<0||roll>=1)return null;for(const r of RARE_CATCHES.filter(r=>r.species===species)){roll-=1/r.odds;if(roll<0)return r;}return null;}
export function prepareRareCatch(s,gear,species,kg){if(!(kg>0))return null;ensureRareState(s);if(Object.hasOwn(gear,'rareId'))return rareById(gear.rareId)?.species===species?gear.rareId:null;let x=s.career.rareSeed;x^=x<<13;x^=x>>>17;x^=x<<5;s.career.rareSeed=x>>>0;gear.rareId=rareAtRoll(species,(x>>>0)/4294967296)?.id||null;return gear.rareId;}
export function awardRareCatch(s,owner,id){const r=rareById(id);if(!r)return null;ensureRareState(s);owner.rareHold??={};owner.rareHold[r.id]=(owner.rareHold[r.id]||0)+1;s.career.rareCollection[r.id]=(s.career.rareCollection[r.id]||0)+1;return r;}
export const rareValue=owner=>RARE_CATCHES.reduce((n,r)=>n+r.value*Math.max(0,Math.min(100000,Math.floor(Number.isFinite(owner.rareHold?.[r.id])?owner.rareHold[r.id]:0))),0);
export const rareCount=owner=>RARE_CATCHES.reduce((n,r)=>n+(owner.rareHold?.[r.id]||0),0);
