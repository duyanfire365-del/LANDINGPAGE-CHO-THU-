import {createHash} from 'node:crypto';
import {db,problem} from './platform.mjs';
import {inquiryCriteria,intentLabels,isConsignment} from './inquiries.mjs';
import {customerData} from './customer-rules.mjs';
import {linkedBot,linkedTelegram} from './linked-telegram-bots.mjs';
export async function inquiryRows(filters={}){
 const intent=filters.intent||'',status=filters.status||'',q=String(filters.q||'').replace(/[^\p{L}\p{N} ]/gu,'').slice(0,100);if(intent&&!intentLabels[intent]||status&&!['new','contacted','following','closed'].includes(status))throw problem(400,'Bộ lọc hồ sơ không hợp lệ.');
 const query=(intent?'&intent=eq.'+intent:'')+(status?'&management_status=eq.'+status:'')+(q?'&or='+encodeURIComponent('(name.ilike.*'+q+'*,phone.ilike.*'+q+'*,area.ilike.*'+q+'*)'):'');const all=[];
 for(let offset=0;offset<10000;offset+=500){const rows=await db('inquiries',{query:'?order=created_at.desc,id.desc&limit=500&offset='+offset+query});all.push(...rows);if(rows.length<500)return all;}throw problem(413,'Có trên 10.000 hồ sơ; anh lọc nhỏ hơn trước khi tổng hợp.');
}
export function inquiryCustomer(row){const c=inquiryCriteria(row),max={'under-5':5,'under-10':10,'10-20':20,'20-30':30,'30-50':50}[row.budget];return customerData({name:row.name,phone:row.phone,area:c.area,type:c.type,budget:c.budget,maxBudget:c.maxBudget||max||null,minSize:c.minSize,industry:c.industry,requirements:c.requirements,source:'Khách gửi thông tin website',sourceText:row.owner_notes||''});}
export async function syncWebsiteCustomers(input){
 const inquiries=(input||await inquiryRows({intent:'tenant'})).filter(r=>r.intent==='tenant').sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))),watch=[];
 for(let offset=0;offset<10000;offset+=500){const rows=await db('customer_watch',{query:'?owner_id=is.null&order=id.asc&limit=500&offset='+offset});watch.push(...rows);if(rows.length<500)break;if(offset===9500)throw problem(413,'Kho khách vượt giới hạn đồng bộ; cần phân trang thêm.');}
 const byPhone=new Map(watch.map(r=>[String(r.data?.phone||'').replace(/^\+84/,'0'),r])),seen=new Set();let created=0,updated=0,skipped=0;
 for(const row of inquiries){const incoming=inquiryCustomer(row);if(!incoming.phone||seen.has(incoming.phone)){skipped++;continue}seen.add(incoming.phone);const old=byPhone.get(incoming.phone);if(old?.data?.websiteInquiryId===row.id&&old.data.websiteInquiryStatus===(row.management_status||'new')){skipped++;continue}
  const data={...(old?.data||{})};const newer=!old?.data?.websiteInquiryCreatedAt||row.created_at>old.data.websiteInquiryCreatedAt||row.id===old.data.websiteInquiryId;
  if(newer)for(const [key,value]of Object.entries(incoming))if(value!==''&&value!=null&&(!old?.data?.[key]||old.data.websiteInquiryId))data[key]=value;
  if(!newer){skipped++;continue}Object.assign(data,{websiteInquiryId:row.id,websiteInquiryCreatedAt:row.created_at,websiteInquiryStatus:row.management_status||'new'});
  const status=old&&!old.data.websiteInquiryId?old.status||'active':({closed:'closed',following:'following'})[row.management_status]||'active',dedup_key=createHash('sha256').update('admin|'+incoming.phone).digest('hex');
  if(old){const saved=await db('customer_watch',{method:'PATCH',query:'?id=eq.'+old.id+'&updated_at=eq.'+encodeURIComponent(old.updated_at),body:{data,status,updated_at:new Date().toISOString()}});if(saved.length)updated++;else skipped++;}
  else{const saved=await db('customer_watch',{method:'POST',query:'?on_conflict=dedup_key',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{owner_id:null,data,status,dedup_key}});if(saved.length){created++;byPhone.set(incoming.phone,saved[0]);}else skipped++;}
 }
 return {created,updated,skipped};
}
export async function sendInquirySummary(filters={}){
 const rows=await inquiryRows(filters),counts=Object.fromEntries(Object.keys(intentLabels).map(k=>[k,rows.filter(r=>r.intent===k).length]));const details=rows.slice(0,12).map(r=>{const price=r.owner_price??r.owner_rent;return [intentLabels[r.intent],r.name,r.phone,r.area,r.type,r.intent==='tenant'?r.budget:price==null?'Giá thỏa thuận':price+(r.intent==='owner'?' triệu/tháng':' triệu đồng')].filter(Boolean).join(' · ')});
 const text=['TỔNG HỢP KHÁCH & KÝ GỬI',...Object.entries(counts).map(([k,v])=>intentLabels[k]+': '+v),'Tổng: '+rows.length+' hồ sơ','',...details,rows.length>12?'Hiển thị 12 hồ sơ mới nhất; xuất tệp trong quản trị để lấy toàn bộ.':'','https://nguonchothue.vn/admin'].join('\n');
 const bot=linkedBot('notification')||linkedBot('source');if(!bot)throw problem(503,'Chưa cấu hình bot Telegram nhận tổng hợp.');const chunks=[];let part='';for(const line of text.split('\n')){if((part+'\n'+line).length>3500){chunks.push(part);part=''}part+=(part?'\n':'')+line;}if(part)chunks.push(part);for(const chunk of chunks)await linkedTelegram(bot,'sendMessage',{chat_id:bot.owner,text:chunk,protect_content:true});await db('notification_log',{method:'POST',body:{kind:'inquiry-summary',record_id:JSON.stringify({counts,total:rows.length,filters}),sent:true}}).catch(()=>{});return {sent:true,total:rows.length,counts};
}
