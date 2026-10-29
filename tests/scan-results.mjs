import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import M from '../public/scan-results-model.js';
import {resultInput,scanResults,ingestResults,updateResult,exportResults} from '../lib/scan-results.mjs';
import handler from '../api/workspace.mjs';
import {extractDocument} from '../lib/documents.mjs';
const now=new Date('2026-10-29T08:00:00Z');
const raw={kind:'owner',originalUrl:'https://example.com/a',content:'Tôi chính chủ cho thuê số 2 Đặng Tất. Giá 10 triệu/tháng.',address:'Số 2 Đặng Tất',district:'Ba Đình',propertyType:'Nhà nguyên căn',phone:'0912345678',rent:10,size:20,frontage:3,postedAt:'2026-10-28T04:00:00Z',collectedAt:now.toISOString(),sources:[{url:'https://www.facebook.com/groups/123/',name:'Nhóm A'},{url:'https://www.facebook.com/groups/456/',name:'Nhóm B'}],industries:['Văn phòng']};
const owner={...JSON.parse(resultInput(raw,now).record_id),id:resultInput(raw,now).id};
const tenant={...owner,id:'tenant',kind:'tenant',originalUrl:'https://example.com/b',phone:'',rent:null,size:null,frontage:null,requirements:'Tìm văn phòng Cầu Giấy',budget:'Dưới 15 triệu',sources:[{name:'Web',url:'https://example.com'}]};
assert.equal(M.day('2026-10-28T18:00:00Z'),'2026-10-29');
assert.equal(M.filter([owner,tenant],{kind:'owner',range:'week',rentMin:'9',rentMax:'11',sizeMin:'10',hasPhone:true,crossposted:true},now).length,1);
assert.equal(M.filter([owner,tenant],{kind:'tenant',rentMin:'1'},now).length,0,'missing price is not zero');
assert.equal(M.filter([owner],{q:'dang tat'},now).length,1);
assert.equal(M.filter([owner],{from:'2026-10-30'},now).length,0);
assert.equal(M.filter([{...owner,collectedAt:'2026-10-22T17:00:00Z'}],{range:'week'},now).length,1,'7 days includes local Oct 23');
assert.equal(M.filter([{...owner,collectedAt:'2026-10-22T16:59:59Z'}],{range:'week'},now).length,0);
assert.equal(M.filter([{...owner,sources:[{url:'https://one.com'},{url:'https://two.com'}]}],{crossposted:true},now).length,0,'two websites do not imply two Facebook groups');
assert.deepEqual(M.summary([owner,tenant],now),{ownersToday:1,tenantsToday:1,unverified:2,verifiedPending:0,published:0,tenantsUncontacted:1});
assert.equal(M.filter([owner,tenant],{source:'platform:facebook'},now).length,1);assert.equal(M.filter([owner,tenant],{source:'platform:website'},now).length,1);
assert.equal(M.filter([{...owner,district:'Quận Ba Đình'}],{district:'Ba Đình'},now).length,1);
assert.equal(M.filter([{...owner,isTransfer:true}],{propertyType:'transfer:Nhà nguyên căn'},now).length,1);assert.equal(M.filter([owner],{propertyType:'transfer:any'},now).length,0);
assert.equal(M.filter([{...owner,propertyType:'Sang nhượng chung cư'}],{propertyType:'transfer:Căn hộ chung cư'},now).length,1);
assert.equal(M.filter([{...owner,industries:['Cafe']}],{industry:'Cà phê'},now).length,1);
assert.equal(M.filter([{...owner,industries:['Spa / Nail / Tóc']}],{industry:'Spa'},now).length,1);
assert.equal(M.filter([{...owner,reviewState:'skipped',verified:false}],{verification:'skipped'},now).length,1);
assert.equal(M.filter([{...owner,status:'published'}],{verification:'published'},now).length,1);
const small={...owner,id:'small',size:5};assert.deepEqual(M.filter([owner,tenant,small],{sort:'size-asc'},now).map(x=>x.id),['small',owner.id,'tenant']);assert.deepEqual(M.filter([owner,tenant,small],{sort:'size-desc'},now).map(x=>x.id),[owner.id,'small','tenant']);
assert.equal(M.chart([owner,tenant],now).length,14);assert.equal(M.chart([owner,tenant],now)[13].tenant,1);
assert.equal(resultInput({...raw,verified:true,status:'published'},now).id,resultInput(raw,now).id);assert.equal(JSON.parse(resultInput({...raw,verified:true},now).record_id).verified,false);
assert.throws(()=>resultInput({...raw,rent:'10 triệu'},now),{status:400});assert.throws(()=>resultInput({...raw,originalUrl:'javascript:alert(1)'},now),{status:400});assert.throws(()=>resultInput({...raw,collectedAt:'2027-01-01'},now),{status:400});
process.env.SUPABASE_URL='https://results-db.test';process.env.SUPABASE_ANON_KEY='fake';process.env.SUPABASE_SERVICE_ROLE_KEY='fake';
const original=global.fetch;const rows=[];let calls=0,race=false;
global.fetch=async(raw,opts={})=>{if(new URL(raw).pathname==='/rest/v1/inquiries'){assert(!opts.method||opts.method==='GET');return Response.json([]);}calls++;const u=new URL(raw);assert.equal(u.origin,'https://results-db.test');assert.equal(u.pathname,'/rest/v1/notification_log','review markers must not write public posts');const kind=u.searchParams.get('kind')?.slice(3),id=u.searchParams.get('id')?.slice(3);if(!opts.method||opts.method==='GET'){let found=rows.filter(x=>(!kind||x.kind===kind)&&(!id||x.id===id));const offset=+(u.searchParams.get('offset')||0),limit=+(u.searchParams.get('limit')||500);return Response.json(found.slice(offset,offset+limit))}const payload=JSON.parse(opts.body);if(opts.method==='POST'){const added=[];for(const row of Array.isArray(payload)?payload:[payload]){if(row.id&&rows.some(x=>x.id===row.id))continue;const v={...row,id:row.id||crypto.randomUUID(),created_at:row.created_at||new Date().toISOString()};rows.push(v);added.push(v)}return Response.json(added)}assert.equal(opts.method,'PATCH');if(race)return Response.json([]);const row=rows.find(x=>x.id===id);assert.equal(u.searchParams.get('created_at'),'eq.'+row.created_at);Object.assign(row,payload);return Response.json([row])};
try{
 const initial=await scanResults();assert.deepEqual(initial.items,[]);assert.equal(initial.lastRun,null);assert.equal(initial.catalog.districts.length,30);assert(initial.catalog.districts.includes('Sơn Tây'));assert(initial.catalog.propertyTypes.includes('Căn hộ dịch vụ'));assert(initial.catalog.industries.includes('Quán Bi-a'));assert(initial.catalog.industries.includes('Thẩm mỹ'));
 const input={...raw,collectedAt:new Date(Date.now()-1000).toISOString()};assert.equal((await ingestResults({items:[input]})).added,1);assert.equal((await ingestResults({items:[input]})).added,0);
 let data=await scanResults();assert.equal(data.items.length,1);assert(data.lastRun);let row=data.items[0];
 let result=await updateResult({action:'scan-result-verify',id:row.id,revision:row.revision,verified:true});assert(result.item.verified);
 await assert.rejects(updateResult({action:'scan-result-status',id:row.id,revision:row.revision,status:'published'}),{status:409});
 result=await updateResult({action:'scan-result-status',id:row.id,revision:result.item.revision,status:'published'});assert.equal(result.item.status,'published');
 race=true;await assert.rejects(updateResult({action:'scan-result-status',id:row.id,revision:result.item.revision,status:'closed'}),{status:409});race=false;
 for(const state of ['skipped','pending','verified','published']){result=await updateResult({action:'scan-result-verification',id:row.id,revision:result.item.revision,verification:state});assert.equal(M.verification(result.item),state);assert.equal((await exportResults({verification:state})).count,1)}
 const output=await exportResults({kind:'owner',status:'published'});assert.equal(output.count,1);const book=new ExcelJS.Workbook();await book.xlsx.load(output.buffer);assert.equal(book.worksheets[0].rowCount,2);assert.equal(book.worksheets[0].getRow(2).getCell(13).text,'0912345678');assert.equal(book.worksheets[0].getRow(2).getCell(7).value,10);
 assert.equal((await exportResults({kind:'tenant'})).count,0);
 for(const format of ['docx','pdf','txt']){const out=await exportResults({kind:'owner',status:'published'},format);assert.equal(out.count,1);assert.equal(out.extension,format);const text=format==='txt'?out.buffer.toString('utf8'):await extractDocument(out.buffer,out.mime);assert(text.includes('0912345678'));assert(text.includes('https://example.com/a'));assert(!text.includes('undefined'));}
 await assert.rejects(exportResults({},'exe'),{status:400});

 const count=calls;for(const [method,url,body] of [['GET','/api/workspace?view=scan-results',undefined],['POST','/api/workspace',{action:'scan-result-ingest',items:[input]}],['POST','/api/workspace',{action:'scan-result-export'}]]){let status;await handler({method,url,headers:{host:'local','content-type':'application/json'},body,socket:{remoteAddress:'results-test'}},{writeHead(s){status=s},end(){},setHeader(){}});assert.equal(status,401)}assert.equal(calls,count);
}finally{global.fetch=original}
console.log('PASS results: normalized ingestion, missing values, stable deduplication, Vietnam dates, all filters, 14-day counts, manual verification/status, CAS, XLSX filtered contents, admin-only read/ingest/export.');
