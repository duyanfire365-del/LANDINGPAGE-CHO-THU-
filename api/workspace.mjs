import {updateInventory} from '../lib/inventory.mjs';
import {waitUntil} from '@vercel/functions';
import {canonicalizeSubset,persistIdentities} from '../lib/listing-catalog.mjs';
import {readJson,send,sameOrigin,limited} from '../lib/http.mjs';
import {actor,requireAdmin,db,clean,notify,configured,telegramConfiguration} from '../lib/platform.mjs';
import {draft} from '../lib/posts.mjs';
import {intentLabels} from '../lib/inquiries.mjs';
export default async function handler(req,res){
 try{
  if(req.method==='GET'){
   const params=new URL(req.url,'http://localhost').searchParams;
   if(params.get('view')==='connections'){
    requireAdmin(req);let storageReady=false;
    if(configured())try{await Promise.all([db('inquiries',{query:'?select=id&limit=1'}),db('profiles',{query:'?select=id&limit=1'})]);storageReady=true}catch{}
    return send(res,200,{storageConfigured:configured(),storageReady,telegramConfigured:telegramConfiguration().ready,telegramError:telegramConfiguration().error||null});
   }
   if(params.get('view')==='inquiries'){
    requireAdmin(req);
    const page=Number(params.get('page')||0),intent=params.get('intent')||'',state=params.get('status')||'';
    if(!Number.isInteger(page)||page<0||page>100000||(intent&&!Object.hasOwn(intentLabels,intent))||(state&&!['new','contacted','following','closed'].includes(state)))return send(res,400,{error:'Bộ lọc hồ sơ không hợp lệ.'});
    let query='?order=created_at.desc&limit=21&offset='+page*20;
    if(intent)query+='&intent=eq.'+intent;
    if(state)query+='&management_status=eq.'+state;
    const search=clean(params.get('q'),100).replace(/[^\p{L}\p{N}\s+@.-]/gu,'').trim();
    if(search)query+='&or=(name.ilike.*'+encodeURIComponent(search)+'*,phone.ilike.*'+encodeURIComponent(search)+'*,area.ilike.*'+encodeURIComponent(search)+'*)';
    const rows=await db('inquiries',{query});return send(res,200,{inquiries:rows.slice(0,20),hasMore:rows.length>20,page});
   }
   const who=await actor(req),query=who.admin?'?order=created_at.desc&limit=500':'?author_id=eq.'+who.id+'&order=created_at.desc&limit=100';
   if(who.admin){const [members,inquiries,posts,notifications]=await Promise.all([db('profiles',{query:'?order=created_at.desc&limit=500'}),db('inquiries',{query:'?order=created_at.desc&limit=500'}),db('posts',{query}),db('notification_log',{query:'?sent=eq.false&order=created_at.desc&limit=100'})]);const standardized=await canonicalizeSubset(posts);return send(res,200,{members,inquiries,posts:standardized,notifications,identityNeedsSync:posts.some((row,i)=>row.public_data.code!==standardized[i].public_data.code||row.public_data.title!==standardized[i].public_data.title)})}
   const [posts,inquiries]=await Promise.all([db('posts',{query}),db('inquiries',{query:'?member_id=eq.'+who.id+'&select=id,intent,area,type,created_at&order=created_at.desc&limit=100'})]);return send(res,200,{posts:(await canonicalizeSubset(posts)).map(({private_data,...post})=>post),inquiries,canPost:who.kind==='sales'&&who.can_post});
  }
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!sameOrigin(req))return send(res,403,{error:'Yêu cầu không hợp lệ.'});
  if(limited(req,30))return send(res,429,{error:'Vui lòng chờ rồi thử lại.'});
  const body=await readJson(req,20000);
  if(body.action==='inventory')return send(res,200,await updateInventory(req,body));
  if(body.action==='submit'){
   const who=await actor(req,{posting:true}),record=await draft(body,who),rows=await db('posts',{method:'POST',body:record});
   const canonical=(await canonicalizeSubset(rows))[0];await db('posts',{method:'PATCH',query:'?id=eq.'+rows[0].id,body:{public_data:canonical.public_data}});
   const notice=await notify('Có tin đang chờ duyệt',{id:canonical.public_data.code,name:canonical.public_data.title});await db('notification_log',{method:'POST',body:{kind:'post',record_id:rows[0].id,sent:notice.sent}}).catch(()=>{});
   return send(res,201,{submitted:true,id:rows[0].id});
  }
  requireAdmin(req);
  if(body.action==='normalize-identities'){waitUntil(persistIdentities().catch(()=>{}));return send(res,202,{queued:true});}
  if(body.action==='telegram-test'){
   if(!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID)return send(res,503,{error:'Cần thêm TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID vào Vercel, rồi Redeploy.'});
   const result=await notify('Thông báo thử — đã kết nối website với Telegram',{id:'kiem-tra-ket-noi'});
   return send(res,result.sent?200:502,result.sent?{sent:true}:{error:result.error});
  }
  if(body.action==='edit-post'){
   if(!/^[-\da-f]{36}$/i.test(body.id))return send(res,400,{error:'Mã tin không hợp lệ.'});
   const rows=await db('posts',{query:'?id=eq.'+body.id});if(!rows[0])return send(res,404,{error:'Không tìm thấy tin.'});
   const {safePublicText}=await import('../lib/posts.mjs');
   const description=clean(body.description,3000),size=Number(body.size),price=Number(body.price);
   if(!description||!safePublicText(description)||!Number.isFinite(size)||size<=0||size>10000000||!Number.isFinite(price)||price<=0||price>1000000)return send(res,400,{error:'Kiểm tra diện tích, giá và mô tả. Phần công khai không chứa số nhà/ngõ/ngách, hashtag hoặc liên kết.'});
   const p=rows[0].public_data,public_data={...p,description,size,price,areaText:size+' m²'};
   public_data.shareText=`${p.title}\nKhu vực: ${p.address}\nDiện tích: ${size} m²\nGiá thuê: ${price} triệu đồng/tháng\n${description}\nLiên hệ: 0906215365`;
   const private_data={...rows[0].private_data,address:clean(body.privateAddress,500),hashtags:clean(body.hashtags,1500).match(/#[\p{L}\p{N}_]+/gu)||[]};
   await db('posts',{method:'PATCH',query:'?id=eq.'+body.id,body:{public_data,private_data}});
   const canonical=(await canonicalizeSubset([{...rows[0],public_data,private_data}]))[0];
   await db('posts',{method:'PATCH',query:'?id=eq.'+body.id,body:{public_data:canonical.public_data}});
   return send(res,200,{saved:true});
  }
  if(body.action==='inquiry-update'){
   if(!/^[-\da-f]{36}$/i.test(body.id)||!['new','contacted','following','closed'].includes(body.status)||typeof body.notes!=='string'||body.notes.length>4000)return send(res,400,{error:'Thông tin cập nhật hồ sơ không hợp lệ.'});
   const rows=await db('inquiries',{method:'PATCH',query:'?id=eq.'+body.id,body:{management_status:body.status,admin_notes:body.notes.trim(),updated_at:new Date().toISOString()}});
   if(!rows.length)return send(res,404,{error:'Không tìm thấy hồ sơ.'});
   return send(res,200,{saved:true});
  }
  if(body.action==='retry'){
   if(!/^[-\da-f]{36}$/i.test(body.id))return send(res,400,{error:'Mã thông báo không hợp lệ.'});
   if(!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID)return send(res,503,{error:'Cần cấu hình Telegram trước khi gửi lại.'});
   const rows=await db('notification_log',{query:'?id=eq.'+body.id});if(!rows[0])return send(res,404,{error:'Không tìm thấy thông báo.'});
   const entry=rows[0],table=({member:'profiles',inquiry:'inquiries',post:'posts'})[entry.kind];if(!table)return send(res,400,{error:'Loại thông báo không hợp lệ.'});
   const records=await db(table,{query:'?id=eq.'+encodeURIComponent(entry.record_id)});if(!records[0])return send(res,404,{error:'Hồ sơ đã bị xóa.'});
   const notice=await notify('Thông báo gửi lại: '+entry.kind,records[0]);if(!notice.sent)return send(res,502,{error:notice.error||'Telegram chưa xác nhận nhận thông báo.'});
   await db('notification_log',{method:'PATCH',query:'?id=eq.'+body.id,body:{sent:true}});return send(res,200,{ok:true});
  }
  if(body.action==='permission'){
   if(!/^[-\da-f]{36}$/i.test(body.id)||typeof body.canPost!=='boolean')return send(res,400,{error:'Thông tin cấp quyền không hợp lệ.'});
   await db('profiles',{method:'PATCH',query:'?id=eq.'+body.id+'&kind=eq.sales',body:{can_post:body.canPost}});return send(res,200,{ok:true});
  }
  if(body.action==='review'){
   if(!/^[-\da-f]{36}$/i.test(body.id)||!['published','rejected'].includes(body.status))return send(res,400,{error:'Thông tin duyệt không hợp lệ.'});
   const posts=await db('posts',{query:'?id=eq.'+body.id});if(!posts[0])return send(res,404,{error:'Không tìm thấy tin.'});
   // Revalidate public fields, including data imported/edited outside this interface.
   const {safePublicText}=await import('../lib/posts.mjs');const p=posts[0].public_data;
   if(body.status==='published'&&(!safePublicText([p.title,p.address,p.description].join(' '))||p.hashtags||!p.title))return send(res,400,{error:'Tin có thông tin riêng tư trong phần công khai. Cần sửa bản nháp trước khi duyệt.'});
   await db('posts',{method:'PATCH',query:'?id=eq.'+body.id,body:{status:body.status,reviewed_at:new Date().toISOString()}});return send(res,200,{ok:true});
  }
  return send(res,400,{error:'Yêu cầu không hợp lệ.'});
 }catch(error){return send(res,error.status||502,{error:error.message||'Chưa xử lý được yêu cầu.'})}
}
