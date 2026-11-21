// Fictional fishing grounds in approximate species regions, not regulatory boundaries.
// Coordinates use the same antimeridian-aware projection as the chart.
const regions=[
 ['aleutians','Aleutian','golden',[[-166.49,54.01],[-165.8,54.5],[-167.5,53.7],[-169,53.2],[-171,52.8],[-173,52.6],[-175,52.5],[-177,52.4],[-179,52.3],[179,52.2],[176,52.1],[173,52.6]]],
 ['pribilof','Pribilof',null,[[-170.3,56.85],[-169.8,57.05],[-169.45,56.3],[-171,56.7],[-170.8,57.2],[-169.2,56.8],[-170,56.1]]],
 ['eastern','Eastern Bering','tanner',[[-165.8,55.7],[-164.8,56],[-163.7,56.2],[-165.5,56.5],[-164.4,56.8],[-163.1,57],[-162.1,56.6],[-166.2,57.1],[-165.1,57.5],[-163.9,57.6]]],
 ['bristol','Bristol Bay','red',[[-163.8,57.5],[-162.8,58],[-161.7,57.7],[-160.8,58.2],[-159.8,58.1],[-160.3,57.7]]],
 ['bering','Bering Sea','snow',[[-172,57.5],[-174,57.2],[-176,57.6],[-178,58],[-173,58.4],[-175,58.6],[-177,59],[-179,59.4],[-172,59.4],[-174,59.7],[-176,60.1],[-178,60.5],[-171,60.3],[-173,61],[-175,61.3],[-177,61.6]]],
 ['western','Western Bering','tanner',[[179,57.5],[177,57.6],[175,57.4],[173,57.5],[171,57.2],[169,57],[179,59],[177,59.2],[175,59.1],[173,59.3],[171,59.2],[169,58.5]]],
 ['stmatthew','St Matthew','blue',[[-172.8,60.15],[-171.8,59.9],[-173.6,60.3],[-172,60.8],[-174,60.9],[-170.8,60.6]]]
];
export const CRAB_GROUND_DATA=regions.flatMap(([region,prefix,species,points])=>points.map(([lon,lat],i)=>({name:region==='aleutians'&&i===0?'UNALASKA SHELF':region==='bristol'&&i===5?'Reymonds spot':`${prefix.toUpperCase()} ${String(i+1).padStart(2,'0')}`,lon,lat,region,species:species||(i%2?'blue':'red'),size:i%3===0?3:2})));
