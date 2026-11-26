import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlayerRadio,RADIO_LIFETIME} from '../player-radio.mjs';

function fixture(){
 const changes={},writes=[],stored=new Map();let online=true;
 const watch=kind=>(ref,fn)=>{changes[kind]={ref,fn};return()=>delete changes[kind];};
 const sdk={uid:'me',ref:(_,path)=>path,
  onChildAdded:watch('add'),onChildChanged:watch('change'),onChildRemoved:watch('remove'),
  serverTimestamp:()=>({'.sv':'timestamp'}),
  set:async(path,value)=>{writes.push({path,value});stored.set(path,value);},
  runTransaction:async(path,update)=>{
   const result=update(stored.get(path));
   if(result===null)stored.delete(path);
   return {committed:result!==undefined};
  }};
 const radio=createPlayerRadio(sdk,'worlds/ABC234',()=>online,
  id=>id==='me'?'My Boat':id==='other'?'Their Boat':null);
 const receive=(kind,sender,call)=>{
  const {fn,ref}=changes[kind];stored.set(ref+'/'+sender,call);
  fn({key:sender,val:()=>call});
 };
 return {radio,changes,writes,stored,receive,offline:()=>{online=false;}};
}
test('radio sends trimmed text only to one available player in this world',async()=>{
 const {radio,writes,offline}=fixture();
 await radio.send('other','  Do you copy?  ');
 assert.equal(writes[0].path,'worlds/ABC234/radio/other/me');
 assert.equal(writes[0].value.text,'Do you copy?');
 assert.equal(writes[0].value.name,'My Boat');
 assert.deepEqual(writes[0].value.sentAt,{'.sv':'timestamp'});
 for(const id of ['me','unknown','../other'])await assert.rejects(radio.send(id,'Test'));
 for(const text of ['  ','X'.repeat(281)])await assert.rejects(radio.send('other',text));
 offline();
 await assert.rejects(radio.send('other','Still there?'));
 assert.equal(writes.length,1);
});
test('inbox order, stale cleanup, safe dismissal, and stopping on world change',async()=>{
 const {radio,changes,stored,receive}=fixture(),now=Date.now();
 const call=(id,name,sentAt)=>({id,name,text:'Check the pots',sentAt});
 assert.equal(changes.add.ref,'worlds/ABC234/radio/me');
 receive('add','expired',call('expired','Old Boat',now-RADIO_LIFETIME-1000));
 receive('add','two',call('two','Second Boat',now-100));
 receive('add','one',call('one','First Boat',now-200));
 assert.deepEqual(radio.calls().map(v=>v.sender),['one','two']);
 assert(!stored.has(changes.add.ref+'/expired'));
 const first=radio.calls()[0];
 receive('change','one',call('replacement','First Boat',now));
 await radio.dismiss(first);
 assert.equal(stored.get(changes.add.ref+'/one').id,'replacement');
 assert.deepEqual(radio.calls().map(v=>v.id),['two','replacement']);
 await radio.dismiss(radio.calls()[0]);
 assert.equal(radio.calls().length,1);
 radio.stop();
 assert.deepEqual(changes,{});
 assert.deepEqual(radio.calls(),[]);
});
