import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {newsFixture} from './news-fixture.mjs';
import {saveNews} from '../lib/news.mjs';
import catalog from '../api/catalog.mjs';
import property from '../api/property.mjs';
const f=await newsFixture(),original=global.fetch;let profile=null;
global.fetch=async(raw,options={})=>{const u=new URL(raw);if(u.pathname==='/auth/v1/user'){if(options.headers?.Authorization==='Bearer valid-poster')return Response.json({id:'member-test'});return Response.json({error:'invalid'},{status:401});}if(u.pathname==='/rest/v1/profiles')return Response.json(profile?[profile]:[]);return f.fetch(raw,options);};
process.env.ADMIN_SECRET='article-dates-test-only-secret-1234567890';
const verifier=JSON.parse(await readFile('lib/admin-password.json','utf8')),value=String(Date.now()+3600000)+'.dates',sig=createHmac('sha256','rental-admin-session:'+process.env.ADMIN_SECRET+':'+verifier.hash).update(value).digest('base64url'),adminCookie='rental_admin='+value+'.'+sig;
async function request(handler,url,cookie=''){let status,headers,body;await handler({method:'GET',url,headers:{cookie},socket:{}},{writeHead(s,h){status=s;headers=h;},end(b){body=b;}});assert.equal(status,200,body);assert.equal(headers['Cache-Control'],'no-store');return body;}
try{
 for(const section of ['news','experience']){
  const {article}=await saveNews({id:randomUUID(),title:'Bài kiểm tra ngày đăng '+section,content:'Nội dung hướng dẫn kiểm tra.',excerpt:'Tóm tắt',status:'published',section,industry:''});
  for(const [role,cookie,memberProfile,visible] of [['guest','',null,false],['forged','rental_member=forged',null,false],['customer','rental_member=valid-poster',{kind:'customer',can_post:true},false],['revoked','rental_member=valid-poster',{kind:'sales',can_post:false},false],['poster','rental_member=valid-poster',{kind:'sales',can_post:true},true],['admin',adminCookie,null,true]]){
   profile=memberProfile;
   const data=JSON.parse(await request(catalog,'/api/catalog?view=news&section='+section+'&admin=true&showDates=true',cookie));assert.equal(data.articles.length,1);assert.equal(Object.hasOwn(data.articles[0],'publishedAt'),visible,section+' '+role);assert.equal(Object.hasOwn(data.articles[0],'updatedAt'),visible);
   const html=await request(property,'/api/property?news='+article.slug+'&section='+section,cookie);assert.equal(html.includes('<time'),visible,section+' detail '+role);assert.equal(html.includes(article.published_at),visible);assert(html.includes(article.title));
  }
 }
 console.log('PASS article dates: both sections list/detail, admin and verified posting role only; guest/customer/revoked/forged sessions omitted dates, query spoofing ignored and no-store responses.');
}finally{global.fetch=original;}
