import {queueCustomerMessage,processCustomerImport} from '../lib/customer-imports.mjs';
import {linkedBot,linkedBotSecret,linkedTelegram,ensureLinkedBotWebhooks,linkedUpdateId,linkedWebhookURL} from '../lib/linked-telegram-bots.mjs';
import {resolveReplyUpdate} from '../lib/telegram-reply-updates.mjs';
import {sourceControl} from '../lib/source-command.mjs';
import {answerSourceChoice} from '../lib/source-review-choices.mjs';
import {recoveryReply} from '../lib/source-reply.mjs';
import {SOURCE_WEBHOOK,webhookHealth,sourceReply,receiptText,sourceStorageHealth,sourceStorageError,sourceStatusText,sourceMessageStatus,sourceWriteHealth} from '../lib/source-bot-health.mjs';
import {isUpdateCommand,updateReference} from '../lib/source-updates.mjs';
import {waitUntil} from '@vercel/functions';
import {automationConfiguration,processSource} from '../lib/source-automation.mjs';
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {readJson,send,sameOrigin} from '../lib/http.mjs';
import {requireAdmin,db,problem} from '../lib/platform.mjs';
const token=()=>process.env.TELEGRAM_SOURCE_BOT_TOKEN?.trim();
const owner=()=>process.env.TELEGRAM_SOURCE_OWNER_ID?.trim();
const secret=()=>createHmac('sha256',token()).update('rental-source-webhook-v1').digest('hex');
function ready(){if(!/^\d+:[A-Za-z0-9_-]{25,}$/.test(token()||'')||!/^\d+$/.test(owner()||''))throw problem(503,'Thêm TELEGRAM_SOURCE_BOT_TOKEN và TELEGRAM_SOURCE_OWNER_ID vào Vercel Production rồi Redeploy.');}
async function telegram(method,body){
 const response=await fetch('https://api.telegram.org/bot'+token()+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
 const data=await response.json();if(data.error_code===429)throw Object.assign(problem(502,'Telegram tạm giới hạn gửi tin.'),{telegramCode:429,retryAfter:data.parameters?.retry_after});if(!response.ok||!data.ok)throw problem(502,data.error_code===403?'Telegram từ chối gửi tin: mở đúng bot, bỏ chặn và bấm Start.':data.error_code===401?'Token bot Telegram không còn hợp lệ. Cập nhật token đúng bot rồi Redeploy.':'Telegram chưa xác nhận kết nối. Kiểm tra token, chat ID và thử lại.');return data.result;
}
export default async function handler(req,res){
 let verifiedOwner=false,stage='nhận yêu cầu';
 const botId=new URL(req.url,'http://localhost').searchParams.get('bot')||'source',bot=linkedBot(botId),token=()=>bot?.token,owner=()=>bot?.owner,secret=()=>bot?linkedBotSecret(bot):'';
 const telegram=(method,body)=>linkedTelegram(bot,method,body?.chat_id?{...body,chat_id:owner()}:body);
 const ready=()=>{if(!bot)throw problem(503,'Bot chưa được cấu hình token và chủ tài khoản hợp lệ.');};
 try{
  // Webhook maintenance must not delay or block authenticated intake.

  if(req.method==='GET'){
   requireAdmin(req);ready();const rows=await db('source_inbox',{query:'?order=created_at.desc&limit=50'});return send(res,200,{items:rows,automation:automationConfiguration()});
  }
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  const hook=new URL(req.url,'https://localhost').searchParams.has('webhook');
  if(!hook){
   requireAdmin(req);if(!sameOrigin(req))return send(res,403,{error:'Yêu cầu không hợp lệ.'});ready();
   const body=await readJson(req);if(body.action==='diagnose'){const [bot,hook]=await Promise.all([telegram('getMe',{}),telegram('getWebhookInfo',{})]);const storage=await sourceStorageHealth(),write=storage.ok?await sourceWriteHealth():{ok:false,stage:'chưa thử ghi vì đọc kho lỗi'};const rows=storage.ok?await db('source_inbox',{query:'?order=created_at.desc&limit=50'}):[];return send(res,200,{storage,write,...webhookHealth(bot,hook,automationConfiguration()),recent:rows.reduce((counts,row)=>(counts[row.processing_status||'received']=(counts[row.processing_status||'received']||0)+1,counts),{})});}if(body.action==='process'){if(!/^[-\da-f]{36}$/i.test(body.id||''))throw problem(400,'Mã nguồn không hợp lệ.');if(!automationConfiguration().enabled)throw problem(503,'Chưa bật TELEGRAM_AUTO_PUBLISH=true trong Vercel.');const old=(await db('source_inbox',{query:'?id=eq.'+body.id}))[0];if(old&&['review','failed','blocked'].includes(old.processing_status))await db('source_inbox',{method:'PATCH',query:'?id=eq.'+body.id+'&processing_status=eq.'+old.processing_status,body:{processing_status:'received',processing_error:'',attempts:0,parsed_data:null}});waitUntil(processSource(body.id));return send(res,202,{queued:true});}if(body.action!=='connect')throw problem(400,'Yêu cầu không hợp lệ.');
   await db('source_inbox',{query:automationConfiguration().enabled?'?select=id,processing_status&limit=1':'?select=id&limit=1'});
   const bot=await telegram('getMe',{});
   if(botId==='source'&&bot.username?.toLowerCase()!=='nguonbdschothueduy_inbox_bot')throw problem(400,'Token chưa thuộc bot @Nguonbdschothueduy_inbox_bot.');
   await telegram('setWebhook',{url:linkedWebhookURL(linkedBot(botId)),secret_token:secret(),allowed_updates:['message','edited_message'],drop_pending_updates:false});
   return send(res,200,{connected:true,username:bot.username});
  }
  ready();const supplied=String(req.headers['x-telegram-bot-api-secret-token']||'');
  if(! /^[a-f0-9]{64}$/.test(supplied)||!timingSafeEqual(Buffer.from(supplied),Buffer.from(secret())))return send(res,403,{error:'Forbidden'});
  const update=await readJson(req,200000);let m=update.message||update.edited_message,recovering=false;
  if(!m||m.chat?.type!=='private'||String(m.from?.id)!==owner()||String(m.chat.id)!==owner())return send(res,200,{ok:true});
  if(!Number.isSafeInteger(update.update_id)||!Number.isSafeInteger(m.message_id))throw problem(400,'Invalid update');verifiedOwner=true;
  if(process.env.VERCEL_ENV==='production'){waitUntil(ensureLinkedBotWebhooks());waitUntil(import('../lib/source-delivery-recovery.mjs').then(m=>m.recoverSourceDeliveries()).catch(()=>{}));}
  const customer=await queueCustomerMessage(m,update.update_id,botId);if(customer.handled){if(customer.id)waitUntil(processCustomerImport(customer.id));return send(res,200,{ok:true});}
  if(/^[0-3]$/.test(String(m.text||'').trim())){
   const decision=await answerSourceChoice(m,text=>sourceReply(telegram,text),{botId});
   if(decision.queuedId)waitUntil(processSource(decision.queuedId));
   return send(res,200,{ok:true});
  }
  if(/^\/(?:danglai|retry)(?:@\w+)?\s*$/.test(String(m.text||''))){const {original,error}=recoveryReply(m,token().split(':')[0]);if(error){await sourceReply(telegram,error);return send(res,200,{ok:true});}m={...original,chat:m.chat,from:m.from};recovering=true;}
  const command=String(m.text||m.caption||'');
  if(/^\/dang(?:@\w+)?\s*$/iu.test(command)){
   if(m.reply_to_message){
    const {original,error}=recoveryReply(m,token().split(':')[0]);
    if(error){
     await sourceReply(telegram,error);
     return send(res,200,{ok:true});
    }
    m={...original,chat:m.chat,from:m.from};
    recovering=true;
   }else if(!m.photo&&!m.document&&!m.video){
    await sourceReply(
     telegram,
     'Anh gửi /dang kèm nội dung bài và ảnh, hoặc trả lời bài gốc bằng /dang.\n'+
     'Ví dụ:\n/dang Cho thuê mặt bằng kinh doanh\n'+
     'Địa chỉ: Số 12 Trần Quốc Vượng, Cầu Giấy\n'+
     'Diện tích: 80 m²\nSố tầng: 2 tầng\n'+
     'Giá thuê: 25 triệu/tháng\n'+
     'Số nhà được giữ riêng, không đưa vào tiêu đề công khai.'
    );
    return send(res,200,{ok:true});
   }
  }
  let text=String(m.text||m.caption||'')
   .slice(0,16000)
   .replace(/^\/dang(?:@\w+)?(?:\s+|$)/iu,'');
  let replySource=null;
  if(!recovering&&!sourceControl(text)){
   const resolved=await resolveReplyUpdate(m,{bot:botId,edited:!!update.edited_message});
   if(resolved.unresolved){await sourceReply(telegram,'Chưa xác định được tin cần sửa. Anh Reply đúng bài gốc đã đăng hoặc thêm mã tin/đường dẫn. Không tạo bài mới từ nội dung Reply này.');return send(res,200,{ok:true});}
   if(resolved.active){if(!isUpdateCommand(text))text='#suatin\n'+text;if(resolved.reference)text+='\nTin cần cập nhật: '+(resolved.reference.slug||resolved.reference.code);replySource=resolved.sourceId;}
  }
  const control=sourceControl(text);
  if(control){
   const config=automationConfiguration();
   await sourceReply(telegram,control==='status'?(await sourceStatusText(config))+(m.reply_to_message?'\n\n'+await sourceMessageStatus(m.reply_to_message,{botId,ownerId:owner()}):'\nMuốn kiểm tra đúng một bài: Trả lời bài đó bằng /status.'):'Đây là lệnh điều khiển, không phải bài đăng. Gửi /status để kiểm tra; gửi nội dung BĐS và ảnh để đăng bài.');
   return send(res,200,{ok:true});
  }
  const media=[];if(replySource)media.push({kind:'source-reference',source_id:replySource,unique_id:'source-ref:'+replySource});const photo=m.photo?.at(-1);if(photo)media.push({kind:'image',file_id:photo.file_id,unique_id:photo.file_unique_id,bot:botId});
  for(const kind of ['document','video'])if(m[kind])media.push({kind:kind==='document'&&['image/jpeg','image/png','image/webp'].includes(m[kind].mime_type)?'image':kind,file_id:m[kind].file_id,unique_id:m[kind].file_unique_id,bot:botId,name:m[kind].file_name||'',mime:m[kind].mime_type||'',size:m[kind].file_size||0});
  if(botId!=='source')media.push({kind:'telegram-origin',bot:botId});
  if(!text&&!media.some(a=>a.kind!=='telegram-origin'))return send(res,200,{ok:true});
  // Keep every caption/private address intact. Exact-content dedup only; changed prices remain for review.
  const hash=createHash('sha256').update(JSON.stringify({...((botId!=='source')?{botId}:{}),text:text.normalize('NFC').trim(),media:media.map(a=>a.unique_id),message_id:m.message_id,...(isUpdateCommand(text)?{editUpdateId:update.update_id}:{})})).digest('hex');
  // Database unique constraints make Telegram redelivery and simultaneous duplicate messages safe.
  stage='lưu bài vào kho nguồn';
  if(process.env.VERCEL)console.info(JSON.stringify({event:'source-intake-write-start',updateId:update.update_id}));
  let saved;
  try{
   saved=await db('source_inbox',{method:'POST',query:'?on_conflict=content_hash',body:{update_id:linkedUpdateId(botId,update.update_id),message_id:m.message_id,chat_id:String(m.chat.id)+(botId==='source'?'':':'+botId),media_group_id:m.media_group_id||null,content:text,media,content_hash:hash},headers:{Prefer:'resolution=ignore-duplicates,return=representation'}});
  }catch(error){
   if(error.databaseCode!=='23505')throw error;
   const delivered=(await db('source_inbox',{query:'?update_id=eq.'+linkedUpdateId(botId,update.update_id)+'&chat_id=eq.'+encodeURIComponent(String(m.chat.id))+'&limit=1'}))[0];
   if(!delivered)throw error;saved=[delivered];
  }
  stage='tìm bài đã lưu hoặc bản trùng';
  const enabled=automationConfiguration().enabled,row=saved?.[0]||(await db('source_inbox',{query:'?content_hash=eq.'+hash}))[0];
  if(process.env.VERCEL)console.info(JSON.stringify({event:'source-intake-write-result',updateId:update.update_id,hasId:!!row?.id}));
  if(!row?.id)throw problem(502,'Kho nguồn chưa trả lại mã bài đã lưu.');
  stage='xếp lại bài cần xử lý';
  if(enabled&&['review','failed','blocked'].includes(row.processing_status)&&(recovering||m.message_id>row.message_id)){await db('source_inbox',{method:'PATCH',query:'?id=eq.'+row.id+'&processing_status=eq.'+row.processing_status,body:{processing_status:'received',processing_error:'',attempts:0,parsed_data:null}});row.processing_status='received';row.processing_error='';}
  // Complete the durable-save acknowledgement inside the webhook request; do not
  // leave this critical feedback behind an unobserved background continuation.
  stage='xác nhận đã lưu nguồn';
  if(text||!m.media_group_id)await sourceReply(telegram,receiptText(row,enabled)+'\nMã nguồn: '+row.id,{recordId:row.id,phase:'receipt',replyTo:m.message_id,botId});
  if(enabled&&!['published','updated','duplicate'].includes(row.processing_status))waitUntil(processSource(row.id));
  return send(res,200,{ok:true});
 }catch(error){if(verifiedOwner&&process.env.VERCEL)console.error(JSON.stringify({event:'source-intake-failed',stage,code:error.databaseCode||error.name||'Error',httpStatus:error.databaseStatus||error.status||0}));if(verifiedOwner)await sourceReply(telegram,'Chưa hoàn tất bước: '+stage+'. '+sourceStorageError(error)+' Mã lỗi: '+(error.databaseCode||error.name||'Error')+'. '+' Anh gửi /status hoặc mở Quản trị → Nguồn từ bot Telegram → Kiểm tra bot / webhook. Tin này chưa được xác nhận đăng.');return send(res,error.status||502,{error:error.message||'Chưa lưu được nguồn Telegram.'});}
}
