import {automaticSourceTarget} from './telegram-auto-target.mjs';
import {createHash} from 'node:crypto';
import {db} from './platform.mjs';
import {sourceControl} from './source-command.mjs';
import {isUpdateCommand,updateReference} from './source-updates.mjs';
import {foldVietnamese} from './source-pricing.mjs';
import {linkedBot,linkedTelegram,linkedUpdateId} from './linked-telegram-bots.mjs';
const fold=s=>foldVietnamese(s).replace(/#[\p{L}\p{N}_]+/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
// Caller must verify webhook secret, owner and private chat first.
export async function resolveReplyUpdate(message,{bot='source',edited=false}={}){
 const text=String(message.text||message.caption||'').trim();if(sourceControl(text))return {active:false};
 const original=message.reply_to_message;if(!original&&!edited){const explicit=updateReference(text);if(explicit)return {active:true,reference:explicit};const rows=await db('posts',{query:'?status=eq.published&select=id,status,public_data,private_data&limit=1000'});const auto=automaticSourceTarget(text,rows);return {active:isUpdateCommand(text)||!!auto.reference||auto.ambiguous||!!message.external_reply||!!message.quote,reference:auto.reference,unresolved:auto.ambiguous||!!((message.external_reply||message.quote)&&!auto.reference)};}
 if(!text&&!message.photo?.length&&!message.document)return {active:false};
 let reference=updateReference(text)||updateReference(original?.text||original?.caption||'');
 const chat=String(message.chat.id)+(bot==='source'?'':':'+bot),messageId=edited?message.message_id:original?.message_id;
 let prior=(await db('source_inbox',{query:'?chat_id=eq.'+encodeURIComponent(chat)+'&message_id=eq.'+messageId+'&limit=1'}))[0];
 const receipt=(original?.text||'').match(/(?:Mã nguồn|Mã lựa chọn):\s*([-a-f0-9]{36})/iu)?.[1];if(!prior&&receipt)prior=(await db('source_inbox',{query:'?id=eq.'+receipt+'&limit=1'}))[0];
 if(prior?.media_group_id&&!prior.result_url)prior=(await db('source_inbox',{query:'?chat_id=eq.'+encodeURIComponent(chat)+'&media_group_id=eq.'+encodeURIComponent(prior.media_group_id)+'&order=message_id.asc&limit=1'}))[0]||prior;
 const visited=new Set();for(let depth=0;prior&&!prior.result_url&&depth<5;depth++){const parent=(prior.media||[]).find(m=>m.kind==='source-reference')?.source_id;if(!/^[a-f0-9-]{36}$/i.test(parent||'')||visited.has(parent))break;visited.add(parent);const next=(await db('source_inbox',{query:'?id=eq.'+parent+'&limit=1'}))[0];if(!next||next.chat_id!==prior.chat_id)break;prior=next;}
 reference||=updateReference(prior?.result_url||'');
 if(!reference&&!prior&&original){const originalText=fold(original.text||original.caption||'');if(originalText.length>20){const rows=await db('posts',{query:'?status=eq.published&select=id,public_data,private_data&limit=1000'}),matches=rows.filter(r=>[r.private_data?.sourceText,r.private_data?.originalText,...(r.private_data?.supplements||[]).map(s=>s.text)].some(t=>t&&fold(t)===originalText));if(matches.length===1)reference={slug:matches[0].public_data.slug};}}
 if(!reference&&!prior){const rows=await db('posts',{query:'?status=eq.published&select=id,status,public_data,private_data&limit=1000'});reference=automaticSourceTarget(original?.text||original?.caption||text,rows).reference||automaticSourceTarget(text,rows).reference;}
 return {active:true,reference,sourceId:!reference?prior?.id:null,unresolved:!reference&&!prior?.id};
}
export async function queueLinkedReply(message,updateId,botId,{edited=false}={}){
 const bot=linkedBot(botId),result=await resolveReplyUpdate(message,{bot:botId,edited});if(!result.active)return {handled:false};
 if(result.unresolved||!result.reference&&!result.sourceId){await linkedTelegram(bot,'sendMessage',{chat_id:bot.owner,text:'Chưa xác định được bài cần sửa. Anh Reply bài gốc đã đăng hoặc kèm mã tin/đường dẫn; nội dung này không được đăng thành bài mới.'});return {handled:true};}
 let content=String(message.text||message.caption||'');if(!isUpdateCommand(content))content='#suatin\n'+content;if(result.reference)content+='\nTin cần cập nhật: '+(result.reference.slug||result.reference.code);
 const media=[{kind:'telegram-origin',bot:botId}];if(result.sourceId)media.push({kind:'source-reference',source_id:result.sourceId,unique_id:'source-ref:'+result.sourceId});const photo=message.photo?.at(-1);if(photo)media.push({kind:'image',file_id:photo.file_id,unique_id:photo.file_unique_id,bot:botId});if(message.document&&/^image\/(jpeg|png|webp)$/.test(message.document.mime_type||''))media.push({kind:'image',file_id:message.document.file_id,unique_id:message.document.file_unique_id,bot:botId});
 const hash=createHash('sha256').update(botId+':'+updateId+':'+message.message_id+':'+content).digest('hex');
 const rows=await db('source_inbox',{method:'POST',query:'?on_conflict=content_hash',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{update_id:linkedUpdateId(botId,updateId),message_id:message.message_id,chat_id:String(message.chat.id)+':'+botId,content,media,content_hash:hash}});
 if(rows[0])await linkedTelegram(bot,'sendMessage',{chat_id:bot.owner,text:'Đã lưu yêu cầu sửa/bổ sung vào đúng bài. Hệ thống sẽ báo kết quả, không tạo bài trùng.'});return {handled:true,id:rows[0]?.id};
}
