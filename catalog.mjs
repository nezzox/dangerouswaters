// Most disciplines/systems have five ranks; intelligent automation is a separate single purchase.
export const SKILL_SYSTEMS=[
 ['autoDeploy','Automatic pot setting','Automation',4500,'Automatically set pots after clearing the buoy range ring'],
 ['autoHaul','Automatic pot retrieval','Automation',6500,'Unlock auto haul; higher ranks reduce minimum soak by 0.2 h'],
 ['work','Deck teamwork','Crew',3500,'All deck operations 8% faster per rank'],
 ['deploy','Pot rigging','Crew',2800,'Setting pots 10% faster per rank'],
 ['haul','Hauler handling','Crew',4000,'Hauling pots 9% faster per rank'],
 ['sort','Catch sorting','Crew',3200,'Haul/sort cycle 7% faster per rank'],
 ['repair','Damage control','Safety',6000,'Incident repairs 15% faster per rank'],
 ['fuel','Economical helm','Navigation',5000,'Fuel use reduced by 4% per rank'],
 ['crab','Crab grounds knowledge','Fishing',5500,'Unlock crab ground potential forecasts; higher ranks narrow uncertainty and add 6% yield per rank; rank IV shows migration direction; rank V reveals dense crab cores on the chart'],
 ['salmon','Salmon reading','Fishing',6500,'Unlock salmon ground potential forecasts; higher ranks narrow uncertainty and add 8% yield per rank'],
 ['price','Market negotiation','Business',8000,'Catch prices +2.5% per rank'],
 ['bait','Bait preparation','Fishing',3000,'Bait cost reduced by 6% per rank'],
 ['hull','Heavy weather seamanship','Safety',5500,'Wave damage reduced by 4% per rank'],
 ['risk','Preventive maintenance','Safety',7500,'Incident frequency reduced by 5% per rank'],
 ['steer','Skipper navigation','Navigation',20000,'Rank I: full-speed return and dock; rank II: approach oldest own pot. Rudder response +7% per rank'],
 ['net','Net handling','Fishing',5000,'Net deployment/retrieval 10% faster per rank'],
 ['unload','Landing coordination','Crew',3500,'Harbor unloading 10% faster per rank'],
 ['fleet','Fleet management','Business',10000,'Hired crew share reduced by 1 percentage point per rank'],
 ['service','Supplier relationships','Business',6000,'Fuel/repair service prices reduced by 4% per rank'],
 ['stability','Swell anticipation','Navigation',4500,'Roll response reduced by 5% per rank']
].map(([key,name,group,base,description])=>({key,name,group,base,description}));
export const PART_SYSTEMS=[
 ['engine','Propulsion system','Propulsion',14000,'Top speed +0.45 m/s per grade'],['hull','Hull reinforcement','Hull',18000,'Wave damage reduced by 7% per grade'],
 ['tank','Energy storage','Storage',12000,'Energy capacity +150 L (diesel) / kWh (electric) per grade'],['hold','Insulated hold','Storage',16000,'Catch capacity +250 kg per grade'],
 ['racks','Pot racks','Storage',10000,'Four additional pots per grade'],['crane','Hydraulic crane','Deck',20000,'All deck work 10% faster per grade'],
 ['propeller','Efficient propeller','Propulsion',15000,'Fuel use reduced by 5% per grade'],['rudder','Rudder assembly','Propulsion',11000,'Rudder response +8% per grade'],
 ['sonar','Bottom sounder','Electronics',21000,'Unlock live bottom sonar; five grades improve range, resolution and signal accuracy; crab yield +5% per grade'],['nets','Salmon net system','Deck',22000,'Salmon yield +8% per grade; requires salmon-capable hull'],
 ['chiller','Refrigeration','Storage',24000,'Catch prices +2% per grade'],['pumps','Emergency pumps','Safety',15000,'Incident repairs 10% faster per grade'],
 ['radio','Safety communications','Electronics',17000,'Incident frequency reduced by 4% per grade'],['stabilizer','Roll stabilizers','Hull',25000,'Roll response reduced by 7% per grade'],
 ['winch','Pot winch','Deck',18000,'Haul/sort cycle 10% faster per grade'],['freezer','Bait freezer','Storage',11000,'Bait cost reduced by 5% per grade'],
 ['lights','Deck floodlights','Electronics',9000,'Brighter, wider and longer-reaching work lights per grade; pot deployment 5% faster per grade'],['landing','Landing conveyor','Deck',16000,'Harbor unloading 8% faster per grade'],
 ['workshop','Onboard workshop','Safety',20000,'Fuel/repair service prices reduced by 5% per grade'],['quarters','Crew accommodation','Hull',26000,'One additional berth per grade; crew increases work rate']
].map(([key,name,group,base,description])=>({key,name,group,base,description}));
SKILL_SYSTEMS.push({key:'intelligentAutoSet',name:'Intelligent Auto Set',group:'Automation',base:1500000,maxRank:1,description:'Requires Auto Set I and installed sonar. Deploy only when the sonar lower crab estimate exceeds 50%. Existing speed and spacing limits still apply.'});
SKILL_SYSTEMS.push({key:'highSpeedHaul',name:'Haul at high speed',group:'Crew',base:20000,maxRank:1,description:'Set and haul crab pots below 7 knots.'});
SKILL_SYSTEMS.push({key:'maxSpeedHauling',name:'Max Speed Hauling',group:'Crew',base:200000,maxRank:1,description:'Set and haul crab pots at up to 13 knots.'});
SKILL_SYSTEMS.push({key:'pickupAll',name:'Pickup All Pots',group:'Automation',base:1500000,maxRank:1,description:'Requires Auto Haul. Plots a continuous working-side route through all your own pots, oldest first, and enables Auto Haul. Stops when the hold is full.'});
const ranks=(systems,prefix)=>systems.flatMap(d=>Array.from({length:d.maxRank||5},(_,i)=>({id:`${prefix}-${d.key}-${i+1}`,key:d.key,rank:i+1,maxRank:d.maxRank||5,name:d.maxRank===1?d.name:`${d.name} ${['I','II','III','IV','V'][i]}`,group:d.group,price:Math.round(d.base*(i+1)**2.15/100)*100,description:d.description,requires:i?`${prefix}-${d.key}-${i}`:null})));
export const SKILLS=ranks(SKILL_SYSTEMS,'skill'),PARTS=ranks(PART_SYSTEMS,'part');
const DESIGNS=[
 ['Ridge','Coastal crabber','starboard',false,24,3,1,1],['Kodiak','Heavy crabber','starboard',false,27,4,.95,1.15],
 ['Twin','Dual-hauler crabber','both',false,28,5,1.02,1.25],['Stern','Aft-wheelhouse crabber','starboard',false,26,4,1,1.1],
 ['Sockeye','Salmon seiner','starboard',true,25,4,1.1,.9],['Frontier','Multi-fishery vessel','both',true,29,6,1,1.3],
 ['Icebound','Ice-strengthened crabber','starboard',false,30,5,.9,1.65],['Swift','Fast long-range seiner','starboard',true,26,4,1.3,1],
 ['Atlas','Factory crabber','both',false,32,7,.95,1.5],['Oceanic','Expedition multi-fishery','both',true,33,8,1.1,1.7],
 ['Classical Guppy','Classic offshore crabber','starboard',false,30,6,1.05,1.5],
 ['Queen Blue','Live crab carrier','starboard',false,32,7,1.0,1.7],
 ['Highwater','Forward-working crabber','starboard',false,32,6,1.03,1.65]
];
export const STARTER={id:'nordvind',name:'Nordvind',type:'Crab fishing vessel',price:180000,length:24,beam:7.6,crew:3,hauler:'starboard',salmon:false,capacity:900,pots:8,tank:500,top:6.2,protection:1,color:0};
const electricClass=(d,i)=>i>=7&&[5,8,9].includes(d);
// Higher classes and larger variants carry enough reserves for offshore trips.
const dieselTank=(family,variant)=>Math.round((900+family*430+variant*240+variant**2*24)/50)*50;
export const BOATS=DESIGNS.flatMap(([name,type,hauler,salmon,length,crew,speed,protection],d)=>Array.from({length:10},(_,i)=>({
 id:`boat-${d+1}-${i+1}`,name:`${name}${electricClass(d,i)?' E':''} ${String(i+1).padStart(2,'0')}`,type,group:electricClass(d,i)?'Electric / solar':salmon?'Crab & salmon':'Crab',hauler,salmon,rank:i+1,
 price:Math.round((360000+d*170000)*(1+i*.42)**1.65*(electricClass(d,i)?4.5:1)/1000)*1000,length:(length+i*1.4-(d===7?4:0))*1.2,beam:((d===7?9.4:d===3?8.8:7.6)+i*.16)*1.2,deckSign:[3,4,10,12].includes(d)?-1:1,rampBow:d===3,forwardWork:d===12,powertrain:electricClass(d,i)?'electric':'diesel',solarKw:electricClass(d,i)?40+i*3:0,
 crew:crew+Math.floor(i/2),capacity:1300+d*180+i*550,pots:12+d*2+i*4,tank:electricClass(d,i)?15000+i*1800:dieselTank(d,i),
 top:(6.4+i*.24)*speed,protection:protection+i*.08,color:d+1,
 description:`${electricClass(d,i)?'Solar-assisted battery electric; shore charging; ':''}${[3,4,10,12].includes(d)?'Aft wheelhouse / forward working deck; ':''}${d===3?'Broad ramp bow; ':''}${d===7?'Short wide hull; ':''}${type}; ${hauler==='both'?'port & starboard haulers':hauler+' hauler'}${salmon?'; salmon nets':''}. Size ${i+1}/10.`
})));
export const boatById=id=>id==='nordvind'?STARTER:BOATS.find(b=>b.id===id)||STARTER;
