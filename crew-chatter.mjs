import {POT_CAPACITY} from './pot-soak.mjs?v=0.18.86';

// Each pair is two independently authored lines in the same situation and voice.
// A short optional lead-in adds cadence. No general-purpose random sentence mashups.
const voices={
 bright:['','Well now. ','You love to see it. ','Now we’re talking. ','All right! ','I’ll take it. ','Would you look at that. ','How about that. '],
 dry:['','Well. ','I’ll say it. ','Between us. ','Here we go. ','Just saying. ','I reckon so. ','Tell you what. '],
 wary:['','Hey, skipper. ','Listen up. ','Easy now. ','Heads up. ','Not gonna lie. ','Just a thought. ','For what it’s worth. '],
};
const bank={
 bigHaul:['bright',
 'That pot’s stuffed to the lid.|This one came up crawling.|Look at the size of that haul.|That’s the kind of pot we came for.|I could hardly see the bottom of that pot.|Now that’s a proper load of crab.|That thing was heavy for a good reason.|There’s a whole payday in that pot.',
 'You picked a good string, Captain.|Keep us on this ground, skipper.|That’s a spot worth coming back to.|Our shares just got a little healthier.|Here’s hoping the neighbors look like that.|That haul made my watch.|I’ll take another one just like it.|Good call bringing us out here.'],
 poorHaul:['dry',
 'That was barely worth the lift.|I can count that catch without taking my gloves off.|We hauled a lot of steel for not much crab.|Slim pickings in that one.|Those crabs had the whole pot to themselves.|That’s a pretty lonely-looking catch.|Gas money, maybe. Payday, no.|All that winch and hardly any crab.',
 'Captain, how attached are you to this spot?|Maybe the next set needs a different bottom.|Tell the skipper this ground owes us a favor.|I’d try deeper water before we bet on this patch.|Let’s hope the next buoy belongs to a better pot.|If that was the good spot, I’ve got questions.|I wouldn’t put much more bait down here.|You can do better than that, Captain.'],
 emptyHaul:['dry',
 'Not one crab in that pot.|We caught a very fine bag of seawater.|Nothing in there but ocean.|That pot came back exactly as we sent it.|That’s a lot of effort for zero crab.|Empty pot. Not even a stowaway.|The bottom can keep that one.|A whole soak and absolutely nothing.',
 'Any chance the captain has a second choice?|Maybe we should ask the crab where they’d like us to set.|Can we try somewhere else, skipper?|I sure hope that wasn’t the captain’s secret spot.|Let’s not bait the same patch twice.|Who put this one on the chart, anyway?|I’m not calling that an economical use of diesel.|Next one had better have something in it.'],
 setting:['dry',
 'Another pot headed over the side.|This pot’s our next bet.|There goes a little bait and a lot of optimism.|We’ll know more once this one’s soaked.|Good, let the bottom do some work for us.|One more pot going down.|We’ve got another one to put on the ground.|That’s another buoy for the watch list.',
 'Keep the line clear of your boots.|I’m giving that rope plenty of room.|Nice and steady on the gear.|I’ll keep an eye on the buoy.|Let it settle before we get too excited.|Leave it enough time to earn its keep.|Mind the slack on deck.|We’ll find out what’s down there soon enough.'],
 hauling:['dry',
 'We’re bringing one up now.|There’s another pot on the line.|We’ll see what that soak was worth.|The hauler’s got another one.|Time to see what took the bait.|This one’s on its way to the rail.|First the rope, then the answer.|Let’s see what’s living in this one.',
 'Keep her steady, skipper.|I always like the moment before we see it.|I hope there’s more than bait in there.|I’ll give the line room to run.|Easy as she comes up.|Watch your feet around the gear.|I’m ready when it comes over.|Let it clear the rail first.'],
 idle:['dry',
 'We’ve had a long stretch without working a pot.|I’m starting to miss the sound of that hauler.|That’s a quiet watch, even for out here.|My sorting gloves are getting bored.|Feels like we’ve been waiting all watch.|I’ve got more coffee in me than work done.|The gear’s getting more rest than I am.|Been a while since we had something to sort.',
 'Any chance we’ll find better fishing ahead?|Captain, tell me there’s a plan.|I’m ready to get something back on deck.|A little action would be welcome about now.|Maybe it’s time to try a different patch.|I’d rather be earning my share.|I hope the next round is worth the wait.|Could use a decent haul before we call it a day.'],
 calm:['bright',
 'Couldn’t ask for much smoother water.|That’s a gentle sea for once.|It’s finally nice enough to look around.|She isn’t fighting the water today.|Even my coffee’s staying in the mug.|I’ll take a sea like this every watch.|That’s about as friendly as this water gets.|It’s good to hear the engine over the wind.',
 'Makes a change from bracing for every roll.|Feels good to stand up straight for once.|I’d happily work a string in this.|Hope it holds a while longer.|Don’t get too used to it, though.|Nice to be able to hear each other talk.|We got the right end of the weather today.|We ought to enjoy it while we can.'],
 cold:['wary',
 'I can barely feel my fingers.|That cold gets right through the gloves.|Feels like the rail might take my skin off.|The air’s got a bite to it.|My cuffs feel like cardboard.|This is the kind of cold you take inside with you.|Just breathing out here feels sharp.|I’m getting cold right through the layers.',
 'I could use five minutes by the heater.|Hot coffee isn’t going to last long out here.|Make sure you can still feel what you’re holding.|I’m putting the dry gloves on next chance I get.|Don’t let the coffee go cold too.|I owe the heater an apology for saying it was too hot.|I’m not shaking hands with that rail.|Keep moving if you want to stay warm.'],
 storm:['wary',
 'I don’t like the way she’s rolling.|That sea looks mean from down here.|I’m not loving this weather, Captain.|This is getting ugly quick.|I’ve got both hands for the boat at this point.|She’s taking a beating out here.|That’s no weather to get careless in.|I wouldn’t turn my back on this sea.',
 'Are we sure we want to stay out here?|Can we take it a little easier, skipper?|No pot is worth getting washed off for.|I’d take a quieter heading if we can.|Say the word if we’re making for shelter.|I’d rather lose some time than take a bad wave wrong.|Nobody needs to prove anything out here.|Let’s not push our luck with this sea.'],
 snow:['wary',
 'Snow’s starting to fill my hood.|That snow goes sideways before it goes down.|I’ve got snow in places that never see daylight.|The snow’s taking the edges off everything.|Snow sticking to the deck already.|I keep brushing snow off the same rail.|That snow’s coming in thick.|Hard to keep your eyes clear in this snow.',
 'Watch where you put your feet.|Keep your gloves out of the slush.|I’ll be looking for a dry layer later.|Try not to lose sight of the next buoy.|It’s worth wiping the windows again.|The wheelhouse looks pretty inviting from here.|I’m keeping an eye on the edges of the deck.|Feels like it’ll keep coming for a while.'],
 rain:['dry',
 'The rain’s found the gap in my collar.|Everything on deck’s getting a rinse.|There goes my last dry sleeve.|That rain’s got some persistence.|I’m pretty sure my boots are filling from the top.|The rain makes this a long watch.|My jacket sounded more waterproof in the shop.|Hard rain out here today.',
 'At least the deck didn’t need washing first.|I should’ve brought the other gloves.|I’d keep a dry rag for the glass.|I hope the spare gear is still dry.|Better mind your step coming down the ladder.|The coffee had better be hot later.|I’ll be hanging everything up after this.|Could be a while before we dry out.'],
 fog:['wary',
 'Can’t see much past the rail in this fog.|The horizon’s gone completely.|That fog makes the next buoy hard to pick out.|I can hear more than I can see.|Gray on gray all the way out.|That’s a short view from deck right now.|We lost the horizon in a hurry.|The fog’s closing the view right down.',
 'I’d keep one eye on the chart.|We can take a little longer if we need to.|I’ll watch the water on this side.|Let me know if you pick anything up ahead.|I’m not guessing at distances in this.|No prize for getting there first in fog.|I’ll call anything I spot out here.|Mind what you can’t see, skipper.'],
 icing:['wary',
 'The deck’s icing up.|We’ve got real ice to knock off.|The ice is taking hold of the rail.|That’s ice, not just frost.|The deck needs clearing before we carry on.|We’re stopping to get this ice off.|I can see why they brought out the ice tools.|We don’t need to be carrying that extra ice.',
 'Watch your footing until it’s clear.|I’m making room for the crew with the tools.|It’s worth stopping for a clean deck.|We can fish again once we’ve cleared it.|Give the icy side a little space.|I’ll check my footing before I move.|Better to do it now than let it build.|Don’t expect the rail to be easy to grip.'],
 survey:['bright',
 'The survey drone’s out looking over the grounds.|That drone is doing our scouting today.|There’s our little set of eyes in the air.|The drone’s got a better view than either of us.|At least the drone doesn’t ask for a share.|Let’s see what the survey finds out there.|That little machine is earning its deck space.|We’re looking for the next set of spots now.',
 'I hope it turns up something worth baiting.|We’ll see how clever it is when the pots come up.|I’m curious what it finds away from this patch.|Better than guessing where to drop the next one.|Maybe it can save us a little wandering.|Finding a spot is only half the job.|I’d rather check the ground before we set.|Let’s see where it sends us next.'],
 surveySet:['dry',
 'We’re running the marks the drone picked.|The survey’s turned into real work.|The next set is on that survey track.|We’re putting the drone’s guesses to the test.|This is the route the survey gave us.|Time to see if those marks earn their keep.|The drone found them. We get to set them.|Now it’s pots, not dots.',
 'I’ll watch for the next waypoint.|Let’s hope it picked a good bottom.|The haul will tell us if it was right.|I like having the next spot already lined up.|Keep that next pot ready.|I’ll try to remember which marks look promising.|I’m interested to see how that string fishes.|See if we can make those marks count.'],
 harbor:['bright',
 'We’re making for harbor.|Nice to be pointed back toward the docks.|The wheelhouse has us heading for port.|We’re on the homeward leg now.|That’s a welcome turn back toward land.|Looks like we’re done heading farther out.|We’ll get back alongside before too long.|It feels good to be headed in.',
 'I’m looking forward to solid ground.|Let me know when you want the lines ready.|A hot meal sounds pretty good after this.|I’ll get the deck ready before we come alongside.|I’ll take a dock over a rolling deck tonight.|Doesn’t hurt to think about the next trip already.|I’m ready to see a roof that doesn’t move.|Let’s get in without any drama.'],
 docked:['bright',
 'We’re tied up at last.|I forgot what a still deck feels like.|Nothing’s rolling under my feet for once.|Good to be alongside.|We’ve got the boat tied up and quiet.|That quay is a welcome sight.|I can finally set the mug down.|It’s nice not to brace against anything.',
 'I’ll take a breather before the next trip.|There’s still gear to put in order.|Might get a proper cup of coffee now.|This is a good time to check the gloves.|Let me know when we’re heading back out.|I could get used to this for about ten minutes.|We’ll be back outside soon enough.|The next watch can wait a moment.'],
 landing:['bright',
 'The catch is coming off the boat.|There’s our work going up onto the quay.|Good to see the hold getting emptied.|This is where the long watch pays off.|Nice to have someone else lifting for a minute.|We’re landing the catch now.|There goes a whole trip’s work in the right direction.|That’s the part we came back for.',
 'I want to see what the tally comes to.|I’ll tidy the deck once they’re done.|At least we didn’t bring it home for nothing.|Let’s get the hold straight for the next run.|Good to finish the job at the dock.|I’ll believe the payday when the tally’s in.|We’ll have room for another load now.|Now there’s time to think about the next trip.'],
 lowFuel:['wary',
 'We’re down to the low end of the fuel gauge.|That fuel gauge is looking thin.|Not much fuel left to work with.|I’d keep that fuel reading in mind.|The fuel level is making me nervous.|We’re not rich in fuel right now.|There’s not much reserve on that gauge.|We’re getting near the bottom of the tank.',
 'Do we have enough to get back, Captain?|I wouldn’t wander any farther without a plan.|Might be time to think about a fill-up.|Worth checking the distance to port.|I’d leave ourselves a margin for the weather.|I’d rather stop for fuel than stop for lack of it.|Let’s not count on the last drop.|Can we make a fuel stop before the next ground?'],
 lineLost:['dry',
 'Losing that pot hurts.|We just lost steel, bait and whatever was in it.|That pot isn’t coming back with us.|One less pot in the gear count.|A lost line can make a whole watch feel longer.|There goes a pot we can’t put out again.|That’s a nasty way to lose a pot.|No good news on that line.',
 'We’ll have to make the rest count.|I’d check the rest of the gear before the next lift.|I’d rather be out a pot than out a person.|That’s coming out of the trip one way or another.|I hope that’s the only one we lose today.|No sense adding a second mistake to the first.|Time to count what we’ve still got.|Let’s give the next lift some care.'],
 cruise:['dry',
 'We’re making our way along now.|Just the run between jobs for a bit.|Feels like a long way out when you look around.|There’s a lot of water between stops out here.|Nothing but the run ahead for a while.|We’ve got some sea to cover yet.|We’re out here properly now.|It’s a steady stretch of water for the moment.',
 'I’ll keep watching from this side.|Might as well get the gear ready for later.|I’ll take it steady till the next job.|I’m keeping an eye out for the buoys.|I’ll be ready when there’s work to do.|It’s a good time to check the next mark.|I’m all ears if you need a hand.|We’ll see what the next stretch brings.'],
 rival:['dry',
 '{rival} is on our patch again.|Look who found our fishing spot: {rival}.|Is that {rival} crowding our buoys?|There’s {rival}, right where we were going.|Even out here, {rival} finds a way to fish next door.|{rival} must have bought the same chart.|Looks like {rival} has taken an interest in our string.|Plenty of water out here, and {rival} picks this bit.',
 'Typical. We turn, they turn.|Next they’ll want our bait recipe.|Should we charge for the guided tour?|Can’t blame them for having good taste.|I hope they leave us a few crab.|Apparently a secret spot needs a bigger ocean.|I’d wave, but they might copy that too.|The crab haven’t picked a side yet.'],
 harborRival:['dry',
 'Looks like {rival} made it in too.|There’s {rival} coming through the harbor.|Wonder how {rival} did on that last run.|Spotted {rival} by the docks.|{rival} finally traded the swell for the quay.|That’s {rival}, back in one piece.|It’s a busy harbor when {rival} is in.|There goes {rival}. Bet their crew wants coffee too.',
 'We’ll get the real story when they weigh in.|Nothing like dock talk before the first tally.|I bet the fish get bigger every time they tell it.|We’ll see what the board looks like after unload.|Save the bragging for when the scales settle.|Everybody’s a good captain when the boat’s tied up.|I’ll take a coffee before I take a fishing tip.|The quay’s got room for both of us.'],
 harborBoard:['dry',
 'There’s {rival}. Look at the board.|That’s {rival} by the docks.|{rival} made it in. Any news from the scales?|Look who’s back in port: {rival}.|Spotted {rival}. I just checked the board.|That’s {rival}, back from another run.|{rival} is in. Heard the latest dock talk?|There goes {rival}. Here’s where the board stands.',
 '{standing} I had to check twice.|Last I saw, {standing}|{standing} That won’t go unnoticed.|Did you see? {standing}|The latest from the quay: {standing}|{standing} Plenty of season left, though.|Word at the docks is right for once: {standing}|{standing} No wonder everyone’s watching the board.'],
 repairs:['wary',
 'Something aboard needs attention.|We’ve got a problem to deal with first.|There’s a repair on the list now.|The gear isn’t the only thing needing a hand today.|We’ve got a fault to sort out.|This isn’t the time to ignore a problem.|The boat’s asking for a little attention.|We’re dealing with something other than fishing now.',
 'Let’s give whoever’s on it some room.|I’d rather take a moment and get it right.|Let me know if they need another pair of hands.|We can worry about the catch after it’s fixed.|I hope they’ve got what they need aboard.|Good time to keep the workload down.|Let’s hear from the crew before we push on.|Better to deal with it than work around it.'],
 salmon:['bright',
 'We’ve got salmon coming aboard.|That net brought up something worth sorting.|There’s salmon in today’s tally.|Good to see salmon coming over the side.|That makes the visit to the net worthwhile.|There’s something to show for that net now.|Nice to see a catch that isn’t crab for a change.|We’ll have some salmon to land after that.',
 'Good call working the net, skipper.|Let’s keep it in good shape for landing.|I hope the next one does as well.|That makes a change to the usual watch.|I’ll take a little variety in the hold.|Glad we gave it a try, Captain.|There’s a reason to come back here.|That should help the trip pay its way.'],
 nets:['dry',
 'We’re working a salmon net this time.|It’s net work for this watch.|We’re on the salmon gear now.|Something different from crab pots today.|The net’s getting its turn.|We’ve got webbing instead of pot line to deal with.|Net work keeps your hands full too.|Today it isn’t all pots and buoys.',
 'Keep the loose gear clear of the working side.|I’ll mind the line from here.|Nothing to be gained by rushing the net.|I’ll leave room for whoever’s working it.|Let’s keep the deck clear around the gear.|We’ll find out how the salmon are running.|Have a look before you step across that line.|I’ll keep an eye on how it’s running.'],
};
export const crewTopics=Object.keys(bank);
for(const pair of Object.values(bank)){pair[1]=pair[1].split('|');pair[2]=pair[2].split('|');}
export function crewLine(topic,index,{rival='North Star',standing='Deep Run leads in total earnings.'}={}){
 const [voice,first,last]=bank[topic],lead=voices[voice][index>>6];
 return (lead+first[index&7]+' '+last[(index>>3)&7]).replace(/\{(rival|standing)\}/g,(_,key)=>key==='rival'?rival:standing);
}

function rivalWithin(s,peers){
 let rival=null,closest=600;
 for(const p of peers){
  const distance=Math.hypot(p.x-s.x,p.y-s.y);
  if(p.name&&distance<closest){rival=p;closest=distance;}
 }
 return rival;
}
function standingFor(self,peers,key,label){
 let name='',best=0,tied=false;
 for(const row of self?[self,...peers]:peers){
  const score=row[key];
  if(!row.name||!Number.isFinite(score)||score<=0)continue;
  if(score>best){name=row.name;best=score;tied=false;}
  else if(score===best)tied=true;
 }
 return name?`${name} ${tied?'is tied for the lead':'leads'} in ${label}.`:'';
}

export function createCrewChatter(random=Math.random){
 let season,world,elapsed,next,idleAt,lastHaul,lost,event=null,bubble=null,expires=0,previous={},harborMetric=0;
 const gap=()=>60+Math.floor(random()*51);
 function tick({state:s,weather:w,active,dt,flight=false,tank=100,electric=false,peers=[],selfStanding=null,isInHarbor}){
  if(s!==season||s.worldId!==world){
   season=s;world=s.worldId;elapsed=idleAt=0;next=gap();lastHaul=s.lastHaul;lost=s.lostPots||0;event=bubble=null;previous={};harborMetric=0;
  }
  if(!active||s.paused||s.overboard||s.tow){
   lastHaul=s.lastHaul;lost=s.lostPots||0;event=bubble=null;return null;
  }
  elapsed+=dt;
  const job=s.deckJob?.kind;
  if(job||s.moored||flight||s.skipperMission)idleAt=elapsed;
  if(s.lastHaul!==lastHaul){
   lastHaul=s.lastHaul;
   if(bubble?.result)bubble=null;
   const kg=lastHaul?.potKg??lastHaul?.kg;
   const topic=lastHaul?.species==='salmon'?(kg>0?'salmon':null):
    kg===0?'emptyHaul':kg>0&&kg<=POT_CAPACITY*.22?'poorHaul':kg>=POT_CAPACITY*.8?'bigHaul':null;
   // A more recent ordinary haul also invalidates any earlier extreme result.
   event=topic?{topic,until:elapsed+90}:null;
  }
  if((s.lostPots||0)>lost){event={topic:'lineLost',until:elapsed+90};if(bubble?.result)bubble=null;}
  lost=s.lostPots||0;
  if(event&&(elapsed>event.until||s.moored||job==='unload'))event=null;
  const rival=rivalWithin(s,peers);
  const harborRival=rival&&(s.moored||isInHarbor?.(s));
  const ranking=metric=>metric%2===0?standingFor(selfStanding,peers,'landed','landed weight'):standingFor(selfStanding,peers,'earned','total earnings');
  const standing=harborRival&&(ranking(harborMetric)||ranking(harborMetric+1));
  const rivalTopic=rival&&(harborRival?(standing?'harborBoard':'harborRival'):'rival');
  const topic=s.incident?'repairs': job==='deice'?'icing':
   job==='unload'&&s.deckJob.elapsed>=s.deckJob.approach&&(s.cargo>0||s.salmon>0)?'landing':
   job==='unload'||s.skipperMission?.kind==='home'?'harbor':s.moored?(rivalTopic||'docked'):
   w.wind>=35||w.waves>=4?'storm':!electric&&s.fuel>0&&s.fuel/tank<=.16?'lowFuel':
   flight?'survey':s.skipperMission?.kind==='droneSet'?'surveySet':
   event?.topic||(job==='deploy'?'setting':job==='haul'?'hauling':
    job==='netSet'||job==='netHaul'?'nets':rivalTopic||(
    w.snow>=.35?'snow':w.temperature<=0?'cold':w.fog>=.65?'fog':w.rain>=.55?'rain':
    elapsed-idleAt>=110?'idle':w.wind<=13&&w.waves<=1.2?'calm':Math.abs(s.speed)>=.6?'cruise':null));
  if(bubble&&(elapsed>=expires||topic!==bubble.topic&&(!bubble.result||['storm','icing','repairs','docked','harbor','landing'].includes(topic))))bubble=null;
  if(bubble?.rival&&rival?.id!==bubble.rival.id)bubble=null;
  if(elapsed>=next&&topic){
   let index=Math.floor(random()*512);
   // Keep the opening sentence fresh, not merely a different interjection.
   if((index&7)===(previous[topic]&7)&&topic in previous)index^=1;
   previous[topic]=index;
   const encounter=topic===rivalTopic;
   bubble={topic,text:crewLine(topic,index,encounter?{rival:rival.name,standing}:undefined),result:topic===event?.topic,rival:encounter?rival:null};
   if(topic==='harborBoard')harborMetric++;
   expires=elapsed+9;next=elapsed+gap();
   if(bubble.result)event=null;
  }
  return bubble;
 }
 return tick;
}
