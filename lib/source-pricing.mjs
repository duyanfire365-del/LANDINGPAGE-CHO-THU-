import {splitPriceNotes} from './source-price-notes.mjs';
import {problem} from './platform.mjs';
export const foldVietnamese=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').replace(/²/g,'2').toLowerCase();
export function parseSourceNumber(value){
 let s=String(value).replace(/\s/g,'');
 if(!/^\d+(?:[.,]\d+)*$/.test(s))return NaN;
 const dot=s.lastIndexOf('.'),comma=s.lastIndexOf(',');
 if(dot>=0&&comma>=0){const decimal=dot>comma?'.':',';s=s.replace(decimal==='.'?/,/g:/\./g,'').replace(decimal,'.')}
 else if(/[.,]/.test(s)){const parts=s.split(/[.,]/);s=parts.slice(1).every(p=>p.length===3)?parts.join(''):parts.length===2?parts.join('.'):''}
 return s?Number(s):NaN;
}
const fail=message=>{throw problem(422,message)};
const num='\\d+(?:(?:[.,]\\d+)|(?:[ \\u00a0]\\d{3}))*';
const sqm='(?:m\\s*(?:\\^\\s*)?2|met\\s*vuong|sqm)';
function mapped(source){let text='',position=0;const starts=[],ends=[];for(const char of source){const folded=foldVietnamese(char);text+=folded;for(let i=0;i<folded.length;i++){starts.push(position);ends.push(position+char.length)}position+=char.length}return {text,quote:(start,end)=>source.slice(starts[start],ends[end-1])}}
export function monthlyFromUnit(rate,size){return Math.round(rate*size)/1000000}
export function formPricing(body,{allowIncomplete=false}={}){const number=v=>v===null||v===undefined||String(v).trim()===''?null:Number(v),size=number(body.size),basis=body.priceMode||'monthly';if(!['monthly','per_m2'].includes(basis))throw problem(400,'Cách tính giá không hợp lệ.');const rate=number(body.pricePerM2);if(basis==='per_m2'&&(!Number.isFinite(rate)||rate<=0||rate>1000000000)){if(allowIncomplete&&rate===null)return {size,price:null,priceBasis:'monthly',pricePerM2:null};throw problem(400,'Đơn giá theo m² phải lớn hơn 0, tính bằng đồng/m²/tháng.');}const price=basis==='per_m2'?(size===null?null:monthlyFromUnit(rate,size)):number(body.price);return {size,price,priceBasis:basis,pricePerM2:basis==='per_m2'?rate:null}}
const pricingSource=source=>splitPriceNotes(source).publicSource;
export function extractRentPricing(source,{allowIncomplete=false,allowUncertain=false}={}){
 let uncertainPrice=false,uncertainSize=false;const pricingNotes=[];
 const {text,quote}=mapped(pricingSource(source));
 const sizes=[...text.matchAll(new RegExp('('+num+')\\s*'+sqm,'g'))].filter(m=>!/[\d.,]/.test(text[m.index-1]||'')&&!/[\/]/.test(text.slice(Math.max(0,m.index-3),m.index).trim().slice(-1))).map(m=>({value:parseSourceNumber(m[1]),evidence:quote(m.index,m.index+m[0].length),index:m.index}));
 if(!sizes.length&&!allowIncomplete)fail('Chưa tìm thấy diện tích m² trong nguồn. Tin được giữ lại để bổ sung diện tích.');
 for(const candidate of sizes){const prefix=text.slice(Math.max(0,text.lastIndexOf('\n',candidate.index)+1),candidate.index),labels=[...prefix.matchAll(/(?:\btang\s*|\bt\s*)(\d+)\s*(?:[:：=–—-]|dien tich|dt)?/g)];candidate.floor=labels.at(-1)?.[1]||null;candidate.total=/tong\s*(?:dien tich|dt)\s*[:：=]?\s*$/.test(prefix);}
 let primary=sizes[0]||{value:null,evidence:''},sizeSelection='single';
 if(sizes.length&&new Set(sizes.map(m=>m.value)).size!==1){const floors=sizes.filter(m=>m.floor);if(!floors.length||sizes.some(m=>!m.floor&&!m.total)){if(!allowUncertain)fail('Nguồn có nhiều diện tích chưa gắn rõ từng tầng; cần xác nhận để tránh nhầm các BĐS.');uncertainSize=true;}const ground=floors.filter(m=>m.floor==='1');if(new Set(ground.map(m=>m.value)).size>1){if(!allowUncertain)fail('Diện tích tầng 1 có nhiều con số mâu thuẫn.');uncertainSize=true;}primary=ground[0]||(floors.length?floors.reduce((a,b)=>a.value>=b.value?a:b):primary);sizeSelection=ground.length?'floor_1':'largest_floor';}
 const floorAreas=[...new Map(sizes.filter(m=>m.floor).map(m=>[m.floor,{floor:Number(m.floor),size:m.value}])).values()].sort((a,b)=>a.floor-b.floor);
 const floorDescription=floorAreas.length?'Diện tích từng tầng: '+floorAreas.map(m=>'tầng '+m.floor+': '+m.size+' m²').join('; ')+'. Diện tích chính hiển thị: '+(primary.floor?'tầng '+primary.floor:'mặt sàn')+'.':'';

 for(const candidate of sizes){const before=text.slice(Math.max(0,candidate.index-30),candidate.index);if(/\d[.,\d]*\s*[-–—~]\s*$/.test(before)){if(!allowUncertain)fail('Nguồn ghi khoảng diện tích; cần xác nhận diện tích tính tiền thuê.');uncertainSize=true;}}
 if(uncertainSize){primary={value:null,evidence:''};pricingNotes.push('Diện tích chưa xác định chính xác; chờ bổ sung.');}
 const size=primary.value;if(!(allowIncomplete&&size===null)&&(!Number.isFinite(size)||size<=0||size>10000000))fail('Diện tích trong nguồn chưa hợp lệ.');
 const money=new RegExp('('+num+')\\s*(trieu(?:\\s*dong)?|tr(?![a-z])|ty(?![a-z])|nghin|ngan|ng(?![a-z])|k(?![a-z])|vnd|dong|d(?![a-z]))','g'),prices=[];
 let consumedUntil=0;
 for(const m of text.matchAll(money)){
  if(m.index<consumedUntil)continue;
  let end=m.index+m[0].length,amount=parseSourceNumber(m[1]);const unit=m[2],prefix=text.slice(Math.max(0,text.lastIndexOf('\n',m.index)+1),m.index);
  // Accent folding makes street names look like money: “62 Triều Khúc”
  // becomes “62 trieu khuc”, and “110 Đồng Xuân” looks like 110 đồng.
  // Classify the original spelling/address context before accepting a price.
  const rawMoney=quote(m.index,end).normalize('NFC'),following=text.slice(end),addressUnit=(unit.startsWith('trieu')&&/^\s*khuc\b/.test(following))
   ||(unit==='dong'&&/^\s+(?:xuan|da|nai|van|khoi|tam|me|nhan|lac|khanh|tien|hoi|truc|quang)\b/.test(following))
   ||(unit==='dong'&&end<text.length&&/^[ \t]+\p{Lu}\p{L}*/u.test(quote(end,Math.min(text.length,end+40)))&&!/^[ \t]*(?:thang|thag|th|m\s*2)\b/.test(following))
   ||(unit==='ng'&&/^\s*\.?\s*\d/.test(following))
   ||(/(?:triều|ngân)/iu.test(rawMoney)&&!/^\s*(?:\/|moi|mot)\s*(?:1\s*)?(?:thang|thag|th|t|m\s*2)\b/.test(following));
  if(addressUnit)continue;
  const rentLabels=[...prefix.matchAll(/gia\s*(?:thue|theu|thuee)?|(?:tien\s*)?(?:thue|theu)/g)],otherLabels=[...prefix.matchAll(/(?:dat\s*)?coc|sang\s*nhu[o]?ng|chuyen\s*nhu[o]?ng|gia\s*nhuong|\bnhuong\b|\bphi\b|dich vu|hoa hong|\bhh\b|doanh thu|\bdien\b|\bnuoc\b|sua chua/g)];
  if(otherLabels.length&&(!rentLabels.length||otherLabels.at(-1).index>=rentLabels.at(-1).index))continue;
  if(/(?:\d[.,\d]*\s*[-–—~]\s*|(?:tu|tren|duoi|hon|khoang|tam|xap xi|nhinh)\s*)$/.test(prefix)){if(!allowUncertain)fail('Nguồn ghi khoảng giá; chưa xác định một giá thuê để đăng chính xác.');uncertainPrice=true;}
  if(/^tr/.test(unit)){const tail=text.slice(end).match(/^(\d{1,3})(?:\s*(?:k|nghin|ngan))?/);if(tail){amount+=Number(tail[1])/(/k|nghin|ngan/.test(tail[0])?1000:10**tail[1].length);end+=tail[0].length}amount*=1000000}
  else if(unit==='ty')amount*=1000000000;
  else if(/^(?:k|nghin|ngan|ng)$/.test(unit))amount*=1000;
  const tail=text.slice(end),per=tail.match(new RegExp('^\\s*(?:/|tren|moi)?\\s*(?:1\\s*)?'+sqm));
  if(per)end+=per[0].length;
  const period=text.slice(end).match(/^\s*(?:\/|moi|mot)\s*(?:1\s*)?(thang|thag|th|t|nam|ngay|gio)\b/);if(period){if(['nam','ngay','gio'].includes(period[1])){if(!allowUncertain)fail('Đơn giá theo năm/ngày/giờ cần xác nhận kỳ thuê tháng trước khi đăng.');uncertainPrice=true;}end+=period[0].length}
  if(!Number.isFinite(amount)||amount<=0)continue;
  consumedUntil=end;prices.push({basis:per?'per_m2':'monthly',amount,evidence:quote(m.index,end)});
 }
 if(!prices.length&&!allowIncomplete)fail('Chưa tìm thấy tiền thuê có đơn vị đồng, nghìn/k hoặc triệu/tr trong nguồn.');
 const monthly=prices.filter(p=>p.basis==='monthly'),rates=prices.filter(p=>p.basis==='per_m2');
 if(new Set(monthly.map(p=>p.amount)).size>1||new Set(rates.map(p=>p.amount)).size>1){if(!allowUncertain)fail('Nguồn có nhiều mức giá khác nhau; cần xác nhận giá thuê áp dụng.');uncertainPrice=true;}
 const rate=rates[0]?.amount,computed=rate&&size!==null?monthlyFromUnit(rate,size):null;let price=monthly[0]?monthly[0].amount/1000000:computed;
 if(computed!==null&&monthly.length&&Math.abs(price-computed)>0.000001){if(!allowUncertain)fail('Tổng tiền thuê và đơn giá/m² × diện tích trong nguồn chưa khớp. Cần xác nhận để tránh đăng sai giá.');uncertainPrice=true;}
 if(uncertainPrice){price=null;pricingNotes.push('Giá khoảng/chưa thống nhất; để trống giá chính xác, chờ bổ sung.');}
 if(!(allowIncomplete&&price===null)&&(!(price>0)||price>1000000))fail('Tiền thuê quy đổi theo tháng vượt phạm vi hợp lệ.');
 return {price,size,priceBasis:rate&&!uncertainPrice?'per_m2':'monthly',pricePerM2:uncertainPrice?null:rate||null,priceEvidence:uncertainPrice?'':(rates[0]||monthly[0])?.evidence||'',sizeEvidence:primary.evidence,floorAreas,floorDescription:uncertainSize?'':floorDescription,sizeSelection,...(allowUncertain?{pricingNotes}: {})};
}

export function transferPricing(body,previous={}){
 const raw=body.transferPrice===undefined?previous.transferPrice:body.transferPrice,value=raw==null||String(raw).trim()===''?null:Number(raw);
 if(value!==null&&(!Number.isFinite(value)||value<=0||value>1000000000))throw problem(400,'Giá chuyển nhượng tính bằng triệu đồng, lớn hơn 0; để trống nếu chưa có giá chính xác.');
 // Negotiation terms belong in private notes, never in public data.
 const negotiable=false;
 return {transferPrice:value,transferNegotiable:negotiable,isTransfer:previous.isTransfer===true||body.isTransfer===true||value!==null||negotiable};
}
export function extractTransferPricing(source){
 const text=foldVietnamese(pricingSource(source)),isTransfer=/sang\s*nhu[o]?ng|chuyen\s*nhu[o]?ng|gia\s*nhuong|\bnhuong\s+(?:quan|cua hang|nha hang|\d)/.test(text),candidates=[];
 const pattern=new RegExp('(?:sang\\s*nhu[o]?ng|chuyen\\s*nhu[o]?ng|gia\\s*nhuong|\\bnhuong)[^\\n]{0,55}?('+num+')\\s*(ty|trieu|tr\\b|vnd|dong|d\\b)','g');
 for(const m of text.matchAll(pattern)){const before=m[0].slice(0,m[0].lastIndexOf(m[1]));if(/^\s*[-–—~]\s*\d/.test(text.slice(m.index+m[0].length))||/gia\s*thue|tien\s*thue|coc|hoa hong|\bhh\b/.test(before)||/^(?:\s*\/\s*(?:thang|th|t)\b)/.test(text.slice(m.index+m[0].length))||/(?:khoang|tam|hon|tren|duoi|tu|den)\s*$/.test(before)||/\d\s*[-–—]\s*$/.test(before))continue;const value=parseSourceNumber(m[1])*(m[2]==='ty'?1000:/^tr/.test(m[2])?1:0.000001);if(value>0&&value<=1000000000)candidates.push(value)}
 const bare=text.match(/(?:^|[,;\s])nhuong(?!\s*[:=]?\s*(?:tu|khoang))/);const bareValues=bare?[...text.slice(bare.index).matchAll(new RegExp('('+num+')\\s*(?:trieu|tr\\b)','g'))].map(m=>parseSourceNumber(m[1])):[];
 return {isTransfer,transferPrice:new Set(candidates).size===1&&new Set(bareValues).size<=1?candidates[0]:null,transferNegotiable:false};
}

export function syncPricingDescription(description,before,after){
 let lines=String(description||'').split('\n');
 const replace=(pattern,value)=>{let found=false;lines=lines.map(line=>{if(!pattern.test(line))return line;found=true;return value});if(!found)lines.push('',value)};
 if((before.price??null)!==(after.price??null))replace(/^[\p{P}\p{S}\s]*(?:giá thuê|tiền thuê)/iu,'Giá thuê: '+(after.price===null?'Liên hệ.':after.price+' triệu đồng/tháng.'));
 if((before.size??null)!==(after.size??null))replace(/^[\p{P}\p{S}\s]*diện tích\s*[:：]/iu,'Diện tích: '+(after.size===null?'Đang cập nhật.':after.size+' m².'));
 if(after.isTransfer&&((before.transferPrice??null)!==(after.transferPrice??null)||!!before.transferNegotiable!==!!after.transferNegotiable||!before.isTransfer)){
  replace(/^[\p{P}\p{S}\s]*(?:giá (?:chuyển nhượng|sang nhượng|nhượng)|sang nhượng\s*[:：])/iu,'Giá chuyển nhượng: '+(after.transferPrice===null?'Liên hệ':after.transferPrice+' triệu đồng')+(after.transferNegotiable?' — Có thể thương lượng.':'.'));
  if(!after.transferNegotiable)lines=lines.filter(line=>!/^\s*(?:có thể\s+)?thương lượng\s*[.!]?\s*$/iu.test(line));
 }
 return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
