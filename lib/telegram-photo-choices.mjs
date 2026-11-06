import {linkedBot,linkedTelegram} from './linked-telegram-bots.mjs';
import {sourceReply} from './source-bot-health.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {db,problem} from './platform.mjs';
import {accessOf} from './media-access.mjs';
import {photoInstructions} from './photo-instructions.mjs';
import {editedMedia} from './post-media.mjs';
const kind='telegram-photo-choice:';
const key=(source,asset)=>{const h=createHash('sha256').update('photo-choice:v1:'+source+':'+asset).digest('hex');return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20,32)].join('-');};
const decode=row=>{try{return JSON.parse(row.record_id);}catch{return null;}};
export async function syncPhotoPost(slug){
 for(let attempt=0;attempt<3;attempt++){
  const row=(await db('posts',{query:'?public_data->>slug=eq.'+encodeURIComponent(slug)+'&limit=1'}))[0];if(!row||row.status!=='published'||['pending','approved'].includes(row.private_data?.deletion?.state))throw problem(409,'Tin đã gỡ hoặc thay đổi; quyền ảnh vẫn được giữ tại kho.');
  const p=row.public_data,patch=await editedMedia({assetIds:(p.media||[]).map(m=>m.id)},p,{admin:true,id:null}),revision=randomUUID();
  const saved=await db('posts',{method:'PATCH',query:'?id=eq.'+row.id+'&status=eq.published&public_data->>contentRevision='+(p.contentRevision?'eq.'+encodeURIComponent(p.contentRevision):'is.null'),body:{public_data:{...p,...patch,contentRevision:revision}}});if(saved.length)return saved[0];
 }
 throw problem(409,'Tin đang được sửa ở nơi khác. Reply lại lựa chọn để đồng bộ ảnh.');
}
export async function requestPhotoChoices(source,post,reply){
 if(!source?.chat_id||!post?.public_data||photoInstructions(source.content).active)return {asked:0};
 const p=post.public_data,origin=source.media?.find(m=>m.kind==='telegram-origin')?.bot||'source',keys=post.private_data?.telegramMediaKeys||{};
 const incoming=new Set([...(source.assetIds||[]),...(source.media||[]).map(m=>keys[m.unique_id||m.file_id]).filter(Boolean)]);
 const ids=(p.media||[]).filter(m=>m.kind==='image').map(m=>m.id);if(!ids.length)return {asked:0};
 const assets=await db('assets',{query:'?id=in.('+ids.join(',')+')&select=*'});let asked=0;
 for(const asset of assets){
  const access=accessOf(asset);if(!incoming.has(asset.id)&&!asset.path?.startsWith('telegram/'+source.id+'-'))continue;
  if(access.visibility!=='owner'||!['held','sensitive'].includes(access.scan)||access.approvedAt)continue;
  const id=key(source.id,asset.id),payload={sourceId:source.id,messageId:source.message_id,assetId:asset.id,slug:p.slug,code:p.code,chatId:String(source.chat_id),botId:origin,expiresAt:Date.now()+72*3600000};
  const created=await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{id,kind:kind+'pending',record_id:JSON.stringify(payload),sent:false}});
  const row=created[0]||(await db('notification_log',{query:'?id=eq.'+id+'&limit=1'}))[0];if(!row||row.kind!==kind+'pending'||row.sent)continue;
  if(access.choiceId&&access.choiceId!==id)continue;
  const held=await db('assets',{method:'PATCH',query:'?id=eq.'+asset.id+'&access_data=eq.'+encodeURIComponent(JSON.stringify(access)),body:{access_data:{...access,choiceId:id}}});if(!held.length)continue;
  const previous=decode(row);if(!previous||previous.sendingAt&&Date.now()-previous.sendingAt<120000)continue;
  const sending={...previous,sendingAt:Date.now()},encoded=JSON.stringify(sending);
  const leased=await db('notification_log',{method:'PATCH',query:'?id=eq.'+id+'&kind=eq.'+kind+'pending&sent=eq.false&record_id=eq.'+encodeURIComponent(row.record_id),body:{record_id:encoded}});if(!leased.length)continue;
  const number=ids.indexOf(asset.id)+1;
  let sent=false;try{sent=await reply('Ảnh '+number+' của tin '+p.code+': '+(access.reason||'Có thể lộ thông tin nguồn hoặc chưa kiểm tra chắc chắn.')+'\nẢnh đang giữ kín chờ anh chọn:\nĐăng công khai = 1\nChỉ mình tôi = 0\nAnh Reply trực tiếp câu hỏi này bằng 1 hoặc 0. Lựa chọn chỉ áp dụng cho ảnh '+number+'.\nMã lựa chọn ảnh: '+id);}catch{}
  const completed={...previous};delete completed.sendingAt;
  await db('notification_log',{method:'PATCH',query:'?id=eq.'+id+'&kind=eq.'+kind+'pending&record_id=eq.'+encodeURIComponent(encoded),body:{sent:sent!==false,record_id:JSON.stringify(completed)}});if(sent!==false)asked++;
 }
 return {asked};
}
// The webhook verifies the Telegram secret and private-chat owner before this handler.
export async function answerPhotoChoice(message,reply,{botId='source'}={}){
 const original=String(message.reply_to_message?.text||message.reply_to_message?.caption||''),id=original.match(/Mã lựa chọn ảnh:\s*([a-f0-9-]{36})/iu)?.[1];if(!id)return {handled:false};
 const answer=String(message.text||'').trim();if(!/^[01]$/.test(answer)){await reply('Anh Reply 1 để đăng công khai hoặc 0 để giữ ảnh chỉ mình tôi.');return {handled:true};}
 const row=(await db('notification_log',{query:'?id=eq.'+id+'&limit=1'}))[0],data=row&&decode(row),chat=String(message.chat.id)+(botId==='source'?'':':'+botId);
 if(!data||data.chatId!==chat||data.botId!==botId||!String(row.kind).startsWith(kind)){await reply('Câu hỏi ảnh không thuộc cuộc trò chuyện hoặc bot này. Chưa đổi quyền ảnh.');return {handled:true};}
 if(row.kind===kind+'done'){await reply('Ảnh này đã được xử lý: '+(data.answer===1?'Công khai.':'Chỉ mình tôi.')+' Không áp dụng lại lựa chọn cũ.');return {handled:true};}
 if(data.expiresAt<Date.now()||row.kind===kind+'canceled'){await reply('Câu hỏi ảnh đã hết hạn hoặc quyền ảnh đã đổi. Anh chỉnh trực tiếp trong Admin hoặc gửi lại ảnh với ghi chú mới.');return {handled:true};}
 const n=Number(answer);let decision=data;
 if(row.kind===kind+'pending'){
  decision={...data,answer:n,answeredAt:new Date().toISOString()};const claimed=await db('notification_log',{method:'PATCH',query:'?id=eq.'+id+'&kind=eq.'+kind+'pending',body:{kind:kind+'applying',record_id:JSON.stringify(decision)}});if(!claimed.length){await reply('Lựa chọn này vừa được nhận. Anh chờ kết quả; không đổi ảnh lần nữa.');return {handled:true};}
 }else if(row.kind!==kind+'applying'||data.answer!==n){await reply('Ảnh đang xử lý lựa chọn trước đó. Chưa nhận lựa chọn khác.');return {handled:true};}
 const asset=(await db('assets',{query:'?id=eq.'+decision.assetId+'&limit=1'}))[0],post=(await db('posts',{query:'?public_data->>slug=eq.'+decision.slug+'&limit=1'}))[0];
 if(!asset||accessOf(asset).choiceId!==id||!post||post.status!=='published'||['pending','approved'].includes(post.private_data?.deletion?.state)||!(post.public_data.media||[]).some(m=>m.id===asset.id)){
  await db('notification_log',{method:'PATCH',query:'?id=eq.'+id,body:{kind:kind+'canceled'}});await reply('Tin hoặc quyền ảnh đã thay đổi trong Admin. Không ghi đè bằng câu trả lời cũ.');return {handled:true};
 }
 const access={...accessOf(asset),visibility:n===1?'public':'owner',members:[],emails:[],choiceId:id,choiceAnswer:n,approvedBy:'telegram-owner',approvedAt:decision.answeredAt};
 const saved=await db('assets',{method:'PATCH',query:'?id=eq.'+asset.id+'&access_data->>choiceId=eq.'+id,body:{access_data:access}});if(!saved.length){await reply('Quyền ảnh vừa thay đổi. Chưa ghi đè; anh kiểm tra lại trong Admin.');return {handled:true};}
 await syncPhotoPost(decision.slug);
 await db('notification_log',{method:'PATCH',query:'?id=eq.'+id+'&kind=eq.'+kind+'applying',body:{kind:kind+'done',sent:true,record_id:JSON.stringify(decision)}});
 await reply('Đã đặt ảnh của tin '+decision.code+' thành '+(n===1?'Công khai.':'Chỉ mình tôi.')+' Các ảnh khác giữ nguyên.');return {handled:true};
}

export async function recoverPhotoQuestions(){
 const rows=await db('notification_log',{query:'?kind=eq.'+kind+'pending&sent=eq.false&order=created_at.desc&limit=5'});let asked=0;const seen=new Set();
 for(const row of rows){const data=decode(row);if(!data||data.expiresAt<Date.now()||seen.has(data.sourceId))continue;seen.add(data.sourceId);const bot=linkedBot(data.botId);if(!bot)continue;const source=(await db('source_inbox',{query:'?id=eq.'+data.sourceId+'&limit=1'}))[0],post=(await db('posts',{query:'?public_data->>slug=eq.'+data.slug+'&limit=1'}))[0];if(!source||source.chat_id!==data.chatId||!post||post.status!=='published')continue;
 const result=await requestPhotoChoices(source,post,text=>sourceReply((method,body)=>linkedTelegram(bot,method,{...body,chat_id:bot.owner}),text,{recordId:source.id,replyTo:source.message_id,botId:bot.id,phase:'photo-choice'}));asked+=result.asked;
 }
 return {asked};
}
