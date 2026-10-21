import {SOURCE_WEBHOOK,webhookHealth,sourceReply,receiptText} from '../lib/source-bot-health.mjs';
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
 const data=await response.json();if(!response.ok||!data.ok)throw problem(502,data.error_code===403?'Telegram từ chối gửi tin: mở đúng bot, bỏ chặn và bấm Start.':data.error_code===401?'Token bot Telegram không còn hợp lệ. Cập nhật token đúng bot rồi Redeploy.':'Telegram chưa xác nhận kết nối. Kiểm tra token, chat ID và thử lại.');return data.result;
}
export default async function handler(req,res){
 let verifiedOwner=false;
 try{
  if(req.method==='GET'){
   requireAdmin(req);ready();const rows=await db('source_inbox',{query:'?order=created_at.desc&limit=50'});return send(res,200,{items:rows,automation:automationConfiguration()});
  }
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  const hook=new URL(req.url,'https://localhost').searchParams.has('webhook');
  if(!hook){
   requireAdmin(req);if(!sameOrigin(req))return send(res,403,{error:'Yêu cầu không hợp lệ.'});ready();
   const body=await readJson(req);if(body.action==='diagnose'){const [bot,hook]=await Promise.all([telegram('getMe',{}),telegram('getWebhookInfo',{})]);const rows=await db('source_inbox',{query:'?order=created_at.desc&limit=50'});return send(res,200,{...webhookHealth(bot,hook,automationConfiguration()),recent:rows.reduce((counts,row)=>(counts[row.processing_status||'received']=(counts[row.processing_status||'received']||0)+1,counts),{})});}if(body.action==='process'){if(!/^[-\da-f]{36}$/i.test(body.id||''))throw problem(400,'Mã nguồn không hợp lệ.');if(!automationConfiguration().enabled)throw problem(503,'Chưa bật TELEGRAM_AUTO_PUBLISH=true trong Vercel.');const old=(await db('source_inbox',{query:'?id=eq.'+body.id}))[0];if(old&&['review','failed','blocked'].includes(old.processing_status))await db('source_inbox',{method:'PATCH',query:'?id=eq.'+body.id+'&processing_status=eq.'+old.processing_status,body:{processing_status:'received',processing_error:'',attempts:0,parsed_data:null}});waitUntil(processSource(body.id));return send(res,202,{queued:true});}if(body.action!=='connect')throw problem(400,'Yêu cầu không hợp lệ.');
   await db('source_inbox',{query:automationConfiguration().enabled?'?select=id,processing_status&limit=1':'?select=id&limit=1'});
   const bot=await telegram('getMe',{});
   if(bot.username?.toLowerCase()!=='nguonbdschothueduy_inbox_bot')throw problem(400,'Token chưa thuộc bot @Nguonbdschothueduy_inbox_bot.');
   await telegram('setWebhook',{url:SOURCE_WEBHOOK,secret_token:secret(),allowed_updates:['message'],drop_pending_updates:false});
   return send(res,200,{connected:true,username:bot.username});
  }
  ready();const supplied=String(req.headers['x-telegram-bot-api-secret-token']||'');
  if(! /^[a-f0-9]{64}$/.test(supplied)||!timingSafeEqual(Buffer.from(supplied),Buffer.from(secret())))return send(res,403,{error:'Forbidden'});
  const update=await readJson(req,200000),m=update.message;
  if(!m||m.chat?.type!=='private'||String(m.from?.id)!==owner()||String(m.chat.id)!==owner())return send(res,200,{ok:true});
  if(!Number.isSafeInteger(update.update_id)||!Number.isSafeInteger(m.message_id))throw problem(400,'Invalid update');verifiedOwner=true;
  let text=String(m.text||m.caption||'').slice(0,16000),replySource=null;
  if(isUpdateCommand(text)&&!updateReference(text)&&m.reply_to_message){let reference=updateReference(m.reply_to_message.text||m.reply_to_message.caption||'');if(!reference){let prior=(await db('source_inbox',{query:'?chat_id=eq.'+encodeURIComponent(String(m.chat.id))+'&message_id=eq.'+m.reply_to_message.message_id+'&limit=1'}))[0];if(prior?.media_group_id&&!prior.result_url)prior=(await db('source_inbox',{query:'?chat_id=eq.'+encodeURIComponent(String(m.chat.id))+'&media_group_id=eq.'+encodeURIComponent(prior.media_group_id)+'&order=message_id.asc&limit=1'}))[0]||prior;reference=updateReference(prior?.result_url||'');if(!reference&&prior?.id&&!isUpdateCommand(prior.content))replySource=prior.id;}if(reference)text+='\nTin cần cập nhật: '+(reference.slug||reference.code);}
  if(/^\/(?:start|status)(?:@\w+)?(?:\s|$)/.test(text)){waitUntil(sourceReply(telegram,'Bot nguồn đã nhận lệnh của anh. '+(automationConfiguration().enabled?'Tự đăng đang bật. Gửi bài và ảnh vào cuộc trò chuyện riêng này.':'Tự đăng đang TẮT. Đặt TELEGRAM_AUTO_PUBLISH=true trong Vercel Production rồi Redeploy.')));return send(res,200,{ok:true});}
  const media=[];if(replySource)media.push({kind:'source-reference',source_id:replySource,unique_id:'source-ref:'+replySource});const photo=m.photo?.at(-1);if(photo)media.push({kind:'image',file_id:photo.file_id,unique_id:photo.file_unique_id});
  for(const kind of ['document','video'])if(m[kind])media.push({kind:kind==='document'&&['image/jpeg','image/png','image/webp'].includes(m[kind].mime_type)?'image':kind,file_id:m[kind].file_id,unique_id:m[kind].file_unique_id,name:m[kind].file_name||'',mime:m[kind].mime_type||'',size:m[kind].file_size||0});
  if(!text&&!media.length)return send(res,200,{ok:true});
  // Keep every caption/private address intact. Exact-content dedup only; changed prices remain for review.
  const hash=createHash('sha256').update(JSON.stringify({text:text.normalize('NFC').trim(),media:media.map(a=>a.unique_id)})).digest('hex');
  // Database unique constraints make Telegram redelivery and simultaneous duplicate messages safe.
  const saved=await db('source_inbox',{method:'POST',query:'?on_conflict=content_hash',body:{update_id:update.update_id,message_id:m.message_id,chat_id:String(m.chat.id),media_group_id:m.media_group_id||null,content:text,media,content_hash:hash},headers:{Prefer:'resolution=ignore-duplicates,return=representation'}});
  const enabled=automationConfiguration().enabled,row=saved[0]||(await db('source_inbox',{query:'?content_hash=eq.'+hash}))[0];
  if(enabled&&row&&['review','failed','blocked'].includes(row.processing_status)&&m.message_id>row.message_id)await db('source_inbox',{method:'PATCH',query:'?id=eq.'+row.id+'&processing_status=eq.'+row.processing_status,body:{processing_status:'received',processing_error:'',attempts:0,parsed_data:null}});
  waitUntil((async()=>{if(text||!m.media_group_id)await sourceReply(telegram,receiptText(row,enabled));if(enabled&&row)await processSource(row.id)})());
  return send(res,200,{ok:true});
 }catch(error){if(verifiedOwner)waitUntil(sourceReply(telegram,'Website chưa lưu hoặc xếp hàng xử lý được tin vừa gửi. Anh mở Quản trị → Nguồn từ bot Telegram → Kiểm tra bot / webhook để kiểm tra; có thể cần kiểm tra kết nối Supabase và các bảng nguồn. Tin này chưa được xác nhận đăng.'));return send(res,error.status||502,{error:error.message||'Chưa lưu được nguồn Telegram.'});}
}
