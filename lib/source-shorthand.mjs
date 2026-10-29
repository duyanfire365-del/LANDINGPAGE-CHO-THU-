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
 let privateAddress='';
 const first=text.trim().replace(/^(?:tầng|tang)\s*\d+\s*[,;]?\s*(?:toà|tòa|toa)\s*/iu,'').match(/^[^\p{L}\p{N}]*(\d+[a-z]?(?:\s*\/\s*\d+)*\s+[\p{L}][^\n,;]{2,100})(?=[,;\n]|$)/iu)?.[1]||'';
 if(first&&!/\b(?:m2|m²|met|trieu|tr|tang|phong)\b/.test(fold(first)))privateAddress=first.trim();
 const explicit=text.match(/(?:mặt tiền|mat tien|\bmt)\s*[:：=]?\s*(\d+(?:[.,]\d+)?)\s*m\b/iu);
 let frontage=explicit?Number(explicit[1].replace(',','.')):null,frontageEvidence=explicit?.[0]||'',frontageInferred=false;
 if(!frontage){
  const match=text.match(/(?:m[²2]\s*(?:\/\s*(?:sàn|san))?\s*[,;]\s*)(\d+(?:[.,]\d+)?)\s*m\s*(?=[.,;\n]|$)/iu);
  if(match){const n=Number(match[1].replace(',','.'));if(n>0&&n<=50){frontage=n;frontageEvidence=match[0].match(/\d+(?:[.,]\d+)?\s*m\s*$/iu)?.[0].trim()||'';frontageInferred=true;notes.push('Mặt tiền '+n+' m được nhận diện từ chuỗi ghi tắt sau diện tích; cần đối chiếu khi xem BĐS.');}}
 }
 return {privateAddress,frontage,frontageEvidence,frontageInferred,privateNotes:notes.join('\n'),commission:fee?'Phí theo nguồn: '+fee[1]+' (cần xác nhận loại phí).':''};
}
