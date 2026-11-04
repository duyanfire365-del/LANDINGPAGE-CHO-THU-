import {createHash} from 'node:crypto';
import {db,problem} from './platform.mjs';
import {linkedBot,linkedTelegram} from './linked-telegram-bots.mjs';
import {saveNews} from './news.mjs';
const command=/^\s*\/(tintuc|nhaptintuc|gotintuc)(?:@\w+)?(?:\s|$)/iu;
const help='Tin tức Hot:\n/tintuc Tiêu đề bài viết\nNội dung chi tiết…\n\nDùng /nhaptintuc để lưu nháp. Có thể gửi ảnh kèm chú thích theo mẫu trên (JPG/PNG/WebP tối đa 2 MB). Sửa tin nhắn gốc để cập nhật; Reply phản hồi của bot bằng /gotintuc để gỡ bài.\nDòng Nguồn: https://… dùng để ghi nguồn tham khảo.';
export function parseNewsMessage(text){const match=String(text||'').match(command);if(!match)return null;const kind=match[1].toLowerCase(),lines=text.slice(match[0].length).trim().split('\n'),title=(lines.shift()||'').replace(/^tiêu đề:\s*/iu,'').trim();if(kind==='gotintuc')return {kind};if(!title||!lines.join('\n').trim())return {kind,help:true};let source_url='',excerpt='';const body=lines.filter(l=>{if(/^nguồn:\s*/iu.test(l)){source_url=l.replace(/^nguồn:\s*/iu,'').trim();return false;}if(/^tóm tắt:\s*/iu.test(l)){excerpt=l.replace(/^tóm tắt:\s*/iu,'').trim();return false;}return true}).join('\n').trim();return {kind,title,content:body,excerpt,source_url,status:kind==='nhaptintuc'?'draft':'published'};}
async function coverFromTelegram(bot,photo){if(photo.file_size>2097152)throw problem(413,'Ảnh bìa tối đa 2 MB. Hãy gửi lại ảnh nhỏ hơn.');const file=await linkedTelegram(bot,'getFile',{file_id:photo.file_id});if(!/^[a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+$/.test(file.file_path||'')||file.file_path.includes('..'))throw problem(400,'Không đọc được ảnh Telegram.');const response=await fetch('https://api.telegram.org/file/bot'+bot.token+'/'+file.file_path,{signal:AbortSignal.timeout(15000),redirect:'error'});if(!response.ok)throw problem(502,'Chưa tải được ảnh Telegram. Hãy thử lại.');if(Number(response.headers.get('content-length'))>2097152)throw problem(413,'Ảnh bìa tối đa 2 MB.');const reader=response.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2097152){await reader.cancel();throw problem(413,'Ảnh bìa tối đa 2 MB.')}chunks.push(Buffer.from(value))}return Buffer.concat(chunks).toString('base64');}
// Invoked only after the existing webhook secret and private-owner checks.
export async function handleNewsTelegram(m,updateId,botId){const parsed=parseNewsMessage(m.text||m.caption||'');if(!parsed)return false;const bot=linkedBot(botId);if(!bot||m.chat?.type!=='private'||String(m.from?.id)!==bot.owner||String(m.chat?.id)!==bot.owner||!Number.isSafeInteger(m.message_id)||!Number.isSafeInteger(updateId))throw problem(403,'Không có quyền đăng tin tức.');
 const reply=text=>linkedTelegram(bot,'sendMessage',{chat_id:bot.owner,text,reply_parameters:{message_id:m.message_id,allow_sending_without_reply:true}});
 if(parsed.help){await reply(help);return true;}
 try{
  let sourceKey=botId+':'+bot.owner+':'+m.message_id,id;
  if(parsed.kind==='gotintuc'){
   id=String(m.reply_to_message?.text||m.reply_to_message?.caption||'').match(/Mã tin tức: ([a-f0-9-]{36})/i)?.[1];if(!id)throw problem(400,'Hãy Reply đúng phản hồi tin tức của bot bằng /gotintuc.');
   const old=(await db('news_articles',{query:'?id=eq.'+id+'&limit=1&select=id,title,content,excerpt,source_url,featured,revision,source_key,source_update'}))[0];if(!old||!old.source_key?.startsWith(botId+':'+bot.owner+':'))throw problem(403,'Bài không thuộc cuộc trò chuyện này. Gỡ bài trong quản trị website.');
   sourceKey=old.source_key;const saved=await saveNews({...old,status:'archived'},{sourceKey,sourceUpdate:updateId});await reply((saved.article.status==='archived'?'Tin tức đã được gỡ khỏi website.':'Yêu cầu gỡ cũ hơn lần cập nhật mới nhất; bài chưa được gỡ. Hãy gửi lại /gotintuc.')+'\nMã tin tức: '+saved.article.id);return true;
  }
  const hash=createHash('sha256').update('hot-news:'+sourceKey).digest('hex');id=[hash.slice(0,8),hash.slice(8,12),hash.slice(12,16),hash.slice(16,20),hash.slice(20,32)].join('-');
  const old=(await db('news_articles',{query:'?id=eq.'+id+'&select=revision,source_update&limit=1'}))[0];
  const duplicate=old&&old.source_update!==null&&Number(old.source_update)>=updateId;
  const coverBase64=!duplicate&&m.photo?.length?await coverFromTelegram(bot,m.photo.at(-1)):undefined;
  const result=await saveNews({...parsed,id,revision:old?.revision,coverBase64},{sourceKey,sourceUpdate:updateId});const a=result.article;
  await reply((a.status==='published'?'Đã đăng Tin tức Hot thành công.\n'+(process.env.SITE_URL||'https://nguonchothue.vn').replace(/\/$/,'')+'/tin-tuc-hot/'+a.slug:a.status==='draft'?'Đã lưu nháp Tin tức Hot, chưa công khai. Mở Quản trị → Khách hàng / Công cụ → Tin tức Hot để xem và đăng.':'Tin tức đã được gỡ khỏi website.')+'\nMã tin tức: '+a.id);return true;
 }catch(e){if(e.status>=400&&e.status<500){await reply('Chưa đăng/cập nhật tin tức: '+e.message+'\nKhông chuyển tin này sang nguồn BĐS hoặc hồ sơ khách.');return true;}e.newsRequest=true;try{await reply('Chưa xác nhận hoàn tất Tin tức Hot do kết nối tạm lỗi. Telegram sẽ thử lại; anh có thể mở Quản trị → Khách hàng / Công cụ → Tin tức Hot để kiểm tra. Gửi lại cùng tin không tạo bài trùng.')}catch{}throw e;}
}
