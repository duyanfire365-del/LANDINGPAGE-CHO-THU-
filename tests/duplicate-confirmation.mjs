import assert from 'node:assert/strict';
import {answerDuplicateConfirmation,requestDuplicateConfirmation} from '../lib/source-duplicate-confirmation.mjs';
process.env.SUPABASE_URL='https://db.test';process.env.SUPABASE_ANON_KEY='sb_publishable_test';process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_test';
const first={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',chat_id:'123',processing_status:'processing',content:'Bài mới',media:[{kind:'image',file_id:'photo'}]},rows=[first],messages=[];
const native=global.fetch;global.fetch=async(raw,options={})=>{const url=new URL(raw),body=options.body?JSON.parse(options.body):null;let found=rows.filter(r=>!url.searchParams.get('id')||'eq.'+r.id===url.searchParams.get('id'));if(url.searchParams.get('chat_id'))found=found.filter(r=>'eq.'+r.chat_id===url.searchParams.get('chat_id'));if(url.searchParams.get('processing_status'))found=found.filter(r=>'eq.'+r.processing_status===url.searchParams.get('processing_status'));if(url.searchParams.get('parsed_data->_duplicateDecision->>state'))found=found.filter(r=>'eq.'+r.parsed_data?._duplicateDecision?.state===url.searchParams.get('parsed_data->_duplicateDecision->>state'));if(options.method==='PATCH')for(const r of found)Object.assign(r,structuredClone(body));return Response.json(structuredClone(found));};
const reply=async text=>messages.push(text),message=(text,id)=>({text,chat:{id:123},...(id?{reply_to_message:{text:'Mã xác nhận: '+id}}:{})});
try{
 await requestDuplicateConfirmation(first,{price:35,size:100},{public_data:{code:'MB - 0001',title:'Mặt bằng cũ',price:30,href:'/tin?slug=live-1234567890123'}},reply);
 assert.equal(first.processing_status,'review');assert.equal(first.parsed_data._duplicateDecision.state,'pending');assert(messages[0].includes('30 triệu/tháng'));assert(messages[0].includes('35 triệu/tháng'));assert.equal(first.media[0].file_id,'photo');
 const ok=await answerDuplicateConfirmation(message('1',first.id),reply);assert.equal(ok.queuedId,first.id);assert.equal(first.processing_status,'received');assert.equal(first.parsed_data._duplicateDecision.state,'approved');
 assert(! (await answerDuplicateConfirmation(message('1',first.id),reply)).queuedId);
 const second={...structuredClone(first),id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',processing_status:'review',parsed_data:{_duplicateDecision:{state:'pending'}}};rows.push(second);
 assert(! (await answerDuplicateConfirmation({...message('1',second.id),chat:{id:999}},reply)).queuedId);assert.equal(second.processing_status,'review');
 const third={...structuredClone(second),id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc'};rows.push(third);
 assert(! (await answerDuplicateConfirmation(message('1'),reply)).queuedId);assert.equal(second.processing_status,'review');assert.equal(third.processing_status,'review');
 const no=await answerDuplicateConfirmation(message('0',second.id),reply);assert(!no.queuedId);assert.equal(second.processing_status,'duplicate');assert.equal(second.parsed_data._duplicateDecision.state,'declined');
 const race=await Promise.all([answerDuplicateConfirmation(message('1',third.id),reply),answerDuplicateConfirmation(message('1',third.id),reply)]);assert.equal(race.filter(r=>r.queuedId).length,1);
 console.log('PASS: durable 1/0 decisions, old/new price comparison, preserved media, wrong-chat and ambiguous-reply rejection, and one-time concurrent approval.');
}finally{global.fetch=native}
