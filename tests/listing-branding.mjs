import jsQR from 'jsqr';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {categoryPrefixes,standardizeListing,standardizeRows} from '../lib/listing-identity.mjs';
import {watermarkImage} from '../lib/image-branding.mjs';
import filesHandler from '../api/files.mjs';
const all=JSON.parse(await readFile('public/listings.json','utf8'));
assert.equal(new Set(all.map(p=>p.code)).size,30);
for(const p of all){assert.match(p.code,/^[A-Z]+ - \d{4,}$/);assert.ok(p.title.includes(String(p.size).replace('.',',')+' m²'));assert.ok(p.title.includes(p.area));assert.ok(p.legacyCodes.some(code=>/^HN-\d{3}$/.test(code)));assert.ok(!/(?:số|ngõ|ngách)\s*\d|#/.test(p.title));}
for(const [type,prefix] of Object.entries(categoryPrefixes))assert.equal(standardizeListing({type,size:280,areaText:'280 m²',address:'Xóm Trại, Chương Mỹ, Hà Nội'},1).code,prefix+' - 0001');
const row=(id,type,date,status='published')=>({id,status,created_at:date,public_data:{type,size:280,areaText:'280 m²',address:'Xóm Trại, Chương Mỹ, Hà Nội',title:'Cũ',code:'WEB-'+id}});
const original=[row('2','Kho xưởng','2026-10-19T02:00:00Z'),row('1','Kho xưởng','2026-10-19T01:00:00Z','rejected'),row('3','Văn phòng','2026-10-19T03:00:00Z')];
const canonical=standardizeRows(original,all);assert.equal(canonical[0].public_data.code,'KX - 0003');assert.equal(canonical[1].public_data.code,'KX - 0002');assert.equal(canonical[2].public_data.code,'VP - 0001');
const backdated=row('backdated','Kho xưởng','2020-01-01T00:00:00Z');const withBackdated=standardizeRows([...canonical,backdated],all);assert.equal(withBackdated[0].public_data.code,'KX - 0003');assert.equal(withBackdated.at(-1).public_data.code,'KX - 0004');assert.equal(standardizeRows([canonical[0]],all)[0].public_data.code,'KX - 0003');
assert.deepEqual(standardizeRows(canonical,all),canonical,'normalization must not grow share captions or legacy aliases on repeated reads');
const input=await sharp({create:{width:800,height:600,channels:3,background:'#686868'}}).png().toBuffer();
await assert.rejects(()=>watermarkImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>')),/Unsupported listing image format/);
const branded=await watermarkImage(input,{format:'png'}),a=await sharp(input).raw().toBuffer(),b=await sharp(branded).removeAlpha().raw().toBuffer();
assert.equal(a.length,b.length);let top=0,bottom=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){if(i<800*400*3)top++;else bottom++}assert.ok(top>200,'QR must be baked into the upper corner');assert.ok(bottom>200,'the phone must be baked into output pixels');
const centerPixels=await sharp(branded).extract({left:200,top:230,width:400,height:150}).removeAlpha().raw().toBuffer(),centerOriginal=await sharp(input).extract({left:200,top:230,width:400,height:150}).raw().toBuffer();assert.notDeepEqual(centerPixels,centerOriginal,'phone and domain must also be embedded at image center');
const decodedPixels=await sharp(branded).ensureAlpha().raw().toBuffer();assert.equal(jsQR(new Uint8ClampedArray(decodedPixels),800,600)?.data,'https://zalo.me/0906215365');
const jpeg=await watermarkImage(input,{code:'KX - 0002'}),jpegPixels=await sharp(jpeg).ensureAlpha().raw().toBuffer();assert.equal(jsQR(new Uint8ClampedArray(jpegPixels),800,600)?.data,'https://zalo.me/0906215365');
process.env.SUPABASE_URL='https://storage.test';process.env.SUPABASE_ANON_KEY='sb_publishable_test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test';
let cache=false,uploads=0,originalReads=0;const id='11111111-1111-4111-8111-111111111111';
global.fetch=async(raw,options={})=>{const url=new URL(raw),path=url.pathname;
 if(path.endsWith('/notification_log'))return Response.json([]);
 if(path.endsWith('/assets'))return Response.json([{id,kind:'image',path:'admin/raw.png',mime:'image/png',name:'raw.png'}]);
 if(path.endsWith('/posts'))return Response.json([{id:'post',status:'published',created_at:'2026-10-19',public_data:{type:'Kho xưởng',size:280,areaText:'280 m²',address:'Xóm Trại, Chương Mỹ, Hà Nội',media:[{id}]}}]);
 if(path.includes('/object/sign/')){const variant=path.includes('/branding/');if(variant&&!cache)return Response.json({error:'missing'},{status:404});return Response.json({signedURL:'/signed/'+(variant?'branded.jpg':'original.png')+'?token=unit'})}
 if(path.endsWith('/original.png')){originalReads++;return new Response(input)}
 if(path.includes('/object/rental-private/branding/')){uploads++;cache=true;const m=await sharp(options.body).metadata();assert.equal(m.format,'jpeg');return Response.json({})}
 throw Error('Unexpected URL '+url);
};
async function media(url){let status,headers;await filesHandler({method:'GET',url,headers:{}},{writeHead(s,h){status=s;headers=h},end(){}});return {status,headers}}
let result=await media('/api/files?action=media&id='+id);assert.equal(result.status,302);assert.ok(result.headers.Location.includes('branded.jpg'));assert.equal(uploads,1);assert.equal(originalReads,1);
result=await media('/api/files?action=media&id='+id+'&download=1');assert.equal(result.status,302);assert.ok(result.headers.Location.includes('download=raw.jpg'));assert.equal(uploads,1);assert.equal(originalReads,1);
console.log('Listing identity and watermark passed: sequential category codes, stable rejected slots, idempotent captions, title privacy, embedded phone pixels, protected media transformation, download branding and cache reuse.');
