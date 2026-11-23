// Save currency uses ten SEK per USD.
export function redeemDeveloperCode(s,code,language='en'){
 if(code==='Nezzox is king'){s.money+=500000;return true;}
 if(code==='Give me a chance'&&!s.chanceCodeUsed){s.money+=750000;s.chanceCodeUsed=true;return true;}
 const match=typeof code==='string'&&/^Ge mig +([0-9]+)$/.exec(code.trim());
 if(!match)return false;
 const amount=Number(match[1])*(language==='sv'?1:10);
 if(amount<=0||!Number.isSafeInteger(amount)||Math.abs(s.money+amount)>Number.MAX_SAFE_INTEGER)return false;
 s.money+=amount;
 return true;
}
