import assert from 'node:assert/strict';
import {previewApify,importApify} from '../lib/apify-import.mjs';
const post={ok:true,recordType:'post',url:'https://www.facebook.com/groups/123/posts/456/?ref=share',facebookUrl:'https://www.facebook.com/groups/123/',text:'Cho thuê kho Hà Đông. Diện tích: 200m². Giá thuê: 12 triệu/tháng. LH 0912345678',user:{name:'Test',profileUrl:'https://www.facebook.com/test'},time:'2026-10-29T10:00:00Z',topComments:[]};
const a=previewApify([{ok:false,recordType:'diagnostic',code:'COMMENTS_SOON'},post,{...post,url:'https://www.facebook.com/groups/123/posts/457/',text:'Bán đất giá bán 8 triệu/m²'}, {...post,url:'https://evil.example/post'}]);
assert.equal(a.items.length,1);assert.equal(a.diagnostics[0].code,'COMMENTS_SOON');assert.equal(a.skipped.length,2);assert.equal(a.items[0].rent,12);assert.equal(a.items[0].size,200);assert.equal(a.items[0].phone,'0912345678');assert.equal(previewApify([post,post]).items.length,1);
assert.equal(previewApify([{...post,text:'',sharedPostText:post.text}]).items.length,1);
assert.equal(previewApify([{...post,text:'Cho thuê kho 200m² giá 70k/m²'}]).items[0].rent,null);
assert.equal(previewApify([{...post,text:'Kho xưởng 333m² chỉ 18 triệu/tháng'}]).items.length,1);
assert.equal(previewApify([{...post,text:'Cần thuê kho 200m², ngân sách 12 triệu/tháng'}]).items[0].kind,'tenant');
assert.throws(()=>previewApify('{}'),{status:400});
process.env.SUPABASE_URL='https://fake.test';process.env.SUPABASE_ANON_KEY='test';process.env.SUPABASE_SERVICE_ROLE_KEY='test';const original=fetch,seen=new Set();global.fetch=async(url,o)=>{const records=JSON.parse(o.body);let out=[];for(const r of [].concat(records)){if(!r.id||!seen.has(r.id)){out.push(r);if(r.id)seen.add(r.id)}}return Response.json(out)};
try{assert.equal((await importApify([post])).added,1);assert.equal((await importApify([post])).added,0)}finally{global.fetch=original}
console.log('PASS Apify import: diagnostics, sale rejection, shared text, author/source, units, missing content, canonical link deduplication and repeat persistence.');
