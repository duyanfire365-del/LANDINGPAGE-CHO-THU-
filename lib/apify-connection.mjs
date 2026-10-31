import {createHash,createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {db,problem} from './platform.mjs';
import {readJson,send} from './http.mjs';
import {importApify} from './apify-import.mjs';
const ACTOR='dami_studio~facebook-groups-scraper',CONFIG='9fc2b532-15d8-4f64-8c51-f65db82cb977',KIND='apify-sync:v1';
const idPattern=/^[a-zA-Z0-9]{10,40}$/;
const token=()=>process.env.APIFY_TOKEN?.trim();
const fingerprint=()=>createHash('sha256').update(token()||'').digest('hex').slice(0,24);
function hookSecret(){if(!token())throw problem(503,'Chưa có APIFY_TOKEN trên máy chủ.');return createHmac('sha256',token()).update('nguonchothue.vn/apify-hook/v1').digest('hex')}
async function api(path,{list=false}={}){
 if(!token())throw problem(503,'Chưa có APIFY_TOKEN trên máy chủ.');
 let r;try{r=await fetch('https://api.apify.com/v2'+path,{headers:{Authorization:'Bearer '+token(),Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)})}catch{throw problem(502,'Chưa kết nối được Apify; thử lại sau.')}
 if(!r.ok){await r.body?.cancel();throw problem(r.status===401||r.status===403?403:502,r.status===401?'Apify từ chối token. Kiểm tra token và Redeploy.':r.status===403?'Token thiếu quyền đọc Actor/lượt chạy hoặc Storages. Kiểm tra quyền tại Apify.':'Apify trả lỗi '+r.status+'. Thử lại sau.')}
 const chunks=[];let size=0;for await(const b of r.body){size+=b.length;if(size>3000000)throw problem(413,'Một trang dữ liệu Apify vượt 3 MB. Giảm số bài/ảnh/bình luận mỗi lượt.');chunks.push(b)}
 let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw problem(502,'Apify trả dữ liệu không đúng JSON.')}
 const data=list?value:value?.data;if(data==null||list&&!Array.isArray(data))throw problem(502,'Apify trả cấu trúc dữ liệu chưa hợp lệ.');return data;
}
async function config(){const row=(await db('notification_log',{query:'?id=eq.'+CONFIG+'&kind=eq.apify-connection:v1&limit=1'}))[0];if(!row)return null;try{const c=JSON.parse(row.record_id);return c.fingerprint===fingerprint()?c:null}catch{return null}}
function identity(run,c){if(run.actId!==c.actorId||run.userId!==c.userId)throw problem(403,'Lượt quét không thuộc Actor và tài khoản Apify đã kết nối.');if(run.status!=='SUCCEEDED')throw problem(409,'Chỉ nhập lượt Apify đã thành công.');if(!idPattern.test(run.defaultDatasetId||''))throw problem(502,'Lượt quét chưa có mã dataset hợp lệ.')}
export async function checkApifyConnection(){
 const actor=await api('/acts/'+ACTOR),runs=await api('/acts/'+ACTOR+'/runs?desc=true&limit=10');const list=runs.items;if(!idPattern.test(actor.id||'')||!Array.isArray(list))throw problem(502,'Chưa đọc được Actor/lượt chạy.');
 const candidate=list.find(r=>r.status==='SUCCEEDED');if(!candidate)throw problem(409,'Chưa có lượt thành công trong 10 lượt gần nhất của Actor này. Chạy thử trên Apify trước.');
 const latest=await api('/actor-runs/'+candidate.id);
 if(latest.actId!==actor.id||!idPattern.test(latest.userId||''))throw problem(502,'Không đối chiếu được tài khoản sở hữu lượt quét.');
 const c={actorId:actor.id,userId:latest.userId,fingerprint:fingerprint(),checkedAt:new Date().toISOString(),latestRunId:latest.id};identity(latest,c);
 await api('/datasets/'+latest.defaultDatasetId+'/items?format=json&clean=false&offset=0&limit=1',{list:true});
 await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:{id:CONFIG,kind:'apify-connection:v1',record_id:JSON.stringify(c),sent:true}});
 return {ready:true,checkedAt:c.checkedAt,latestRunId:latest.id,message:'Đọc được Actor, lượt chạy và dữ liệu kết quả. Chưa khởi chạy lượt quét mới.'};
}
function jobId(runId){const h=createHash('sha256').update(KIND+runId).digest('hex');return h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32)}
export async function apifyConnectionView(){const c=await config();const rows=await db('notification_log',{query:'?kind=eq.'+KIND+'&order=created_at.desc&limit=10'});return {configured:!!token(),checked:!!c,checkedAt:c?.checkedAt||null,latestRunId:c?.latestRunId||'',endpoint:'https://nguonchothue.vn/api/workspace?apify-hook=1',eventType:'ACTOR.RUN.SUCCEEDED',runs:rows.map(r=>{const x=JSON.parse(r.record_id);return {hookReceivedAt:x.hookReceivedAt||null,runId:x.runId,status:x.status,offset:x.offset,added:x.added,received:x.received,review:x.review,skipped:x.skipped,diagnostics:x.diagnostics||[],error:x.error||'',updatedAt:x.updatedAt}})}}
export function apifyWebhookSetup(){return {url:'https://nguonchothue.vn/api/workspace?apify-hook=1',headers:{'X-Apify-Webhook-Key':hookSecret()},eventType:'ACTOR.RUN.SUCCEEDED',payload:'Giữ payload mặc định của Apify. Không dùng APIFY_TOKEN làm khóa webhook.'}}
export async function syncApifyRun(runId,{origin='manual'}={}){
 if(!idPattern.test(runId||''))throw problem(400,'Mã lượt Apify chưa hợp lệ.');const c=await config();if(!c)throw problem(409,'Bấm Kiểm tra kết nối trong quản trị trước khi nhận dữ liệu tự động.');
 const id=jobId(runId),old=(await db('notification_log',{query:'?id=eq.'+id+'&kind=eq.'+KIND+'&limit=1'}))[0];let previous;try{previous=old?JSON.parse(old.record_id):null}catch{throw problem(503,'Nhật ký đồng bộ chưa đọc được.')}
 if(previous&&(previous.actorId!==c.actorId||previous.userId!==c.userId))throw problem(403,'Nhật ký thuộc kết nối Apify khác.');
 if(previous?.status==='completed'){if(origin==='webhook'){previous.hookReceivedAt=new Date().toISOString();await db('notification_log',{method:'PATCH',query:'?id=eq.'+id+'&created_at=eq.'+encodeURIComponent(old.created_at),body:{record_id:JSON.stringify(previous)}})}return {...previous,duplicate:true};}
 if(previous?.status==='processing'&&Date.now()-Date.parse(previous.updatedAt)<120000)throw problem(409,'Lượt này đang được xử lý. Apify có thể gửi lại sau.');
 const stamp=new Date().toISOString(),job={runId,actorId:c.actorId,userId:c.userId,hookReceivedAt:origin==='webhook'?stamp:previous?.hookReceivedAt||null,status:'processing',offset:previous?.offset||0,added:previous?.added||0,received:previous?.received||0,review:previous?.review||0,skipped:previous?.skipped||0,diagnostics:previous?.diagnostics||[],updatedAt:stamp,lease:randomUUID()};
 const rows=await db('notification_log',old?{method:'PATCH',query:'?id=eq.'+id+'&created_at=eq.'+encodeURIComponent(old.created_at),body:{record_id:JSON.stringify(job),created_at:stamp}}:{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{id,kind:KIND,record_id:JSON.stringify(job),created_at:stamp,sent:true}});
 if(!rows.length)throw problem(409,'Một tiến trình khác vừa nhận lượt quét này.');
 async function save(){job.updatedAt=new Date().toISOString();const changed=await db('notification_log',{method:'PATCH',query:'?id=eq.'+id+'&created_at=eq.'+encodeURIComponent(stamp),body:{record_id:JSON.stringify(job)}});if(!changed.length)throw problem(409,'Lượt đồng bộ đã được tiến trình khác tiếp quản.')}
 try{
  const run=await api('/actor-runs/'+runId);identity(run,c);const deadline=Date.now()+75000;
  while(Date.now()<deadline){const items=await api('/datasets/'+run.defaultDatasetId+'/items?format=json&clean=false&offset='+job.offset+'&limit=100',{list:true});
   if(items.length){const result=await importApify(items);job.added+=result.added;job.received+=result.received;job.review+=result.review;job.skipped+=result.skipped.length;job.offset+=items.length;job.diagnostics=(job.diagnostics||[]).concat(result.diagnostics).slice(0,20);await save()}
   if(items.length<100){job.status='completed';job.error='';await save();return job}
  }
  job.status='pending';job.error='Đã lưu một phần. Cần tiếp tục lượt này; Apify sẽ thử lại webhook.';await save();return job;
 }catch(error){job.status='failed';job.error=error.status?error.message:'Đồng bộ bị gián đoạn; có thể thử lại, tin đã lưu không bị nhập trùng.';try{await save()}catch{}throw error}
}
export async function syncLatestApify(){const c=await config();if(!c)throw problem(409,'Kiểm tra kết nối trước.');const runs=await api('/acts/'+ACTOR+'/runs?desc=true&limit=10');const run=runs.items?.find(r=>r.status==='SUCCEEDED');if(!run)throw problem(404,'Không có lượt thành công gần đây.');return syncApifyRun(run.id)}
export async function apifyHook(req,res,schedule=()=>{}){
 if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
 if(!token())throw problem(503,'Apify chưa được cấu hình.');const actual=String(req.headers['x-apify-webhook-key']||''),expected=hookSecret();
 if(!actual||!timingSafeEqual(createHash('sha256').update(actual).digest(),createHash('sha256').update(expected).digest()))throw problem(401,'Khóa webhook không hợp lệ.');
 const body=await readJson(req,30000);if(body.eventType!=='ACTOR.RUN.SUCCEEDED')throw problem(400,'Chỉ nhận sự kiện ACTOR.RUN.SUCCEEDED.');
 const result=await syncApifyRun(body.resource?.id||body.eventData?.actorRunId||body.runId,{origin:'webhook'});if(result.status==='completed'&&!result.duplicate&&result.added>0&&process.env.MATCH_BOTS_ENABLED==='1')schedule(import('./matching-bots.mjs').then(m=>m.runMatchingBots()).catch(()=>{}));return send(res,result.status==='completed'?200:503,{ok:result.status==='completed',runId:result.runId,status:result.status,added:result.added,review:result.review,duplicate:result.duplicate===true});
}
