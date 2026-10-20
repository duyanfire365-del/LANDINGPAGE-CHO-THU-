import {readJson,send,sameOrigin,limited} from '../lib/http.mjs';
import {configured,supa,member,memberCookie,clean,notify,db} from '../lib/platform.mjs';
export default async function handler(req,res){
 if(req.method==='GET'){
  try{return send(res,200,{enabled:configured(),profile:configured()?await member(req):null})}catch{return send(res,503,{error:'Chưa kết nối được hệ thống thành viên.'})}
 }
 if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
 if(!sameOrigin(req))return send(res,403,{error:'Yêu cầu không hợp lệ.'});
 if(limited(req,8))return send(res,429,{error:'Vui lòng chờ một phút rồi thử lại.'});
 try{
  const body=await readJson(req,5000);
  if(body.action==='logout'){res.setHeader('Set-Cookie',memberCookie(req,'',0));return send(res,200,{ok:true})}
  const email=clean(body.email,254).toLowerCase(),password=typeof body.password==='string'?body.password:'';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12||password.length>128)return send(res,400,{error:'Nhập email hợp lệ và mật khẩu từ 12 đến 128 ký tự.'});
  if(body.action==='register'){
   const full_name=clean(body.name,100),phone=clean(body.phone,20),kind=body.kind;
   if(!full_name||!/^(0|\+84)\d{9}$/.test(phone)||!['customer','sales'].includes(kind)||body.consent!==true)return send(res,400,{error:'Vui lòng điền đủ thông tin và đồng ý tạo hồ sơ.'});
   const data=await supa('/auth/v1/signup',{method:'POST',auth:'anon',body:{email,password,data:{full_name,phone,kind}}});
   // Supabase can deliberately return an obfuscated response for an existing email.
   if(data.user?.id&&data.user.identities?.length){
    const notice=await notify('Đăng ký thành viên mới',{id:data.user.id,full_name,phone});
    await db('notification_log',{method:'POST',body:{kind:'member',record_id:data.user.id,sent:notice.sent}}).catch(()=>{});
   }
   return send(res,200,{message:'Nếu email hợp lệ, anh/chị sẽ nhận hướng dẫn xác nhận tài khoản. Sau khi xác nhận, vui lòng đăng nhập. Sale/CTV cần được quản trị viên cấp quyền trước khi gửi tin.'});
  }
  if(body.action!=='login')return send(res,400,{error:'Yêu cầu không hợp lệ.'});
  let session;try{session=await supa('/auth/v1/token?grant_type=password',{method:'POST',auth:'anon',body:{email,password}})}catch{return send(res,401,{error:'Chưa đăng nhập được. Kiểm tra email, mật khẩu và xác nhận email.'})}
  if(!session?.access_token)return send(res,401,{error:'Vui lòng xác nhận email trước khi đăng nhập.'});
  res.setHeader('Set-Cookie',memberCookie(req,session.access_token,Math.min(session.expires_in||3600,3600)));
  return send(res,200,{ok:true});
 }catch(error){return send(res,error.status||502,{error:error.message||'Chưa kết nối được hệ thống thành viên.'})}
}
