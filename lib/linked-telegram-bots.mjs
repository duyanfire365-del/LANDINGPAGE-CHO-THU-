import {createHmac,createHash} from 'node:crypto';
const defaults=[{id:'source',tokenEnv:'TELEGRAM_SOURCE_BOT_TOKEN',ownerEnv:'TELEGRAM_SOURCE_OWNER_ID',mode:'source'},{id:'customer',tokenEnv:'TELEGRAM_CUSTOMER_BOT_TOKEN',ownerEnv:'TELEGRAM_CUSTOMER_OWNER_ID',mode:'customer'},{id:'notification',tokenEnv:'TELEGRAM_BOT_TOKEN',ownerEnv:'TELEGRAM_SOURCE_OWNER_ID',mode:'source'}];
export function linkedTelegramBots(){let extra=[];try{extra=JSON.parse(process.env.TELEGRAM_LINKED_BOTS_JSON||'[]')}catch{}const map=new Map(defaults.map(b=>[b.id,b]));for(const b of Array.isArray(extra)?extra:[])if(/^[-a-z0-9_]{1,32}$/.test(b.id||'')&&/^TELEGRAM_[A-Z0-9_]*TOKEN$/.test(b.tokenEnv||'')&&/^TELEGRAM_[A-Z0-9_]*OWNER_ID$/.test(b.ownerEnv||''))map.set(b.id,{...b,mode:b.mode==='customer'?'customer':'source'});const seen=new Set();return [...map.values()].map(b=>({...b,token:process.env[b.tokenEnv]?.trim(),owner:process.env[b.ownerEnv]?.trim()})).filter(b=>/^\d+:[A-Za-z0-9_-]{25,}$/.test(b.token||'')&&/^\d+$/.test(b.owner||'')).filter(b=>{if(seen.has(b.token))return false;seen.add(b.token);return true});}
export const linkedBot=id=>linkedTelegramBots().find(b=>b.id===id);
export function linkedBotSecret(bot){return createHmac('sha256',bot.token).update(bot.id==='source'?'rental-source-webhook-v1':bot.id==='customer'?'rental-customer-webhook-v1':'rental-linked-webhook-v1:'+bot.id).digest('hex')}
export async function linkedTelegram(bot,method,body){const r=await fetch('https://api.telegram.org/bot'+bot.token+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)}),d=await r.json();if(!r.ok||!d.ok)throw Object.assign(Error('Telegram request failed'),{telegramCode:d.error_code||r.status,retryAfter:d.parameters?.retry_after});return d.result;}
export const linkedWebhookURL=bot=>bot.id==='customer'?'https://nguonchothue.vn/api/workspace?customer-hook=1':'https://nguonchothue.vn/api/telegram-inbox?webhook=1'+(bot.id==='source'?'':'&bot='+bot.id);
let startup;
export function ensureLinkedBotWebhooks(){
 if(startup)return startup;
 startup=Promise.all(linkedTelegramBots().map(async bot=>{
  try{
   const info=await linkedTelegram(bot,'getWebhookInfo',{}),url=linkedWebhookURL(bot);
   if(info.url&&new URL(info.url).hostname!=='nguonchothue.vn')return {id:bot.id,status:'foreign-webhook-preserved'};
   if(info.url!==url||!info.allowed_updates?.includes('edited_message'))await linkedTelegram(bot,'setWebhook',{url,secret_token:linkedBotSecret(bot),allowed_updates:['message','edited_message'],drop_pending_updates:false});
   return {id:bot.id,status:'connected'};
  }catch{return {id:bot.id,status:'failed'}}
 })).then(results=>{if(process.env.VERCEL)console.info(JSON.stringify({event:'linked-telegram-webhooks',results}));if(results.some(r=>r.status==='failed'))startup=null;return results});return startup;
}

export const linkedUpdateId=(botId,id)=>botId==='source'?id:'-'+BigInt('0x'+createHash('sha256').update(botId+':'+id).digest('hex').slice(0,15)).toString();
