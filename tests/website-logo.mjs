import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
import sharp from 'sharp';
import {fixture} from './three-bot-fixture.mjs';
import {prepareWebsiteLogo,saveWebsiteLogo,websiteLogoMetadata,websiteLogoImage} from '../lib/website-logo.mjs';
import workspace from '../api/workspace.mjs';
import catalog from '../api/catalog.mjs';
import files from '../api/files.mjs';
const f=await fixture(),original=global.fetch;global.fetch=f.fetch;
async function call(handler,method,url,body,headers={}){let status,replyHeaders,payload;await handler({method,url,body,headers:{host:'localhost','content-type':'application/json',...headers},socket:{remoteAddress:'logo-unit'}},{writeHead(s,h){status=s;replyHeaders=h},end(p){payload=p},setHeader(){}});return {status,headers:replyHeaders,payload}}
try{
 const png=await sharp({create:{width:1200,height:200,channels:4,background:{r:0,g:120,b:40,alpha:.5}}}).png().toBuffer();const prepared=await prepareWebsiteLogo(png.toString('base64'));assert.equal(prepared.width,900);assert.equal(prepared.height,150);assert.equal((await sharp(Buffer.from(prepared.base64,'base64')).metadata()).format,'webp');
 await assert.rejects(prepareWebsiteLogo(Buffer.from('<svg><image href="http://127.0.0.1/"></image></svg>').toString('base64')),{status:400});await assert.rejects(prepareWebsiteLogo('invalid!'),{status:400});
 const small=await sharp({create:{width:10,height:10,channels:3,background:'red'}}).png().toBuffer();await assert.rejects(prepareWebsiteLogo(small.toString('base64')),{status:400});
 const huge=await sharp({create:{width:4000,height:4000,channels:3,background:'red'}}).png().toBuffer();await assert.rejects(prepareWebsiteLogo(huge.toString('base64')),{status:400});
 const before=await websiteLogoMetadata();assert(!before.custom);const first=await saveWebsiteLogo({action:'website-logo-save',revision:null,base64:png.toString('base64'),alt:'Logo mới'});assert(first.custom);assert.equal((await websiteLogoMetadata()).alt,'Logo mới');assert((await websiteLogoImage()).bytes.length<250000);await assert.rejects(saveWebsiteLogo({action:'website-logo-reset',revision:null}),{status:409});
 const pub=await call(catalog,'GET','/api/catalog?view=website-brand');assert.equal(pub.status,200);assert(!String(pub.payload).includes('base64'));assert(!String(pub.payload).includes('owner_address'));
 const image=await call(files,'GET','/api/files?action=website-logo');assert.equal(image.status,200);assert.equal(image.headers['Content-Type'],'image/webp');assert(Buffer.isBuffer(image.payload));const cache=await call(files,'GET','/api/files?action=website-logo',undefined,{'if-none-match':image.headers.ETag});assert.equal(cache.status,304);
 assert.equal((await call(workspace,'POST','/api/workspace?website-logo=1',{action:'website-logo-reset',revision:first.revision})).status,401);
 process.env.ADMIN_SECRET='logo-test-secret-no-production-key-123456';const verifier=JSON.parse(await readFile('lib/admin-password.json','utf8')),value=String(Date.now()+3600000)+'.logo',sig=createHmac('sha256','rental-admin-session:'+process.env.ADMIN_SECRET+':'+verifier.hash).update(value).digest('base64url');const cookie={cookie:'rental_admin='+value+'.'+sig};
 assert.equal((await call(workspace,'POST','/api/workspace?website-logo=1',{action:'website-logo-reset',revision:first.revision},{...cookie,origin:'https://evil.example'})).status,403);
 const reset=await call(workspace,'POST','/api/workspace?website-logo=1',{action:'website-logo-reset',revision:first.revision},cookie);assert.equal(reset.status,200);assert(!JSON.parse(reset.payload).custom);assert.equal((await call(files,'GET','/api/files?action=website-logo')).status,404);
 assert.equal(f.tables.posts.length,0);assert.equal(f.tables.customer_watch[0].data.name,'Khách admin');
 console.log('PASS website logo: real image validation/resize/alpha/WebP, SVG and oversized-pixel rejection, private admin save/reset/CAS, safe public metadata/image/ETag, unauthorized and cross-origin protection, original data preserved.');
}finally{global.fetch=original}
