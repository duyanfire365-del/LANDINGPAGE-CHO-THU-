import {formatDescription} from './listing-content.mjs';
import {copyClauses,foldPrivate,separateSensitiveCopy} from './listing-privacy.mjs';
// Compact verified facts only. Private clauses are retained by the intake layer.
export function polishListingCopy({title,text='',facts=[]}){
 const normalize=v=>foldPrivate(v).replace(/m\s*(?:²|2)/g,' m2 ').replace(/(\d)\s*tr(?:ieu)?\b/g,'$1 trieu').replace(/\btrieu dong\b/g,'trieu').replace(/[\p{P}\p{S}\s]+/gu,' ').trim();
 const seen=new Set([normalize(title)]),selected=[];let length=0;
 for(const raw of [...copyClauses(separateSensitiveCopy(text).publicSource),...facts.filter(Boolean)]){
  const line=raw.replace(/(\d)\s*m(?:2|²)(?![\p{L}\p{N}])/giu,'$1 m²').trim().replace(/^[\p{S}•●▪\s]+/u,'').replace(/([!?])\1+/g,'$1').replace(/[ \t]{2,}/g,' ').trim();
  if(!line||/^(?:up|upp|đẩy tin|chấm|\.+)$/iu.test(line))continue;
  if(/^(?:[\p{P}\p{S}\s]*)(?:liên hệ|hotline|call|zalo|anh\/chị quan tâm|hẹn xem)/iu.test(line))continue;
  const key=normalize(line);if(!key||seen.has(key))continue;
  const joined=normalize(selected.join(' '));if(joined.includes(key))continue;
  // Equivalent labels/units should not repeat the same verified size or rent.
  const fact=key.match(/^(?:dien tich|dt|gia thue|tien thue)\s+(.+)$/)?.[1];
  if(fact&&joined.includes(fact))continue;
  if(length+line.length>1600)continue;
  seen.add(key);selected.push(line);length+=line.length+2;
 }
 selected.push('Liên hệ để xác nhận hiện trạng, điều kiện thuê và hẹn xem.');
 return formatDescription(selected.join('\n\n'));
}
