import assert from 'node:assert/strict';
import {checkApifyConnection,apifyWebhookSetup,apifyConnectionView,syncApifyRun,apifyHook} from '../lib/apify-connection.mjs';
process.env.APIFY_TOKEN='fake-apify-unit-test-token-not-a-secret';process.env.SUPABASE_URL='https://db.test';process.env.SUPABASE_ANON_KEY='test';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const actorId='actor123456789012',userId='user1234567890123',runId='run12345678901234',datasetId='data1234567890123',rows=new Map();let pageCalls=0,foreign=false,failedPage=false,dbCalls=0,apiCalls=0;
function post(i){return {ok:true,recordType:'post',url:'https://www.facebook.com/groups/123/posts/'+(100000+i)+'/',facebookUrl:'https://www.facebook.com/groups/123/',text:'Chính chủ cho thuê kho tại Hà Đông, Hà Nội, diện tích 200m², giá thuê 12 triệu/tháng. LH 0912345678',user:{name:'Test'},topComments:[]}}
const original=global.fetch;
global.fetch=async(raw,o={})=>{const u=new URL(raw);if(u.origin==='https://api.apify.com'){apiCalls++;assert.equal(o.method,undefined,'connection must never launch a paid Actor');assert.equal(o.headers.Authorization,'Bearer '+process.env.APIFY_TOKEN);assert.equal(u.searchParams.has('token'),false);
 if(u.pathname==='/v2/acts/dami_studio~facebook-groups-scraper')return Response.json({data:{id:actorId}});
 if(u.pathname.endsWith('/runs'))return Response.json({data:{items:[{id:runId,status:'SUCCEEDED'}]}});
 if(u.pathname.includes('/actor-runs/'))return Response.json({data:{id:runId,actId:foreign?'foreign123456789':actorId,userId,status:'SUCCEEDED',defaultDatasetId:datasetId}});
 if(u.pathname.includes('/datasets/')){pageCalls++;const offset=Number(u.searchParams.get('offset')),limit=Number(u.searchParams.get('limit'));if(offset===100&&failedPage){failedPage=false;throw Error('temporary network failure')}return Response.json(Array.from({length:101},(_,i)=>post(i)).slice(offset,offset+limit))}
 throw Error('unexpected Apify path '+u.pathname);
 }
 assert.equal(u.origin,'https://db.test');dbCalls++;const id=u.searchParams.get('id')?.slice(3),kind=u.searchParams.get('kind')?.slice(3);let result=[];
 if(o.method==='POST'){for(const row of [].concat(JSON.parse(o.body))){const key=row.id||crypto.randomUUID();if(!rows.has(key)||o.headers.Prefer?.includes('merge-duplicates')){rows.set(key,{...rows.get(key),...row,id:key,created_at:row.created_at||rows.get(key)?.created_at||new Date().toISOString()});result.push(rows.get(key))}}}
 else if(o.method==='PATCH'){const row=rows.get(id),match=u.searchParams.get('created_at')?.slice(3);if(row&&(!match||match===row.created_at)){Object.assign(row,JSON.parse(o.body));result=[row]}}
 else result=[...rows.values()].filter(x=>(!id||id===x.id)&&(!kind||kind===x.kind));return Response.json(result);
};
try{
 let status;const before=dbCalls;await assert.rejects(apifyHook({method:'POST',headers:{'content-type':'application/json'},body:{eventType:'ACTOR.RUN.SUCCEEDED',resource:{id:runId}}},{writeHead(c){status=c},end(){}}),{status:401});assert.equal(dbCalls,before,'invalid hook must not read database');
 const checked=await checkApifyConnection();assert.equal(checked.ready,true);const setup=apifyWebhookSetup();assert.notEqual(setup.headers['X-Apify-Webhook-Key'],process.env.APIFY_TOKEN);assert.equal((await apifyConnectionView()).checked,true);
 foreign=true;await assert.rejects(syncApifyRun('foreignRun1234567'),{status:403});foreign=false;
 failedPage=true;await assert.rejects(syncApifyRun(runId),{status:502});let view=await apifyConnectionView();const partial=view.runs.find(r=>r.runId===runId);assert.equal(partial.status,'failed');assert.equal(partial.offset,100);assert.equal(partial.added,100);
 const completed=await syncApifyRun(runId);assert.equal(completed.status,'completed');assert.equal(completed.added,101);assert.equal(completed.offset,101);const apiBefore=apiCalls;assert.equal((await syncApifyRun(runId)).duplicate,true);assert.equal(apiCalls,apiBefore,'completed duplicate must not fetch dataset again');
 let payload;await apifyHook({method:'POST',headers:{'content-type':'application/json','x-apify-webhook-key':setup.headers['X-Apify-Webhook-Key']},body:{eventType:'ACTOR.RUN.SUCCEEDED',resource:{id:runId}}},{writeHead(c){status=c},end(body){payload=JSON.parse(body)}});assert.equal(status,200);assert(payload.duplicate);assert((await apifyConnectionView()).runs.find(r=>r.runId===runId).hookReceivedAt);assert.equal(JSON.stringify(payload).includes(process.env.APIFY_TOKEN),false);
 await assert.rejects(apifyHook({method:'POST',headers:{'content-type':'application/json','x-apify-webhook-key':setup.headers['X-Apify-Webhook-Key']},body:{eventType:'ACTOR.RUN.FAILED',runId}},{writeHead(){},end(){}}),{status:400});
 process.env.APIFY_TOKEN='different-fake-token';assert.equal((await apifyConnectionView()).checked,false,'token rotation requires recheck');assert.notEqual(apifyWebhookSetup().headers['X-Apify-Webhook-Key'],setup.headers['X-Apify-Webhook-Key']);
 console.log('PASS Apify connection: scoped read checks, server-only token, hook auth, actor/account restriction, multi-page ingestion, resumable failures, duplicate delivery and token rotation; no paid Actor starts.');
}finally{global.fetch=original;delete process.env.APIFY_TOKEN}
