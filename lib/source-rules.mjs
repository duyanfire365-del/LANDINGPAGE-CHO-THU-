import {areas,categories} from './posts.mjs';
import {problem} from './platform.mjs';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();
const fail=message=>{throw problem(422,message)};
const number=s=>Number(s.replace(',','.'));
export function extractByRules(source){
 const lines=source.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const field=(...labels)=>{const line=lines.find(l=>labels.some(label=>norm(l.split(/[:：]/)[0])===label));return line?.split(/[:：]/).slice(1).join(':').trim()||''};
 if(['dia chi','loai bds','khu vuc'].some(label=>lines.filter(l=>norm(l.split(/[:：]/)[0])===label).length>1))fail('Bài có nhiều nhóm thông tin. Mỗi lần gửi một BĐS.');
 const area=areas.find(a=>norm(a)===norm(field('khu vuc','quan huyen')))||areas.filter(a=>norm(source).includes(norm(a))).sort((a,b)=>b.length-a.length)[0];
 const rawType=field('loai bds','danh muc','loai hinh');
 const aliases=[['Mặt bằng kinh doanh',/mặt bằng|cửa hàng/iu],['Văn phòng',/văn phòng/iu],['Kho xưởng',/kho xưởng|nhà xưởng|kho bãi/iu],['Nhà nguyên căn',/nhà nguyên căn|nhà riêng/iu],['Căn hộ dịch vụ',/căn hộ dịch vụ/iu],['Căn hộ chung cư',/chung cư|căn hộ/iu],['Phòng trọ',/phòng trọ/iu],['Biệt thự, nhà liền kề',/biệt thự|liền kề/iu],['Ki-ốt',/ki.?ốt/iu],['Đất cho thuê',/đất cho thuê|cho thuê đất/iu]];
 const type=categories.find(t=>norm(t)===norm(rawType))||aliases.find(([,pattern])=>pattern.test(rawType||source))?.[0]||'Bất động sản khác';
 const priceMatches=[...source.matchAll(/(?:giá\s*(?:thuê)?|thuê)\s*[:：=]?\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)(?:\s*đồng)?(?:\s*\/\s*(?:tháng|th))?/giu)];
 const sizeMatches=[...source.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:m²|m2|m\^2|mét vuông)/giu)];
 if(new Set(priceMatches.map(m=>number(m[1]))).size!==1||new Set(sizeMatches.map(m=>number(m[1]))).size!==1)fail('Chưa tách được một giá thuê và diện tích rõ ràng. Ghi Giá thuê: 20 triệu/tháng; Diện tích: 100 m².');
 const price=number(priceMatches[0][1]),size=number(sizeMatches[0][1]);
 let privateAddress=field('dia chi','dia chi day du');
 if(!privateAddress)privateAddress=lines.find(l=>/(?:số\s+\d|\b\d+[a-z]?\s+(?:đường|phố|ngõ))/iu.test(l)&&!/giá thuê|diện tích/iu.test(l))||'';

 const explicitLocation=field('ten duong','duong','vi tri cong khai');
 const pieces=privateAddress.split(/[,;\n]/).map(s=>s.trim());
 let location=explicitLocation||pieces[0].replace(/^(?:địa chỉ\s*[:：]?\s*)?(?:số\s*)?\d+[a-z]?(?:\s*\/\s*\d+)*\s*(?:(?:đường|phố)\s+)?/iu,'').trim();
 // Keep address fragments private; fall back to district without asking the owner to rewrite the post.
 if(/\d|ngõ|ngách|hẻm|#|https?:/iu.test(location))location='';
 if(!location)location=area||'Liên hệ để biết vị trí';
 if(/(?:^|\n)\s*(?:\d+[.)]|[-•])\s*(?:cho thuê|bđs)/iu.test(source)||/\b(?:bán|cần mua)\b/iu.test(source))fail('Nguồn có thể chứa nhiều BĐS hoặc nội dung bán. Mỗi lần gửi một BĐS cho thuê.');
 const transfer=source.match(/(?:sang nhượng|chuyển nhượng)\s*[:：=]?\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/iu);
 const floors=source.match(/(\d+)\s*tầng/iu),frontage=source.match(/mặt tiền\s*[:：]?\s*(\d+(?:[.,]\d+)?)\s*m\b/iu);
 return {floors:floors?number(floors[1]):null,floorsEvidence:floors?.[0]||'',frontage:frontage?number(frontage[1]):null,frontageEvidence:frontage?.[0]||'',listingCount:1,intent:'rent',area:area||'Hà Nội',type,location,privateAddress,price,size,priceEvidence:priceMatches[0][0],sizeEvidence:sizeMatches[0][0],transferPrice:transfer?number(transfer[1]):null,transferEvidence:transfer?.[0]||''};
}
