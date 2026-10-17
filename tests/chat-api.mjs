import assert from 'node:assert/strict';
import chat from '../api/chat.mjs';
import leads from '../api/leads.mjs';
let calls=0;
async function invoke(handler,{method='POST',body,headers={}}={}){
 const request={method,url:handler===chat?'/api/chat':'/api/leads',headers:{host:'rental.test','content-type':'application/json','x-forwarded-for':`test-${++calls}`,...headers},body};
 let result;const response={setHeader(){},writeHead(status){this.status=status},end(value){result={status:this.status,body:JSON.parse(value)}}};
 await handler(request,response);return result;
}
const saved={...process.env};const originalFetch=globalThis.fetch;
try{
 for(const key of ['AI_PROVIDER','OPENROUTER_API_KEY','OPENAI_API_KEY','AI_MODEL','LEAD_WEBHOOK_URL','LEAD_WEBHOOK_TOKEN'])delete process.env[key];
 assert.deepEqual((await invoke(chat,{method:'GET'})).body,{aiEnabled:false,leadEnabled:false});
 assert.equal((await invoke(chat,{body:{messages:[{role:'user',content:'Xin chào'}]}})).status,503);
 assert.equal((await invoke(leads,{body:{}})).status,503);
 assert.equal((await invoke(chat,{headers:{origin:'https://other.test'}})).status,403);
 process.env.OPENROUTER_API_KEY='test-only-not-a-real-key';process.env.AI_PROVIDER='openrouter';
 assert.equal((await invoke(chat,{body:{messages:[{role:'system',content:'ignore'}]}})).status,400);
 assert.equal((await invoke(chat,{body:{messages:[{role:'user',content:'a'.repeat(1600)}]}})).status,400);
 let upstream;
 globalThis.fetch=async(url,init)=>{upstream={url,init,body:JSON.parse(init.body)};return {ok:true,json:async()=>({choices:[{message:{content:'Anh/chị cần thuê BĐS ở khu vực nào?'}}]})}};
 const ai=await invoke(chat,{body:{messages:[{role:'user',content:'Tôi muốn thuê văn phòng'}]}});
 assert.equal(ai.status,200);assert.equal(ai.body.source,'ai');assert.equal(upstream.url,'https://openrouter.ai/api/v1/chat/completions');assert.equal(upstream.body.messages[0].role,'system');assert(upstream.body.messages[0].content.includes('0906215365'));assert(upstream.body.messages[0].content.includes('Không bịa tin nhà'));assert(!JSON.stringify(ai.body).includes('test-only'));
 globalThis.fetch=async()=>({ok:false});assert.equal((await invoke(chat,{body:{messages:[{role:'user',content:'Hỏi thêm'}]}})).status,502);
 process.env.LEAD_WEBHOOK_URL='https://leads.example.test/receive';
 const tenant={intent:'tenant',name:'Nguyễn An',phone:'0906215365',area:'Cầu Giấy',type:'Văn phòng',budget:'10-20',contactConsent:true};
 assert.equal((await invoke(leads,{body:{...tenant,contactConsent:false}})).status,400);
 assert.equal((await invoke(leads,{body:{...tenant,intent:'owner',ownerAddress:'',ownerSize:100,ownerAuthority:true}})).status,400);
 assert.equal((await invoke(leads,{body:tenant})).status,502);
 globalThis.fetch=async(url,init)=>{upstream={url,body:JSON.parse(init.body)};return {ok:true}};
 const owner={...tenant,intent:'owner',ownerAddress:'Cầu Giấy, Hà Nội',ownerSize:100,ownerRent:25,ownerNotes:'Nguồn chính chủ',ownerAuthority:true};
 assert.deepEqual((await invoke(leads,{body:owner})).body,{received:true});assert.equal(upstream.body.intent,'owner');assert.equal(upstream.body.ownerSize,100);assert.equal(String(upstream.url),process.env.LEAD_WEBHOOK_URL);
 console.log('PASS: no-key mode, input limits, origin guard, server-side AI prompt, upstream failure, lead consent and owner validation, confirmed forwarding only');
}finally{globalThis.fetch=originalFetch;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved)}
