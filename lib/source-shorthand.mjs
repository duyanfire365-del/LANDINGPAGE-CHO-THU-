const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
// Interpret common agency shorthand; preserve the exact source and flag ambiguous units.
export function sourceShorthand(value){
 const text=String(value||''),notes=[];
 const payment=text.match(/\btt\s*(\d{1,2})\s*c\s*(\d{1,2})\b/iu);
 if(payment)notes.push('Thanh toán: '+Number(payment[1])+' tháng; cọc: '+Number(payment[2])+' tháng (ghi tắt: '+payment[0]+').');
 const fee=text.match(/(?:^|[\s.;,])((?:phí|phi)\s*[:：=]?\s*\d+(?:[.,]\d+)?\s*(?:tr(?:iệu)?|triệu|k|nghìn)(?![\p{L}]))/iu);
 if(fee)notes.push('Phí ghi trong nguồn: '+fee[1]+'; cần xác nhận loại phí.');
 const duration=text.match(/(?:dưới|duoi|trên|tren)\s*\d+(?:[.,]\d+)?(?:\s*(?:tháng|thang|năm|nam))?/iu);
 if(duration)notes.push('Mốc thời hạn theo nguồn: '+duration[0]+(/thang|nam/.test(fold(duration[0]))?'.':' — chưa ghi đơn vị, cần xác nhận; không tự quy đổi thành tháng hoặc năm.'));
 // Bare m is an area shorthand only in a listing-size position, never a road/height/distance label.
 const areaCandidates=[...text.matchAll(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*m(?![\p{L}\p{N}²^])/giu)].filter(m=>{
  const n=Number(m[1].replace(',','.')),before=fold(text.slice(Math.max(0,m.index-45),m.index)),after=fold(text.slice(m.index+m[0].length,m.index+m[0].length+35));
  if(/\d+\s*m[²2]?(?:\s*[x×*]\s*\d+(?:[.,]5)?\s*t(?:ang)?)?\s*[,;]\s*$/.test(before))return false;
  if(n<=0||n<10&&!/(?:dien tich|\bdt)\s*[:：=]?\s*$/.test(before)||n>10000000||/(?:duong|ngo|ngach|hem|mat tien|\bmt|ngang|cao|chieu dai|rong|cach|di bo|ra pho|ra duong|khoang cach)\s*[:：=]?\s*$/.test(before)||/\d\s*[-–—~]\s*$/.test(before)||/^\s*[-–—~]\s*\d/.test(after))return false;
  return /(?:dien tich|\bdt)\s*[:：=]?\s*$/.test(before)||/^\s*[x×*]\s*\d+(?:[.,]5)?\s*t(?:ang)?\b/.test(after)||/(?:^|[\n,;])\s*$/.test(before)&&/^\s*(?:[,;\n.]|$)/.test(after);
 });
 const areaValues=[...new Set(areaCandidates.map(m=>Number(m[1].replace(',','.'))))],size=areaValues.length===1?areaValues[0]:null,sizeEvidence=size!==null?areaCandidates[0][0]:'';
 if(size!==null)notes.push('Diện tích '+size+' m² được nhận diện từ cách ghi tắt '+sizeEvidence+'; không cộng diện tích các tầng.');
 if(areaValues.length>1)notes.push('Có nhiều diện tích ghi tắt bằng m; cần xác nhận trước khi sử dụng.');
 let privateAddress='';
 const first=text.trim().replace(/^(?:tầng|tang)\s*\d+\s*[,;]?\s*(?:toà|tòa|toa)\s*/iu,'').match(/^[^\p{L}\p{N}]*(\d+[a-z]?(?:\s*\/\s*\d+)*\s+[\p{L}][^\n,;]{2,100})(?=[,;\n]|$)/iu)?.[1]||'';
 if(first&&!/\b(?:m2|m²|met|trieu|tr|tang|phong)\b/.test(fold(first)))privateAddress=first.trim();
 const explicit=text.match(/(?:mặt tiền|mat tien|\bmt)\s*[:：=]?\s*(\d+(?:[.,]\d+)?)\s*(?:m\b)?(?=$|[\s,;.:])/iu);
 let frontage=explicit?Number(explicit[1].replace(',','.')):null,frontageEvidence=explicit?.[0]||'',frontageInferred=false;
 if(!frontage){
  const match=text.match(/(?<![\d.,])(\d+(?:[.,]\d+)?)\s*(m[²2]|m)(?:\s*\/\s*(?:sàn|san))?\s*(?:(?:[x×*]|[,;])\s*\d+(?:[.,]5)?\s*t(?:ầng|ang)?)?\s*[,;]\s*(\d+(?:[.,]\d+)?)\s*m\s*(?=[.,;\n]|$)/iu);
  if(match&&(match[2].length>1||areaCandidates.some(m=>m.index===match.index))&&!/^\s*(?:đường|duong|ngõ|ngo|cao|dài|dai)\b/iu.test(text.slice(match.index+match[0].length))){const n=Number(match[3].replace(',','.'));if(n>0&&n<=50){frontage=n;frontageEvidence=match[0].match(/\d+(?:[.,]\d+)?\s*m\s*$/iu)?.[0].trim()||'';frontageInferred=true;notes.push('Mặt tiền '+n+' m được nhận diện từ chuỗi ghi tắt sau diện tích/số tầng; cần đối chiếu khi xem BĐS.');}}

 }
 return {privateAddress,size,sizeEvidence,frontage,frontageEvidence,frontageInferred,privateNotes:notes.join('\n'),commission:fee?'Phí theo nguồn: '+fee[1]+' (cần xác nhận loại phí).':''};
}
