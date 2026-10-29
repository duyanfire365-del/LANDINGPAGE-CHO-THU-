import {createHash,timingSafeEqual} from 'node:crypto';
import {waitUntil} from '@vercel/functions';
import {send} from '../lib/http.mjs';
import {db} from '../lib/platform.mjs';
import {automationConfiguration,processSource} from '../lib/source-automation.mjs';
export default async function handler(req,res){
 const key=process.env.CRON_SECRET;
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 if(!key||key.length<32||!timingSafeEqual(createHash('sha256').update(req.headers.authorization||'').digest(),createHash('sha256').update('Bearer '+key).digest()))return send(res,401,{error:'Unauthorized'});
 waitUntil(import('../lib/source-delivery-recovery.mjs').then(m=>m.recoverSourceDeliveries()).catch(()=>{}));
 waitUntil(import('../lib/google-commands.mjs').then(m=>m.scheduledGoogleCommands()));
 const customerWork=async()=>{try{const {db}=await import('../lib/platform.mjs');const {processCustomerImport}=await import('../lib/customer-imports.mjs');await db('customer_imports',{method:'PATCH',query:'?status=eq.processing&updated_at=lt.'+encodeURIComponent(new Date(Date.now()-600000).toISOString()),body:{status:'review',error:'Lần xử lý trước bị gián đoạn. Kiểm tra bản gốc và bổ sung văn bản để xử lý lại.'}});const rows=await db('customer_imports',{query:'?status=eq.received&order=created_at.asc&limit=3'});for(const row of rows)await processCustomerImport(row.id);await (await import('../lib/customers.mjs')).matchNewStock();await (await import('../lib/customer-sheets.mjs')).autoCustomerSheet();}catch{}};waitUntil(customerWork());
 if(!automationConfiguration().enabled)return send(res,200,{enabled:false});
 try{
  const stale=new Date(Date.now()-10*60*1000).toISOString();
  const rows=await db('source_inbox',{query:'?or=(processing_status.eq.received,processing_status.eq.failed,processing_status.eq.blocked,and(processing_status.eq.processing,processing_started_at.lt.'+stale+'))&attempts=lt.3&order=created_at.asc&limit=2'});
  waitUntil(Promise.all(rows.map(row=>processSource(row.id))));return send(res,200,{queued:rows.length});
 }catch{return send(res,503,{error:'Source queue unavailable'})}
}
