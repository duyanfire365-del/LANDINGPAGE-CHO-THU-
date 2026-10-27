import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {publishContinuously,preparePublishing,publishingStatus,retryPendingPublishingNotices,uploadPublishingImage} from '../lib/publishing.mjs';
import handler from '../api/publishing.mjs';
import sharp from 'sharp';
process.env.SUPABASE_URL='https://publishing.test';process.env.SUPABASE_ANON_KEY='sb_publishable_test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test';process.env.TELEGRAM_SOURCE_BOT_TOKEN='123456789:'+ 'x'.repeat(35);process.env.TELEGRAM_SOURCE_OWNER_ID='123';process.env.PUBLISHING_AUTOMATION_KEY='k'.repeat(43);
const jobs=[],posts=[],assets=[],fingerprints=[],notices=[];let requests=0,telegramFail=false,uploads=0;const sent=[];
global.fetch=async(raw,options={})=>{
 const url=new URL(raw),body=options.body&&typeof options.body==='string'?JSON.parse(options.body):null;requests++;
 if(url.hostname==='api.telegram.org'){sent.push(body.text);return Response.json(telegramFail?{ok:false,error_code:403}:{ok:true,result:{message_id:sent.length}})}
 if(url.pathname.startsWith('/storage/')){uploads++;return Response.json({Key:'ok'})}
 const table=url.pathname.split('/').at(-1),rows={source_inbox:jobs,posts,assets,source_fingerprints:fingerprints,notification_log:notices}[table];assert(rows,'Unexpected table '+table);
 let found=rows.filter(row=>{
  for(const key of ['id','status','processing_status','attempts','processing_started_at','source_inbox_id','content_hash','path','fingerprint']){
   const rule=url.searchParams.get(key);if(!rule)continue;
   if(rule.startsWith('eq.')&&String(row[key])!==rule.slice(3))return false;
   if(rule.startsWith('in.(')&&!rule.slice(4,-1).split(',').includes(String(row[key])))return false;
  }
  for(const field of ['id','claim']){const filter=url.searchParams.get('parsed_data->_publishing->notice->>'+field);const value=row.parsed_data?._publishing?.notice?.[field];if(filter==='is.null'&&value!=null)return false;if(filter?.startsWith('eq.')&&String(value)!==filter.slice(3))return false;}
  if(url.searchParams.has('parsed_data->_publishing->notice->>sent')&&row.parsed_data?._publishing?.notice?.sent!==false)return false;
  return true;
 });
 if(options.method==='POST'){
  let existing=table==='source_inbox'?rows.find(r=>r.id===body.id):table==='posts'?rows.find(r=>r.source_inbox_id===body.source_inbox_id):table==='source_fingerprints'?rows.find(r=>r.fingerprint===body.fingerprint):table==='assets'?rows.find(r=>r.path===body.path):null;
  if(existing){if(options.headers?.Prefer?.includes('ignore-duplicates'))return Response.json([]);return Response.json({code:'23505'},{status:409})}
  const row={id:randomUUID(),attempts:0,processing_started_at:null,created_at:new Date().toISOString(),...structuredClone(body)};rows.push(row);return Response.json([structuredClone(row)]);
 }
 if(options.method==='PATCH'){for(const row of found)Object.assign(row,structuredClone(body));return Response.json(structuredClone(found))}
 const offset=Number(url.searchParams.get('offset')||0),limit=Number(url.searchParams.get('limit')||500);return Response.json(structuredClone(found.slice(offset,offset+limit)));
};
const source='Cho thuê mặt bằng Trung Kính, Cầu Giấy\nĐịa chỉ: Số 12 Trung Kính, Cầu Giấy, Hà Nội\nDiện tích: 80 m²\nGiá thuê: 30 triệu/tháng\nSĐT chủ nhà 1: 0987654321';
const fields={title:'Mặt bằng Trung Kính — 80 m², 30 triệu/tháng',location:'Trung Kính',area:'Cầu Giấy',type:'Mặt bằng kinh doanh',size:80,price:30,description:'Mặt bằng tại Trung Kính, Cầu Giấy. Diện tích 80 m², giá thuê 30 triệu đồng/tháng. Liên hệ để xác nhận hiện trạng và đặt lịch xem.',privateAddress:'Số 12 Trung Kính, Cầu Giấy, Hà Nội',sourceInfo:{ownerPhones:['0987654321','',''],ownerPublic:[false,false,false]}};
const input={requestId:'test-publishing-0001',text:source,fields,assetIds:[]},options={automation:true,legacyListings:async()=>[]};
async function call(body,{key='Bearer '+process.env.PUBLISHING_AUTOMATION_KEY,method='POST',origin}={}){let status,payload;await handler({method,url:'/api/publishing',headers:{authorization:key,'content-type':'application/json',host:'nguonchothue.vn',...(origin?{origin}:{})},body},{writeHead(s){status=s},end(value){payload=JSON.parse(value)}});return {status,payload}}
const before=requests;assert.equal((await call({action:'health'},{key:''})).status,401);assert.equal((await call({action:'health'},{key:'Bearer wrong'})).status,401);assert.equal((await call({action:'health'},{method:'GET'})).status,405);assert.equal((await call({action:'health'},{origin:'https://attacker.test'})).status,403);assert.equal(requests,before,'invalid auth/origin never reads or writes services');
const health=await call({action:'health'});assert.equal(health.payload.permanent,true);assert.equal(health.payload.expiresAt,null);assert(!JSON.stringify(health).includes(process.env.PUBLISHING_AUTOMATION_KEY));assert.equal((await call({action:'delete-post'})).status,400);
await assert.rejects(()=>publishContinuously({...input,text:'/status'},options));assert.equal(posts.length,0);assert.equal(jobs.length,0);
await assert.rejects(()=>preparePublishing({...input,fields:{...fields,price:99}},options),/khớp/);assert.equal(posts.length,0);
telegramFail=true;const first=await publishContinuously(input,options);assert.equal(first.status,'published');assert.equal(first.notificationPending,true);assert.equal(posts.length,1);assert.equal(jobs.length,1);assert.equal(posts[0].private_data.sourceText,source);assert(!JSON.stringify(posts[0].public_data).includes('0987654321'));assert(!JSON.stringify(posts[0].public_data).includes('Số 12'));
telegramFail=false;const replay=await publishContinuously(input,options);assert.equal(replay.reused,true);assert.equal(replay.telegramSent,true);assert.equal(posts.length,1);const sentCount=sent.length;await publishContinuously(input,options);assert.equal(sent.length,sentCount,'completed requests do not repeat notifications');
await assert.rejects(()=>publishContinuously({...input,text:source.replace('30 triệu','31 triệu')},options),/nội dung khác/);
const changed={...input,requestId:'test-publishing-0002',text:source.replace('30 triệu','35 triệu'),fields:{...fields,price:35,sourceInfo:{ownerPhones:['0912345678','','']}}};const duplicate=await publishContinuously(changed,options);assert.equal(duplicate.status,'review');assert.equal(posts.length,1);assert.equal(posts[0].public_data.price,30);assert.equal(duplicate.matches[0].rentNeedsReview,true);assert.equal(duplicate.matches[0].ownerContactNeedsReview,true);assert(sent.at(-1).includes('Số liên hệ chủ khác'));
const raced=await Promise.all([publishContinuously({...input,requestId:'race-publishing-0001',text:source.replaceAll('Trung Kính','Xuân Thủy'),fields:{...fields,title:'Mặt bằng Xuân Thủy',location:'Xuân Thủy',privateAddress:'Số 12 Xuân Thủy, Cầu Giấy, Hà Nội'}},options),publishContinuously({...input,requestId:'race-publishing-0002',text:source.replaceAll('Trung Kính','Xuân Thủy'),fields:{...fields,title:'Mặt bằng Xuân Thủy',location:'Xuân Thủy',privateAddress:'Số 12 Xuân Thủy, Cầu Giấy, Hà Nội'}},options)]);assert.equal(posts.length,2,'two concurrent request IDs for the same property create only one new post');assert(raced.some(r=>r.status==='review'));
const jpg=await sharp({create:{width:640,height:480,channels:3,background:'#b9a18b'}}).jpeg().toBuffer();const one=await uploadPublishingImage({base64:jpg.toString('base64'),illustration:true});const two=await uploadPublishingImage({base64:jpg.toString('base64'),illustration:true});assert.equal(one.asset.id,two.asset.id);assert.equal(uploads,1);assert(one.asset.path.startsWith('editor-ai/publishing/'));
assets.push({id:randomUUID(),path:'other-owner/private.jpg',owner_id:'another-owner',kind:'image',mime:'image/jpeg'});await assert.rejects(()=>preparePublishing({...input,assetIds:[assets.at(-1).id]},options),/luồng nhập/);
const status=await publishingStatus(input.requestId);assert.equal(status.published,true);assert(!JSON.stringify(status).includes('0987654321'));assert(!JSON.stringify(status).includes(source));
const pending=jobs.find(j=>j.id===first.id);pending.parsed_data._publishing.notice.sent=false;const previous=sent.length;await Promise.all([retryPendingPublishingNotices(),retryPendingPublishingNotices()]);assert.equal(pending.parsed_data._publishing.notice.sent,true);assert.equal(sent.length,previous+1,'concurrent outbox workers claim the notice once');
console.log('PASS: permanent auth and restricted actions; privacy/evidence guards; request replay and conflicting-payload rejection; concurrent dedup; changed rent/owner review; durable Telegram retry; content-addressed AI uploads; foreign-asset rejection.');
