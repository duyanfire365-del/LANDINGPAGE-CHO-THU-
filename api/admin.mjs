import {createHash,createHmac,createDecipheriv,timingSafeEqual,randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {readJson,send,sameOrigin,limited} from '../lib/http.mjs';
const lifetime=8*60*60;
function equal(a,b){const x=createHash('sha256').update(a).digest(),y=createHash('sha256').update(b).digest();return timingSafeEqual(x,y)}
function signature(value,secret){return createHmac('sha256','rental-admin-session:'+secret).update(value).digest('base64url')}
function authenticated(req,secret){
 const token=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('rental_admin='))?.slice(13)||'';
 const [expires,nonce,sig,...extra]=token.split('.');
 return extra.length===0&&/^\d+$/.test(expires||'')&&Number(expires)>Date.now()&&Number(expires)<=Date.now()+lifetime*1000&&!!nonce&&!!sig&&equal(sig,signature(expires+'.'+nonce,secret));
}
function cookie(req,value,maxAge){
 const secure=process.env.VERCEL||req.headers['x-forwarded-proto']==='https'||req.socket?.encrypted;
 return `rental_admin=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`;
}
async function listings(secret){
 const payload=JSON.parse(await readFile(new URL('../lib/admin-listings.enc.json',import.meta.url),'utf8'));
 const key=createHash('sha256').update('rental-admin-data:'+secret).digest();
 const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(payload.iv,'base64'));
 decipher.setAuthTag(Buffer.from(payload.tag,'base64'));
 return JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload.data,'base64')),decipher.final()]).toString('utf8'));
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Vary','Cookie');
 const secret=process.env.ADMIN_SECRET;
 if(!secret||secret.length<32)return send(res,503,{error:'Trang quản trị chưa được kích hoạt. Cần cấu hình khóa bảo mật trong Vercel.'});
 if(req.method==='POST'){
  if(!sameOrigin(req))return send(res,403,{error:'Yêu cầu không hợp lệ.'});
  if(limited(req,6))return send(res,429,{error:'Anh/chị vui lòng chờ một phút rồi thử lại.'});
  try{
   const body=await readJson(req,2000);
   if(body.action==='logout'){res.setHeader('Set-Cookie',cookie(req,'',0));return send(res,200,{authenticated:false})}
   if(body.action!=='login'||typeof body.password!=='string'||!equal(body.password,secret))return send(res,401,{error:'Khóa đăng nhập không đúng.'});
   // Verify the configured key can decrypt the data before issuing a session.
   await listings(secret);
   const value=String(Date.now()+lifetime*1000)+'.'+randomBytes(24).toString('base64url');
   res.setHeader('Set-Cookie',cookie(req,value+'.'+signature(value,secret),lifetime));
   return send(res,200,{authenticated:true});
  }catch(error){return send(res,error.status||503,{error:error.status?'Yêu cầu không hợp lệ.':'Khóa cấu hình chưa khớp dữ liệu quản trị.'})}
 }
 if(req.method!=='GET'){res.setHeader('Allow','GET, POST');return send(res,405,{error:'Method not allowed'})}
 if(!authenticated(req,secret))return send(res,401,{error:'Vui lòng đăng nhập quản trị.'});
 try{return send(res,200,{listings:await listings(secret)})}catch{return send(res,503,{error:'Chưa đọc được dữ liệu quản trị. Vui lòng kiểm tra khóa cấu hình.'})}
}
