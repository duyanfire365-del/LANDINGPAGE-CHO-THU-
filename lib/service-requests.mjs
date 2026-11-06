import {createHash} from 'node:crypto';
import {db,requireAdmin,notify,problem} from './platform.mjs';
import {readJson,send,sameOrigin,limited} from './http.mjs';
import {serviceArticles} from './service-content.mjs';
const uuid=/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
const text=(v,n)=>typeof v==='string'?v.trim().replace(/[\u0000-\u001f]/g,' ').slice(0,n):'';
export function serviceRequest(body){
 const service=serviceArticles.find(a=>a.industry===body.service),name=text(body.name,100),phone=text(body.phone,30).replace(/[ .()-]/g,'').replace(/^\+84/,'0'),address=text(body.address,250),need=text(body.need,1200),age=body.age===''||body.age==null?null:Number(body.age),urgency=body.urgency;
 if(!uuid.test(body.id||'')||!service||!name||!/^0\d{9}$/.test(phone)||!address||!need||!['urgent','soon','exploring'].includes(urgency)||body.consent!==true||text(body.website,200)||(age!==null&&(!Number.isInteger(age)||age<18||age>100))||(service.section==='recruitment'&&age===null))throw problem(400,'Kiểm tra tên, số điện thoại, khu vực, nhu cầu và đồng ý liên hệ. Ứng viên CTV cần từ đủ 18 tuổi.');
 return {id:body.id,service:service.industry,kind:service.section,name,phone,address,age,need,urgency,contact_consent:true};
}
export async function deliverServiceRequest(id){
 const rows=await db('service_requests',{method:'PATCH',query:'?id=eq.'+id+'&notification_state=in.(pending,failed)&select=*',body:{notification_state:'sending',notification_claimed_at:new Date().toISOString()}});if(!rows.length)return;
 const r=rows[0],spec=serviceArticles.find(a=>a.industry===r.service),urgency={urgent:'Gấp',soon:'Trong thời gian tới',exploring:'Đang tìm hiểu'}[r.urgency];
 const result=await notify((r.kind==='recruitment'?'Đăng ký CTV: ':'Yêu cầu dịch vụ: ')+spec.title,{id:r.id,name:r.name,phone:r.phone,area:r.address,type:spec.title,intent:'tenant',ownerNotes:['Tuổi: '+(r.age??'Không cung cấp'),'Nhu cầu: '+r.need,'Mức độ cần: '+urgency,'Đã đồng ý liên hệ.','Quản lý: /admin → Đăng ký dịch vụ / CTV'].join('\n')});
 await db('service_requests',{method:'PATCH',query:'?id=eq.'+id+'&notification_state=eq.sending',body:{notification_state:result.sent?'sent':'failed',notification_error:result.sent?'':String(result.error||'Chưa gửi được thông báo').slice(0,500),notified_at:result.sent?new Date().toISOString():null}});
 return result.sent;
}
export async function handleServiceRequests(req,res){
 try{
  if(req.method==='GET'){requireAdmin(req);const p=new URL(req.url,'http://localhost').searchParams,offset=Number(p.get('offset')||0);if(!Number.isInteger(offset)||offset<0||offset>100000)throw problem(400,'Trang không hợp lệ.');const rows=await db('service_requests',{query:'?select=id,service,kind,name,phone,address,age,need,urgency,status,notification_state,notification_error,created_at&order=created_at.desc,id.desc&limit=21&offset='+offset});return send(res,200,{requests:rows.slice(0,20),hasMore:rows.length>20});}
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!sameOrigin(req))throw problem(403,'Yêu cầu không hợp lệ.');
  if(limited(req,8))throw problem(429,'Anh/chị vui lòng chờ một phút rồi thử lại.');
  const body=await readJson(req,5000);
  if(body.action){requireAdmin(req);if(!uuid.test(body.id||''))throw problem(400,'Mã không hợp lệ.');if(body.action==='retry-notification'){
   // Recover an interrupted delivery only after its lease has expired.
   await db('service_requests',{method:'PATCH',query:'?id=eq.'+body.id+'&notification_state=eq.sending&notification_claimed_at=lt.'+new Date(Date.now()-300000).toISOString(),body:{notification_state:'failed'}});
   const sent=await deliverServiceRequest(body.id);return send(res,200,{saved:true,sent:sent===true});
  }if(body.action!=='request-status'||!['new','contacted','closed'].includes(body.status))throw problem(400,'Thao tác không hợp lệ.');await db('service_requests',{method:'PATCH',query:'?id=eq.'+body.id,body:{status:body.status}});return send(res,200,{saved:true});}
  const record=serviceRequest(body),hash=createHash('sha256').update(JSON.stringify(record)).digest('hex');
  const inserted=await db('service_requests',{method:'POST',query:'?on_conflict=id&select=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{...record,request_hash:hash}});
  if(!inserted.length){const prior=(await db('service_requests',{query:'?id=eq.'+record.id+'&select=request_hash,notification_state'}))[0];if(!prior||prior.request_hash!==hash)throw problem(409,'Yêu cầu đã thay đổi. Vui lòng bắt đầu đăng ký mới.');return send(res,200,{received:true,notificationPending:prior.notification_state!=='sent'});}
  let sent=false;try{sent=await deliverServiceRequest(record.id)}catch{/* The registration is durable and visible to admin even if notification fails. */}
  return send(res,200,{received:true,notificationPending:sent!==true});
 }catch(e){return send(res,e.status||503,{error:e.status?e.message:'Chưa lưu được đăng ký. Anh/chị vui lòng thử lại hoặc gọi 0906 215 365.'});}
}
