import {randomUUID,randomInt,createHash} from 'node:crypto';
import {db,configured} from './platform.mjs';
export const SOURCE_WEBHOOK='https://nguonchothue.vn/api/telegram-inbox?webhook=1';
export function webhookHealth(bot,hook,automation){const connected=hook.url===SOURCE_WEBHOOK;return {username:bot.username||'',webhookConnected:connected,pendingUpdates:hook.pending_update_count||0,lastErrorAt:hook.last_error_date?new Date(hook.last_error_date*1000).toISOString():null,lastError:String(hook.last_error_message||'').replace(/https?:\/\/\S+/gi,'[địa chỉ webhook]').slice(0,350),automation,issues:[...(!connected?['Webhook chưa trỏ đúng website. Bấm Kết nối bot nhận nguồn.']:[]),...(!automation.enabled?['Tự đăng đang tắt: đặt TELEGRAM_AUTO_PUBLISH=true ở Vercel Production rồi Redeploy.']:[]),...(automation.mode==='ai'&&!automation.aiReady?['Chế độ AI chưa có khóa. Dùng TELEGRAM_SOURCE_MODE=provided để dùng ảnh gửi kèm và quy tắc.']:[])]}}
export async function sourceReply(telegram,text,{recordId='source-bot',phase='result',replyTo,botId='source'}={}){
 const body={chat_id:process.env.TELEGRAM_SOURCE_OWNER_ID?.trim(),text,protect_content:false,...(Number.isSafeInteger(replyTo)&&replyTo>0?{reply_parameters:{message_id:replyTo,allow_sending_without_reply:true}}:{})};
 let sent=false,code='network',messageId;
 for(let attempt=0;attempt<3;attempt++)try{
  const result=await telegram('sendMessage',body);messageId=result?.message_id;sent=true;break;
 }catch(error){
  code=error.telegramCode||error.status||'network';const delay=Number(error.retryAfter);
  const rate=code===429&&Number.isFinite(delay)&&delay>=0&&delay<=10;
  const transient=code==='network'||Number(code)>=500;
  if(attempt<2&&(rate||transient)){await new Promise(resolve=>setTimeout(resolve,rate?Math.max(1,delay)*1000+100:250*(attempt+1)));continue}
  break;
 }
 if(process.env.VERCEL)console[sent?'info':'error'](JSON.stringify({event:sent?'source-telegram-send-confirmed':'source-telegram-send-failed',sourceId:recordId,botId,phase,...(sent?{messageId}:{code})}));
 // Persist both outcomes by source, so a published post cannot conceal a failed reply.
 await db('notification_log',{method:'POST',body:{kind:recordId==='source-bot'&&!sent?'source-result-failed':'source-delivery:'+phase,record_id:recordId,sent}}).catch(()=>{});
 return sent;
}
export function receiptText(row,enabled){const labels={published:'Tin này đã đăng lên website.',updated:'Lệnh này đã bổ sung vào tin đăng.',duplicate:'Nguồn này đã có trong kho.',grouped:'Ảnh này đã ghép vào album.',processing:'Nguồn đang được xử lý.',blocked:'Nguồn đang thiếu cấu hình.',failed:'Lượt xử lý trước bị gián đoạn.',review:'Nguồn cần kiểm tra lại.'};let text=row?.parsed_data?._duplicateDecision?.state==='pending'?'Bài trùng đang chờ anh trả lời 1 để đăng thêm hoặc 0 để bỏ qua.':labels[row?.processing_status]||'Đã nhận nguồn và lưu riêng trong quản trị.';if(!enabled)text+=' Tự đăng đang TẮT. Đặt TELEGRAM_AUTO_PUBLISH=true ở Vercel Production rồi Redeploy; sau đó vào Nguồn từ bot Telegram để xử lý lại.';else if(row?.parsed_data?._duplicateDecision?.state!=='pending'&&!['published','updated','duplicate','grouped'].includes(row?.processing_status))text+=' Đã xếp hàng xử lý; nếu chưa có kết quả, mở Quản trị → Nguồn từ bot Telegram → Tải nguồn mới để xem trạng thái.';if(row?.result_url&&/^\/(?:tin\?|bds\/)/.test(row.result_url))text+='\nhttps://nguonchothue.vn'+row.result_url;return text}

export function sourceStorageError(error){const code=error.databaseCode||'';if(code==='PGRST205'||code==='42P01')return 'Chưa tìm thấy bảng nguồn. Cần kiểm tra database/004_source_inbox.sql và 005_source_automation.sql trong Supabase.';if(code==='PGRST204'||code==='42703'||code==='PGRST202'||code==='42883')return 'Bảng nguồn hoặc hàm xử lý chưa đủ phiên bản. Cần kiểm tra database/005_source_automation.sql trong Supabase.';if(error.status===401||error.databaseStatus===403||code==='42501')return 'Supabase từ chối quyền. Kiểm tra SUPABASE_SERVICE_ROLE_KEY và quyền bảng nguồn ở Vercel Production, rồi Redeploy.';if(code==='23505')return 'Tin bị trùng mã cập nhật Telegram trong kho. Đã giữ bản cũ; cần đối chiếu nguồn trong quản trị.';if(error.status===503)return 'Chưa đủ cấu hình Supabase Production. Kiểm tra SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY rồi Redeploy.';return 'Không hoàn tất kết nối/lưu nguồn vào Supabase. Kiểm tra trạng thái dự án, kết nối và nhật ký Vercel.'}
export async function sourceStorageHealth(){if(!configured())return {ok:false,error:sourceStorageError({status:503})};try{const rows=await db('source_inbox',{query:'?select=id,processing_status,processing_error,created_at,attempts&order=created_at.desc&limit=5'});await db('rpc/claim_source_job',{method:'POST',body:{job_id:'00000000-0000-0000-0000-000000000000',daily_limit:20}});return {ok:true,recent:rows.map(r=>({status:r.processing_status,at:r.created_at,attempts:r.attempts}))}}catch(error){return {ok:false,error:sourceStorageError(error),code:error.databaseCode||''}}}
export async function sourceStatusText(automation){const storage=await sourceStorageHealth();return 'Telegram: đã nhận được lệnh. Tự đăng: '+(automation.enabled?'BẬT':'TẮT')+'.\n'+(storage.ok?'Kho nguồn: đọc được. Hàm nhận việc: gọi được.\n'+(storage.recent.length?'Nguồn gần nhất: '+storage.recent.map(r=>(r.status||'received')+' ('+new Date(r.at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})+')').join('; '):'Chưa có nguồn nào được lưu.'):'Kho nguồn/hàng đợi: CÓ LỖI. '+storage.error+(storage.code?' Mã kiểm tra: '+storage.code+'.':''))+'\nẢnh minh họa tự động: '+(automation.bannerMode==='category'?'website tự chọn banner theo loại BĐS, không cần AI':automation.autoImages===false?'TẮT':automation.imageReady?'BẬT — tự tạo ảnh AI khi bài thiếu ảnh; phụ thuộc quyền và số dư dịch vụ.':'chưa kết nối dịch vụ ảnh AI; bài dùng ảnh dự phòng và báo riêng cho quản trị.')+'\nLệnh trả lời được chưa có nghĩa bài đăng đã được lưu. Xem kết quả từng tin trong Quản trị → Nguồn từ bot Telegram.'}

async function findMessageStatus(message,{botId="source",ownerId=process.env.TELEGRAM_SOURCE_OWNER_ID?.trim()}={}){
 const chat=ownerId+(botId==="source"?"":":"+botId);let row=(await db('source_inbox',{query:'?chat_id=eq.'+encodeURIComponent(chat)+'&message_id=eq.'+message.message_id+'&limit=1'}))[0];
 if(!row){const {createHash}=await import('node:crypto');const unique=[];if(message.photo?.at(-1))unique.push(message.photo.at(-1).file_unique_id);for(const kind of ['document','video'])if(message[kind])unique.push(message[kind].file_unique_id);const text=String(message.text||message.caption||'').slice(0,16000),hash=createHash('sha256').update(JSON.stringify({text:text.normalize('NFC').trim(),media:unique})).digest('hex');row=(await db('source_inbox',{query:'?chat_id=eq.'+encodeURIComponent(chat)+'&content_hash=eq.'+hash+'&limit=1'}))[0];}
 if(!row)return 'BÀI ANH ĐANG TRẢ LỜI: chưa tìm thấy bản lưu theo tin nhắn hoặc nội dung/ảnh trùng. Chưa có xác nhận bài này đã vào kho nguồn. Mở quản trị kiểm tra webhook và nhật ký bước lưu; không cần gửi lại bài nhiều lần.';
 const labels={received:'Đã lưu, đang chờ nhận việc',processing:'Đang xử lý',published:'Đã đăng',review:'Đang cần kiểm tra',failed:'Xử lý bị gián đoạn',blocked:'Thiếu cấu hình',duplicate:'Trùng nguồn có sẵn',grouped:'Ảnh thuộc một album',updated:'Đã bổ sung tin'};
 return 'BÀI ANH ĐANG TRẢ LỜI: '+(labels[row.processing_status]||row.processing_status)+'.\nMã nguồn: '+row.id+'\nSố lần xử lý: '+(row.attempts||0)+(row.processing_error?'\nThông báo đã lưu: '+String(row.processing_error).slice(0,600):'')+(row.result_url&&/^\/(?:tin\?|bds\/)/.test(row.result_url)?'\nhttps://nguonchothue.vn'+row.result_url:'');
}

export async function sourceMessageStatus(message,options){try{return await findMessageStatus(message,options)}catch(error){return "Kiểm tra bài cụ thể chưa hoàn tất: "+sourceStorageError(error)}}

export async function sourceWriteHealth(){
 if(!configured())return {ok:false,stage:'cấu hình kho',error:sourceStorageError({status:503})};
 const id=randomUUID(),hash=createHash('sha256').update('source-write-probe:'+id).digest('hex'),number=-randomInt(1,2**47),query='?id=eq.'+id+'&content_hash=eq.'+hash;
 let result={ok:false,stage:'ghi bản kiểm tra',cleanupOk:false};
 try{
  const rows=await db('source_inbox',{method:'POST',body:{id,update_id:number,message_id:number,chat_id:process.env.TELEGRAM_SOURCE_OWNER_ID?.trim(),content:'[KIỂM TRA LƯU NGUỒN — KHÔNG ĐĂNG] '+id,content_hash:hash,media:[{kind:'health-probe'}],processing_status:'review'}});
  if(!Array.isArray(rows)||rows[0]?.id!==id)throw Error('ProbeInsertNotConfirmed');
  result.stage='đọc lại bản vừa ghi';const saved=await db('source_inbox',{query});if(!saved.some(row=>row.id===id))throw Error('ProbeReadBackNotConfirmed');
  result.ok=true;result.stage='ghi và đọc lại đạt';
 }catch(error){result.error=sourceStorageError(error);result.code=error.databaseCode||error.message?.match(/^Probe\w+$/)?.[0]||error.name||'Error';}
 finally{try{await db('source_inbox',{method:'DELETE',query});const remaining=await db('source_inbox',{query:query+'&select=id'});if(remaining.length)throw Error('ProbeCleanupNotConfirmed');result.cleanupOk=true}catch(error){result.ok=false;result.stage='xóa bản kiểm tra';result.cleanupError='Chưa xóa được bản kiểm tra riêng. Bản này được chặn tự đăng.';result.cleanupCode=error.databaseCode||error.name||'Error'}}
 return result;
}
