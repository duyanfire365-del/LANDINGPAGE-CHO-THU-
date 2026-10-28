import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createSourceIllustration,illustrationConcept,illustrationPrompt,sourceImageConfiguration} from '../lib/source-illustration.mjs';
process.env.SUPABASE_URL='https://images.test';process.env.SUPABASE_ANON_KEY='sb_publishable_test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test';process.env.AI_GATEWAY_API_KEY='fake-gateway';process.env.SOURCE_IMAGE_DAILY_LIMIT='2';
const png=await sharp({create:{width:600,height:600,channels:3,background:'#c2a57b'}}).png().toBuffer();
let assets=[],logs=[],calls=0,uploads=[],fail=false;const prompts=[];
global.fetch=async(raw,options={})=>{
 const url=new URL(raw),body=typeof options.body==='string'?JSON.parse(options.body):options.body;
 if(url.hostname==='ai-gateway.vercel.sh'){
  calls++;prompts.push(body.messages[0].content);assert.equal(body.model,'google/gemini-3.1-flash-image');assert.deepEqual(body.modalities,['image','text']);await new Promise(r=>setTimeout(r,20));
  return fail?Response.json({error:'billing'}, {status:402}):Response.json({choices:[{message:{images:[{image_url:{url:'data:image/png;base64,'+png.toString('base64')}}]}}]});
 }
 if(url.pathname.startsWith('/storage/')){uploads.push(Buffer.from(body));return Response.json({Key:'ok'});}
 const rows=url.pathname.endsWith('/assets')?assets:logs;const found=rows.filter(r=>['id','path','kind','record_id'].every(k=>!url.searchParams.get(k)||'eq.'+r[k]===url.searchParams.get(k)));
 if(options.method==='POST'){
  const prior=rows.find(r=>r.id===body.id||body.path&&r.path===body.path);if(prior&&options.headers.Prefer?.includes('ignore-duplicates'))return Response.json([]);
  if(prior){Object.assign(prior,body);return Response.json([prior]);}
  const row={id:crypto.randomUUID(),created_at:new Date().toISOString(),...body};rows.push(row);return Response.json([row]);
 }
 if(options.method==='PATCH'){found.forEach(r=>Object.assign(r,body));return Response.json(found);}
 return Response.json(found);
};
assert.equal(illustrationConcept('50B Minh Họa. quán cà phê & văn phòng. phi 30tr','Mặt bằng kinh doanh'),'coffee_office');
const prompt=illustrationPrompt('Mặt bằng kinh doanh','coffee_office');assert(!/50B|Minh Họa|30tr|48tr|250|tt3c1/.test(prompt));assert(prompt.includes('never a reconstruction'));assert(sourceImageConfiguration().ready);
const body={requestId:'example-cafe-20261028',type:'Mặt bằng kinh doanh',concept:'coffee_office',namespace:'telegram'};
const result=await createSourceIllustration(body);assert(result.path.startsWith('editor-ai/telegram/'));assert.equal(result.mime,'image/jpeg');assert.equal(calls,1);assert.equal((await sharp(uploads[0]).metadata()).width,1536);assert.equal((await sharp(uploads[0]).metadata()).height,1024);
assert((await createSourceIllustration(body)).reused);assert.equal(calls,1);await assert.rejects(()=>createSourceIllustration({...body,concept:'home'}),{status:409});
const pair=await Promise.allSettled([createSourceIllustration({...body,requestId:'concurrent-20261028'}),createSourceIllustration({...body,requestId:'concurrent-20261028'})]);assert.equal(pair.filter(r=>r.status==='fulfilled').length,1);assert.equal(calls,2);
await assert.rejects(()=>createSourceIllustration({...body,requestId:'over-budget-20261028'}),{status:429});assert.equal(calls,2);
assets=[];logs=[];fail=true;process.env.SOURCE_IMAGE_DAILY_LIMIT='4';await assert.rejects(()=>createSourceIllustration({...body,requestId:'billing-error-20261028'}),{status:503});assert.equal(assets.length,0);assert(logs.some(l=>l.kind==='source-image:failed'));await assert.rejects(()=>createSourceIllustration({...body,requestId:'billing-error-20261028'}),{status:503});await assert.rejects(()=>createSourceIllustration({...body,requestId:'billing-error-20261028'}),{status:503});const beforeLimit=calls;await assert.rejects(()=>createSourceIllustration({...body,requestId:'billing-error-20261028'}),{status:429});assert.equal(calls,beforeLimit);
await assert.rejects(()=>createSourceIllustration({...body,type:'50B/private',requestId:'unsafe-20261028'}),{status:400});
console.log('PASS: generic private-safe prompts, gateway image decoding, JPEG/mobile dimensions, cached replay, concurrent lock, hard daily budget, billing failures and input validation.');
