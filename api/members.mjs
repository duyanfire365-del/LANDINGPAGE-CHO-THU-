import {identity,identityFields} from '../lib/member-identity.mjs';
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
  const id=identity(body),fields=identityFields(id),password=typeof body.password==='string'?body.password:'';
  const setSession=session=>{if(!session?.access_token)throw Object.assign(Error('Chưa có phiên đăng nhập. Vui lòng xác minh tài khoản.'),{status:401});res.setHeader('Set-Cookie',memberCookie(req,session.access_token,Math.min(session.expires_in||3600,3600)))};
  if(body.action==='verify-otp'){
   const token=clean(body.token,10);if(!/^\d{6,10}$/.test(token))return send(res,400,{error:'Nhập mã OTP gồm 6–10 chữ số.'});
   if(!['signup','login'].includes(body.purpose))return send(res,400,{error:'Yêu cầu mã không hợp lệ.'});
   let session;try{session=await supa('/auth/v1/verify',{method:'POST',auth:'anon',body:{...fields,token,type:body.purpose==='signup'?'signup':'email'}})}catch{return send(res,400,{error:'Mã OTP không đúng, đã dùng hoặc hết hạn. Hãy yêu cầu mã mới.'})}
   setSession(session);return send(res,200,{ok:true,verified:true});
  }
  if(body.action==='send-login-otp'||body.action==='resend-otp'){
   try{await supa(body.action==='resend-otp'?'/auth/v1/resend':'/auth/v1/otp',{method:'POST',auth:'anon',body:body.action==='resend-otp'?{...fields,type:'signup'}:{...fields,create_user:false}})}catch(error){return send(res,error.status===429?429:503,{error:'Chưa gửi được email OTP. Vui lòng thử lại sau; quản trị cần kiểm tra dịch vụ email và giới hạn gửi trong Supabase.'})}
   return send(res,200,{otpRequired:true,channel:id.channel,purpose:body.action==='resend-otp'?'signup':'login',message:'Nếu tài khoản hợp lệ, mã xác nhận sẽ được gửi. Kiểm tra hộp thư rác nếu dùng email.'});
  }

  if(password.length<12||password.length>128)return send(res,400,{error:'Nhập mật khẩu từ 12 đến 128 ký tự.'});
  if(body.action==='register'){
   const full_name=clean(body.name,100),phone=clean(body.phone,20),kind=body.kind;
   if(!full_name||(phone&&!/^(0|\+84)\d{9}$/.test(phone))||!['customer','sales'].includes(kind)||body.consent!==true)return send(res,400,{error:'Vui lòng điền đủ thông tin và đồng ý tạo hồ sơ.'});
   const settings=await supa('/auth/v1/settings',{auth:'anon'});if(settings.mailer_autoconfirm===true)return send(res,503,{error:'Quản trị cần bật xác minh '+'email'+' bằng OTP trong Supabase trước khi nhận đăng ký.'});if(settings.external?.[id.channel]===false)return send(res,503,{error:'Phương thức đăng ký này chưa được bật. Vui lòng chọn phương thức khác hoặc liên hệ quản trị.'});
   let data;try{data=await supa('/auth/v1/signup',{method:'POST',auth:'anon',body:{...fields,password,data:{full_name,phone,kind}}})}catch{return send(res,503,{error:'Chưa gửi được mã đăng ký. Vui lòng thử lại sau hoặc liên hệ quản trị kiểm tra dịch vụ email.'})}
   // Supabase can deliberately return an obfuscated response for an existing email.
   if(data.user?.id&&data.user.identities?.length){
    const notice=await notify('Đăng ký thành viên mới',{id:data.user.id,full_name,phone});
    await db('notification_log',{method:'POST',body:{kind:'member',record_id:data.user.id,sent:notice.sent}}).catch(()=>{});
   }
   return send(res,200,{otpRequired:true,channel:id.channel,purpose:'signup',message:'Nếu thông tin hợp lệ, mã OTP sẽ được gửi tới '+'email'+'. Nhập mã để xác minh tài khoản. Sale/CTV cần được quản trị cấp quyền gửi tin.'});
  }
  if(body.action!=='login')return send(res,400,{error:'Yêu cầu không hợp lệ.'});
  let session;try{session=await supa('/auth/v1/token?grant_type=password',{method:'POST',auth:'anon',body:{...fields,password}})}catch{return send(res,401,{error:'Chưa đăng nhập được. Kiểm tra email, mật khẩu và xác minh tài khoản.'})}
  if(!session?.access_token)return send(res,401,{error:'Vui lòng xác minh tài khoản trước khi đăng nhập.'});
  setSession(session);
  return send(res,200,{ok:true});
 }catch(error){return send(res,error.status||502,{error:error.message||'Chưa kết nối được hệ thống thành viên.'})}
}
