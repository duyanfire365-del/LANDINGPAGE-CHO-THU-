import {createHash,timingSafeEqual,randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {readJson,send} from '../lib/http.mjs';
import {db,problem} from '../lib/platform.mjs';
import {listings} from './admin.mjs';
import {sourceReply} from '../lib/source-bot-health.mjs';
import {brandingQR} from '../lib/branding-settings.mjs';
const expires=1793124736848;
const scenes=new Set(['cafe','eatery','restaurant','beer','retail','townhouse','villa']);
export default async function handler(req,res){
 try{
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  const expected=process.env.BATCH_IMPORT_SECRET||'',provided=String(req.headers.authorization||'').replace(/^Bearer /,'');
  if(Date.now()>expires||expected.length<32)return send(res,503,{error:'Batch transfer disabled'});
  if(!timingSafeEqual(createHash('sha256').update(expected).digest(),createHash('sha256').update(provided).digest()))return send(res,403,{error:'Forbidden'});
  const body=await readJson(req,1500000);
  if(body.batch!=='uploads-20261027')throw problem(400,'Invalid batch');
  if(body.action==='inspect'){const qr=await brandingQR();return send(res,200,{items:await listings(),qr:{custom:qr.custom,revision:qr.revision}})}
  if(body.action==='upload'){
   if(!scenes.has(body.scene)||typeof body.base64!=='string'||body.base64.length>1400000)throw problem(400,'Invalid image');
   const path='editor-ai/uploads-20261027/'+body.scene+'-v1.jpg';
   const existing=await db('assets',{query:'?path=eq.'+encodeURIComponent(path)+'&limit=1'});if(existing[0])return send(res,200,{asset:existing[0]});
   const raw=Buffer.from(body.base64,'base64'),meta=await sharp(raw,{limitInputPixels:12000000}).metadata();
   if(!['jpeg','png','webp'].includes(meta.format)||meta.width<480||meta.height<320)throw problem(400,'Invalid image dimensions');
   const bytes=await sharp(raw,{limitInputPixels:12000000}).rotate().resize({width:1536,height:1536,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:88}).toBuffer();
   const key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=process.env.SUPABASE_URL.replace(/\/$/,'')+'/storage/v1/object/rental-private/'+path;
   const uploaded=await fetch(url,{method:'POST',headers:{apikey:key,...(key.startsWith('sb_')?{}:{Authorization:'Bearer '+key}),'Content-Type':'image/jpeg','x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(20000)});
   if(!uploaded.ok&&uploaded.status!==409)throw problem(502,'Image upload not confirmed');
   const asset={id:randomUUID(),owner_id:null,path,name:'anh-minh-hoa-ai-'+body.scene+'.jpg',mime:'image/jpeg',size:bytes.length,kind:'image'};
   const rows=await db('assets',{method:'POST',body:asset});return send(res,200,{asset:rows[0]});
  }
  if(body.action==='notify'){
   if(typeof body.text!=='string'||!body.text.trim()||body.text.length>3900)throw problem(400,'Invalid message');
   const record='uploads-20261027:'+createHash('sha256').update(body.text).digest('hex');
   const old=await db('notification_log',{query:'?kind=eq.batch-import-result&record_id=eq.'+record+'&sent=eq.true&limit=1'});if(old.length)return send(res,200,{sent:true,reused:true});
   const sent=await sourceReply(async(method,payload)=>{const response=await fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_SOURCE_BOT_TOKEN.trim()+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});const result=await response.json();if(!response.ok||!result.ok)throw Object.assign(Error('Telegram rejected'),{telegramCode:result.error_code||response.status,retryAfter:result.parameters?.retry_after});return result.result},body.text);
   await db('notification_log',{method:'POST',body:{kind:'batch-import-result',record_id:record,sent}});return send(res,sent?200:502,{sent});
  }
  throw problem(400,'Invalid action');
 }catch(error){return send(res,error.status||502,{error:error.status&&error.status<500?error.message:'Batch operation not completed'})}
}
