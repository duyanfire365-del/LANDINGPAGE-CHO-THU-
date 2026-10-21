import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import handler from '../api/telegram-inbox.mjs';
process.env.TELEGRAM_SOURCE_BOT_TOKEN='123456789:'+ 'a'.repeat(35);
process.env.TELEGRAM_SOURCE_OWNER_ID='456789';
process.env.SUPABASE_URL='https://database.test';process.env.SUPABASE_ANON_KEY='sb_publishable_test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test';
const secret=createHmac('sha256',process.env.TELEGRAM_SOURCE_BOT_TOKEN).update('rental-source-webhook-v1').digest('hex');
const rows=new Map();let calls=0;process.env.TELEGRAM_AUTO_PUBLISH='false';const pending=[];globalThis[Symbol.for('@vercel/request-context')]={get:()=>({waitUntil:p=>pending.push(p)})};
global.fetch=async (raw,options={})=>{const url=new URL(raw);if(url.origin==='https://api.telegram.org')return Response.json({ok:true,result:{}});calls++;if(options.method==='POST'){assert.ok(String(raw).startsWith('https://database.test/rest/v1/source_inbox?on_conflict=content_hash'));assert.equal(options.headers.Prefer,'resolution=ignore-duplicates,return=representation');const row=JSON.parse(options.body);if(!rows.has(row.content_hash)){rows.set(row.content_hash,row);return Response.json([row])}return Response.json([])}return Response.json([...rows.values()].filter(r=>r.content_hash===url.searchParams.get('content_hash')?.slice(3)))};
async function call(body,{key=secret,url='/api/telegram-inbox?webhook=1',method='POST'}={}){let status,payload;const req={method,url,headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':key},body};await handler(req,{writeHead(s){status=s},end(value){payload=JSON.parse(value)}});await Promise.all(pending.splice(0));return {status,payload}}
const update={update_id:1,message:{message_id:5,chat:{id:456789,type:'private'},from:{id:456789},text:'Số 12 ngõ 34 Trung Kính giá 30 triệu #nguon'}};
assert.equal((await call(update,{key:''})).status,403);assert.equal(calls,0);
assert.equal((await call(update,{url:'/api/telegram-inbox',method:'GET'})).status,401);
assert.equal((await call({...update,message:{...update.message,from:{id:999}}})).status,200);assert.equal(calls,0);
assert.equal((await call({...update,message:{...update.message,chat:{id:-12,type:'group'}}})).status,200);assert.equal(calls,0);
assert.equal((await call(update)).status,200);assert.equal(rows.size,1);assert.equal([...rows.values()][0].content,update.message.text);
await call(update);await call({...update,update_id:2,message:{...update.message,message_id:6}});assert.equal(rows.size,1);
await call({...update,update_id:3,message:{...update.message,message_id:7,text:update.message.text.replace('30 triệu','35 triệu')}});assert.equal(rows.size,2);
await call({update_id:4,message:{message_id:8,chat:update.message.chat,from:update.message.from,photo:[{file_id:'small',file_unique_id:'small'},{file_id:'large',file_unique_id:'large'}],media_group_id:'album1'}});assert.equal(rows.size,3);assert.equal([...rows.values()][2].media[0].file_id,'large');
await call({update_id:5,message:{...update.message,text:'/start'}});assert.equal(rows.size,3);
console.log('Telegram inbox: secret verification, admin guard, owner-only intake, private source preservation, exact dedup, changed-price preservation, media references and Start handling passed.');
// A fresh owner resend of a formerly blocked source should retry without requiring text changes.
process.env.TELEGRAM_AUTO_PUBLISH='true';process.env.TELEGRAM_SOURCE_MODE='provided';
const old={id:'11111111-1111-4111-8111-111111111111',message_id:5,processing_status:'review',content:'Kho xưởng 280m2 giá thuê 16 triệu',media:[]};let resets=0;
global.fetch=async (raw,options={})=>{const url=new URL(raw);if(url.origin==='https://api.telegram.org')return Response.json({ok:true,result:{}});if(url.pathname.endsWith('/rpc/claim_source_job'))return Response.json([]);if(options.method==='PATCH'){const body=JSON.parse(options.body);assert.equal(body.processing_status,'received');assert.equal(body.parsed_data,null);resets++;Object.assign(old,body);return Response.json([old])}if(options.method==='POST')return Response.json([]);return Response.json([old])};
assert.equal((await call({...update,update_id:10,message:{...update.message,message_id:11}})).status,200);await Promise.all(pending);assert.equal(resets,1);
old.processing_status='published';await call({...update,update_id:11,message:{...update.message,message_id:12}});await Promise.all(pending);assert.equal(resets,1);
console.log('Resend recovery passed: reviewed sources reset for processing, published sources never reset.');

process.env.TELEGRAM_AUTO_PUBLISH='false';let savedReply=null;
global.fetch=async(raw,options={})=>{const url=new URL(raw);if(url.origin==='https://api.telegram.org')return Response.json({ok:true,result:{}});if(options.method==='POST'){savedReply=JSON.parse(options.body);return Response.json([savedReply])}return Response.json([{result_url:'/tin?slug=live-1790000000000999'}]);};
await call({update_id:100,message:{...update.message,message_id:100,text:'Hãy bổ sung thêm dữ liệu\nGiá thuê: 25 triệu/tháng',reply_to_message:{message_id:90,text:'Đã tự đăng MB - 0029'}}});assert(savedReply.content.includes('MB - 0029'));
await call({update_id:101,message:{...update.message,message_id:101,text:'Hãy bổ sung thêm ảnh',reply_to_message:{message_id:91,text:'Bài nguồn ban đầu'},photo:[{file_id:'reply-photo',file_unique_id:'reply-photo'}]}});assert(savedReply.content.includes('live-1790000000000999'));assert.equal(savedReply.media[0].file_id,'reply-photo');
console.log('PASS: owner-only reply supplements resolve the posted code or original message target, retaining attached photos');

let savedContext=null;global.fetch=async(raw,options={})=>{if(String(raw).startsWith('https://api.telegram.org'))return Response.json({ok:true,result:{}});if(options.method==='POST'){savedContext=JSON.parse(options.body);return Response.json([savedContext])}return Response.json([{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',content:'Nguồn gốc đang thiếu giá',processing_status:'review'}]);};await call({update_id:102,message:{...update.message,message_id:102,text:'Hãy bổ sung giá thuê: 25 triệu/tháng',reply_to_message:{message_id:92,text:'Nguồn gốc đang thiếu giá'}}});assert.equal(savedContext.media[0].kind,'source-reference');assert.equal(savedContext.media[0].source_id,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

// The owner's /start can work even when the intake table is missing: diagnose that separately.
const replies=[],order=[];global.fetch=async(raw,options={})=>{if(String(raw).startsWith('https://api.telegram.org')){order.push('telegram');replies.push(JSON.parse(options.body).text);return Response.json({ok:true,result:{}})}order.push('database');return Response.json({code:'PGRST205',message:'raw database internals must not be echoed'},{status:404})};
const storageFailure=await call({update_id:200,message:{...update.message,message_id:200,text:'Sang nhượng quán ăn, giá thuê 18 triệu/tháng'}});assert.equal(storageFailure.status,502);assert.equal(order[0],'telegram','receipt starts before slow database work');assert(replies.some(t=>t.includes('chưa phải xác nhận đã đăng')));assert(replies.some(t=>t.includes('004_source_inbox.sql')));assert(!replies.join('\n').includes('raw database internals'));
replies.length=0;assert.equal((await call({update_id:201,message:{...update.message,message_id:201,text:'/status'}})).status,200);assert(replies.some(t=>t.includes('Kho nguồn/hàng đợi: CÓ LỖI')));assert(replies.some(t=>t.includes('PGRST205')));
console.log('PASS: owner receives immediate pre-save receipt and actionable missing-storage error; /status probes the actual queue rather than reporting only the auto-post flag');
