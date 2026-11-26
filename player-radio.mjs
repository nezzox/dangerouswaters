// Ephemeral inbox: one outstanding call per sender/recipient, within this world.
export const RADIO_LIFETIME=600000;
export const RADIO_LIMIT=280;

export function createPlayerRadio(sdk,world,online,memberName){
 const ref=(target,sender)=>sdk.ref(sdk.database,`${world}/radio/${target}${sender?'/'+sender:''}`);
 const inbox=ref(sdk.uid),calls=new Map();
 let stopped=false;
 async function dismiss(call){
  if(stopped)return;
  if(calls.get(call.sender)?.id===call.id)calls.delete(call.sender);
  // A late acknowledge must never delete a different call written in this slot.
  return sdk.runTransaction(ref(sdk.uid,call.sender),current=>current?.id===call.id?null:undefined,{applyLocally:false});
 }
 function receive(snapshot){
  if(stopped)return;
  const call=snapshot.val();
  if(typeof call?.id!=='string'||typeof call.name!=='string'||!call.name||
     typeof call.text!=='string'||!call.text.trim()||call.text.length>RADIO_LIMIT||!Number.isFinite(call.sentAt))return;
  const message={...call,sender:snapshot.key};
  if(Date.now()-message.sentAt>=RADIO_LIFETIME){void dismiss(message).catch(()=>{});return;}
  calls.set(message.sender,message);
 }
 const stops=[sdk.onChildAdded(inbox,receive),sdk.onChildChanged(inbox,receive),
  sdk.onChildRemoved(inbox,snapshot=>calls.delete(snapshot.key))];
 return {
  async send(target,body){
   const text=body.trim(),name=memberName(sdk.uid);
   if(stopped||!online()||!/^[A-Za-z0-9_-]+$/.test(target)||target===sdk.uid||!memberName(target)||!name)throw Error('unavailable');
   if(!text||text.length>RADIO_LIMIT)throw Error('message length');
   await sdk.set(ref(target,sdk.uid),{id:crypto.randomUUID(),name,text,sentAt:sdk.serverTimestamp()});
  },
  calls(){
   for(const call of calls.values())if(Date.now()-call.sentAt>=RADIO_LIFETIME)void dismiss(call).catch(()=>{});
   return [...calls.values()].sort((a,b)=>a.sentAt-b.sentAt);
  },
  dismiss,
  stop(){stopped=true;for(const stop of stops)stop();calls.clear();}
 };
}
