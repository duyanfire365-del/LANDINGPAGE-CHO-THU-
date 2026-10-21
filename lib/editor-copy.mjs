import {splitPriceNotes} from './source-price-notes.mjs';
import {safePublicText} from './posts.mjs';
import {stripCommission} from './commission.mjs';

const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Retain the author's useful wording and bullet order; remove only private
// source data. If a fragment cannot be made public, omit it rather than guess.
export function publicSourceCopy(text,item,sourceInfo){
 const separated=splitPriceNotes(text),kept=[];let removed=separated.priceTrackingNotes?separated.priceTrackingNotes.split('\n').length:0;
 for(const raw of separated.publicSource.split(/\r?\n/)){
  if(!raw.trim()){if(kept.length&&kept.at(-1)!=='')kept.push('');continue}
  let line=raw.trim();
  if(/^[\p{P}\p{S}\s]*(?:nguồn(?:\s+của|\s+từ)?|chủ nhà|đối tác|hoa hồng|sđt nguồn|map|bản đồ)(?:\s|[:：=])/iu.test(line)){removed++;continue}
  if(/^[\p{P}\p{S}\s]*(?:(?:sđt|sdt|đt|dt)\s*)?(?:chủ(?:\s*nhà)?|chu nha|đối tác|doi tac|nguồn(?:\s*của)?|nguon(?:\s*cua)?|hoa hồng|hoa hong|map|bản đồ|ban do)\s*\d*\s*[:：=]/iu.test(line)){removed++;continue}
  if(item.privateAddress&&line.includes(item.privateAddress)){line=line.replace(item.privateAddress,item.location==='Liên hệ để biết vị trí'?'':item.location);removed++}
  line=line.replace(/-?\d{1,2}\.\d{3,}\s*[,;]\s*-?\d{2,3}\.\d{3,}/g,'');
  for(const value of [...(sourceInfo.ownerPhones||[]),...(sourceInfo.partnerPhones||[])].filter(v=>v&&v.replace(/\D/g,'').length>=8)){const digits=value.replace(/\D/g,'');line=line.replace(new RegExp(digits.split('').join('[ .()–—-]*'),'g'),'')}
  line=stripCommission(line).replace(/#[\p{L}\p{N}_]+/gu,'').replace(/https?:\/\/\S+|www\.\S+/giu,'').replace(/(?:\+84|0)(?:[ .()–—-]*\d){9}(?!\d)/g,'');
  for(const value of [sourceInfo.sourceName,sourceInfo.commission,sourceInfo.mapLabel].filter(v=>v&&v.length>2))line=line.replaceAll(value,'');
  // Drop house/alley numbers while leaving the street name available.
  line=line.replace(/(?:số\s*)?\d+[a-z]?(?:\s*\/\s*\d+)*\s+(?:(?:ngõ|ngách|hẻm|ngo|ngach|hem)\s*\d+[a-z]?(?:\s*\/\s*\d+)*\s*)+/giu,'').replace(/(?:số\s*)?\d+[a-z]?\s+(?:đường|phố)\s+/giu,'');
  if(item.location&&item.location!=='Liên hệ để biết vị trí')line=line.replace(new RegExp('(?:số\\s*)?\\d+[a-z]?\\s+(?='+escaped(item.location)+')','giu'),'');
  line=line.replace(/(\d+(?:[.,]\d+)?\s*(?:m²|m2|m|k|tr))$/iu,'$1.');
  line=line.replace(/^địa chỉ\s*[:：]?\s*/iu,'Vị trí: ').replace(/[ \t]{2,}/g,' ').trim();
  if(!/[\p{L}\p{N}]/u.test(line))continue;
  if(/^(?:[\p{P}\p{S}\s]*)(?:liên hệ|hotline|call|zalo|quan tâm gọi)[^\n]*$/iu.test(line)&&!/(?:m²|m2|triệu|tr\/)/iu.test(line)&&/(?:\+84|0)(?:[ .()–—-]*\d){9}(?!\d)/.test(raw)){removed++;continue}
  if(safePublicText(line))kept.push(line);else{const parts=line.split(/[;|]/).map(s=>s.trim()).filter(p=>p&&safePublicText(p));kept.push(...parts);removed++}
 }
 const full=kept.join('\n').replace(/\n{3,}/g,'\n\n').trim(),lines=full.split('\n').filter(Boolean);
 const complete=(lines.length>=4&&full.length>=180)||full.length>=420;
 return {text:full.slice(0,3000),complete,removed,truncated:full.length>3000};
}

export function polishSparseCopy(title,facts,sourceCopy){
 const details=sourceCopy&&sourceCopy.length>70?sourceCopy:facts.join(' ');
 return [title+'.',details,'Anh/chị quan tâm có thể liên hệ để trao đổi thêm về nhu cầu sử dụng, xác nhận hiện trạng và các điều kiện thuê trước khi quyết định.', 'Hẹn xem thực tế để đánh giá không gian và mức độ phù hợp với nhu cầu. Các thông tin còn thiếu sẽ được trao đổi khi tư vấn.'].filter(Boolean).join('\n\n');
}
