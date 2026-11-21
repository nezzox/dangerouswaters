// USD per live kg, rounded from historical ex-vessel benchmarks; see docs/crab-fisheries.md.
export const CRAB_SPECIES={
 golden:{en:'Golden king crab',sv:'Guldkungskrabba',usdKg:16.76,color:'#c7a858'},
 red:{en:'Red king crab',sv:'Röd kungskrabba',usdKg:16.36,color:'#cb7e72'},
 blue:{en:'Blue king crab',sv:'Blå kungskrabba',usdKg:12.32,color:'#7caeda'},
 snow:{en:'Snow crab',sv:'Snökrabba',usdKg:10.93,color:'#b4a2d4'},
 tanner:{en:'Tanner crab',sv:'Tannerkrabba',usdKg:8.27,color:'#c2bb78'}
};
export const crabSpeciesName=(id,language='en')=>(Object.hasOwn(CRAB_SPECIES,id)?CRAB_SPECIES[id]:CRAB_SPECIES.golden)[language==='sv'?'sv':'en'];
