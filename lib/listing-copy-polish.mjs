import {createRequire} from 'node:module';
const {detailKey,detailCovered,technicalDetail}=createRequire(import.meta.url)('../public/sharing.js');
import {expandPublicUnits} from './shorthand-copy.mjs';
import {formatDescription} from './listing-content.mjs';
import {copyClauses,foldPrivate,separateSensitiveCopy,sensitiveCopy} from './listing-privacy.mjs';
// Keep supplied public detail; only remove duplication and confidential clauses. Private clauses are retained by the intake layer.
export function polishListingCopy({title,text='',facts=[],contactText='Liên hệ để xác nhận hiện trạng, điều kiện thuê và hẹn xem.'}){
 const normalize=detailKey;
 const seen=new Set([normalize(title)]),selected=[];let length=0;
 for(const raw of [...copyClauses(separateSensitiveCopy(text).publicSource),...facts.filter(Boolean).flatMap(copyClauses)]){
  const line=expandPublicUnits(raw).replace(/^(?:riêng biệt|rieng biet)[.!]?$/iu,'Nhà riêng biệt.').replace(/^(?:thang máy|thang may)[.!]?$/iu,'Có thang máy.').replace(/\p{Extended_Pictographic}|[\u200d\ufe0e\ufe0f\u20e3]/gu,'').replace(/(\d)\s*m(?:2|²)(?![\p{L}\p{N}])/giu,'$1 m²').replace(/(\d)\s*m(?![\p{L}\p{N}²])/giu,'$1 m').trim().replace(/^[\p{S}•●▪\s]+/u,'').replace(/([!?])\1+/g,'$1').replace(/[ \t]{2,}/g,' ').trim();
  if(!line||technicalDetail(line)||sensitiveCopy(line)||/^(?:up|upp|đẩy tin|chấm|\.+)$/iu.test(line))continue;
  if(/^(?:[\p{P}\p{S}\s]*)(?:liên hệ|hotline|call|zalo|anh\/chị quan tâm|hẹn xem)/iu.test(line))continue;
  const key=normalize(line);if(!key||seen.has(key)||detailCovered(line,selected.join('\n')))continue;
  const joined=normalize(selected.join(' '));if(joined.includes(key))continue;
  // Equivalent labels/units should not repeat the same verified size or rent.
  const fact=key.match(/^(?:dien tich|dt|gia thue|tien thue)\s+(.+)$/)?.[1];
  if(fact&&joined.includes(fact))continue;
  if(/^co /.test(key)&&joined.includes(key.slice(3)))continue;
  if(length+line.length>10000)continue;
  seen.add(key);selected.push(line);length+=line.length+2;
 }
 return formatDescription(selected.join('\n')+'\n\n'+contactText);
}
