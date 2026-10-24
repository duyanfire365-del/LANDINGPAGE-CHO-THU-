import {formatDescription} from './listing-content.mjs';
// Edit only already-sanitized public text; all factual claims remain from source.
export function polishListingCopy({title,text='',facts=[]}){
 const normalize=v=>String(v).toLocaleLowerCase('vi').replace(/[\p{P}\p{S}\s]+/gu,' ').trim();
 const seen=new Set(),lines=[];
 for(const raw of formatDescription(text).split('\n')){
  const line=raw.trim().replace(/([!?])\1{2,}/g,'$1').replace(/[🔥💥🚨⭐🌟]{2,}/gu,'').replace(/[ \t]{2,}/g,' ').trim();
  if(!line||/^(?:up|upp|đẩy tin|chấm|\.+)$/iu.test(line))continue;
  const key=normalize(line);if(!key||seen.has(key))continue;seen.add(key);lines.push(line);
 }
 const verified=[...new Set(facts.filter(Boolean))];
 const short=lines.join(' ').length<180;
 if(short){
  const details=lines.filter(l=>normalize(l)!==normalize(title));
  return formatDescription([title,...details,...verified.filter(f=>!normalize(details.join(' ')).includes(normalize(f))),'Anh/chị quan tâm vui lòng liên hệ để xác nhận hiện trạng, điều kiện thuê và sắp xếp lịch xem thực tế.'].filter(Boolean).join('\n\n'));
 }
 // Remove repeated sales calls, preserve useful details, and bound the public copy.
 let contactKept=false;const selected=[];let length=0;
 for(const line of lines){
  if(/^(?:[\p{P}\p{S}\s]*)(?:liên hệ|hotline|call|zalo|anh\/chị quan tâm)/iu.test(line)){if(contactKept)continue;contactKept=true;}
  if(length+line.length>2400)continue;
  selected.push(line);length+=line.length+2;
 }
 for(const fact of verified)if(!normalize(selected.join(' ')).includes(normalize(fact)))selected.push(fact);
 return formatDescription(selected.join('\n\n')).slice(0,2900);
}
