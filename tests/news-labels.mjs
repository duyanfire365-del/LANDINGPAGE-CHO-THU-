import assert from 'node:assert/strict';
import sharp from 'sharp';
import {newsFixture} from './news-fixture.mjs';
import {parseNewsMessage,messageNewsLinks} from '../lib/news-message.mjs';
import {handleNewsTelegram} from '../lib/news-telegram.mjs';
import {newsTextHTML,renderNewsArticle,getNews} from '../lib/news.mjs';
import {linkedBotSecret,linkedBot} from '../lib/linked-telegram-bots.mjs';
import inbox from '../api/telegram-inbox.mjs';
import {customerHook} from '../lib/customer-imports.mjs';
const f=await newsFixture(),original=global.fetch;global.fetch=f.fetch;
const title='Thị trường mặt bằng Hà Nội',body='Đoạn đầu do anh tự biên tập, giữ nguyên số liệu 100 m².\n\nĐoạn thứ hai giữ nguyên giọng văn.',source='https://example.com/tin-goc?a=1&b=2';
async function hook(handler,update,botId='source'){let status,payload;await handler({method:'POST',url:botId==='customer'?'/api/workspace?customer-hook=1':'/api/telegram-inbox?webhook=1',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':linkedBotSecret(linkedBot(botId))},body:update},{writeHead(s){status=s},end(p){payload=p},setHeader(){}});return {status,payload};}
try{
 for(const text of ['Tin tức\n'+title+'\n'+body,'Tin tức: '+title+'\n'+body,'TIN TỨC - '+title+'\n'+body,'#tintuc\n'+title+'\n'+body,title+'\n'+body+'\n#TinTuc','Tin tuc\n'+title+'\n'+body]){const p=parseNewsMessage(text);assert.equal(p.title,title);assert(p.content.startsWith(body));assert(p.content.endsWith('Nguồn tin tức: Nội dung do người đăng cung cấp.'));assert.equal(p.status,'published');}
 for(const text of ['KH: Anh cần thuê nhà để mở spa','Cho thuê nhà\nĐón đọc tin tức mới nhất','#tintucbds\nCho thuê nhà','Cho thuê nhà\nhttps://example.com/#tintuc'])assert.equal(parseNewsMessage(text),null);
 assert(parseNewsMessage('#tintuc').help);assert(parseNewsMessage('Tin tức: '+title).help);
 const exact=parseNewsMessage('#tintuc\n'+title+'\n'+body+'\nNguồn: '+source);assert.equal(exact.content,body+'\nNguồn: '+source);assert.equal(exact.source_url,source);assert(!exact.content.includes('do người đăng'));
 const name=parseNewsMessage('Tin tức\n'+title+'\n'+body+'\nNguồn: Báo do anh cung cấp');assert(name.content.endsWith('Nguồn: Báo do anh cung cấp'));assert.equal(name.source_url,'');
 const linkMessage={entities:[{type:'text_link',url:source},{type:'text_link',url:source},{type:'bold'}]};assert.deepEqual(messageNewsLinks(linkMessage),[source]);const linked=parseNewsMessage('#tintuc\n'+title+'\n'+body,{links:messageNewsLinks(linkMessage)});assert.equal(linked.source_url,source);assert(linked.content.endsWith(source));
 const html=newsTextHTML('<img src=x onerror=alert(1)> '+source+'\njavascript:alert(1)');assert(!html.includes('<img'));assert(html.includes('&lt;img'));assert(html.includes('href="https://example.com/tin-goc?a=1&amp;b=2"'));assert(!html.includes('href="javascript:'));
 process.env.TELEGRAM_SOURCE_BOT_TOKEN='123456:'+'a'.repeat(35);process.env.TELEGRAM_SOURCE_OWNER_ID='777';process.env.TELEGRAM_CUSTOMER_BOT_TOKEN='234567:'+'b'.repeat(35);process.env.TELEGRAM_CUSTOMER_OWNER_ID='777';
 const m={message_id:300,from:{id:777},chat:{id:777,type:'private'},text:'#tintuc\n'+title+'\n'+body+'\nNguồn: '+source};
 assert.equal((await hook(inbox,{update_id:100,message:m})).status,200);assert.equal(f.rows.length,1);assert.equal(f.rows[0].title,title);assert.equal(f.rows[0].content,body+'\nNguồn: '+source);assert(f.messages.at(-1).body.text.includes('Đã đăng Tin tức Hot thành công.'));
 await hook(inbox,{update_id:100,message:m});assert.equal(f.rows.length,1);await hook(inbox,{update_id:101,edited_message:{...m,text:'Tiêu đề đã sửa không còn nhãn\n'+body+'\nNguồn: '+source}});assert.equal(f.rows.length,1);assert.equal(f.rows[0].title,'Tiêu đề đã sửa không còn nhãn');await hook(inbox,{update_id:100,message:m});assert.equal(f.rows[0].title,'Tiêu đề đã sửa không còn nhãn');
 const page=renderNewsArticle(await getNews(f.rows[0].id));assert.equal((page.match(/href="https:\/\/example.com\/tin-goc\?a=1&amp;b=2"/g)||[]).length,1,'one clickable source, no duplicate source footer');assert(!page.includes('class="news-source"'));assert(page.includes('href="https://example.com/tin-goc?a=1&amp;b=2"'));
 const before=f.rows.length;await hook(inbox,{update_id:102,message:{...m,message_id:301,text:'Tin tức'}});assert.equal(f.rows.length,before);assert(f.messages.at(-1).body.text.includes('#tintuc'));
 await hook(inbox,{update_id:103,message:{...m,message_id:302,from:{id:999}}});assert.equal(f.rows.length,before);
 const png=await sharp({create:{width:600,height:400,channels:3,background:'red'}}).png().toBuffer();global.fetch=async(raw,options={})=>{const u=new URL(raw);if(u.hostname==='api.telegram.org'&&u.pathname.endsWith('/getFile'))return Response.json({ok:true,result:{file_path:'photos/news.jpg'}});if(u.hostname==='api.telegram.org'&&u.pathname.startsWith('/file/'))return new Response(png);return f.fetch(raw,options)};
 await hook(inbox,{update_id:104,message:{...m,message_id:303,text:undefined,caption:'Tin tức: '+title+'\n'+body,photo:[{file_id:'fake',file_size:png.length}]}});assert.equal(f.rows.length,2);assert.equal(f.rows[1].has_cover,true);assert.equal(f.rows[1].title,title);
 global.fetch=f.fetch;await hook((req,res)=>customerHook(req,res,()=>{}),{update_id:105,message:{...m,message_id:304,text:'Tin tức\n'+title+'\n'+body}},'customer');assert.equal(f.rows.length,3);assert.equal(f.tables.posts.length,0);assert.equal(f.tables.inquiries.length,2);
 await handleNewsTelegram({...m,message_id:305,text:'Tin tức\n'+title+'\n'+body+'\nNguồn: javascript:alert(1)'},106,'source');assert.equal(f.rows.length,3);assert(f.messages.at(-1).body.text.startsWith('Chưa đăng/cập nhật tin tức:'));
 console.log('PASS Telegram news labels: Tin tức/#tintuc aliases, prepared-copy fidelity, paragraph/source preservation, hidden link + image captions, original webhook routing, edits without labels, retry deduplication, owner guard, safe clickable sources. No AI/source fetch or BĐS/customer writes.');
}finally{global.fetch=original}
