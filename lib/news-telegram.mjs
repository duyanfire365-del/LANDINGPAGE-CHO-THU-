import {articleSections,articleHref} from './article-sections.mjs';
import {createHash} from 'node:crypto';
import {db,problem} from './platform.mjs';
import {linkedBot,linkedTelegram} from './linked-telegram-bots.mjs';
import {saveNews} from './news.mjs';
import {parseNewsMessage,messageNewsLinks} from './news-message.mjs';
export {parseNewsMessage} from './news-message.mjs';
const help='Đăng kinh nghiệm: #kinhnghiemmbkd hoặc dòng Kinh nghiệm tìm MBKD, sau đó là tiêu đề và nội dung. Có thể thêm Ngành: cafe / food / spa / office / retail / warehouse / other.\n\nTin tức Hot — đăng đúng bài anh đã soạn:\n#tintuc\nTiêu đề bài viết\nNội dung chi tiết…\nNguồn: https://…\n\nCó thể thay #tintuc bằng dòng Tin tức hoặc Tin tức: Tiêu đề. Gửi một ảnh kèm nội dung trên trong chú thích để dùng làm ảnh bìa (JPG/PNG/WebP tối đa 2 MB). /tintuc vẫn dùng được; /nhaptintuc để lưu nháp. Sửa tin nhắn gốc để cập nhật; Reply phản hồi của bot bằng /gotintuc để gỡ bài.';
const newsId=key=>{const h=createHash('sha256').update('hot-news:'+key).digest('hex');return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20,32)].join('-')};
async function coverFromTelegram(bot,photo){if(photo.file_size>2097152)throw problem(413,'Ảnh bìa tối đa 2 MB. Hãy gửi lại ảnh nhỏ hơn.');const file=await linkedTelegram(bot,'getFile',{file_id:photo.file_id});if(!/^[a-zA-Z0-9_/-]+\.[a-zA-Z0-9]+$/.test(file.file_path||'')||file.file_path.includes('..'))throw problem(400,'Không đọc được ảnh Telegram.');const response=await fetch('https://api.telegram.org/file/bot'+bot.token+'/'+file.file_path,{signal:AbortSignal.timeout(15000),redirect:'error'});if(!response.ok)throw problem(502,'Chưa tải được ảnh Telegram. Hãy thử lại.');if(Number(response.headers.get('content-length'))>2097152)throw problem(413,'Ảnh bìa tối đa 2 MB.');const reader=response.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2097152){await reader.cancel();throw problem(413,'Ảnh bìa tối đa 2 MB.')}chunks.push(Buffer.from(value))}return Buffer.concat(chunks).toString('base64');}
// Invoked only after the existing webhook secret and private-owner checks.
export async function handleNewsTelegram(m,updateId,botId,{edited=false}={}){const text=m.text||m.caption||'',links=messageNewsLinks(m);let parsed=parseNewsMessage(text,{links});const bot=linkedBot(botId);if(!parsed&&!edited)return false;if(!bot||m.chat?.type!=='private'||String(m.from?.id)!==bot.owner||String(m.chat?.id)!==bot.owner||!Number.isSafeInteger(m.message_id)||!Number.isSafeInteger(updateId))throw problem(403,'Không có quyền đăng tin tức.');
 if(!parsed&&edited){const sourceKey=botId+':'+bot.owner+':'+m.message_id,old=(await db('news_articles',{query:'?id=eq.'+newsId(sourceKey)+'&select=id,section&limit=1'}))[0];if(!old)return false;parsed=parseNewsMessage(text,{force:true,links,section:old.section||'news'});}
 const reply=text=>linkedTelegram(bot,'sendMessage',{chat_id:bot.owner,text,reply_parameters:{message_id:m.message_id,allow_sending_without_reply:true}});
 if(parsed.help){await reply(help);return true;}
 try{
  let sourceKey=botId+':'+bot.owner+':'+m.message_id,id;
  if(parsed.kind==='gotintuc'){
   id=String(m.reply_to_message?.text||m.reply_to_message?.caption||'').match(/Mã tin tức: ([a-f0-9-]{36})/i)?.[1];if(!id)throw problem(400,'Hãy Reply đúng phản hồi tin tức của bot bằng /gotintuc.');
   const old=(await db('news_articles',{query:'?id=eq.'+id+'&limit=1&select=id,title,content,excerpt,source_url,featured,revision,source_key,source_update'}))[0];if(!old||!old.source_key?.startsWith(botId+':'+bot.owner+':'))throw problem(403,'Bài không thuộc cuộc trò chuyện này. Gỡ bài trong quản trị website.');
   sourceKey=old.source_key;const saved=await saveNews({...old,status:'archived'},{sourceKey,sourceUpdate:updateId});await reply((saved.article.status==='archived'?'Tin tức đã được gỡ khỏi website.':'Yêu cầu gỡ cũ hơn lần cập nhật mới nhất; bài chưa được gỡ. Hãy gửi lại /gotintuc.')+'\nMã tin tức: '+saved.article.id);return true;
  }
  id=newsId(sourceKey);
  const old=(await db('news_articles',{query:'?id=eq.'+id+'&select=revision,source_update&limit=1'}))[0];
  const duplicate=old&&old.source_update!==null&&Number(old.source_update)>=updateId;
  const coverBase64=!duplicate&&m.photo?.length?await coverFromTelegram(bot,m.photo.at(-1)):undefined;
  const result=await saveNews({...parsed,id,revision:old?.revision,coverBase64},{sourceKey,sourceUpdate:updateId});const a=result.article,label=articleSections[a.section||'news'].label;
  await reply((a.status==='published'?'Đã đăng '+label+' thành công.\n'+(process.env.SITE_URL||'https://nguonchothue.vn').replace(/\/$/,'')+articleHref(a):a.status==='draft'?'Đã lưu nháp '+label+', chưa công khai. Mở Quản trị → Khách hàng / Công cụ → Tin tức / Kinh nghiệm MBKD để xem và đăng.':'Tin tức đã được gỡ khỏi website.')+'\nMã tin tức: '+a.id);return true;
 }catch(e){if(e.status>=400&&e.status<500){await reply('Chưa đăng/cập nhật tin tức: '+e.message+'\nKhông chuyển tin này sang nguồn BĐS hoặc hồ sơ khách.');return true;}e.newsRequest=true;try{await reply('Chưa xác nhận hoàn tất Tin tức Hot do kết nối tạm lỗi. Telegram sẽ thử lại; anh có thể mở Quản trị → Khách hàng / Công cụ → Tin tức Hot để kiểm tra. Gửi lại cùng tin không tạo bài trùng.')}catch{}throw e;}
}
