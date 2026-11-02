export const foldBusiness=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/\s+/g,' ').trim();
const groups={coffee:['ca phe','cafe','coffee','tra sua'],food:['nha hang','quan an','hang an','an uong','bep nau','nau an','quan oc','do oc','bun','pho bo','lau','nuong','do an'],beauty:['spa','nail','toc','salon','tham my','lam dep'],office:['van phong','showroom'],retail:['thoi trang','ban le','cua hang','tap hoa','sieu thi','cua hang tien loi'],education:['giao duc','lop hoc','trung tam dao tao'],clinic:['phong kham','nha khoa'],warehouse:['kho','xuong','san xuat'],residential:['de o','nha o']};
export const mentionsBusiness=(text,term)=>new RegExp('(?:^|[^a-z0-9])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^a-z0-9])').test(text);
export function industryGroups(value){const s=foldBusiness(value);if(s==='oc')return ['food'];return Object.entries(groups).filter(([,terms])=>terms.some(t=>mentionsBusiness(s,t))).map(([key])=>key)}
const clauses=value=>String(value||'').split(/[.;\n]/).flatMap(line=>foldBusiness(line).split(/,\s*(?=(?:khong|cam|han che|tru|tranh|chua|du kien|uu tien|phu hop|cho phep|co|nhan|kinh doanh|kd|gan|cach|ben canh|xung quanh)\b)/)).filter(Boolean);
const uncertain=clause=>/\b(?:chua|du kien|dang xin|can xac nhan|can kiem tra)\b/.test(clause);
function negative(clause){return /\b(?:khong|cam|han che|tru|tranh)\b/.test(clause)&&!/\bkhong (?:cam|han che)\b/.test(clause)}
export function businessSuitability(customer,post){
 const industry=foldBusiness(customer.industry),wanted=industryGroups(industry),text=[post.title,post.description,...(post.facts||[])].join('\n'),parts=clauses(text),allow=Array.isArray(post.allowedIndustries)?post.allowedIndustries:Array.isArray(post.industries)?post.industries:[],deny=Array.isArray(post.deniedIndustries)?post.deniedIndustries:[];
 if(clauses(customer.requirements).some(c=>!/\b(?:khong|ko)\b/.test(c)&&/\b(?:nau an|phuc vu do an|can bep|co bep)\b/.test(c))&&!wanted.includes('food'))wanted.push('food');
 const matches=value=>foldBusiness(value)===industry||industryGroups(value).some(k=>wanted.includes(k));
 if(deny.some(matches))return {state:'no',reason:'Nguồn cấm/hạn chế ngành khách cần'};
 if(parts.some(c=>negative(c)&&((wanted.some(k=>groups[k].some(t=>mentionsBusiness(c,t))))||(industry&&mentionsBusiness(c,industry)))))return {state:'no',reason:'Bài nguồn ghi hạn chế ngành khách cần'};
 const clean=parts.some(c=>(/\b(?:mo hinh|mh|kinh doanh|nganh nghe|loai hinh) sach\b/.test(c)||/\bmhs\b/.test(c))&&!negative(c)&&!uncertain(c));
 // Food preparation is incompatible with a clean-only source, even if another sentence is broad.
 if(clean&&wanted.includes('food'))return {state:'no',reason:'Nguồn chỉ nhận mô hình sạch, không khớp khách hàng ăn'};
 if(wanted.includes('residential'))return /can ho|phong tro|nha nguyen can|biet thu/.test(foldBusiness(post.type))?{state:'yes',reason:'Loại nhà phù hợp nhu cầu để ở'}:{state:'unknown',reason:'Nguồn chưa xác nhận phù hợp để ở'};
 if(allow.some(matches))return {state:'yes',reason:'Ngành được nguồn xác nhận phù hợp'};
 if(parts.some(c=>/\b(?:kinh doanh|kd|phu hop|cho phep|nhan)\b/.test(c)&&/\b(?:moi|tat ca) (?:loai hinh|nganh nghe|mo hinh)\b/.test(c)&&!negative(c)&&!uncertain(c))||parts.some(c=>/\bkhong han che (?:loai hinh|nganh nghe|mo hinh)\b/.test(c)&&!uncertain(c)))return industry?{state:'yes',reason:'Nguồn cho kinh doanh mọi loại hình/ngành nghề'}:{state:'unknown',reason:'Khách chưa rõ ngành nghề'};
 if(clean&&wanted.length&&wanted.every(k=>['coffee','beauty','office','retail'].includes(k)))return {state:'yes',reason:'Ngành phù hợp nhóm mô hình sạch theo nguồn'};
 if(parts.some(c=>{if(negative(c)||uncertain(c))return false;const affirmative=c.match(/\b(?:phu hop|cho phep|uu tien|thich hop|thue lam|khong cam|khong han che)\b(.+)/)?.[1]?.split(/\b(?:gan|cach|ben canh|xung quanh)\b/)[0]||'';return wanted.some(k=>groups[k].some(t=>mentionsBusiness(affirmative,t)))||industry&&mentionsBusiness(affirmative,industry)}))return {state:'yes',reason:'Bài nguồn nêu rõ ngành phù hợp'};
 // An office listing is direct use evidence; nearby cafés/shops are never suitability evidence.
 if(wanted.length===1&&wanted[0]==='office'&&foldBusiness(post.type)==='van phong')return {state:'yes',reason:'Nguồn văn phòng phù hợp mục đích văn phòng'};
 if(wanted.includes('residential')&&/can ho|phong tro|nha nguyen can|biet thu/.test(foldBusiness(post.type)))return {state:'yes',reason:'Loại nhà phù hợp nhu cầu để ở'};
 return {state:'unknown',reason:'Nguồn chưa nêu rõ phù hợp ngành khách cần'};
}
const features={
 'thang máy':['thang may'], 'lối đi riêng':['loi di rieng'], 'đỗ ô tô':['do o to','cho do o to','cho de o to'],
 'đường ô tô':['o to vao','o to do cua','duong o to'], 'mặt phố':['mat pho','mat duong'],
 'đường hai chiều':['duong hai chieu','duong 2 chieu'], 'PCCC':['pccc','phong chay chua chay'],
 'khu dân cư đông':['dong dan','dan cu dong','mat do dan cu cao']
};
export function requiredBusinessFeatures(customer){const lines=String(customer.requirements||'').split(/[\n.;]/).map(foldBusiness),found=[];
 for(const [label,terms]of Object.entries(features))for(const line of lines){const term=terms.find(t=>line.includes(t));if(!term)continue;const before=line.slice(0,line.indexOf(term));if(/(?:khong|ko) (?:can|yeu cau)\s*[:：]?\s*$/.test(before))continue;found.push({label,terms,optional:before.lastIndexOf('uu tien')>=0&&before.lastIndexOf('uu tien')>before.lastIndexOf('bat buoc')});break}
 for(const value of customer.requiredFeatures||[]){const label=Object.keys(features).find(k=>foldBusiness(k)===foldBusiness(value)||features[k].includes(foldBusiness(value)));found.push({label:label||value,terms:label?features[label]:[foldBusiness(value)],optional:false})}
 return [...new Map(found.map(f=>[foldBusiness(f.label),f])).values()];
}
export function featureSuitability(post,feature){const stored=(post.features||[]).map(foldBusiness),parts=clauses([post.title,post.description,...(post.facts||[])].join('\n'));
 if(parts.some(c=>feature.terms.some(t=>mentionsBusiness(c,t))&&negative(c)))return 'no';
 if(stored.some(s=>!negative(s)&&!uncertain(s)&&(feature.terms.some(t=>mentionsBusiness(s,t))||s===foldBusiness(feature.label))))return 'yes';
 if(parts.some(c=>feature.terms.some(t=>mentionsBusiness(c,t))&&uncertain(c)))return 'unknown';
 if(parts.some(c=>feature.terms.some(t=>mentionsBusiness(c,t))&&!negative(c)&&!/\b(?:gan|cach|co the bo sung)\b/.test(c)))return 'yes';return 'unknown';
}

export function inferCustomerIndustry(value){const s=foldBusiness(value);for(const [group,terms]of Object.entries(groups))for(const term of terms){const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');if(new RegExp('(?:nganh nghe|muc dich|kinh doanh|thue lam|mo|lam|thue)\\s*[:：]?\\s*(?:de\\s+)?(?:quan\\s+)?'+escaped+'(?=$|[^a-z0-9])').test(s))return {coffee:'Cà phê',food:'Nhà hàng / Quán ăn',beauty:'Spa / Nail / Tóc',office:'Văn phòng',retail:'Bán lẻ',education:'Giáo dục',clinic:'Phòng khám',warehouse:'Kho xưởng',residential:'Để ở'}[group];}return ''}
