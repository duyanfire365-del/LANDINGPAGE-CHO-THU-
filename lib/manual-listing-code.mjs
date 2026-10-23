import {readFile} from 'node:fs/promises';
import {db,supa,problem} from './platform.mjs';
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
 for(let offset=0;;offset+=500){const rows=await db('posts',{query:'?select=id,public_data&order=id.asc&limit=500&offset='+offset});if(rows.some(r=>r.id!==postId&&(r.public_data.code===result.code||(r.public_data.legacyCodes||[]).includes(result.code))))throw problem(409,'Mã này đã được sử dụng hoặc lưu làm mã cũ của tin khác.');if(rows.length<500)break;}
 // Atomic create in the existing private bucket serializes competing admin edits.
 // The object is server-only and contains no credentials or source data.
 const path='/storage/v1/object/rental-private/system/listing-code-claims/'+encodeURIComponent(result.code)+'.json';
 try{await supa(path,{method:'POST',body:{postId,code:result.code},headers:{'x-upsert':'false'}})}catch(error){
  let claim;try{claim=await supa(path.replace('/object/','/object/authenticated/'))}catch{throw problem(503,'Chưa giữ được mã trong kho riêng. Kiểm tra kết nối Supabase Storage rồi thử lại.');}
  if(claim?.postId!==postId)throw problem(409,'Mã đang được tin khác sử dụng.');
 }
 return {...result,codeMode:'manual'};
}
