import {telegramMessageText} from './telegram-message-text.mjs';
// Normalize presentation, never invent or pad a missing contact digit.
export function customerInputText(value){return String(value??'').normalize('NFKC').replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/g,'').replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\r\n?/g,'\n').replace(/[\u00a0\u2000-\u200a\u202f]/g,' ')}
export function normalizeCustomerPhone(value){return customerInputText(value).replace(/[\s.·•()-]/g,'').replace(/^\+84/,'0')}
export function customerPhones(value){const matches=customerInputText(value).match(/(?<![\d.,])(?:\+84|0)(?:[ .()·-]*\d){9}(?!\d)/g)||[];return [...new Set(matches.map(normalizeCustomerPhone))]}
export function customerMessageInput(message){const text=telegramMessageText(message);return {text:customerInputText(text),originalText:text,telegramMessage:{message_id:message.message_id,text:typeof message.text==='string'?message.text:undefined,caption:typeof message.caption==='string'?message.caption:undefined,entities:message.entities,caption_entities:message.caption_entities,rich_message:message.rich_message}}}
const fold=value=>customerInputText(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
const number='(\\d+(?:[.,]\\d+)*)',sizeUnit='(?:m2|m\\^2|met vuong|sqm)',lengthUnit='(?:m(?![a-z0-9])|met\\b)';
const sizeLabel='(?:dien tich(?:\\s+(?:mong muon|can tim|toi thieu|toi da|min|max))?|\\bdt(?![a-z]))',frontLabel='(?:mat tien(?:\\s+(?:toi thieu|toi da|min|max))?|\\bmt(?![a-z]))';
const operator='(?:>=|<=|>|<|=|toi thieu|toi da|it nhat|khong nho hon|khong duoi|khong qua|khong vuot(?: qua)?|lon hon|nho hon|tu|tren|duoi|min|max)';
const valueOf=x=>{if(/^\d{1,3}(?:[.,]\d{3})+$/.test(x))return Number(x.replace(/[.,]/g,''));return Number(x.replace(',','.'));};
const maximum=text=>/<=|(?<![>])<|toi da|khong qua|khong vuot|nho hon|duoi|\bmax\b/.test(text)&&!/(?:khong duoi|tren duoi)/.test(text);
function measurement(s,label,unit){const ranges=[...s.matchAll(new RegExp(label+'\\s*[:：=]?\\s*(?:tu\\s*)?'+number+'\\s*(?:'+unit+')?\\s*(?:-|den|toi)\\s*'+number+'\\s*'+unit,'g'))];if(ranges.length){const m=ranges.at(-1);return {min:valueOf(m[1]),max:valueOf(m[2])};}
 const values=[...s.matchAll(new RegExp(label+'\\s*[:：]?\\s*('+operator+')?\\s*[:：]?\\s*'+number+'\\s*'+unit,'g'))];if(values.length){const m=values.at(-1);return {[maximum(m[0].slice(0,m[0].lastIndexOf(m[2])))?'max':'min']:valueOf(m[2])};}return null;}
export function extractCustomerIdentity(value){const text=customerInputText(value),s=fold(text);const m=s.match(/^\s*(?:khach(?: hang)?|kh)\s*(?:\(\s*(?:cua\s+(?:doi tac\s+)?|doi tac\s+)([^\n)]+)\s*\)|cua\s+([^:\n]+))\s*[:：]?/dm);if(!m)return {};
 const group=m[1]||m[2],start=m.indices[m[1]?1:2][0],provider=text.slice(start,start+group.length).trim().replace(/^(?:đối tác|doi tac)\s+/iu,'').replace(/[\s:：]+$/,'');if(!provider||provider.length>100)return {};return {source:provider,name:'Nguồn đối tác '+provider};}
export function extractCustomerCriteria(value){
 const text=customerInputText(value),plain=fold(text),s=plain.replace(/≥/g,'>=').replace(/≤/g,'<='),out={};
 const size=measurement(s,sizeLabel,sizeUnit)||measurement(s,'(?<![a-z0-9.,/])',sizeUnit);if(size){if(size.min&&size.max&&size.min>size.max)out.parseWarnings=['Khoảng diện tích đảo ngược; giữ nguyên văn để xác nhận.'];else{if(size.min)out.minSize=size.min;if(size.max)out.maxSize=size.max;}}
 else{const m=s.match(new RegExp('(?:\\btu|\\bcan|\\btren|>=)\\s*'+number+'\\s*'+sizeUnit));if(m)out.minSize=valueOf(m[1]);}
 const frontage=measurement(s,frontLabel,lengthUnit);if(frontage?.min)out.minFrontage=frontage.min;else if(frontage?.max)out.parseWarnings=[...(out.parseWarnings||[]),'Mặt tiền ghi giới hạn tối đa; chưa suy thành mặt tiền tối thiểu.'];
 const moneyLabel='(?:ngan sach(?:\\s+(?:toi da|mong muon))?|tai chinh|budget|\\btc(?![a-z])|\\bns(?![a-z]))',moneyUnit='(?:trieu(?:\\s+dong)?|tr(?![a-z])|cu\\b|ty\\b|nghin\\b|ngan\\b|k\\b|vnd\\b|dong\\b|d\\b)',amount=(raw,unit)=>valueOf(raw)*(/^(?:ty)/.test(unit||'')?1000:/^(?:nghin|ngan|k)/.test(unit||'')?.001:/^(?:vnd|dong|d)/.test(unit||'')?.000001:1);
 const budgets=[...s.matchAll(new RegExp(moneyLabel+'\\s*[:：]?\\s*((?:tren duoi|khoang|tam|xap xi|quanh)|'+operator+')?\\s*[:：]?\\s*'+number+'\\s*('+moneyUnit+')?(?:\\s*(?:-|den|toi)\\s*'+number+'\\s*('+moneyUnit+')?)?','g'))];
 if(!budgets.length){const m=s.match(new RegExp('(<=|<|toi da|duoi|khong qua)\\s*'+number+'\\s*('+moneyUnit+')'));if(m)budgets.push(m);}
 if(budgets.length){const m=budgets.at(-1),low=amount(m[2],m[3]||m[5]),high=m[4]?amount(m[4],m[5]||m[3]):null,op=m[1]||'';
  if(high!=null&&low>high)out.parseWarnings=[...(out.parseWarnings||[]),'Khoảng ngân sách đảo ngược; cần xác nhận.'];
  else if(/tren duoi|khoang|tam|xap xi|quanh/.test(op)){out.budget='Khoảng '+low+' triệu/tháng — cần xác nhận mức tối đa';out.maxBudget=null;out.budgetApproximate=true;}
  else if(high!=null){out.budget=low+'-'+high+' triệu/tháng';out.maxBudget=high;out.budgetApproximate=false;}
  else if(/^(?:>=|>|tu|tren|it nhat|toi thieu|khong duoi|min)$/.test(op)){out.budget='Từ '+low+' triệu/tháng';out.maxBudget=null;out.budgetApproximate=false;}
  else{out.maxBudget=low;out.budgetApproximate=false;}
 }
 const location=plain.match(/(?:^|[^a-z])(?:dia ban(?: cac quan)?|khu vuc(?: mong muon)?|\bkv|quan(?: huyen)?)(?![a-z])\s*[.:：]?\s*/);
 if(location&&!/(?:khong|ko) (?:yeu cau|gioi han|bat buoc)(?: ve)?\s*$/.test(plain.slice(Math.max(0,location.index-40),location.index).trim())){const start=location.index+location[0].length,rest=text.slice(start).split('\n')[0],f=fold(rest),stop=f.search(/(?:[,;]\s*)?(?:ban kinh\b|\bbk(?![a-z])|xe dich\b|gia thue\b|\b(?:dt|mt|tc|ns)(?![a-z])|dien tich\b|ngan sach\b|tai chinh\b|budget\b|uu tien\s+(?:mat pho|mat duong|chan de)\b|mat pho\b|chan de\b)/);const area=(stop>=0?rest.slice(0,stop):rest).trim().replace(/[\s,;.]+$/,'');if(area&&!/^[.;]/.test(area)&&/[\p{L}]/u.test(area)&&! /^(?:nào|nao|bất kỳ|bat ky)$/iu.test(area))out.area=area;}
 if(!out.area){const nearby=plain.match(/(?:gan|quanh)\s+ha noi\b/);if(nearby)out.area=text.slice(nearby.index,nearby.index+nearby[0].length);}
 const radius=s.match(new RegExp('(?:ban kinh(?:\\s+(?:xe dich|tim kiem))?|\\bbk(?![a-z])|xe dich|[±])\\s*[:：]?\\s*(?:'+operator+')?\\s*'+number+'\\s*(km|m)(?![a-z0-9])'));
 if(radius){out.searchRadiusKm=valueOf(radius[1])/(radius[2]==='m'?1000:1);if(out.area){out.locationAnchor=out.area.replace(/^(?:(?:gần|gan|quanh|khu vực|khu vuc)\s+)+/iu,'').trim();out.area=out.locationAnchor+' (bán kính '+out.searchRadiusKm+' km)';}}
 if(/sieu thi|cua hang tien loi/.test(s))out.industry='Siêu thị / Cửa hàng tiện lợi';return out;
}
