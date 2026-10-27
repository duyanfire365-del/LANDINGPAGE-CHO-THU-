import {createHash,randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {db,problem} from './platform.mjs';
import {draft} from './posts.mjs';
import {trustedDraft} from './trusted-intake.mjs';
import {listings} from '../api/admin.mjs';
import {canonicalizeSubset} from './listing-catalog.mjs';
import {sameProperty,fingerprint,sourceSignature} from './source-automation.mjs';
import {sourceControl} from './source-command.mjs';
import {extractRentPricing} from './source-pricing.mjs';
import {sourceReply} from './source-bot-health.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const uuid=hex=>hex.slice(0,8)+'-'+hex.slice(8,12)+'-4'+hex.slice(13,16)+'-a'+hex.slice(17,20)+'-'+hex.slice(20,32);
const namespace='nguonchothue-publishing-v1:';
export function requestKey(value){if(typeof value!=='string'||!/^[a-zA-Z0-9._:-]{8,128}$/.test(value))throw problem(400,'Mã lượt nhập cần 8–128 ký tự chữ, số, dấu chấm, gạch hoặc hai chấm.');return value}
const jobId=value=>uuid(hash(namespace+requestKey(value)));
const jobMeta=row=>row.parsed_data?._publishing||{};
async function readJob(key){return (await db('source_inbox',{query:'?id=eq.'+jobId(key)+'&limit=1'}))[0]}
async function patchJob(row,body,query=''){return db('source_inbox',{method:'PATCH',query:'?id=eq.'+row.id+query,body})}
export function jobResult(row){const meta=jobMeta(row);return {id:row.id,requestId:meta.requestId,status:row.processing_status,published:row.processing_status==='published',href:row.result_url||null,error:row.processing_error||'',telegramSent:meta.notice?.sent===true,notificationPending:!!meta.notice&&!meta.notice.sent,matches:meta.matches||[],retryAfter:row.processing_status==='importing'?5:undefined}}
export async function publishingStatus(key){const row=await readJob(key);if(!row||!jobMeta(row).requestId)throw problem(404,'Không tìm thấy lượt nhập.');return jobResult(row)}
async function telegram(method,body){const token=process.env.TELEGRAM_SOURCE_BOT_TOKEN?.trim();if(!token)throw problem(503,'Bot nhận nguồn chưa có cấu hình.');const response=await fetch('https://api.telegram.org/bot'+token+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)}),data=await response.json();if(!response.ok||!data.ok)throw Object.assign(Error('Telegram rejected notice'),{telegramCode:data.error_code||response.status,retryAfter:data.parameters?.retry_after});return data.result}
async function notify(row,text){
 const fresh=await readJob(jobMeta(row).requestId)||row,meta={...jobMeta(fresh)},prior=meta.notice;row.parsed_data=fresh.parsed_data;
 if(prior?.text===text&&prior.sent){row.parsed_data=fresh.parsed_data;return true}
 if(prior?.claim&&Date.now()-Date.parse(prior.claimedAt)<120000)return false;
 const claim=randomUUID(),next={...meta,notice:{id:hash(text),text,sent:false,claim,claimedAt:new Date().toISOString()}};
 const condition='&parsed_data->_publishing->notice->>id='+(prior?.id?'eq.'+prior.id:'is.null')+'&parsed_data->_publishing->notice->>claim='+(prior?.claim?'eq.'+prior.claim:'is.null');
 const changed=await patchJob(fresh,{parsed_data:{...fresh.parsed_data,_publishing:next}},condition);
 if(!changed.length){const current=await readJob(jobMeta(row).requestId);if(current)row.parsed_data=current.parsed_data;return jobMeta(row).notice?.sent===true}
 row.parsed_data=changed[0].parsed_data;
 const sent=await sourceReply(telegram,text);next.notice={...next.notice,sent,claim:null,claimedAt:null};
 const saved=await patchJob(row,{parsed_data:{...row.parsed_data,_publishing:next}},'&parsed_data->_publishing->notice->>claim=eq.'+claim);
 if(saved[0])row.parsed_data=saved[0].parsed_data;return sent;
}
export async function retryPublishingNotice(key){const row=await readJob(key);if(!row||!jobMeta(row).requestId)throw problem(404,'Không tìm thấy lượt nhập.');const notice=jobMeta(row).notice;if(notice&&!notice.sent)await notify(row,notice.text);return jobResult(row)}
export async function uploadPublishingImage(body){
 if(typeof body.base64!=='string'||body.base64.length>1400000||!/^[A-Za-z0-9+/\r\n]*={0,2}$/.test(body.base64))throw problem(400,'Ảnh mã hóa tối đa khoảng 1 MB.');
 const input=Buffer.from(body.base64,'base64'),meta=await sharp(input,{limitInputPixels:12000000}).metadata();if(!['jpeg','png','webp'].includes(meta.format)||meta.width<320||meta.height<240)throw problem(400,'Ảnh cần JPEG, PNG hoặc WebP, tối thiểu 320 × 240.');
 const bytes=await sharp(input,{limitInputPixels:12000000}).rotate().resize({width:1536,height:1536,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:88}).toBuffer();
 const digest=hash(bytes),illustration=body.illustration===true,path=(illustration?'editor-ai/publishing/':'publishing/source/')+digest+'.jpg';
 const existing=await db('assets',{query:'?path=eq.'+encodeURIComponent(path)+'&limit=1'});if(existing[0])return {asset:existing[0],reused:true};
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY,base=process.env.SUPABASE_URL?.replace(/\/$/,'');if(!key||!base)throw problem(503,'Chưa kết nối kho ảnh.');
 const result=await fetch(base+'/storage/v1/object/rental-private/'+path,{method:'POST',headers:{apikey:key,...(key.startsWith('sb_')?{}:{Authorization:'Bearer '+key}),'Content-Type':'image/jpeg','x-upsert':'true'},body:bytes,signal:AbortSignal.timeout(20000)});if(!result.ok)throw problem(502,'Chưa xác nhận lưu ảnh.');
 const asset={id:uuid(hash(path)),owner_id:null,path,name:illustration?'anh-minh-hoa-ai.jpg':'anh-nguon.jpg',mime:'image/jpeg',kind:'image',size:bytes.length};
 try{return {asset:(await db('assets',{method:'POST',body:asset}))[0],reused:false}}catch(error){if(error.databaseCode!=='23505')throw error;const row=(await db('assets',{query:'?path=eq.'+encodeURIComponent(path)+'&limit=1'}))[0];if(!row)throw error;return {asset:row,reused:true}}
}
export async function preparePublishing(body,{automation=false,legacyListings=listings}={}){
 const text=String(body.text||'').trim();if(text.length<15||text.length>16000||sourceControl(text))throw problem(422,'Gửi nội dung BĐS đầy đủ; lệnh điều khiển không phải bài đăng.');
 const assetIds=Array.isArray(body.assetIds)?[...new Set(body.assetIds)]:[];
 if(automation&&assetIds.length){const assets=await db('assets',{query:'?id=in.('+assetIds.map(id=>{if(!/^[a-f0-9-]{36}$/i.test(id))throw problem(400,'Mã ảnh không hợp lệ.');return id}).join(',')+')'});if(assets.length!==assetIds.length||assets.some(a=>a.owner_id||!a.path?.match(/^(?:editor-ai\/(?:publishing|uploads-20261027)\/|publishing\/source\/)/)))throw problem(403,'Chỉ gắn ảnh thuộc luồng nhập tự động.');}
 const record=body.fields?await draft({...body.fields,originalText:text,assetIds},{admin:true,id:null},{allowGeneralLocation:true}):await trustedDraft({text,assetIds});
 const p=record.public_data;if(p.price==null&&p.size==null&&!record.private_data.address)throw problem(422,'Chưa nhận diện được thông tin BĐS; giữ nguồn để kiểm tra, không đăng bài trống.');
 if(body.fields?.privateAddress&&!sourceSignature(text).includes(sourceSignature(body.fields.privateAddress)))throw problem(422,'Địa chỉ riêng chưa khớp bài nguồn.');
 if(body.fields){const parsed=extractRentPricing(text,{allowIncomplete:true,allowUncertain:true});for(const field of ['price','size'])if(p[field]!=null){let verified=parsed[field];if(verified==null){const quote=body.fields[field+'Evidence'];if(typeof quote!=='string'||!quote.trim()||!text.includes(quote))throw problem(422,'Cần trích dẫn dữ liệu gốc khi giá/diện tích có nhiều phương án.');verified=extractRentPricing(quote,{allowIncomplete:true,allowUncertain:true})[field];}if(verified==null||Math.abs(Number(verified)-Number(p[field]))>.000001)throw problem(422,'Giá/diện tích chưa khớp bài nguồn; không tự đăng sai dữ liệu.');}}
 record.private_data.sourceText=text;record.private_data.originalText=text;
 const item={area:p.area,size:p.size,price:p.price,transferPrice:p.transferPrice,privateAddress:record.private_data.address,sourceText:text};
 const original=await legacyListings(),staticRows=original.map(x=>({public_data:x,private_data:{address:x.address,sourceInfo:x.sourceInfo||{}}}));
 let match=staticRows.find(x=>sameProperty(item,x));
 for(let offset=0;!match;offset+=500){if(offset>=25000)throw problem(503,'Kho tin quá lớn để kiểm tra hết trong lượt này.');const rows=await db('posts',{query:'?status=eq.published&select=id,public_data,private_data&order=id.asc&limit=500&offset='+offset});match=rows.find(x=>sameProperty(item,x)||sourceSignature(text)===sourceSignature(x.private_data?.sourceText||'')&&!!x.private_data?.sourceText);if(rows.length<500)break;}
 return {record,item,match};
}
function matchSummary(match,record){const old=match.public_data,now=record.public_data,oldInfo=match.private_data?.sourceInfo||{},next=record.private_data.sourceInfo||{};const phones=i=>(i.ownerPhones||[]).filter(Boolean).map(p=>p.replace(/\D/g,''));const a=phones(oldInfo),b=phones(next);return {code:old.code||'',title:old.title||'',href:old.href||'/bds/'+old.slug,oldRent:old.price??null,newRent:now.price??null,oldTransfer:old.transferPrice??null,newTransfer:now.transferPrice??null,rentNeedsReview:old.price!==now.price,transferNeedsReview:(old.transferPrice??null)!==(now.transferPrice??null),ownerContactNeedsReview:!!(a.length&&b.length&&a.join('|')!==b.join('|')),sourceNeedsReview:!!(oldInfo.sourceName&&next.sourceName&&oldInfo.sourceName!==next.sourceName),ownerVerified:!!(a.length&&b.length)} }
export async function publishContinuously(body,options={}){
 const requestId=requestKey(body.requestId),text=String(body.text||'').trim();if(text.length<15||text.length>16000||sourceControl(text))throw problem(422,'Nội dung này không phải bài BĐS.');
 const payloadHash=hash(JSON.stringify({text,fields:body.fields||null,assetIds:[...(body.assetIds||[])].sort()}));
 let row=await readJob(requestId);
 if(row&&jobMeta(row).payloadHash!==payloadHash)throw problem(409,'Mã lượt nhập đã dùng cho nội dung khác.');
 if(row?.processing_status==='published'||row?.processing_status==='review'&&jobMeta(row).matches?.length){const notice=jobMeta(row).notice;if(!notice?.sent){const text=notice?.text||(row.processing_status==='published'?'Bài đã được lưu trên website.':'Nguồn trùng đã được giữ lại để kiểm tra; không đăng thêm.')+(row.result_url?'\nhttps://nguonchothue.vn'+row.result_url:'');await notify(row,text)}return {...jobResult(row),reused:true}}
 if(!row){const h=hash(namespace+requestId),number=-parseInt(h.slice(0,12),16);const entry={id:jobId(requestId),update_id:number,message_id:number,chat_id:process.env.TELEGRAM_SOURCE_OWNER_ID?.trim()||'publishing',content:text,media:[],content_hash:hash(namespace+requestId+payloadHash),processing_status:'import_ready',parsed_data:{_publishing:{version:1,requestId,payloadHash,input:{fields:body.fields||null,assetIds:body.assetIds||[]}}}};try{row=(await db('source_inbox',{method:'POST',body:entry}))[0]}catch(error){if(error.databaseCode!=='23505')throw error;row=await readJob(requestId);if(!row)throw error;}}
 if(jobMeta(row).payloadHash!==payloadHash)throw problem(409,'Mã lượt nhập đã dùng cho nội dung khác.');
 const started=row.processing_started_at;if(row.processing_status==='importing'&&Date.now()-Date.parse(started)<600000)return jobResult(row);
 const claimed=await patchJob(row,{processing_status:'importing',processing_started_at:new Date().toISOString(),attempts:(row.attempts||0)+1},'&processing_status=eq.'+row.processing_status+'&attempts=eq.'+(row.attempts||0)+(started?'&processing_started_at=eq.'+encodeURIComponent(started):''));
 if(!claimed.length)return {...jobResult(await readJob(requestId)),retryAfter:5};row=claimed[0];
 try{
  const existing=(await db('posts',{query:'?source_inbox_id=eq.'+row.id+'&limit=1'}))[0];
  if(existing){await patchJob(row,{processing_status:'published',result_url:existing.public_data.href,processing_error:''});row.processing_status='published';row.result_url=existing.public_data.href;await notify(row,'Đã xác nhận bài đăng: '+existing.public_data.title+'\nhttps://nguonchothue.vn'+row.result_url);return jobResult(row)}
  const {record,item,match}=await preparePublishing(body,options);
  if(match){const comparison=matchSummary(match,record),meta={...jobMeta(row),matches:[comparison]};row.parsed_data={...row.parsed_data,_publishing:meta};row.processing_status='review';row.result_url=comparison.href;row.processing_error='Tin đã có trong kho; không đăng lặp hoặc ghi đè. Kiểm tra giá và nguồn liên hệ.';await patchJob(row,{processing_status:row.processing_status,result_url:row.result_url,processing_error:row.processing_error,parsed_data:row.parsed_data});const money=n=>n==null?'chưa rõ':n+' triệu';await notify(row,'TIN ĐÃ CÓ — KHÔNG ĐĂNG LẶP\n'+comparison.code+' '+comparison.title+'\nThuê cũ / mới: '+money(comparison.oldRent)+' / '+money(comparison.newRent)+' mỗi tháng.\nSang nhượng cũ / mới: '+money(comparison.oldTransfer)+' / '+money(comparison.newTransfer)+'.\n'+(comparison.ownerContactNeedsReview?'Số liên hệ chủ khác: cần kiểm tra.\n':'')+(comparison.sourceNeedsReview?'Tên nguồn khác: cần kiểm tra.\n':'')+(!comparison.ownerVerified?'Chưa đủ số liên hệ để kết luận đổi chủ.\n':'')+'https://nguonchothue.vn'+comparison.href);return jobResult(row)}
  const key=fingerprint(item),reserved=await db('source_fingerprints',{method:'POST',query:'?on_conflict=fingerprint',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{fingerprint:key,source_id:row.id}});
  if(!reserved.length){const owner=(await db('source_fingerprints',{query:'?fingerprint=eq.'+key}))[0];if(owner?.source_id!==row.id){row.processing_status='review';row.processing_error='Một nguồn cùng BĐS đang hoặc đã được xử lý. Không đăng thêm khi chưa đối chiếu.';await patchJob(row,{processing_status:'review',processing_error:row.processing_error});await notify(row,row.processing_error);return jobResult(row)}}
  record.status='published';record.source_inbox_id=row.id;record.reviewed_at=new Date().toISOString();record.private_data.publishing={requestId,payloadHash};record.public_data.titleMode='custom';
  const slug=record.public_data.slug;for(const field of ['image','shareImage'])if(record.public_data[field]?.startsWith('/api/files?'))record.public_data[field]+='&post='+encodeURIComponent(slug);
  const saved=await db('posts',{method:'POST',query:'?on_conflict=source_inbox_id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:record});const post=saved[0]||(await db('posts',{query:'?source_inbox_id=eq.'+row.id}))[0];if(!post)throw problem(502,'Chưa xác nhận lưu bài.');
  const canonical=(await canonicalizeSubset([post]))[0]||post;await db('posts',{method:'PATCH',query:'?id=eq.'+post.id,body:{public_data:canonical.public_data}});
  row.processing_status='published';row.result_url=canonical.public_data.href;await patchJob(row,{processing_status:'published',result_url:row.result_url,processing_error:'',processed_at:new Date().toISOString()});
  await notify(row,'ĐÃ ĐĂNG '+canonical.public_data.code+'\n'+canonical.public_data.title+'\nhttps://nguonchothue.vn'+row.result_url);return jobResult(row);
 }catch(error){const current=(await db('posts',{query:'?source_inbox_id=eq.'+row.id+'&limit=1'}).catch(()=>[]))[0];if(current){await patchJob(row,{processing_status:'published',result_url:current.public_data.href,processing_error:'Bài đã lưu; cần kiểm tra phản hồi/thông báo.'});return jobResult(await readJob(requestId))}row.processing_status='import_failed';row.processing_error=error.status?error.message:'Lượt nhập bị gián đoạn; gửi lại cùng mã để tiếp tục.';await patchJob(row,{processing_status:row.processing_status,processing_error:row.processing_error}).catch(()=>{});await notify(row,'NGUỒN CHƯA ĐĂNG\nMã lượt: '+requestId+'\n'+row.processing_error).catch(()=>{});throw error}
}

export async function retryPendingPublishingNotices(limit=5){const rows=await db('source_inbox',{query:'?parsed_data->_publishing->notice->>sent=eq.false&order=created_at.asc&limit='+Math.min(5,Math.max(1,limit))});let sent=0;for(const row of rows){const meta=jobMeta(row);if(meta.requestId&&meta.notice?.text&&!meta.notice.sent&&await notify(row,meta.notice.text))sent++;}return {checked:rows.length,sent}}
