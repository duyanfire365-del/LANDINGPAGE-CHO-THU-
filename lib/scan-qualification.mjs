export const foldScan=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
const districts=['Nam Từ Liêm','Bắc Từ Liêm','Hà Đông','Cầu Giấy','Thanh Xuân','Đống Đa','Hoàn Kiếm','Ba Đình','Hoàng Mai','Long Biên','Tây Hồ','Hai Bà Trưng','Hoài Đức','Thanh Oai','Đan Phượng','Chương Mỹ','Đông Anh','Gia Lâm','Thanh Trì','Sóc Sơn','Mê Linh','Sơn Tây','Ba Vì','Phúc Thọ','Thạch Thất','Quốc Oai','Đan Phượng','Thường Tín','Phú Xuyên','Ứng Hòa','Mỹ Đức'];
const wards={'Phương Canh':'Nam Từ Liêm','Mỹ Đình':'Nam Từ Liêm','Cự Khối':'Long Biên','Bát Khối':'Long Biên','Vân Canh':'Hoài Đức','Kim Chung':'Hoài Đức','Nguyên Khê':'Đông Anh','Văn Quán':'Hà Đông','Kiến Hưng':'Hà Đông','Dương Nội':'Hà Đông','Trần Duy Hưng':'Cầu Giấy','Dịch Vọng':'Cầu Giấy','Trung Hòa':'Cầu Giấy','Nguyễn Khuyến':'Hà Đông','Nguyễn Trãi':'Thanh Xuân'};
// Ambiguous names (Kim Chung, Nguyễn Khuyến, Nguyễn Trãi...) require explicit Hà Nội context.
const ambiguous=new Set(['Kim Chung','Nguyễn Khuyến','Nguyễn Trãi']);
export function scanPhones(text){return [...new Set([...String(text||'').matchAll(/(?<!\d)(?:\+84|0)(?:[ .()-]*\d){9}(?!\d)/g)].map(m=>m[0].replace(/[ .()-]/g,'').replace(/^\+84/,'0')).filter(p=>/^0[35789]\d{8}$/.test(p)))]}
export function scanLocation(content){
 const text=String(content||'').normalize('NFC'),head=text.split(/\n/).filter(x=>!/^\s*#/.test(x)).slice(0,10).join('\n').slice(0,1200),n=foldScan(head);
 const external=n.match(/\b(?:bac ninh|hung yen|bac giang|hai duong|hai phong|ha nam|nam dinh|thai nguyen|vinh phuc|phu tho|hoa binh|thanh hoa|nghe an|da nang|ho chi minh|tp\.?\s*hcm|binh duong|dong nai|ha giang|cao bang|lang son|lao cai|yen bai|dien bien|son la|lai chau|tuyen quang|bac kan|quang ninh|thai binh|ninh binh|ha tinh|quang binh|quang tri|thua thien hue|hue|quang nam|quang ngai|binh dinh|phu yen|khanh hoa|ninh thuan|binh thuan|kon tum|gia lai|dak lak|dak nong|lam dong|binh phuoc|tay ninh|ba ria|vung tau|long an|tien giang|ben tre|tra vinh|vinh long|dong thap|an giang|kien giang|can tho|hau giang|soc trang|bac lieu|ca mau|van lam|tien du|lang giang)\b/);
 const indexOfName=name=>n.search(new RegExp('\\b'+foldScan(name)+'\\b'));
 const found=districts.map(name=>({name,index:indexOfName(name)})).filter(x=>x.index>=0).sort((a,b)=>a.index-b.index);
 const hanoi=/\bha noi\b/.test(n),ward=Object.entries(wards).find(([name])=>indexOfName(name)>=0&&(!ambiguous.has(name)||hanoi));
 if(external)return {state:'outside-or-ambiguous',district:found[0]?.name||'',reason:'Có địa danh ngoài Hà Nội ('+external[0]+'); cần xác nhận phạm vi.'};
 if(found.length&&(!ward||found[0].index<=indexOfName(ward[0])))return {state:'hanoi',district:found[0].name,evidence:found[0].name};
 if(ward)return {state:'hanoi',district:ward[1],evidence:ward[0]+' → '+ward[1]+' (suy ra từ địa danh)'};
 if(hanoi)return {state:'hanoi-city-only',district:'',evidence:'Hà Nội'};
 return {state:'unknown',district:'',reason:'Chưa xác định được địa điểm tại Hà Nội.'};
}
export function qualifyScan(item){
 const text=String(item.content||''),n=foldScan(text),location=scanLocation(text),phones=scanPhones(text),reasons=[];
 const opening=n.split('\n').slice(0,3).join(' ').slice(0,250);
 const demandMatch=opening.match(/(?:can|tim|nhu cau|muon)\s+(?:thue|tim\s+thue|mat bang|kho|xuong|van phong)/),offerMatch=opening.match(/cho\s*thue|chinh chu|(?:toi|minh|nha toi|nha minh)\s+(?:dang\s+)?co\s+(?:kho|xuong|nha|mat bang|van phong)/);
 const demand=!!demandMatch&&(!offerMatch||demandMatch.index<offerMatch.index);
 const offer=/cho\s*thue|sang\s*nhuong|chuyen\s*nhuong|(?:toi|minh|nha toi|nha minh)\s+(?:dang\s+)?co\s+(?:kho|xuong|nha|mat bang|van phong)/.test(n)||(/kho|xuong|mat bang|van phong/.test(opening)&&/\d\s*(?:trieu|tr)\s*\/\s*thang/.test(n));
 const owner=/chinh chu\s*(?:dang\s*)?(?:cho thue|can cho thue|sang nhuong)|(?:toi|minh|nha toi|nha minh|gia dinh toi|gia dinh minh)\s+(?:la\s+chu|(?:dang\s+)?co\s+(?:kho|xuong|nha|mat bang|van phong))|(?:chu kho|chu xuong|chu nha)\s*(?:truc tiep|dang tin|cho thue)/.test(n);
 const broker=/nhan ky gui|chuyen moi gioi|ben em co|nguon hang|chu gui|hang chinh chu|san bat dong san|phi moi gioi|hoa hong/.test(n);
 const kind=demand?'tenant':'owner';
 if(!phones.length)reasons.push('Không có số điện thoại Việt Nam rõ ràng trong chính nội dung.');
 if(!['hanoi','hanoi-city-only'].includes(location.state))reasons.push(location.reason);
 if(kind==='tenant'){
  if(!demand)reasons.push('Chưa có nhu cầu tìm thuê rõ ràng.');
 }else{
  if(!offer)reasons.push('Chưa xác định là nguồn cho thuê/sang nhượng.');
  if(location.state==='hanoi-city-only')reasons.push('Chỉ ghi Hà Nội, chưa có quận/huyện hoặc địa điểm cụ thể.');
  if(!owner)reasons.push('Chưa có lời tự khai là chủ nguồn; không suy ra chính chủ từ tên hoặc số điện thoại.');
  if(broker)reasons.push('Có dấu hiệu trung gian/môi giới; cần kiểm tra.');
 }
 return {accepted:reasons.length===0,kind,reasons,district:location.district,phone:phones.join(', '),ownerEvidence:kind==='owner'&&owner?'Người đăng tự khai là chủ nguồn; chưa được xác minh.':'',locationEvidence:location.evidence||'',version:'hanoi-direct-v1'};
}
