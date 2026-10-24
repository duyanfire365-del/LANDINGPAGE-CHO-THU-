import {readFile} from 'node:fs/promises';
import {db,problem} from './platform.mjs';
import {categoryPrefixes,codeFor} from './listing-identity.mjs';
export function parseManualCode(value,type){
 const match=String(value||'').trim().toUpperCase().match(/^([A-Z]+)\s*-\s*(\d{1,6})$/);
 if(!match||match[1]!==categoryPrefixes[type]||Number(match[2])<1)throw problem(400,'Mã phải đúng danh mục, ví dụ KX - 0001, MB - 0001, NC - 0001 hoặc DT - 0001.');
 const sequence=Number(match[2]);return {code:codeFor(type,sequence),listingSequence:sequence};
}
export async function reserveManualCode(value,type,postId){
 const result=parseManualCode(value,type);
 const staticRows=JSON.parse(await readFile(new URL('../public/listings.json',import.meta.url),'utf8'));
 if(staticRows.some(p=>p.code===result.code||(p.legacyCodes||[]).includes(result.code)))throw problem(409,'Mã này đã được dùng bởi tin có sẵn.');
 for(let offset=0;;offset+=500){
  const rows=await db('posts',{query:'?select=id,status,public_data,private_data&order=id.asc&limit=500&offset='+offset});
  if(rows.some(r=>r.id!==postId&&!['pending','approved'].includes(r.private_data?.deletion?.state)&&!r.public_data.codeReleased&&(r.public_data.code===result.code||(r.public_data.legacyCodes||[]).includes(result.code))))throw problem(409,'Mã đang được tin khác sử dụng. Anh chọn số khác; mã của tin đã xóa có thể dùng lại.');
  if(rows.length<500)break;
 }
 // Codes are saved on the post itself with the existing contentRevision check.
 // Do not reserve them in Storage: abandoned objects blocked valid future edits.
 return {...result,codeMode:'manual',codeReleased:false};
}
