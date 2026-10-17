import {readJson,send,sameOrigin,limited} from '../lib/http.mjs';
import {actor,requireAdmin,db,clean,notify} from '../lib/platform.mjs';
import {draft} from '../lib/posts.mjs';
export default async function handler(req,res){
 try{
  if(req.method==='GET'){
   const who=await actor(req),query=who.admin?'?order=created_at.desc&limit=500':'?author_id=eq.'+who.id+'&order=created_at.desc&limit=100';
   if(who.admin){const [members,inquiries,posts,notifications]=await Promise.all([db('profiles',{query:'?order=created_at.desc&limit=500'}),db('inquiries',{query:'?order=created_at.desc&limit=500'}),db('posts',{query}),db('notification_log',{query:'?sent=eq.false&order=created_at.desc&limit=100'})]);return send(res,200,{members,inquiries,posts,notifications})}
   const [posts,inquiries]=await Promise.all([db('posts',{query}),db('inquiries',{query:'?member_id=eq.'+who.id+'&select=id,intent,area,type,created_at&order=created_at.desc&limit=100'})]);return send(res,200,{posts:posts.map(({private_data,...post})=>post),inquiries,canPost:who.kind==='sales'&&who.can_post});
  }
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!sameOrigin(req))return send(res,403,{error:'Yêu cầu không hợp lệ.'});
  if(limited(req,30))return send(res,429,{error:'Vui lòng chờ rồi thử lại.'});
  const body=await readJson(req,20000);
  if(body.action==='submit'){
   const who=await actor(req,{posting:true}),record=await draft(body,who),rows=await db('posts',{method:'POST',body:record});
   const notice=await notify('Có tin đang chờ duyệt',{id:rows[0].id});await db('notification_log',{method:'POST',body:{kind:'post',record_id:rows[0].id,sent:notice.sent}}).catch(()=>{});
   return send(res,201,{submitted:true,id:rows[0].id});
  }
  requireAdmin(req);
  if(body.action==='retry'){
   if(!/^[-\da-f]{36}$/i.test(body.id))return send(res,400,{error:'Mã thông báo không hợp lệ.'});
   if(!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID)return send(res,503,{error:'Cần cấu hình Telegram trước khi gửi lại.'});
   const rows=await db('notification_log',{query:'?id=eq.'+body.id});if(!rows[0])return send(res,404,{error:'Không tìm thấy thông báo.'});
   const entry=rows[0],table=({member:'profiles',inquiry:'inquiries',post:'posts'})[entry.kind];if(!table)return send(res,400,{error:'Loại thông báo không hợp lệ.'});
   const records=await db(table,{query:'?id=eq.'+encodeURIComponent(entry.record_id)});if(!records[0])return send(res,404,{error:'Hồ sơ đã bị xóa.'});
   const notice=await notify('Thông báo gửi lại: '+entry.kind,records[0]);if(!notice.sent)return send(res,502,{error:'Telegram chưa xác nhận nhận thông báo.'});
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
