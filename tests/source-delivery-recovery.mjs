import assert from 'node:assert/strict';
import {recoverSourceDeliveries} from '../lib/source-delivery-recovery.mjs';
process.env.SUPABASE_URL='https://delivery.test';process.env.SUPABASE_ANON_KEY='fake';process.env.SUPABASE_SERVICE_ROLE_KEY='fake';
process.env.TELEGRAM_BOT_TOKEN='987654321:'+ 'b'.repeat(35);process.env.TELEGRAM_SOURCE_OWNER_ID='456789';
const id='11111111-1111-4111-8111-111111111111',sent=[],logs=[];let alreadySent=false;
global.fetch=async(raw,options={})=>{const u=new URL(raw);
 if(u.origin==='https://api.telegram.org'){assert(u.pathname.startsWith('/bot987654321:'));sent.push(JSON.parse(options.body));return Response.json({ok:true,result:{message_id:999}})}
 if(u.pathname.endsWith('/notification_log')){
  if(options.method==='POST'){logs.push(JSON.parse(options.body));return Response.json([])}
  if(u.searchParams.get('sent')==='eq.true')return Response.json(alreadySent?[{sent:true}]:[]);
  return Response.json([{record_id:id,created_at:new Date(Date.now()-180000).toISOString()},{record_id:id,created_at:new Date(Date.now()-240000).toISOString()}]);
 }
 assert.equal(options.method,'GET','recovery must never create or update a listing');assert(u.pathname.endsWith('/source_inbox'));return Response.json([{id,message_id:266,processing_status:'published',result_url:'/tin?slug=live-1793269706932200',media:[{kind:'telegram-origin',bot:'notification'}]}]);
};
assert.equal((await recoverSourceDeliveries()).retried,1);assert.equal(sent.length,1);assert.equal(sent[0].chat_id,'456789');assert.equal(sent[0].reply_parameters.message_id,266);assert(sent[0].text.includes('https://nguonchothue.vn/tin?slug='));assert.equal(logs[0].sent,true);
alreadySent=true;assert.equal((await recoverSourceDeliveries()).retried,0);assert.equal(sent.length,1);
console.log('PASS: failed result notification retries on the originating bot, with original reply and correct result link; duplicate failures and confirmed deliveries do not resend or republish.');
