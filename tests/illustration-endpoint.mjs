import assert from 'node:assert/strict';
import sharp from 'sharp';
import jsQR from 'jsqr';
process.env.SUPABASE_URL='https://library.test';process.env.SUPABASE_ANON_KEY='sb_publishable_test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test';
const row={id:'00000000-0000-4000-8000-000000000001',status:'published',created_at:'2026-10-28',public_data:{type:'Mặt bằng kinh doanh',slug:'live-1793180000000',code:'MB - 0100',listingSequence:100,codeMode:'manual',title:'Mặt bằng kinh doanh',description:'Phù hợp cà phê.',image:'/banners/mb.png',media:[]},private_data:{}};
let requests=0;
global.fetch=async url=>{requests++;const u=new URL(url);assert.equal(u.hostname,'library.test','Never call a paid AI service');return Response.json(u.pathname.endsWith('/posts')?[row]:[])};
const {default:handler}=await import('../api/illustration.mjs');
async function run(url,method='GET'){const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(body){this.body=body}};await handler({url,method},res);return res}
assert.equal((await run('/api/illustration?slug=../../secret')).status,400);
assert.equal((await run('/api/illustration?slug=live-1793180000000','POST')).status,405);
let r=await run('/api/illustration?slug=live-1793180000000');assert.equal(r.status,200);assert.equal(r.headers['Content-Type'],'image/jpeg');assert(r.headers['Cache-Control'].includes('s-maxage'));
const {data,info}=await sharp(r.body).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,1200);assert.equal(info.height,800);assert.equal(jsQR(new Uint8ClampedArray(data),info.width,info.height)?.data,'https://zalo.me/0906215365');
row.status='draft';assert.equal((await run('/api/illustration?slug=live-1793180000000')).status,404);row.status='published';row.public_data.media=[{kind:'image',id:'photo'}];assert.equal((await run('/api/illustration?slug=live-1793180000000')).status,404);
console.log('PASS illustration endpoint: published fallback-only access, method/path checks, JPEG1200x800, readable QR, CDN cache, zero paid AI calls.');
