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
export function formPricing(body){const size=Number(body.size),basis=body.priceMode||'monthly';if(!['monthly','per_m2'].includes(basis))throw problem(400,'Cách tính giá không hợp lệ.');const rate=Number(body.pricePerM2),price=basis==='per_m2'?monthlyFromUnit(rate,size):Number(body.price);if(basis==='per_m2'&&(!Number.isFinite(rate)||rate<=0||rate>1000000000))throw problem(400,'Đơn giá theo m² phải lớn hơn 0, tính bằng đồng/m²/tháng.');return {size,price,priceBasis:basis,pricePerM2:basis==='per_m2'?rate:null}}
export function extractRentPricing(source){
 const {text,quote}=mapped(String(source));
 const sizes=[...text.matchAll(new RegExp('('+num+')\\s*'+sqm,'g'))].filter(m=>!/[\d.,]/.test(text[m.index-1]||'')&&!/[\/]/.test(text.slice(Math.max(0,m.index-3),m.index).trim().slice(-1))).map(m=>({value:parseSourceNumber(m[1]),evidence:quote(m.index,m.index+m[0].length),index:m.index}));
 if(!sizes.length)fail('Chưa tìm thấy diện tích m² trong nguồn. Tin được giữ lại để bổ sung diện tích.');
 if(new Set(sizes.map(m=>m.value)).size!==1)fail('Nguồn có nhiều diện tích khác nhau; cần xác nhận diện tích dùng để tính tiền thuê.');
 for(const candidate of sizes){const before=text.slice(Math.max(0,candidate.index-30),candidate.index);if(/\d[.,\d]*\s*[-–—~]\s*$/.test(before))fail('Nguồn ghi khoảng diện tích; cần xác nhận diện tích tính tiền thuê.');}
 const size=sizes[0].value;if(!Number.isFinite(size)||size<=0||size>10000000)fail('Diện tích trong nguồn chưa hợp lệ.');
 const money=new RegExp('('+num+')\\s*(trieu(?:\\s*dong)?|tr(?![a-z])|ty(?![a-z])|nghin|ngan|ng(?![a-z])|k(?![a-z])|vnd|dong|d(?![a-z]))','g'),prices=[];
 let consumedUntil=0;
 for(const m of text.matchAll(money)){
  if(m.index<consumedUntil)continue;
  let end=m.index+m[0].length,amount=parseSourceNumber(m[1]);const unit=m[2],prefix=text.slice(Math.max(0,text.lastIndexOf('\n',m.index)+1),m.index);
  const rentLabels=[...prefix.matchAll(/gia\s*(?:thue|theu|thuee)?|(?:tien\s*)?(?:thue|theu)/g)],otherLabels=[...prefix.matchAll(/(?:dat\s*)?coc|sang\s*nhu[o]?ng|chuyen\s*nhu[o]?ng|\bphi\b|dich vu|hoa hong|\bhh\b|doanh thu|\bdien\b|\bnuoc\b|sua chua/g)];
  if(otherLabels.length&&(!rentLabels.length||otherLabels.at(-1).index>rentLabels.at(-1).index))continue;
  if(/(?:\d[.,\d]*\s*[-–—~]\s*|(?:tu|tren|duoi|hon|khoang)\s*)$/.test(prefix))fail('Nguồn ghi khoảng giá; chưa xác định một giá thuê để đăng chính xác.');
  if(/^tr/.test(unit)){const tail=text.slice(end).match(/^(\d{1,3})(?:\s*(?:k|nghin|ngan))?/);if(tail){amount+=Number(tail[1])/(/k|nghin|ngan/.test(tail[0])?1000:10**tail[1].length);end+=tail[0].length}amount*=1000000}
  else if(unit==='ty')amount*=1000000000;
  else if(/^(?:k|nghin|ngan|ng)$/.test(unit))amount*=1000;
  const tail=text.slice(end),per=tail.match(new RegExp('^\\s*(?:/|tren|moi)?\\s*(?:1\\s*)?'+sqm));
  if(per)end+=per[0].length;
  const period=text.slice(end).match(/^\s*(?:\/|moi|mot)\s*(?:1\s*)?(thang|thag|th|t|nam|ngay|gio)\b/);if(period){if(['nam','ngay','gio'].includes(period[1]))fail('Đơn giá theo năm/ngày/giờ cần xác nhận kỳ thuê tháng trước khi đăng.');end+=period[0].length}
  if(!Number.isFinite(amount)||amount<=0)continue;
  consumedUntil=end;prices.push({basis:per?'per_m2':'monthly',amount,evidence:quote(m.index,end)});
 }
 if(!prices.length)fail('Chưa tìm thấy tiền thuê có đơn vị đồng, nghìn/k hoặc triệu/tr trong nguồn.');
 const monthly=prices.filter(p=>p.basis==='monthly'),rates=prices.filter(p=>p.basis==='per_m2');
 if(new Set(monthly.map(p=>p.amount)).size>1||new Set(rates.map(p=>p.amount)).size>1)fail('Nguồn có nhiều mức giá khác nhau; cần xác nhận giá thuê áp dụng.');
 const rate=rates[0]?.amount,computed=rate?monthlyFromUnit(rate,size):null,price=monthly[0]?monthly[0].amount/1000000:computed;
 if(computed!==null&&monthly.length&&Math.abs(price-computed)>0.000001)fail('Tổng tiền thuê và đơn giá/m² × diện tích trong nguồn chưa khớp. Cần xác nhận để tránh đăng sai giá.');
 if(!(price>0)||price>1000000)fail('Tiền thuê quy đổi theo tháng vượt phạm vi hợp lệ.');
 return {price,size,priceBasis:rate?'per_m2':'monthly',pricePerM2:rate||null,priceEvidence:(rates[0]||monthly[0]).evidence,sizeEvidence:sizes[0].evidence};
}
