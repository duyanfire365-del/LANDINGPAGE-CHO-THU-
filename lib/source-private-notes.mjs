import {separateSensitiveCopy} from './listing-privacy.mjs';
import {foldVietnamese} from './source-pricing.mjs';
export function splitPrivateNotes(value){
 const separated=separateSensitiveCopy(value);
 const publicLines=[],notes=separated.privateNotes.split('\n').filter(Boolean);let internal=false;
 for(const raw of separated.publicSource.split(/\r?\n/)){
  const line=foldVietnamese(raw).replace(/^[^a-z0-9]+/,'');
  if(/^(?:noi dung|thong tin|phan)\s+cong khai\s*[:=]/.test(line)){internal=false;continue;}
  if(/^(?:(?:ghi chu|thong tin|du lieu|phan|muc)\s+(?:kin|noi bo|rieng tu|rieng)|chi (?:quan tri|moi gioi)|khong cong khai)\b/.test(line))internal=true;
  if(internal){if(raw.trim())notes.push(raw.trim());continue;}
  const kept=[];
  for(const part of raw.split(/[;|]/)){
   const text=foldVietnamese(part).replace(/^[^a-z0-9]+/,'');
   const role=/(?:chu nha|chinh chu|doi tac|nguon doi tac)/.test(text)&&/(?:\+?84|0)(?:[ .()–—-]*\d){9}/.test(part);
   if(role||/^(?:(?:sdt|dien thoai|so dien thoai)\s+)?(?:chu nha|doi tac|nguon(?: cua| tu)?|ten nguon|map|toa do|dinh vi|hoa hong|phi moi gioi)\s*(?:\d\s*)?[:=]/.test(text))notes.push(part.trim());
   else kept.push(part);
  }
  publicLines.push(kept.join(';'));
 }
 return {publicSource:publicLines.join('\n'),privateNotes:[...new Set(notes)].join('\n').slice(0,8000)};
}
