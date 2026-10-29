import {db} from './platform.mjs';
import {linkedBot,linkedTelegram} from './linked-telegram-bots.mjs';
import {sourceReply,receiptText} from './source-bot-health.mjs';
// Retry only known failed final replies. Never run the publishing pipeline again.
export async function recoverSourceDeliveries(){
 const since=new Date(Date.now()-86400000).toISOString(),before=new Date(Date.now()-120000).toISOString();
 const failed=await db('notification_log',{query:'?kind=eq.source-delivery:result&sent=eq.false&created_at=gte.'+since+'&created_at=lt.'+before+'&order=created_at.desc&limit=15'});
 const seen=new Set();let retried=0;
 for(const failure of failed){
  const id=failure.record_id;if(!/^[a-f0-9-]{36}$/i.test(id||'')||seen.has(id))continue;seen.add(id);
  const delivered=await db('notification_log',{query:'?kind=eq.source-delivery:result&sent=eq.true&record_id=eq.'+id+'&created_at=gte.'+encodeURIComponent(failure.created_at)+'&limit=1'});if(delivered.length)continue;
  const row=(await db('source_inbox',{query:'?id=eq.'+id+'&limit=1'}))[0];
  if(!row||!['published','updated','duplicate','review','failed','blocked'].includes(row.processing_status))continue;
  const bot=linkedBot(row.media?.find(m=>m.kind==='telegram-origin')?.bot||'source');if(!bot)continue;
  await sourceReply((method,body)=>linkedTelegram(bot,method,{...body,chat_id:bot.owner}),receiptText(row,true)+(row.processing_error?'\n'+row.processing_error:'')+'\nMã nguồn: '+id+'\nAnh Reply bài gốc bằng /status để kiểm tra.',{recordId:id,replyTo:row.message_id,botId:bot.id});
  if(++retried>=3)break;
 }
 return {retried};
}
