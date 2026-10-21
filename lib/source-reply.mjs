// Only called after webhook-secret and owner/private-chat authentication.
// The owner explicitly chooses which human-authored message to recover.
export function recoveryReply(message,botId){
 const original=message.reply_to_message;
 if(!original)return {error:message.external_reply||message.quote?'Telegram chỉ gửi trích dẫn/liên kết trả lời, chưa gửi toàn bộ bài gốc và ảnh cho bot. Anh chuyển tiếp nguyên bài có ảnh vào cuộc trò chuyện riêng này; không cần gõ /danglai thêm.':'Telegram không gửi kèm bài gốc trong lệnh này. Anh chuyển tiếp nguyên bài có ảnh vào bot nguồn để nhập lại.'};
 if(original.from?.is_bot===true||String(original.from?.id)===String(botId))return {error:'Đây là tin thông báo của bot. Anh chuyển tiếp bài nguồn có nội dung và ảnh vào cuộc trò chuyện này; bot sẽ nhập bài nguồn.'};
 if(original.chat?.id!==undefined&&String(original.chat.id)!==String(message.chat.id))return {error:'Bài được trả lời thuộc cuộc trò chuyện khác. Anh chuyển tiếp nguyên bài có ảnh vào bot nguồn để bot nhận đủ dữ liệu.'};
 if(!Number.isSafeInteger(original.message_id)||original.message_id<=0)return {error:'Telegram không gửi mã tin gốc hợp lệ. Anh chuyển tiếp nguyên bài có ảnh vào bot nguồn để nhập lại.'};
 if(![original.text,original.caption].some(v=>typeof v==='string'&&v.trim())&&!original.photo?.some(p=>p.file_id)&&!original.document?.file_id&&!original.video?.file_id)return {error:'Telegram có gửi mã tin gốc nhưng không kèm nội dung hoặc tệp ảnh có thể tải. Anh chuyển tiếp nguyên bài và ảnh vào bot nguồn; không cần thử /danglai nhiều lần.'};
 return {original};
}
