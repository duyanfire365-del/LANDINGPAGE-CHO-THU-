import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
import sharp from 'sharp';
import {fixture} from './three-bot-fixture.mjs';
import {prepareWebsiteLogo,saveWebsiteLogo,websiteLogoMetadata,websiteLogoImage} from '../lib/website-logo.mjs';
import {siteContent,saveSiteContent,validateSiteContent} from '../lib/site-content.mjs';
import chat from '../api/chat.mjs';
import workspace from '../api/workspace.mjs';
import catalog from '../api/catalog.mjs';
import files from '../api/files.mjs';
const f=await fixture(),original=global.fetch;global.fetch=f.fetch;
async function call(handler,method,url,body,headers={}){let status,replyHeaders,payload;await handler({method,url,body,headers:{host:'localhost','content-type':'application/json',...headers},socket:{remoteAddress:'logo-unit'}},{writeHead(s,h){status=s;replyHeaders=h},end(p){payload=p},setHeader(){}});return {status,headers:replyHeaders,payload}}
try{
 const initial=await siteContent();assert.equal(initial.content.faqs.length,10);assert(initial.content.faqs[2].question.startsWith('Làm thế nào'));assert(!JSON.stringify(initial).includes('base64'));
 const c=structuredClone(initial.content);c.faqs=[{question:'<img src=x onerror=alert(1)>',answer:'Trả lời mới\n\nĐoạn hai',group:1}];c.address='Địa chỉ mới';c.socials=[{label:'Facebook',url:'https://facebook.com/example'}];
 assert.throws(()=>validateSiteContent({...c,mapUrl:'javascript:alert(1)'}),{status:400});assert.throws(()=>validateSiteContent({...c,links:[{label:'X',url:'//evil.test'}]}),{status:400});assert.throws(()=>validateSiteContent({...c,faqs:[]}),{status:400});
 const saved=await saveSiteContent({action:'site-content-save',revision:null,content:c});assert.equal((await siteContent()).content.address,'Địa chỉ mới');await assert.rejects(saveSiteContent({action:'site-content-save',revision:null,content:c}),{status:409});
 process.env.AI_PROVIDER='openai';process.env.OPENAI_API_KEY='fake-content-test-only';global.fetch=async(url,options)=>{if(String(url)==='https://api.openai.com/v1/chat/completions'){const payload=JSON.parse(options.body);assert(payload.messages[0].content.includes('Trả lời mới'));assert(!payload.messages[0].content.includes('Giá thuê hiển thị trên website là mức giá tham khảo'));return Response.json({choices:[{message:{content:'Nội dung FAQ mới'}}]})}return f.fetch(url,options)};assert.equal((await call(chat,'POST','/api/chat',{messages:[{role:'user',content:'Câu hỏi'}]})).status,200);global.fetch=f.fetch;
 const png=await sharp({create:{width:600,height:150,channels:4,background:'red'}}).png().toBuffer();await saveWebsiteLogo({action:'website-logo-save',revision:null,base64:png.toString('base64'),alt:'Logo đầu trang mới'});assert.equal((await siteContent()).logo.alt,'Logo đầu trang mới');assert.equal((await siteContent()).logo.mode,'header');
 const own=await saveSiteContent({action:'site-content-logo-save',revision:saved.revision,base64:png.toString('base64'),alt:'Logo cuối trang'});assert(own.logo.custom);assert(!JSON.stringify(own).includes('base64'));const image=await call(files,'GET',own.logo.url);assert.equal(image.status,200);assert(Buffer.isBuffer(image.payload));assert.equal((await call(files,'GET',own.logo.url,undefined,{'if-none-match':image.headers.ETag})).status,304);
 assert.equal((await call(workspace,'GET','/api/workspace?view=site-content')).status,401);assert.equal((await call(workspace,'POST','/api/workspace?site-content=1',{action:'site-content-reset',revision:own.revision})).status,401);
 process.env.ADMIN_SECRET='content-test-only-fake-secret-12345678901234';const verifier=JSON.parse(await readFile('lib/admin-password.json','utf8')),value=String(Date.now()+3600000)+'.content',sig=createHmac('sha256','rental-admin-session:'+process.env.ADMIN_SECRET+':'+verifier.hash).update(value).digest('base64url'),cookie={cookie:'rental_admin='+value+'.'+sig};
 assert.equal((await call(workspace,'POST','/api/workspace?site-content=1',{action:'site-content-reset',revision:own.revision},{...cookie,origin:'https://evil.example'})).status,403);
 const reset=await call(workspace,'POST','/api/workspace?site-content=1',{action:'site-content-reset',revision:own.revision},cookie);assert.equal(reset.status,200);const restored=JSON.parse(reset.payload);assert.equal(restored.content.faqs.length,10);assert(restored.logo.custom);const header=await saveSiteContent({action:'site-content-logo-reset',revision:restored.revision});assert(!header.logo.custom);assert.equal(header.logo.alt,'Logo đầu trang mới');
 const pub=await call(catalog,'GET','/api/catalog?view=site-content');assert.equal(pub.status,200);assert(!String(pub.payload).includes('base64'));assert.equal(f.tables.posts.length,0);assert.equal(f.tables.customer_watch[0].data.name,'Khách admin');
 console.log('PASS editable FAQ/footer: validation, default preservation, CRUD/CAS, independent footer logo/header fallback, public DTO/image/ETag, admin-only and CSRF guards, original records unchanged.');
}finally{global.fetch=original}
