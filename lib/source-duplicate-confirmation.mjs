import {db} from './platform.mjs';
export async function requestDuplicateConfirmation(source,item,match,reply){
 const old=match?.public_data;
 const decision={state:'pending',existingSlug:old?.slug||'',existingCode:old?.code||'',existingUrl:old?.href|| (old?.slug?'/bds/'+old.slug:''),requestedAt:new Date().toISOString()};
 await db('source_inbox',{method:'PATCH',query:'?id=eq.'+source.id,body:{processing_status:'review',processing_error:'Nguồn trùng: chờ chủ bot trả lời 1 để đăng thêm hoặc 0 để bỏ qua.',parsed_data:{...item,_duplicateDecision:decision},content:source.content,media:source.media||[],result_url:decision.existingUrl||null}});
 const price=n=>n==null?'chưa rõ':n+' triệu/tháng';
 await reply('Phát hiện nguồn có thể trùng'+(old?.code?' với '+old.code:' với nguồn đã nhận')+'.\n'+(old?.title?old.title+'\n':'')+(old?'Giá tin cũ: '+price(old.price)+'\n':'')+'Giá bài anh vừa gửi: '+price(item.price)+'\nAnh có tiếp tục đăng thành một tin MỚI không?\n1 = Có, đăng thêm tin mới.\n0 = Không, bỏ qua.'+(old?.slug?.startsWith('live-')?'\n2 = Sửa/bổ sung vào bài cũ '+old.code+'.':'')+'\nTrả lời tin nhắn này bằng số tương ứng.\nMã xác nhận: '+source.id);
}
export async function answerDuplicateConfirmation(message,reply,{chatId}={}){
 const answer=String(message.text||'').trim();if(!/^[012]$/.test(answer))return {handled:false};
 const explicit=String(message.reply_to_message?.text||'').match(/Mã xác nhận:\s*([a-f0-9-]{36})/i)?.[1];
 const chat=chatId||String(message.chat.id);
 const query=explicit?'?id=eq.'+explicit+'&chat_id=eq.'+encodeURIComponent(chat):'?chat_id=eq.'+encodeURIComponent(chat)+'&processing_status=eq.review&parsed_data->_duplicateDecision->>state=eq.pending&order=created_at.desc&limit=2';
 const rows=await db('source_inbox',{query});
 const candidates=rows.filter(r=>String(r.chat_id)===chat&&r.processing_status==='review'&&r.parsed_data?._duplicateDecision?.state==='pending');
 if(candidates.length!==1){await reply(explicit?'Yêu cầu này đã được trả lời hoặc không còn chờ xác nhận.':'Chưa xác định được một bài chờ xác nhận. Anh trả lời đúng tin nhắn hỏi bài trùng bằng 1 hoặc 0.');return {handled:true};}
 const row=candidates[0],updating=answer==='2',approved=answer==='1'||updating;const slug=row.parsed_data._duplicateDecision.existingSlug;if(updating&&!/^live-\d{10,20}$/.test(slug||'')){await reply('Phương án 2 không có trong câu hỏi này. Chọn 0 hoặc 1.');return {handled:true};}
 const parsed={...row.parsed_data,_duplicateDecision:{...row.parsed_data._duplicateDecision,state:updating?'update':approved?'approved':'declined',decidedAt:new Date().toISOString()}};
 const changed=await db('source_inbox',{method:'PATCH',query:'?id=eq.'+row.id+'&chat_id=eq.'+encodeURIComponent(chat)+'&processing_status=eq.review&parsed_data->_duplicateDecision->>state=eq.pending',body:{...(updating?{content:'#suatin\n'+row.content+'\nTin cần cập nhật: '+slug}:{}),parsed_data:parsed,processing_status:approved?'received':'duplicate',processing_error:approved?'':'Chủ bot chọn không đăng thêm.',attempts:0}});
 if(!changed.length){await reply('Yêu cầu này vừa được xử lý. Bot không tạo thêm bài trùng.');return {handled:true};}
 await reply(updating?'Đã nhận lựa chọn 2. Đang cập nhật bài cũ, không tạo bài mới.':approved?'Đã nhận lựa chọn 1. Đang đăng thêm bài mới; tin cũ được giữ nguyên.':'Đã nhận lựa chọn 0. Bỏ qua bài này, không đăng thêm.');
 return {handled:true,queuedId:approved?row.id:null};
}
