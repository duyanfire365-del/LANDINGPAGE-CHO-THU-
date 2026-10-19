import assert from 'node:assert/strict';
import {draft,safePublicText} from '../lib/posts.mjs';
import {validateExtraction,fingerprint,sameProperty,processSource} from '../lib/source-automation.mjs';
assert.ok(safePublicText('Diện tích 100 m², giá 20 triệu đồng/tháng.'));assert.ok(!safePublicText('Địa chỉ 123 Lạc Long Quân'));assert.ok(!safePublicText('123 lạc long quân'));assert.ok(safePublicText('Mặt tiền: 5 m. Số tầng: 3 tầng.'));assert.ok(!safePublicText('số 123, ngõ 20'));
const text='Cho thuê văn phòng số 987 đường Lạc Long Quân, Tây Hồ, diện tích 123m2, giá thuê 32tr/tháng. #NguonTest';
const item={listingCount:1,intent:'rent',type:'Văn phòng',area:'Tây Hồ',location:'Lạc Long Quân',privateAddress:'số 987 đường Lạc Long Quân',price:32,size:123,priceEvidence:'giá thuê 32tr/tháng',sizeEvidence:'123m2'};
assert.equal(validateExtraction({...item},text).price,32);
for(const patch of [{price:999},{size:99},{privateAddress:'số 555 đường Lạc Long Quân'},{listingCount:2},{intent:'sale'},{area:'Cầu Giấy'}])assert.throws(()=>validateExtraction({...item,...patch},text),{status:422});
assert.equal(validateExtraction({...item,privateAddress:'',location:''},text).location,'Tây Hồ');assert.equal(validateExtraction({...item,location:'số 987 Lạc Long Quân'},text).location,'Tây Hồ');
assert.throws(()=>validateExtraction({...item,price:200,priceEvidence:'sang nhượng 200tr'},text+' sang nhượng 200tr'),{status:422});
assert.equal(fingerprint(item),fingerprint({...item,type:'Mặt bằng kinh doanh',price:50}));
assert.ok(sameProperty(item,{public_data:{area:'Tây Hồ',size:123},private_data:{address:'987 Lạc Long Quân'}}));
assert.ok(!sameProperty(item,{public_data:{area:'Tây Hồ',size:123},private_data:{address:'87 Lạc Long Quân'}}));
let legacy=[];const runSource=id=>processSource(id,{legacyListings:async()=>legacy});
process.env.TELEGRAM_SOURCE_MODE='ai';process.env.OPENAI_API_KEY='unit-test-key';process.env.TELEGRAM_AUTO_PUBLISH='true';process.env.SUPABASE_URL='https://db.test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test';process.env.SUPABASE_ANON_KEY='sb_publishable_test';process.env.TELEGRAM_SOURCE_BOT_TOKEN='test';process.env.TELEGRAM_SOURCE_OWNER_ID='1';
let albumRows=[],downloads=0;let source,posts=[],assets=[],fingerprints=[],imageCalls=0,chatCalls=0,failImage=false,claim=true;
const fixture=()=>({id:'11111111-1111-4111-8111-111111111111',content:text,processing_status:'received',attempts:0});
const response=data=>new Response(JSON.stringify(data),{status:200});
global.fetch=async (raw,options={})=>{
 const url=new URL(raw),body=options.body&&typeof options.body==='string'?JSON.parse(options.body):null;
 if(url.hostname==='api.telegram.org'){
  if(url.pathname.endsWith('/getFile'))return response({ok:true,result:{file_path:'photos/test.jpg',file_size:200}});
  if(url.pathname.startsWith('/file/')){downloads++;const bytes=Buffer.alloc(200);bytes[0]=255;bytes[1]=216;return new Response(bytes,{headers:{'content-length':'200'}})}
  return response({ok:true});
 }
 if(url.hostname==='api.openai.com'){
  if(url.pathname.includes('chat/completions')){chatCalls++;return response({choices:[{message:{content:JSON.stringify(item)}}]})}
  imageCalls++;if(failImage)return new Response('{}',{status:429});const bytes=Buffer.alloc(200);bytes[0]=255;bytes[1]=216;return response({data:[{b64_json:bytes.toString('base64')}]});
 }
 if(url.pathname.includes('/storage/'))return response({});
 if(url.pathname.endsWith('/rpc/claim_source_job')){if(!claim||source.processing_status==='published')return response([]);source.processing_status='processing';source.attempts++;return response([source])}
 const table=url.pathname.split('/').at(-1),method=options.method||'GET';
 if(table==='source_inbox'){
  if(url.searchParams.has('media_group_id'))return response(albumRows);
  const target=albumRows.find(r=>'eq.'+r.id===url.searchParams.get('id'))||source;
  if(method==='PATCH')Object.assign(target,body);return response([target]);
 }
 if(table==='posts'){
  if(method==='PATCH'){const row=posts.find(p=>'eq.'+p.id===url.searchParams.get('id'));Object.assign(row,body);return response([row])}
  if(method==='POST'){assert.equal(body.status,'published');posts.push({id:'post'+(posts.length+1),created_at:new Date().toISOString(),...body});return response([posts.at(-1)])}
  if(url.searchParams.has('source_inbox_id'))return response(posts.filter(p=>p.source_inbox_id===url.searchParams.get('source_inbox_id').slice(3)));
  return response(posts);
 }
 if(table==='source_fingerprints'){
  if(method==='POST'){const exists=fingerprints.find(f=>f.fingerprint===body.fingerprint);if(exists)return response([]);fingerprints.push(body);return response([body])}return response(fingerprints);
 }
 if(table==='assets'){
  if(method==='POST'){const row={id:'22222222-2222-4222-8222-'+String(assets.length+1).padStart(12,'0'),...body};assets=assets.filter(a=>a.path!==body.path);assets.push(row);return response([row])}
  const path=url.searchParams.get('path');if(path)return response(assets.filter(a=>path.startsWith('eq.')?a.path===path.slice(3):a.path.startsWith(path.slice(5).replace('*',''))));
  return response(assets);
 }
 throw Error('Unexpected request '+url);
};
source=fixture();await runSource(source.id);assert.equal(source.processing_status,'published');assert.equal(posts.length,1);assert.equal(imageCalls,1);assert.equal(chatCalls,1);assert.equal(posts[0].public_data.isIllustration,true);
const publicText=JSON.stringify(posts[0].public_data);assert.ok(!publicText.includes('987'));assert.ok(!publicText.includes('#NguonTest'));assert.equal(posts[0].private_data.sourceText,text);assert.equal(posts[0].private_data.address,item.privateAddress);assert.ok(posts[0].private_data.hashtags.includes('#NguonTest'));
await runSource(source.id);assert.equal(posts.length,1);assert.equal(imageCalls,1);
source={...fixture(),id:'33333333-3333-4333-8333-333333333333'};await runSource(source.id);assert.equal(source.processing_status,'duplicate');assert.equal(imageCalls,1);assert.equal(posts.length,1);
posts=[];assets=[];fingerprints=[];failImage=true;source=fixture();await runSource(source.id);assert.equal(source.processing_status,'failed');assert.equal(posts.length,0);
failImage=false;await runSource(source.id);assert.equal(source.processing_status,'published');assert.equal(posts.length,1);assert.equal(chatCalls,3); // extraction reused on retry
source=fixture();delete process.env.OPENAI_API_KEY;await runSource(source.id);assert.equal(source.processing_status,'blocked');
process.env.OPENAI_API_KEY='test';source={...fixture(),content:''};await runSource(source.id);assert.equal(source.processing_status,'review');
posts=[];legacy=[{slug:'legacy-unit',area:'Tây Hồ',size:123,address:item.privateAddress}];source=fixture();await runSource(source.id);assert.equal(source.processing_status,'duplicate');
claim=false;source=fixture();await runSource(source.id);assert.equal(source.processing_status,'received');
claim=true;legacy=[];posts=[];assets=[];fingerprints=[];delete process.env.OPENAI_API_KEY;process.env.TELEGRAM_SOURCE_MODE='provided';
const noApiText='Loại BĐS: Văn phòng\nĐịa chỉ: Số 987 đường Lạc Long Quân, Tây Hồ, Hà Nội\nKhu vực: Tây Hồ\nDiện tích: 123m2\nGiá thuê: 32 triệu/tháng\n#NguonTest';
source={...fixture(),content:noApiText,media:[{kind:'image',file_id:'photo1',unique_id:'photo1'}]};
const beforeAI=chatCalls+imageCalls;await runSource(source.id);assert.equal(source.processing_status,'published');assert.equal(chatCalls+imageCalls,beforeAI);assert.equal(downloads,1);assert.equal(posts[0].public_data.isIllustration,false);assert.ok(!posts[0].public_data.description.includes('tạo bằng AI'));assert.equal(posts[0].public_data.media.length,1);
posts=[];assets=[];fingerprints=[];source={...fixture(),content:noApiText,media:[]};await runSource(source.id);assert.equal(source.processing_status,'published');assert.equal(posts.length,1);assert.equal(posts[0].public_data.illustrationKind,'banner');assert.equal(chatCalls+imageCalls,beforeAI);
posts=[];assets=[];fingerprints=[];source={...fixture(),content:noApiText,chat_id:'1',media_group_id:'album1',media:[{kind:'image',file_id:'album1',unique_id:'album1'}]};
albumRows=[source,{...fixture(),id:'44444444-4444-4444-8444-444444444444',content:'',chat_id:'1',media_group_id:'album1',media:[{kind:'image',file_id:'album2',unique_id:'album2'}]}];
await runSource(source.id);assert.equal(source.processing_status,'published');assert.equal(posts[0].public_data.media.length,2);assert.equal(albumRows[1].processing_status,'grouped');assert.equal(chatCalls+imageCalls,beforeAI);
console.log('Source automation passed: verified rent/size evidence, private address checks, sale/multiple-listing rejection, dedup without image cost, publish+AI media, source privacy, retry/recovery, missing key and job-claim guards.');

albumRows=[];posts=[];assets=[];fingerprints=[];
const warehouse='🏭 THÔNG TIN KHO XƯỞNG\n✅ Diện tích: 280m²\n✅ Đất full thổ cư\n✅ Điện 3 pha\n✅ Khung xưởng chắc chắn, chiều cao khoảng 6–8m\n✅ Cốt nền chắc chắn\n✅ Có WC khép kín\n✅ Đường vào rộng, thuận tiện vận chuyển và bốc dỡ hàng hóa\n* Kho chứa hàng\n* Kho phân phối\n* Xưởng sản xuất\n* Xưởng gia công\n💰 Giá thuê: 16 triệu/tháng\n#pc';
source={...fixture(),content:warehouse,media:[]};await runSource(source.id);assert.equal(source.processing_status,'published');assert.equal(posts[0].public_data.type,'Kho xưởng');assert.equal(posts[0].public_data.size,280);assert.equal(posts[0].public_data.price,16);assert.ok(posts[0].public_data.address.includes('liên hệ để biết vị trí'));assert.ok(posts[0].public_data.description.includes('điện ba pha'));assert.ok(posts[0].public_data.description.includes('6–8 m'));assert.ok(posts[0].public_data.description.includes('kho phân phối'));assert.equal(posts[0].private_data.address,'');assert.ok(!posts[0].public_data.description.includes('#pc'));assert.equal(chatCalls+imageCalls,beforeAI);
const published=posts[0];source={...fixture(),id:'55555555-5555-4555-8555-555555555555',content:warehouse.replace('#pc','#newtag'),media:[]};await runSource(source.id);assert.equal(source.processing_status,'duplicate');assert.equal(posts.length,1);
source={...fixture(),id:'66666666-6666-4666-8666-666666666666',content:warehouse.replace('Điện 3 pha','Có cửa cuốn'),media:[]};await runSource(source.id);assert.equal(source.processing_status,'published');assert.equal(posts.length,2);
console.log('Warehouse regression passed: no address/photo/API required, facts retained, honest location, content dedup and distinct unknown-address properties kept.');

await assert.rejects(()=>draft({...item,area:'Hà Nội',title:'Kho cho thuê',location:'Liên hệ để biết vị trí',description:'Cho thuê kho.'},{admin:false,id:null},{allowGeneralLocation:true}),{status:400});

albumRows=[];posts=[];assets=[];fingerprints=[];
const unitSource='🏭 CHO THUÊ KHO XƯỞNG TRỤC CẦU BƯỚU – BỆNH VIỆN K\n📍 Vị trí: Trục Cầu Bướu, khu vực gần Bệnh viện K\n📐 Diện tích: 1.600m²\nKho đã có mái che, nhà xưởng đầy đủ, có thể vào sử dụng ngay.\n💰 Giá thuê: 110.000đ/m²/tháng (GIÁ CHỐT)\n#khoxuong #thanhtri #hadong\nH50%';
source={...fixture(),id:'77777777-7777-4777-8777-777777777777',content:unitSource,media:[{kind:'image',file_id:'unitphoto',unique_id:'unitphoto'}]};await runSource(source.id);assert.equal(source.processing_status,'published',source.processing_error);assert.equal(posts.length,1);assert.equal(posts[0].public_data.price,176);assert.equal(posts[0].public_data.pricePerM2,110000);assert.equal(posts[0].public_data.size,1600);assert.equal(posts[0].public_data.priceBasis,'per_m2');assert(posts[0].public_data.description.includes('110.000 đồng/m²/tháng'));assert(posts[0].public_data.description.includes('176 triệu'));assert(posts[0].public_data.title.includes('Cầu Bươu'));assert.equal(posts[0].public_data.media.length,1);assert.equal(chatCalls+imageCalls,beforeAI);
console.log('Per-m² Telegram regression passed: original screenshot post auto-publishes with supplied photo, 110000 VND/m², 1600 m² and 176 million/month, no paid API.');

albumRows=[];posts=[];assets=[];fingerprints=[];const contactSource=warehouse+'\nHH50%\nChủ nhà 1: 0911111111\nĐối tác 2: 0922222222\nNguồn của: Anh Hùng\nMap: https://maps.app.goo.gl/PrivatePin';source={...fixture(),id:'88888888-8888-4888-8888-888888888888',content:contactSource,media:[]};await runSource(source.id);assert.equal(source.processing_status,'published',source.processing_error);assert.equal(posts[0].private_data.sourceInfo.ownerPhones[0],'0911111111');assert.equal(posts[0].private_data.sourceInfo.partnerPhones[1],'0922222222');assert(posts[0].private_data.sourceInfo.mapUrl.includes('PrivatePin'));assert.equal(posts[0].private_data.sourceInfo.commission,'HH50%');assert(!JSON.stringify(posts[0].public_data).includes('HH50%'));assert(!JSON.stringify(posts[0].public_data).includes('0911111111'));assert(!JSON.stringify(posts[0].public_data).includes('PrivatePin'));console.log('Telegram private source sync passed: owner/partner slots, source attribution and Map saved privately, public listing remains clean.');
