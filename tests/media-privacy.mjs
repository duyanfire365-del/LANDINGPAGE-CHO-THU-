import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import files from '../api/files.mjs';
import {imagePrivacy,privateMediaCommand,canReadAsset,publicMedia,mediaEntry,setMediaAccess} from '../lib/media-access.mjs';
import {inspectTelegramAsset} from '../lib/telegram-media.mjs';
import {editedMedia} from '../lib/post-media.mjs';
const originalFetch=global.fetch;
process.env.SUPABASE_URL='https://privacy-db.test';process.env.SUPABASE_SERVICE_ROLE_KEY='fake';process.env.SUPABASE_ANON_KEY='fake';process.env.ADMIN_SECRET='privacy-test-only-secret-0123456789012345';process.env.OPENAI_API_KEY='privacy-test';delete process.env.OPENROUTER_API_KEY;process.env.AI_PROVIDER='openai';
const verifier=JSON.parse(await readFile('lib/admin-password.json','utf8')),value=String(Date.now()+3600000)+'.privacy',sig=createHmac('sha256','rental-admin-session:'+process.env.ADMIN_SECRET+':'+verifier.hash).update(value).digest('base64url'),admin='rental_admin='+value+'.'+sig;
const member=randomUUID(),other=randomUUID(),profiles=[{id:member,email:'trusted@example.com',kind:'sales',can_post:true},{id:other,email:'other@example.com',kind:'sales',can_post:true}];
const bytes=await sharp({create:{width:10,height:10,channels:3,background:'white'}}).jpeg().toBuffer();
const assets=['public','owner','members'].map((visibility,i)=>({id:randomUUID(),kind:'image',mime:'image/jpeg',name:'source.jpg',owner_id:null,path:'test/'+i+'.jpg',access_data:{visibility,members:visibility==='members'?[member]:[],emails:visibility==='members'?['trusted@example.com']:[],scan:'clear'}}));
const post={id:randomUUID(),status:'published',public_data:{slug:'live-1793999999999999',media:assets.map(mediaEntry),image:'/api/files?action=media&id='+assets[1].id}};
let vision={sensitive:false,clear:true,categories:['none']},calls=0,visionFail=false;
const matches=(r,q)=>{for(const [key,v]of q){if(['select','limit','offset','order','on_conflict'].includes(key))continue;const data=key==='public_data->>slug'?r.public_data?.slug:r[key];if(v.startsWith('eq.')&&String(data)!==v.slice(3))return false;if(v.startsWith('in.')&&!v.slice(4,-1).split(',').includes(String(data)))return false;if(key==='public_data->media'&&v.startsWith('cs.')&&!JSON.parse(v.slice(3)).every(m=>r.public_data.media.some(a=>a.id===m.id)))return false;}return true;};
global.fetch=async(raw,options={})=>{const u=new URL(raw),body=typeof options.body==='string'?JSON.parse(options.body):null;
 if(u.hostname==='api.openai.com'){calls++;if(visionFail)return Response.json({error:'failed'},{status:500});return Response.json({choices:[{message:{content:JSON.stringify(vision)}}]});}
 if(u.pathname==='/auth/v1/user'){const id=options.headers.Authorization==='Bearer trusted'?member:other;return Response.json({id});}
 if(u.pathname.includes('/storage/v1/object/sign/'))return Response.json({signedURL:'/object/privatebytes/test?token=fake'});
 if(u.pathname.startsWith('/storage/v1/object/privatebytes/'))return new Response(bytes);
 if(u.pathname.includes('/storage/v1/object/upload/sign/'))return Response.json({url:'/object/upload/sign/test?token=fake'});
 if(u.pathname.includes('/rest/v1/')){const table=u.pathname.split('/').at(-1),all=table==='assets'?assets:table==='posts'?[post]:table==='profiles'?profiles:[],rows=all.filter(r=>matches(r,u.searchParams));if(options.method==='PATCH'){rows.forEach(r=>Object.assign(r,body));}if(options.method==='POST'){const row={id:randomUUID(),...body};all.push(row);return Response.json([row]);}return Response.json(rows);}
 throw Error('Unexpected request '+u.pathname);
};
async function call(action,{cookie='',id,slug=post.public_data.slug,body,publicOnly=false}={}){let status,headers,payload;const url='/api/files?action='+action+(id?'&id='+id:'')+'&slug='+slug+(publicOnly?'&public=1':'');await files({method:body?'POST':'GET',url,headers:{host:'privacy.test',cookie,'content-type':'application/json'},body,socket:{remoteAddress:randomUUID()}},{writeHead(s,h){status=s;headers=h;},end(v){payload=v;}});let json;try{json=JSON.parse(payload)}catch{}return {status,headers,payload,json};}
try{
 assert(privateMediaCommand('Thêm ảnh #chiminhtoi MB - 0001'));assert(!privateMediaCommand('#chiminhtoikhac'));
 const freeCalls=calls;assert.equal((await imagePrivacy(bytes,{allowPaidAI:false})).visibility,'owner');assert.equal((await imagePrivacy(bytes,{allowPaidAI:false,forcePublic:true})).visibility,'public');const pending={id:randomUUID(),kind:'image',path:'telegram/pending.jpg',access_data:{visibility:'owner',scan:'pending'}};assets.push(pending);assert.equal((await inspectTelegramAsset(pending)).access_data.visibility,'owner');assert.equal(calls,freeCalls,'Telegram photos never invoke paid vision with provider keys present');assets.pop();
 let p=await imagePrivacy(bytes);assert.equal(p.visibility,'public');for(const categories of [['land_document'],['exact_address'],['personal_document']]){vision={sensitive:true,clear:true,categories};assert.equal((await imagePrivacy(bytes)).visibility,'owner');}
 vision={sensitive:false,clear:false,categories:['uncertain']};assert.equal((await imagePrivacy(bytes)).visibility,'owner');visionFail=true;assert.equal((await imagePrivacy(bytes)).visibility,'owner');visionFail=false;const before=calls;assert.equal((await imagePrivacy(bytes,{forcePrivate:true})).scan,'command');assert.equal(calls,before);delete process.env.OPENAI_API_KEY;assert.equal((await imagePrivacy(bytes)).visibility,'owner');process.env.OPENAI_API_KEY='privacy-test';
 const sanitized=publicMedia(post.public_data,new Map(assets.map(a=>[a.id,a])));assert.equal(sanitized.media.length,1);assert.equal(sanitized.media[0].id,assets[0].id);assert(!JSON.stringify(sanitized).includes('trusted@example.com'));assert(!JSON.stringify(sanitized).includes(assets[1].id));assert(!JSON.stringify(sanitized).includes(assets[2].id));
 assert.equal((await call('public-media')).json.media.length,1);
 assert.equal((await call('private-media')).status,401);assert.equal((await call('private-media',{cookie:'rental_member=trusted'})).json.media.length,1);assert.equal((await call('private-media',{cookie:'rental_member=other'})).json.media.length,0);assert.equal((await call('private-media',{cookie:admin})).json.media.length,2);
 assert.equal((await call('media',{id:assets[1].id})).status,401);assert.equal((await call('media',{id:assets[2].id,cookie:'rental_member=other'})).status,403);
 const read=await call('media',{id:assets[2].id,cookie:'rental_member=trusted'});assert.equal(read.status,200,JSON.stringify(read));assert(Buffer.isBuffer(read.payload));assert(!read.headers.Location);assert(read.headers['Cache-Control'].includes('no-store'));
 assert.equal((await call('media',{id:assets[1].id,cookie:admin,publicOnly:true})).status,403,'sharing never obtains private bytes even with Admin cookie');
 assets[2].access_data.members=[];assert.equal((await call('media',{id:assets[2].id,cookie:'rental_member=trusted'})).status,403);
 await assert.rejects(()=>setMediaAccess({mediaAccess:[{id:assets[1].id,visibility:'public'}]},assets,{admin:false,id:member}),{status:403});
 await assert.rejects(()=>setMediaAccess({mediaAccess:[{id:assets[1].id,visibility:'members',emails:'missing@example.com'}]},assets,{admin:true}),{status:400});assert.equal(assets[1].access_data.visibility,'owner');
 await setMediaAccess({mediaAccess:[{id:assets[1].id,visibility:'members',emails:'trusted@example.com'}]},assets,{admin:true});assert.deepEqual(assets[1].access_data.members,[member]);assert(canReadAsset(assets[1],{id:member},{attached:true,published:true}));assert(!canReadAsset(assets[1],{id:other},{attached:true,published:true}));
 const edit=await editedMedia({assetIds:assets.map(a=>a.id),mediaAccess:[{id:assets[1].id,visibility:'public'}]},post.public_data,{admin:true});assert.equal(assets[1].access_data.visibility,'members'); // local overlay; persistence is deferred, never placed in the post payload
 assert.equal(edit.accessUpdates.length,1);assert(!JSON.stringify(edit).includes('pendingAccess'));assert(!JSON.stringify(edit).includes('accessUpdates'));assert.equal(edit.media.length,3);
 const upload=await call('upload',{cookie:admin,body:{action:'upload',name:'new.jpg',mime:'image/jpeg',size:bytes.length}});assert.equal(upload.status,200,JSON.stringify(upload));assert.equal(assets.at(-1).access_data.visibility,'owner');assert.equal(assets.at(-1).access_data.scan,'pending');
 console.log('PASS media privacy: real handlers enforce guest/Admin/granted-member access, revocation, public-only sharing, private byte proxy, safe covers, grants validation, upload quarantine, vision sensitive/uncertain/failure/explicit private modes.');
}finally{global.fetch=originalFetch;}
