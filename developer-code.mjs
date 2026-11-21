// Save currency uses ten SEK per USD.
export function redeemDeveloperCode(s,code){if(code==='Nezzox is king'){s.money+=500000;return true;}if(code==='Give me a chance'&&!s.chanceCodeUsed){s.money+=750000;s.chanceCodeUsed=true;return true;}return false;}
