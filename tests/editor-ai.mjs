import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {prepareEditorText,createEditorImage} from '../lib/editor-ai.mjs';
import {draft} from '../lib/posts.mjs';
const originalFetch=globalThis.fetch;
for(const key of ['OPENAI_API_KEY','OPENROUTER_API_KEY','AI_PROVIDER'])delete process.env[key];
const text='Cho thuê mặt bằng 70m² Triều Khúc, giá 12 triệu/tháng\nĐịa chỉ: 12 ngõ 62 Triều Khúc\nGiá thuê 12tr/tháng\nChủ nhà 1: 0911111111\nNguồn của: Anh Hùng\nHH50%\n#NguonRieng';
const base=await prepareEditorText(text);assert.equal(base.source,'rules');assert.equal(base.item.price,12);assert.equal(base.item.size,70);assert.equal(base.item.area,'Thanh Trì');assert.equal(base.item.location,'Triều Khúc');assert(base.item.privateAddress.includes('12 ngõ 62'));assert.equal(base.item.sourceInfo.ownerPhones[0],'0911111111');assert(!base.item.description.includes('0911111111'));assert(!base.item.description.includes('HH50%'));
const missingPrice=await prepareEditorText('Cho thuê văn phòng Cầu Giấy diện tích 80m2');assert.equal(missingPrice.item.size,80);assert.equal(missingPrice.item.price,null);assert(missingPrice.warnings.some(w=>w.includes('giá thuê')));
const missingSize=await prepareEditorText('Cho thuê văn phòng Cầu Giấy giá thuê 12tr/tháng');assert.equal(missingSize.item.size,null);assert.equal(missingSize.item.price,12);
await assert.rejects(createEditorImage({type:'Văn phòng'}, {id:randomUUID()}),{status:503});
process.env.OPENAI_API_KEY='unit-key';process.env.SUPABASE_URL='https://editor-db.test';process.env.SUPABASE_SERVICE_ROLE_KEY='test-secret';process.env.SUPABASE_ANON_KEY='test-public';
const owner=randomUUID(),assets=[],jpeg=await sharp({create:{width:200,height:100,channels:3,background:'beige'}}).jpeg().toBuffer();let imageCalls=0,badText=false;
globalThis.fetch=async(value,options={})=>{const u=new URL(value),body=typeof options.body==='string'?JSON.parse(options.body):null,json=data=>new Response(JSON.stringify(data));
 if(u.origin==='https://api.openai.com'){
  if(u.pathname.endsWith('/chat/completions'))return json({choices:[{message:{content:JSON.stringify(badText?{title:'Cho thuê số 12 ngõ 62 Triều Khúc',description:'Gọi 0911111111, HH50%'}:{title:'Cho thuê mặt bằng tại Triều Khúc',description:'Mặt bằng 70 m², giá thuê 12 triệu đồng/tháng. Liên hệ để hẹn xem thực tế.'})}}]});
  assert(u.pathname.endsWith('/images/generations'));imageCalls++;assert(body.prompt.includes('restaurant / dining space'));for(const secret of ['12 ngõ 62','0911111111','HH50%','INJECTED'])assert(!body.prompt.includes(secret));return json({data:[{b64_json:jpeg.toString('base64')}]});
 }
 assert.equal(u.origin,'https://editor-db.test');if(u.pathname.includes('/storage/')){assert(Buffer.isBuffer(options.body));return json({})}
 assert(u.pathname.endsWith('/assets'));if(options.method==='POST'){const asset={id:randomUUID(),...body};assets.push(asset);return json([asset])}
 const path=u.searchParams.get('path'),ids=u.searchParams.get('id');return json(assets.filter(a=>path?a.path===path.slice(3):ids?ids.slice(4,-1).split(',').includes(a.id):true));
};
try{
 const rewritten=await prepareEditorText(text);assert.equal(rewritten.source,'ai');assert(rewritten.item.description.includes('hẹn xem'));assert.equal(rewritten.item.price,12);badText=true;assert.equal((await prepareEditorText(text)).source,'rules','private AI output falls back to a safe draft');
 const requestId=randomUUID(),body={type:'Mặt bằng kinh doanh',description:'Quán ăn. INJECTED 12 ngõ 62, 0911111111 HH50%',requestId},image=await createEditorImage(body,{id:owner});assert.equal(image.asset.owner_id,owner);assert(image.asset.path.startsWith('editor-ai/'+owner+'/'));assert.equal((await createEditorImage(body,{id:owner})).asset.id,image.asset.id);assert.equal(imageCalls,1,'retry reuses persisted image');
 const prepared=await draft({...base.item,originalText:text,assetIds:[image.asset.id]}, {admin:false,id:owner});assert.equal(prepared.status,'pending');assert.equal(prepared.private_data.sourceText,text);assert.equal(prepared.public_data.media[0].id,image.asset.id);assert.equal(prepared.public_data.media[0].isIllustration,true);assert.equal(prepared.public_data.isIllustration,true);assert(prepared.public_data.notes.some(n=>n.includes('không phải ảnh chụp thực tế')));assert.equal(prepared.private_data.sourceInfo.ownerPhones[0],'0911111111');
 await assert.rejects(draft({...base.item,originalText:text,assetIds:[image.asset.id]}, {admin:false,id:randomUUID()}),{status:403});
 console.log('PASS: original text -> rewritten public draft, partial fields, verified prices, private source separation, AI fallback, real image bytes, attached illustration labels, reuse and asset ownership');
}finally{globalThis.fetch=originalFetch}
