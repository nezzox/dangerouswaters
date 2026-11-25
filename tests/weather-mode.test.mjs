import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,conditions,weatherAt} from '../simulation.mjs';
import {restoreSeason,seasonJSON} from '../saves.mjs';
import {createLiveWeather} from '../live-weather.mjs';

test('every saved season, including a former Dynamic season, looks up real vessel weather',async()=>{
 const now=Date.now(),times=[Math.floor(now/1000)-3600,Math.floor(now/1000)+3600];
 const air={hourly:{time:times,wind_speed_10m:[10,10],wind_direction_10m:[90,90],temperature_2m:[3,3]}};
 const sea={hourly:{time:times,wave_height:[1,1]}};
 for(const mode of [undefined,'dynamic','calm',null]){
  const value=JSON.parse(seasonJSON(createGame()));value.weatherMode=mode;
  const s=restoreSeason(value);
  assert.equal(s.weatherMode,'live');
  assert.deepEqual(conditions(s),weatherAt(s.hour));
  let requests=0;
  const client=createLiveWeather({now:()=>now,fetchImpl:async url=>{
   requests++;return {ok:true,json:async()=>url.includes('marine-api')?sea:air};
  }});
  await client.update(s);
  assert.equal(requests,2);
  assert.equal(conditions(s).temperature,3);
  assert.equal(conditions(s).wind,10);
 }
});
