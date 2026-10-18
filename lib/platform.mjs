import {authenticated} from '../api/admin.mjs';
export const problem=(status,message)=>Object.assign(new Error(message),{status});
export function configured(){return Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY&&process.env.SUPABASE_SERVICE_ROLE_KEY)}
export async function supa(path,{method='GET',body,auth='service',headers={}}={}){
 if(!configured())throw problem(503,'Chưa kết nối hệ thống thành viên và lưu trữ. Vui lòng liên hệ hotline.');
 const key=auth==='anon'?process.env.SUPABASE_ANON_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY;
 // New publishable/secret keys are API keys, not JWT bearer tokens.
 const authorization=key.startsWith('sb_')?{}:{Authorization:`Bearer ${key}`};
 const response=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+path,{method,headers:{apikey:key,...authorization,'Content-Type':'application/json',...headers},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{data=null}
 if(!response.ok)throw problem(response.status===401||response.status===403?401:502,'Chưa thực hiện được yêu cầu. Vui lòng kiểm tra thông tin hoặc thử lại.');
 return data;
}
export async function db(table,{query='',method='GET',body}={}){return supa('/rest/v1/'+table+query,{method,body,headers:{Prefer:'return=representation'}})}
export const clean=(value,length=300)=>typeof value==='string'?value.trim().slice(0,length):'';
export function memberCookie(req,value,age=3600){return `rental_member=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${process.env.VERCEL||req.headers['x-forwarded-proto']==='https'||req.socket?.encrypted?'; Secure':''}`}
export async function member(req){
 const token=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('rental_member='))?.slice(14);
 if(!token)return null;
 try{const user=await supa('/auth/v1/user',{auth:'anon',headers:{Authorization:'Bearer '+token}});const rows=await db('profiles',{query:'?id=eq.'+encodeURIComponent(user.id)+'&select=*'});return rows[0]||null}catch(error){if(error.status===401)return null;throw error}
}
export async function actor(req,{posting=false}={}){
 if(authenticated(req))return {admin:true,id:null};
 const profile=await member(req);if(!profile)throw problem(401,'Vui lòng đăng nhập.');
 if(posting&&!(profile.kind==='sales'&&profile.can_post))throw problem(403,'Anh/chị chưa được quản trị viên cấp quyền gửi tin.');
 return {...profile,admin:false};
}
export function requireAdmin(req){if(!authenticated(req))throw problem(401,'Vui lòng đăng nhập quản trị.')}
export function telegramConfiguration(){
 const token=process.env.TELEGRAM_BOT_TOKEN?.trim(),chat=process.env.TELEGRAM_CHAT_ID?.trim();
 if(!token||!chat)return {ready:false,error:'Chưa có đủ TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID trong môi trường Production. Thêm đủ hai biến rồi Redeploy.'};
 if(!/^\d+:[A-Za-z0-9_-]{25,}$/.test(token))return {ready:false,error:'Token Telegram chưa đúng định dạng. Chỉ dán token BotFather cấp; không thêm chữ bot, dấu < > hoặc đường dẫn. Sau khi sửa cần Redeploy.'};
 if(!/^(?:-?\d+|@[A-Za-z0-9_]{5,})$/.test(chat))return {ready:false,error:'Chat ID chưa đúng định dạng. Dán riêng dãy số chat.id, giữ dấu âm nếu là nhóm; không dán toàn bộ JSON hoặc đường dẫn. Sau khi sửa cần Redeploy.'};
 return {ready:true};
}
export async function notify(kind,record){
 const config=telegramConfiguration();if(!config.ready)return {sent:false,error:config.error};
 const text=`Nguồn cho thuê Hà Nội\n${kind}\nMã: ${record.id||record.code||''}\n${record.name||record.full_name||''}\n${record.phone||''}\n${record.area||''} ${record.type||''}\nMở trang quản trị để xem hồ sơ.`;
 try{
  const response=await fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN.trim()+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID.trim(),text,protect_content:true}),signal:AbortSignal.timeout(6000)});
  const result=await response.json();if(response.ok&&result.ok===true)return {sent:true};
  const code=result.error_code||response.status,description=String(result.description||'').toLowerCase();
  if(code===401)return {sent:false,error:'Telegram từ chối token (401). Có thể đang dùng token cũ đã thu hồi. Cập nhật token mới nhất vào Vercel Production rồi Redeploy.'};
  if(code===403)return {sent:false,error:'Bot không được phép gửi tin (403). Mở đúng bot, bỏ chặn và bấm Start; nếu gửi vào nhóm thì thêm bot và cấp quyền gửi tin.'};
  if(code===400&&description.includes('chat not found'))return {sent:false,error:'Telegram không tìm thấy cuộc trò chuyện. Bấm Start và gửi tin cho đúng bot ứng với token, lấy lại chat.id rồi cập nhật TELEGRAM_CHAT_ID và Redeploy.'};
  if(code===429)return {sent:false,error:'Telegram giới hạn gửi tin. Chờ một phút rồi thử lại.'};
  if(code===400)return {sent:false,error:'Telegram từ chối thông tin cuộc trò chuyện (400). Kiểm tra chat.id của đúng bot; giữ dấu âm nếu là nhóm.'};
  return {sent:false,error:'Telegram tạm thời chưa xác nhận nhận tin. Vui lòng thử lại sau.'};
 }catch{return {sent:false,error:'Máy chủ website chưa kết nối được Telegram hoặc kết nối hết thời gian chờ. Vui lòng thử lại.'}}
}
