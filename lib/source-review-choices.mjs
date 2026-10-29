import {db} from './platform.mjs';
import {extractByRules} from './source-rules.mjs';
import {answerDuplicateConfirmation} from './source-duplicate-confirmation.mjs';
const uuid=v=>/^[a-f0-9-]{36}$/i.test(v||'');
export async function requestReviewChoice(source,reason,reply){
 const reference=(source.media||[]).find(m=>m.kind==='source-reference')?.source_id;
 const standalone=String(source.content||'').replace(/^\s*#(?:suatin|st|sua|bosung|them)\b\s*/iu,'').replace(/\nTin cần cập nhật:[^\n]*/giu,'').trim();
 let canPublish=false;if(reference)try{const item=extractByRules(standalone,{allowIncomplete:true,allowUncertain:true});canPublish=!!(item.size||item.price||item.privateAddress)&&item.type!=='Bất động sản khác';}catch{}
 const decision={state:'pending',requestedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString(),options:canPublish?[0,1,2,3]:[0,1,3]};
 const changed=await db('source_inbox',{method:'PATCH',query:'?id=eq.'+source.id+'&processing_status=in.(review,failed,blocked,received)',body:{parsed_data:{...(source.parsed_data||{}),_reviewDecision:decision}}});if(!changed.length)return false;
 await reply('Nguồn chưa đăng được: '+reason+'\nAnh chọn cách xử lý:\n0 = Không tiếp tục, bỏ qua tin này.\n1 = Có, thử xử lý lại tin đã lưu.'+(canPublish?'\n2 = Dùng nội dung đầy đủ trong Reply làm một tin nguồn độc lập (vẫn kiểm tra trùng).':'')+'\n3 = Giữ lại chờ bổ sung; anh Reply câu hỏi này bằng nội dung đã sửa.\nTrả lời bằng một số ở trên; nếu có nhiều câu hỏi đang chờ, Reply đúng câu hỏi.\nMã lựa chọn: '+source.id);return true;
}
export async function answerSourceChoice(message,reply,{botId='source'}={}){
 const answer=String(message.text||'').trim();if(!/^[0-3]$/.test(answer))return {handled:false};
 const chat=String(message.chat.id)+(botId==='source'?'':':'+botId),original=String(message.reply_to_message?.text||'');
 const explicit=original.match(/Mã lựa chọn:\s*([a-f0-9-]{36})/iu)?.[1];
 if(!explicit&&/Mã xác nhận:/iu.test(original))return answerDuplicateConfirmation(message,reply,{chatId:chat});
 const rows=await db('source_inbox',{query:explicit?'?id=eq.'+explicit+'&chat_id=eq.'+encodeURIComponent(chat):'?chat_id=eq.'+encodeURIComponent(chat)+'&parsed_data->_reviewDecision->>state=eq.pending&order=created_at.desc&limit=2'});
 const pending=rows.filter(r=>r.chat_id===chat&&['review','failed','blocked','received'].includes(r.processing_status)&&r.parsed_data?._reviewDecision?.state==='pending');
 if(!pending.length&&!explicit)return answerDuplicateConfirmation(message,reply,{chatId:chat});
 if(pending.length!==1){await reply('Chưa có một câu hỏi duy nhất đang chờ. Anh Reply đúng câu hỏi bằng số phương án; lựa chọn đã xử lý không được chạy lại.');return {handled:true};}
 const row=pending[0],decision=row.parsed_data._reviewDecision,n=Number(answer);
 if(new Date(decision.expiresAt).getTime()<Date.now()||!decision.options.includes(n)){await reply('Phương án không có trong câu hỏi này hoặc câu hỏi đã hết hạn. Anh gửi lại nội dung đầy đủ để đối chiếu.');return {handled:true};}
 const body={processing_status:n===0?'duplicate':n===3?'review':'received',processing_error:n===0?'Chủ bot chọn bỏ qua.':n===3?'Chờ chủ bot bổ sung nội dung.':'',attempts:0,parsed_data:{...row.parsed_data,_reviewDecision:{...decision,state:n===0?'declined':n===3?'held':'answered',answer:n,decidedAt:new Date().toISOString()}}};
 if(n===2){body.content=String(row.content||'').replace(/^\s*#(?:suatin|st|sua|bosung|them)\b\s*/iu,'').replace(/\nTin cần cập nhật:[^\n]*/giu,'').trim();extractByRules(body.content,{allowIncomplete:true,allowUncertain:true});body.media=(row.media||[]).filter(m=>m.kind!=='source-reference');const parentId=(row.media||[]).find(m=>m.kind==='source-reference')?.source_id;if(uuid(parentId)){const parent=(await db('source_inbox',{query:'?id=eq.'+parentId+'&limit=1'}))[0];if(parent?.chat_id===chat)body.media.push(...(parent.media||[]).filter(m=>m.kind==='image'));}body.parsed_data={_reviewDecision:body.parsed_data._reviewDecision};}
 const saved=await db('source_inbox',{method:'PATCH',query:'?id=eq.'+row.id+'&chat_id=eq.'+encodeURIComponent(chat)+'&parsed_data->_reviewDecision->>state=eq.pending',body});if(!saved.length){await reply('Lựa chọn này vừa được xử lý; không chạy lại.');return {handled:true};}
 await reply(n===0?'Đã chọn 0: bỏ qua, không đăng.':n===3?'Đã chọn 3: giữ riêng. Anh Reply câu hỏi bằng nội dung đầy đủ đã sửa.':'Đã chọn '+n+': đang xử lý. Bot sẽ báo đường dẫn nếu đăng thành công hoặc lý do cần bổ sung.');return {handled:true,queuedId:n===1||n===2?row.id:null};
}
