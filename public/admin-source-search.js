(function(root){
 const fold=v=>String(v??'').normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/\s+/g,' ').trim();
 const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const districts=['Nam Từ Liêm','Bắc Từ Liêm','Cầu Giấy','Hà Đông','Đống Đa','Thanh Xuân','Ba Đình','Hoàn Kiếm','Hoàng Mai','Long Biên','Tây Hồ','Hai Bà Trưng','Hoài Đức','Đông Anh','Gia Lâm','Thanh Trì','Chương Mỹ','Thanh Oai','Thường Tín','Phú Xuyên','Ứng Hòa','Mỹ Đức','Ba Vì','Phúc Thọ','Thạch Thất','Quốc Oai','Sóc Sơn','Mê Linh','Đan Phượng','Sơn Tây'];
 const types=[['Mặt bằng kinh doanh','mat bang kinh doanh|mat bang|mbkd|mb'],['Văn phòng','van phong|vp'],['Kho xưởng','kho xuong|nha xuong|kho|xuong|kx'],['Nhà nguyên căn','nha nguyen can|nguyen can|nha rieng|nnc|nc'],['Căn hộ dịch vụ','can ho dich vu|chdv'],['Căn hộ chung cư','can ho chung cu|chung cu|chcc'],['Phòng trọ','phong tro'],['Biệt thự, nhà liền kề','biet thu|lien ke'],['Đất cho thuê','dat cho thue']];
 function number(s){s=String(s).replace(/\s/g,'');if(/^\d{1,3}(?:[.,]\d{3})+$/.test(s))return Number(s.replace(/[.,]/g,''));return Number(s.replace(',','.'))}
 function parse(query){let text=fold(query).replace(/m²/g,'m2'),rest=text;const out={areas:[],types:[],terms:[],criteria:[],code:null,size:null,price:null,frontage:null,floors:null,transfer:/gia (?:sang nhuong|chuyen nhuong)|tien (?:sang nhuong|chuyen nhuong)/.test(text)};
  const consume=(pattern,fn)=>{rest=rest.replace(pattern,(...args)=>{fn(...args);return ' '})};
  consume(/\b(mb|vp|kx|nc|bds|chcc|chdv|bt|pt|dt|ko)\s*[-–—]?\s*(\d{1,6})\b/g,(_,p,n)=>{out.code=p+String(Number(n));out.criteria.push('Mã '+p.toUpperCase()+' - '+String(Number(n)).padStart(4,'0'))});
  for(const area of districts){const re=new RegExp('\\b'+esc(fold(area))+'\\b','g');consume(re,()=>{out.areas.push(area);out.criteria.push(area)})}
  if(/\btu liem\b/.test(rest))consume(/\btu liem\b/g,()=>{out.areas.push('Bắc Từ Liêm','Nam Từ Liêm');out.criteria.push('Bắc / Nam Từ Liêm')});
  for(const [name,aliases] of types){consume(new RegExp('\\b(?:'+aliases+')\\b','g'),()=>{out.types.push(name);out.criteria.push(name)})}
  const n='(\\d+(?:[.,]\\d+)*)',money='(?:trieu(?:\\s*dong)?|tr|cu|tr/thang|vnd|dong|d)',areaUnit='(?:m2|met vuong|sqm)';
  function range(key,unit,label,scale=false){
   consume(new RegExp('(?:tu\\s+)?'+n+'\\s*(?:'+unit+')?\\s*(?:-|–|—|den|toi)\\s*'+n+'\\s*('+unit+')\\b','g'),(_,a,b,u)=>{let x=number(a),y=number(b);if(scale&&/^(?:dong|vnd|d)$/.test(u)){x/=1e6;y/=1e6}out[key]={min:x,max:y};out.criteria.push(label+' '+x+'–'+y)});
   consume(new RegExp('(?:duoi|nho hon|toi da|khong qua|tren|lon hon|it nhat|tu|khoang|tam|gia|ngan sach|tai chinh)?\\s*'+n+'\\s*('+unit+')\\b','g'),(whole,a,u)=>{let value=number(a);if(scale&&/^(?:dong|vnd|d)$/.test(u))value/=1e6;const min=/^(?:tren|lon hon|it nhat|tu)\b/.test(whole.trim()),max=/^(?:duoi|nho hon|toi da|khong qua)\b/.test(whole.trim()),near=/^(?:khoang|tam)\b/.test(whole.trim());out[key]||=min?{min:value,strictMin:/^(?:tren|lon hon)/.test(whole.trim())}:max?{max:value,strictMax:/^(?:duoi|nho hon)/.test(whole.trim())}:near?{min:value*.9,max:value*1.1}:{min:value,max:value};out.criteria.push(label+' '+(min?(/^(?:tren|lon hon)/.test(whole.trim())?'trên ':'từ '):max?(/^(?:duoi|nho hon)/.test(whole.trim())?'dưới ':'tối đa '):near?'khoảng ':'')+value)})
  }
  range('size',areaUnit,'Diện tích (m²)');range('price',money,'Giá (triệu)',true);
  consume(/(?:mat tien|ngang|mt)\s*(duoi|tren|tu|toi da|it nhat)?\s*(\d+(?:[.,]\d+)?)\s*m\b/g,(_,op,v)=>{const x=number(v);out.frontage=/duoi|toi da/.test(op)?{max:x}:/tren|tu|it nhat/.test(op)?{min:x}:{min:x,max:x};out.criteria.push('Mặt tiền '+(op||'')+' '+x+' m')});
  consume(/(\d+)\s*tang\b/g,(_,v)=>{out.floors={min:Number(v),max:Number(v)};out.criteria.push(v+' tầng')});
  rest=rest.replace(/\b(?:gia sang nhuong|gia chuyen nhuong|tien sang nhuong|tien chuyen nhuong|tim|kiem|cho|anh|em|nguon|hang|tin|bai|da dang|can|thue|tai|khu vuc|quan|huyen|phuong|gia|ngan sach|tai chinh|dien tich|mat tien|thang|moi|cac|co|va|voi|ha noi)\b/g,' ');
  out.terms=rest.replace(/[^a-z0-9.,+]+/g,' ').trim().split(/\s+/).filter(Boolean);out.criteria=[...new Set(out.criteria)];return out;
 }
 function publicData(row){return row.post?.public_data||row}
 function index(row,extra=''){const p=publicData(row),d=row.post?.private_data||{};return fold([p.code,...(p.legacyCodes||[]),p.title,p.address,p.area,p.type,...(p.categories||[]),p.description,p.size,p.price,p.frontage,p.floors,JSON.stringify(d.sourceInfo||{}),d.address,d.priceTrackingNotes,d.sourceText,...(d.hashtags||[]),extra].filter(v=>v!=null).join(' '))}
 function inRange(value,r){if(!r)return true;const n=Number(value);return value!==null&&value!==undefined&&value!==''&&Number.isFinite(n)&&(r.min==null||(r.strictMin?n>r.min:n>=r.min))&&(r.max==null||(r.strictMax?n<r.max:n<=r.max))}
 function matches(row,p,extra=''){const x=publicData(row),d=row.post?.private_data||{},text=index(row,extra),codes=[x.code,...(x.legacyCodes||[])].map(c=>fold(c).replace(/[\s–—-]+/g,'').replace(/([a-z]+)0+(\d)/,'$1$2'));
  return (!p.code||codes.includes(p.code))&&(!p.areas.length||p.areas.some(a=>fold(x.area)===fold(a)||new RegExp('\\b'+esc(fold(a))+'\\b').test(fold(x.address)+' '+fold(d.address))))&&(!p.types.length||[x.type,...(x.categories||[])].some(t=>p.types.includes(t)))&&inRange(x.size,p.size)&&inRange(p.transfer?d.privateTransferPrice:x.price,p.price)&&inRange(x.frontage??d.privateFrontage,p.frontage)&&inRange(x.floors,p.floors)&&p.terms.every(t=>text.includes(t)||text.replace(/[ .()-]/g,'').includes(t.replace(/[ .()-]/g,'')));
 }
 const api={parse,matches,index,fold,inRange};if(typeof module==='object'&&module.exports)module.exports=api;else root.RentalAdminSourceSearch=api;
})(typeof window==='object'?window:globalThis);
