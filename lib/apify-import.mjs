import {problem} from './platform.mjs';
import {resultInput,ingestResults} from './scan-results.mjs';
import {parseSourceNumber} from './source-pricing.mjs';
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
function fb(value,{post=false}={}){let u;try{u=new URL(value)}catch{throw Error('Thiếu link Facebook hợp lệ.')}
 if(u.protocol!=='https:'||u.username||u.password||! /^(?:www\.|m\.)?facebook\.com$/.test(u.hostname)||u.href.length>2000)throw Error('Chỉ nhận link Facebook HTTPS.');
 if(post&&! /\/(?:posts|permalink)\/\d+|\/story\.php/.test(u.pathname))throw Error('Chưa có link bài đăng cụ thể.');
 u.hostname='www.facebook.com';u.hash='';for(const k of [...u.searchParams.keys()])if(!['story_fbid','id'].includes(k))u.searchParams.delete(k);return u.href;
}
export function previewApify(input,now=new Date()){
 let data=input;if(typeof data==='string'){if(Buffer.byteLength(data)>2000000)throw problem(413,'File JSON tối đa 2 MB.');try{data=JSON.parse(data.replace(/^\uFEFF/,''))}catch{throw problem(400,'File JSON chưa đúng định dạng.')}}
 if(!Array.isArray(data)||data.length>1000)throw problem(400,'Cần file JSON dạng danh sách, tối đa 1.000 dòng.');
 const items=[],skipped=[],diagnostics=[],seen=new Set();
 for(const [index,row] of data.entries()){
  if(!row||typeof row!=='object'){skipped.push({row:index+1,reason:'Dòng không hợp lệ'});continue}
  if(row.recordType==='diagnostic'||row.ok===false){diagnostics.push({row:index+1,code:String(row.code||'DIAGNOSTIC').slice(0,80),message:row.code==='COMMENTS_SOON'?'Dịch vụ chưa bật lấy toàn bộ bình luận; lượt này không đọc và không tính phí bình luận.':String(row.details||row.message||'Thông báo từ dịch vụ.').slice(0,1000)});continue}
  try{
   const content=[row.text,row.sharedPostText].filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()).filter((x,i,a)=>a.indexOf(x)===i).join('\n\n').normalize('NFC');
   const normalized=fold(content);if(content.length<20)throw Error('Bài chưa có đủ nội dung.');
   const tenant=/(?:can|tim|nhu cau)\s+(?:thue|mat bang|kho|xuong)/.test(normalized.slice(0,200))&&! /cho\s+thue/.test(normalized);
   if(!tenant&&!/cho\s*thue|sang\s*nhuong|chuyen\s*nhuong/.test(normalized)&&!(/kho|xuong|mat bang|van phong|nguyen can/.test(normalized)&&/\d\s*(?:trieu|tr)\s*\/\s*thang/.test(normalized)))throw Error(/gia ban|can ban|dau tu|trieu\s*\/\s*m/.test(normalized)?'Tin bán/đầu tư, ngoài kho cho thuê.':'Chưa xác định được là cho thuê hay khách tìm thuê.');
   const originalUrl=fb(row.url,{post:true});if(seen.has(originalUrl))throw Error('Trùng link bài trong file.');
   const source=fb(row.facebookUrl||row.inputUrl||originalUrl),title=String(row.groupTitle||'Nhóm Facebook').slice(0,180);
   const areas=[...content.matchAll(/(?:diện tích|\bdt(?:sd)?)\s*[:：]?\s*(\d[\d.,]*)\s*m[²2]?/giu)].map(m=>parseSourceNumber(m[1])).filter(n=>Number.isFinite(n)&&n>0);
   if(!areas.length){const m=content.match(/(\d[\d.,]*)\s*m[²2]/iu);if(m)areas.push(parseSourceNumber(m[1]))}
   const uncertainSize=/diện tích[^\n]{0,20}(?:từ|&|–|\d\s*-\s*\d)/iu.test(content)||new Set(areas).size>1;
   const size=uncertainSize?null:areas[0]||null;
   // Per-square-metre or foreign-currency prices are retained as text, never monthly totals.
   const price=content.match(/(?:giá(?:\s+thuê)?\s*[:：]?\s*|chỉ\s+)(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)\s*(?:đồng\s*)?(?:\/\s*tháng|mỗi tháng|tháng)/iu);
   const rent=price?parseSourceNumber(price[1]):null;
   const frontageMatch=content.match(/(?:mặt tiền|\bmt)\s*[:：]?\s*(\d+(?:[.,]\d+)?)\s*m\b/iu);
   const phone=[...content.matchAll(/(?<!\d)(?:\+84|0)(?:[ .-]*\d){9}(?!\d)/g)].map(x=>x[0].replace(/[ .-]/g,''));
   const locationLine=content.split('\n').find(x=>/(?:địa chỉ|vị trí|tại|cho thuê kho|cho thuê nhà|cho thuê xưởng)/iu.test(x))||content.split('\n')[0];
   const district=content.match(/Nam Từ Liêm|Bắc Từ Liêm|Hà Đông|Cầu Giấy|Thanh Xuân|Đống Đa|Hoàn Kiếm|Ba Đình|Hoàng Mai|Long Biên|Tây Hồ|Hai Bà Trưng|Hoài Đức|Thanh Oai|Đan Phượng|Chương Mỹ|Đông Anh|Gia Lâm|Thanh Trì|Văn Lâm|Lạng Giang|Tiên Du/iu)?.[0]||'';
   const type=/kho|xuong/.test(normalized)?'Kho xưởng':/van phong/.test(normalized)?'Văn phòng':/mat bang|cua hang|ki.ot/.test(normalized)?'Mặt bằng kinh doanh':/nguyen can|nha rieng/.test(normalized)?'Nhà nguyên căn':'Bất động sản khác';
   let postedAt='';if(row.time&&Number.isFinite(Date.parse(row.time)))postedAt=new Date(row.time).toISOString();
   const comments=Array.isArray(row.topComments)?row.topComments:[];
   const item={kind:tenant?'tenant':'owner',originalUrl,content,address:locationLine.slice(0,500),district,propertyType:type,rent,size,frontage:frontageMatch?parseSourceNumber(frontageMatch[1]):null,phone:[...new Set(phone)].join(', '),authorName:String(row.user?.name||'').slice(0,180),facebookUrl:row.user?.profileUrl?fb(row.user.profileUrl):'',postedAt,collectedAt:now.toISOString(),sources:[{name:title,url:source}],evidence:'Nhập JSON Apify; thông tin nguồn chưa xác minh.'+(size===null?' Diện tích thiếu hoặc có nhiều phương án; xem bản gốc.':'')+(rent===null?' Chưa xác nhận tổng giá thuê tháng.':'')+(comments.length?` Có ${comments.length} bình luận nổi bật trong bản gốc.`:' Chưa có nội dung bình luận trong file.'),isTransfer:/sang\s*nhuong|chuyen\s*nhuong/.test(normalized),requirements:tenant?content.slice(0,2000):''};
   resultInput(item,now);items.push(item);seen.add(originalUrl);
  }catch(e){skipped.push({row:index+1,reason:e.message})}
 }
 return {total:data.length,items,skipped,diagnostics};
}
export async function importApify(input){const preview=previewApify(input);let added=0,received=0;for(let n=0;n<preview.items.length;n+=100){const saved=await ingestResults({items:preview.items.slice(n,n+100)});added+=saved.added;received+=saved.received}return {total:preview.total,added,received,duplicates:received-added,skipped:preview.skipped,diagnostics:preview.diagnostics}}
