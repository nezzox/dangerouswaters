// Local development aid. Save balances are stored in SEK units: 10 SEK = 1 USD.
export function redeemDeveloperCode(s,code){if(code!=='Nezzox is king')return false;s.money+=500000;return true;}
