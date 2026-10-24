import {foldVietnamese} from './source-pricing.mjs';
import {db,problem} from './platform.mjs';
import {extractByRules} from './source-rules.mjs';
const states={tamdung:'paused',dachothue:'rented',conhang:'available',choxacnhan:'awaiting'};
export function editCommands(text){
 const tags=[...String(text||'').matchAll(/#([\p{L}\p{N}_]+)/gu)].map(m=>foldVietnamese(m[1]));
 const textEdit=/^(?:(?:anh|em)\s+)?(?:hay\s+)?(?:\/?suatin\b|sua tin\b|sua bai\b|chinh sua\b)/.test(foldVietnamese(String(text||'').trim()));
 const availability=[...new Set(tags.map(t=>states[t]).filter(Boolean))];
 if(availability.length>1)throw problem(422,'Chỉ chọn một trạng thái: #tamdung, #dachothue, #conhang hoặc #choxacnhan.');
 if(tags.includes('hot')&&tags.includes('bohot'))throw problem(422,'Chọn #hot hoặc #bohot, không dùng cả hai.');
 return {edit:tags.includes('suatin')||textEdit,availability:availability[0],hot:tags.includes('hot')?true:tags.includes('bohot')?false:undefined,active:textEdit||tags.some(t=>t==='suatin'||t==='hot'||t==='bohot'||states[t])};
}
const fold=value=>foldVietnamese(value).replace(/#[\p{L}\p{N}_]+/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export async function inferUpdateTarget(source,rows){
 const text=source.content||'',clean=text.replace(/#[\p{L}\p{N}_]+/gu,'').trim();
 const live=rows.filter(r=>r.status==='published'&&!r.public_data.codeReleased&&!['pending','approved'].includes(r.private_data?.deletion?.state));
 if(clean.length>30){
  const item=extractByRules(text,{allowIncomplete:true,allowUncertain:true});
  const candidates=live.filter(r=>{
   const p=r.public_data,address=r.private_data?.address;
   if(item.privateAddress&&address&&fold(item.privateAddress)===fold(address))return true;
   const original=r.private_data?.sourceText||r.private_data?.originalText;
   if(original&&fold(original)===fold(text))return true;
   return item.size!=null&&Number(p.size)===item.size&&item.location&&item.location!==item.area&&item.location!=='Liên hệ để biết vị trí'&&fold(p.address).includes(fold(item.location));
  });
  if(candidates.length===1)return candidates[0].public_data.slug;
  throw problem(422,candidates.length?'Nội dung khớp nhiều tin. Anh trả lời bài gốc hoặc kèm mã tin để sửa đúng bài.':'Chưa xác định được tin từ nội dung. Anh trả lời bài gốc hoặc thêm mã tin, ví dụ #suatin KX - 0001.');
 }
 // A short status command without an explicit reference applies to the last
 // successfully posted/updated listing in this owner's private Telegram chat.
 if(!source.chat_id)throw problem(422,'Cần mã tin hoặc trả lời bài gốc để xác định tin sửa.');
 const previous=await db('source_inbox',{query:'?chat_id=eq.'+encodeURIComponent(source.chat_id)+'&order=message_id.desc&limit=100'});
 for(const row of previous){if(row.id===source.id||source.message_id&&row.message_id>=source.message_id||!['published','updated'].includes(row.processing_status))continue;const slug=row.result_url?.match(/live-\d{10,20}/)?.[0];if(slug&&live.some(r=>r.public_data.slug===slug))return slug;}
 throw problem(422,'Chưa tìm thấy tin vừa đăng. Anh kèm mã tin hoặc trả lời bài gốc.');
}
