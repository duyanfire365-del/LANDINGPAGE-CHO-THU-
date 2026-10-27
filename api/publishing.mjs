import {waitUntil} from '@vercel/functions';
import {createHash,timingSafeEqual} from 'node:crypto';
import {authenticated} from './admin.mjs';
import {readJson,send,sameOrigin,limited} from '../lib/http.mjs';
import {configured,db} from '../lib/platform.mjs';
import {publishContinuously,retryPendingPublishingNotices,preparePublishing,publishingStatus,retryPublishingNotice,uploadPublishingImage} from '../lib/publishing.mjs';
const digest=value=>createHash('sha256').update(value).digest();
export function publishingActor(req){
 if(authenticated(req))return {automation:false};
 const expected=process.env.PUBLISHING_AUTOMATION_KEY||'',header=String(req.headers.authorization||'');
 if(expected.length>=32&&header.startsWith('Bearer ')&&timingSafeEqual(digest(expected),digest(header.slice(7))))return {automation:true};
 return null;
}
export default async function handler(req,res){
 try{
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  const actor=publishingActor(req);if(!actor)return send(res,401,{error:'Cần đăng nhập quản trị hoặc khóa nhập tin được cấp quyền.'});
  if(!sameOrigin(req))return send(res,403,{error:'Yêu cầu khác nguồn không được chấp nhận.'});
  if(limited(req,60))return send(res,429,{error:'Vui lòng chờ một phút rồi tiếp tục với cùng mã lượt nhập.'});
  const body=await readJson(req,1500000);
  if(body.action==='health'){let storageReady=false;if(configured())try{await db('source_inbox',{query:'?select=id&limit=1'});storageReady=true}catch{}return send(res,200,{permanent:true,storageReady,automationKeyConfigured:(process.env.PUBLISHING_AUTOMATION_KEY||'').length>=32,telegramReady:!!(process.env.TELEGRAM_SOURCE_BOT_TOKEN&&process.env.TELEGRAM_SOURCE_OWNER_ID),expiresAt:null,actions:['health','upload-image','preview','publish','status','retry-notification']})}
  if(!configured())return send(res,503,{error:'Chưa kết nối Supabase; nguồn chưa được đăng.'});
  if(body.action==='upload-image')return send(res,200,await uploadPublishingImage(body));
  if(body.action==='preview'){const {record,match}=await preparePublishing(body,actor);return send(res,200,{publicData:record.public_data,duplicate:!!match,existing:match?{code:match.public_data.code,href:match.public_data.href||'/bds/'+match.public_data.slug}:null})}
  if(body.action==='publish'){waitUntil(retryPendingPublishingNotices().catch(()=>{}));const result=await publishContinuously(body,actor);return send(res,result.status==='importing'?202:200,result)}
  if(body.action==='status')return send(res,200,await publishingStatus(body.requestId));
  if(body.action==='retry-notification')return send(res,200,await retryPublishingNotice(body.requestId));
  return send(res,400,{error:'Thao tác không được hỗ trợ.'});
 }catch(error){if(process.env.VERCEL)console.error(JSON.stringify({event:'publishing-request-failed',status:error.status||502,code:error.databaseCode||error.name||'Error'}));return send(res,error.status||502,{error:error.status?error.message:'Chưa hoàn tất lượt nhập. Giữ cùng mã lượt nhập để thử lại.'})}
}
