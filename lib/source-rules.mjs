import {isCustomerDemand} from './source-inline.mjs';
import {sourceShorthand} from './source-shorthand.mjs';
import {taggedCategories} from './source-tags.mjs';
import {inferCategory} from './listing-content.mjs';
import {extractDimensions} from './property-dimensions.mjs';
import {extractRentPricing,foldVietnamese,parseSourceNumber,extractTransferPricing} from './source-pricing.mjs';
import {areas,categories} from './posts.mjs';
import {problem} from './platform.mjs';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();
const fail=message=>{throw problem(422,message)};
const number=parseSourceNumber;
export function extractByRules(source,{allowIncomplete=false,allowUncertain=false}={}){
 if(isCustomerDemand(source))fail('Đây là nhu cầu tìm thuê của khách; giữ riêng để tư vấn, không đăng thành nguồn hàng.');
 const shorthand=sourceShorthand(source);
 const lines=source.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const field=(...labels)=>{const line=lines.find(l=>labels.some(label=>norm(l.split(/[:：]/)[0])===label));return line?.split(/[:：]/).slice(1).join(':').trim()||''};
 if(['dia chi','loai bds','khu vuc'].some(label=>lines.filter(l=>norm(l.split(/[:：]/)[0])===label).length>1))fail('Bài có nhiều nhóm thông tin. Mỗi lần gửi một BĐS.');
 const area=areas.find(a=>norm(a)===norm(field('khu vuc','quan huyen')))||areas.filter(a=>norm(source.replace(/#[\p{L}\p{N}_]+/gu,'')).includes(norm(a))).sort((a,b)=>b.length-a.length)[0];
 const rawType=field('loai bds','danh muc','loai hinh');
 const typeSource=foldVietnamese(rawType||source);
 const aliases=[['Mặt bằng kinh doanh',/mat ba(?:n)?g|cua hang|\bmbkd\b|\bmb\b/],['Văn phòng',/van pho(?:n)?g|\bvp\b/],['Kho xưởng',/\b(?:kho|xuong|xuog|kx)\b/],['Nhà nguyên căn',/nha nguyen can|nha rieng|\bnnc\b|\bnc\b/],['Căn hộ dịch vụ',/can ho dich vu|\bchdv\b/],['Căn hộ chung cư',/chung cu|can ho|\bchcc\b/],['Phòng trọ',/phong tro/],['Biệt thự, nhà liền kề',/biet thu|lien ke/],['Ki-ốt',/ki.?ot/],['Đất cho thuê',/dat cho thue|cho thue dat/]];
 const type=taggedCategories(source)[0]||categories.find(t=>norm(t)===norm(rawType))||inferCategory(typeSource)||aliases.find(([,pattern])=>pattern.test(typeSource))?.[0]||'Bất động sản khác';
 const pricing=extractRentPricing(source,{allowIncomplete,allowUncertain});
 let privateAddress=field('dia chi','dia chi day du','dia chi cu the','dia chi rieng tu');
 if(!privateAddress)privateAddress=lines.find(l=>/(?:số\s+\d|\b\d+[a-z]?\s+(?:đường|phố|ngõ))/iu.test(l)&&!/giá thuê|diện tích/iu.test(l))||'';

 if(!privateAddress)privateAddress=shorthand.privateAddress;
 const explicitLocation=field('ten duong','duong','vi tri cong khai','vi tri');
 // Named street frontage without a house number is still useful location evidence.
 if(!privateAddress&&!explicitLocation){
  for(const line of lines){
   const named=line.match(/(?:mặt phố|mặt đường|tại|địa chỉ\s*[:：])\s+([^\n]+)/iu);
   if(named&&/(?:cho thuê|sang nhượng|chuyển nhượng|địa chỉ)/iu.test(line)&&!/[\d#]|https?:/iu.test(named[1])){privateAddress=named[1].trim();break;}
  }
 }
 const pieces=privateAddress.split(/[,;\n]/).map(s=>s.trim().replace(/^[^\p{L}\p{N}]+/u,''));
 let location=explicitLocation||pieces[0].replace(/^(?:địa chỉ\s*[:：]?\s*)?(?:số\s*)?\d+[a-z]?(?:\s*\/\s*\d+)*\s*(?:(?:đường|phố)\s+)?/iu,'').trim();
 location=location.replace(/^(?:(?:ngõ|ngách|hẻm|ngo|ngach|hem)\s*\d+[a-z]?(?:\s*\/\s*\d+)*\s*)+/iu,'').replace(/^(?:đường|phố)\s+/iu,'');
 location=location.replace(/[,;–—-]?\s*(?:khu vực\s+)?(?:gần|cạnh|sát|đối diện|cách|phía sau|ngay sau|bên hông)\b.*$/iu,'').replace(/[,;–—-]\s*$/u,'').trim();
 location=location.replace(/cầu\s+bướu|cau\s+buou/giu,'Cầu Bươu');
 // Keep address fragments private; fall back to district without asking the owner to rewrite the post.
 if(/\d|ngõ|ngách|hẻm|#|https?:/iu.test(location))location='';
 if(!location)location=area||'Liên hệ để biết vị trí';
 if(location!=='Liên hệ để biết vị trí')location=location.replace(/(^|\s)(\p{L})/gu,(_,space,letter)=>space+letter.toLocaleUpperCase('vi')); 
 if([...source.matchAll(/(?:^|\n)\s*(?:\d+[.)]|[-•])\s*(?:cho thuê|bđs)/giu)].length>1||/\b(?:gia ban|can ban|can mua|ban\s+(?:nha|dat|kho|xuong|can ho|biet thu|bds|bat dong san|mat bang))\b/.test(foldVietnamese(source)))fail('Nguồn có thể chứa nhiều BĐS hoặc nội dung bán. Mỗi lần gửi một BĐS cho thuê.');
 const transfer=source.match(/(?:sang nhượng|chuyển nhượng|sang nhuong|chuyen nhuong)\s*[:：=]?\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)/iu);
 const floors=source.match(/(\d+)\s*tầng/iu),frontage=source.match(/mặt tiền\s*[:：]?\s*(\d+(?:[.,]\d+)?)\s*m\b/iu);
 return {floors:floors?number(floors[1]):null,floorsEvidence:floors?.[0]||'',frontage:frontage?number(frontage[1]):null,frontageEvidence:frontage?.[0]||shorthand.frontageEvidence,listingCount:1,intent:'rent',area:area||'Hà Nội',type,location,privateAddress,...pricing,...extractDimensions(source),transferPrice:transfer?number(transfer[1]):null,transferEvidence:transfer?.[0]||'',...extractTransferPricing(source)};
}
