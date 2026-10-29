import {createHash} from 'node:crypto';
import {areas} from './posts.mjs';
import '../public/need-matching.js';
const matcher=globalThis.RentalNeedMatching;
export const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/\s+/g,' ').trim();
const num=v=>typeof v==='number'&&Number.isFinite(v)&&v>0?v:null;
export const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function moneyRange(value){
 const key=String(value||'');const ranges={'under-5':[0,5],'under-10':[0,10],'10-20':[10,20],'20-30':[20,30],'30-50':[30,50],'over-50':[50,null],'over-100':[100,null],'over-200':[200,null],'over-300':[300,null]};if(Object.hasOwn(ranges,key))return {min:ranges[key][0],max:ranges[key][1],...(key.startsWith('under-')?{exclusiveMax:true}:key.startsWith('over-')?{exclusiveMin:true}:{})};
 const text=fold(value);let m=text.match(/^(?:tu\s*)?(\d+(?:[.,]\d+)?)\s*(?:-|–|den)\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)(?:\b|\/)/);if(m)return {min:+m[1].replace(',','.'),max:+m[2].replace(',','.')};
 m=text.match(/^(duoi|toi da|khong qua|tren|tu)\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)(?:\b|\/)/);if(m)return ['tren','tu'].includes(m[1])?{min:+m[2].replace(',','.'),max:null,exclusiveMin:m[1]==='tren'}:{min:0,max:+m[2].replace(',','.'),exclusiveMax:m[1]==='duoi'};return {min:null,max:null};
}
export function normalizeCustomer(data,origin){
 const range=moneyRange(data.budget),maxBudget=num(data.maxBudget)??range.max,minBudget=num(data.minBudget)??range.min,phone=String(data.phone||'').replace(/[ .()-]/g,'').replace(/^\+84/,'0');
 const c={name:String(data.name||'Chưa rõ tên').slice(0,120),phone,area:String(data.area||''),type:String(data.type||''),industry:String(data.industry||''),requirements:String(data.requirements||'').slice(0,3000),minBudget,maxBudget,budgetMinExclusive:data.minBudget==null&&range.exclusiveMin===true,budgetMaxExclusive:data.maxBudget==null&&range.exclusiveMax===true,minSize:num(data.minSize),maxSize:num(data.maxSize),minFrontage:num(data.minFrontage),transaction:data.transaction==='transfer'?'transfer':'rent',transferBudget:num(data.transferBudget),requiredFeatures:Array.isArray(data.requiredFeatures)?data.requiredFeatures.map(v=>String(v).trim()).slice(0,30):[],requirementsReviewed:data.requirementsReviewed===true,origins:[origin]};
 const identity=/^0\d{9}$/.test(phone)&&c.name.trim()&&!fold(c.name).includes('chua ro')?phone:origin.key;
 c.key=digest([origin.ownerId||'admin',identity,fold(c.name),c.area,c.type,c.industry,c.minBudget,c.maxBudget,c.budgetMinExclusive,c.budgetMaxExclusive,c.minSize,c.maxSize,c.minFrontage,c.transaction,c.transferBudget,c.requiredFeatures,c.requirements,c.requirementsReviewed]);return c;
}
export function combineCustomers(list){const map=new Map();for(const c of list){const old=map.get(c.key);if(old)old.origins.push(...c.origins.filter(o=>!old.origins.some(x=>x.key===o.key)));else map.set(c.key,{...c,origins:[...c.origins]})}return [...map.values()]}
function district(value){return fold(value).replace(/^(?:quan|huyen|thi xa)\s+/,'')}
function industryKey(value){const s=fold(value);const aliases={cafe:'ca phe',coffee:'ca phe','quan bi-a':'bi a','bi-a':'bi a',bida:'bi a',billiards:'bi a','tham my vien':'tham my'};return Object.hasOwn(aliases,s)?aliases[s]:s}
function mentions(text,term){let escaped='';for(const c of fold(term))escaped+=('\\^$.*+?()[]{}|'.includes(c)?'\\'+c:c);return !!escaped&&new RegExp('(?:^|[^a-z0-9])'+escaped+'(?=$|[^a-z0-9])').test(text)}
function industryState(customer,post){
 const raw=(Object.hasOwn(matcher.sectors,customer.industry)?matcher.sectors[customer.industry]:null)||customer.industry.split('/').map(s=>fold(s.trim())).filter(Boolean),terms=[...new Set(raw.flatMap(t=>industryKey(t)==='ca phe'?['ca phe','cafe','coffee']:industryKey(t)==='bi a'?['quan bi-a','bi-a','bida','billiards']:[fold(t)]))],allowed=(post.allowedIndustries||post.industries||[]).flatMap(t=>String(t).split('/').map(industryKey)),denied=(post.deniedIndustries||[]).flatMap(t=>String(t).split('/').map(industryKey)),text=fold([post.title,post.description,...(post.facts||[])].join('. '));
 if(terms.some(t=>denied.includes(industryKey(t))))return 'no';
 const clauses=text.split(/[.;\n]/);
 for(const term of terms){const needle=fold(term);if(clauses.some(c=>mentions(c,needle)&&/\b(khong|cam|han che)\b/.test(c)))return 'no'}
 if(terms.some(t=>allowed.some(x=>x===industryKey(t)||x===industryKey(customer.industry))))return 'yes';
 if(terms.some(t=>clauses.some(c=>mentions(c,t)&&/\b(phu hop|cho phep|uu tien|thich hop)\b/.test(c))))return 'yes';
 const residential=['can ho chung cu','can ho dich vu','phong tro','nha nguyen can','biet thu, nha lien ke'];if(fold(customer.industry)==='de o'&&residential.includes(matcher.typeKey(post.type)))return 'yes';return 'unknown';
}
export function evaluateMatch(c,p){
 const reasons=[],missing=[],failed=[];const check=(known,pass,yes,no,unknown)=>{if(!known)missing.push(unknown);else if(pass)reasons.push(yes);else failed.push(no)};
 if(p.matchingCriteriaStale)missing.push('Tiêu chí nguồn cần xác nhận lại sau khi tin thay đổi');
 if(p.isSale||p.transaction==='sale')failed.push('Nguồn bán không phải nguồn cho thuê');
 if(p.status&&p.status!=='published')failed.push('Tin chưa công khai');
 if(['rented','paused'].includes(p.availability))failed.push('Nguồn đã cho thuê/tạm dừng');else if(p.availability!=='available')missing.push('Tình trạng còn hàng chưa được xác nhận');else reasons.push('Nguồn đang công khai, còn hàng');
 const locations=matcher.locations({area:'',requirements:[c.area,c.requirements].join('\n')}),wanted=locations.areas.filter(a=>areas.includes(a));check(wanted.length>0&&!!p.area,wanted.some(a=>district(a)===district(p.area))&&!locations.excluded.some(a=>district(a)===district(p.area)),'Đúng khu vực','Sai khu vực','Khách hoặc nguồn chưa có khu vực chuẩn');
 const place=fold([p.area,p.address,p.location,p.title].join(' '));if(locations.specific.some(a=>!place.includes(fold(a))))missing.push('Cần đối chiếu vị trí cụ thể: '+locations.specific.join(', '));if(locations.excluded.some(a=>place.includes(fold(a))))failed.push('Nguồn ở khu vực khách loại trừ');
 const types=[p.type,...(p.categories||[])].map(matcher.typeKey);check(!!c.type&&!!p.type,types.includes(matcher.typeKey(c.type)),'Đúng loại BĐS','Sai loại BĐS','Chưa đủ loại BĐS');
 check(c.maxBudget!=null&&num(p.price)!=null,(c.budgetMinExclusive?p.price>(c.minBudget??0):p.price>=(c.minBudget??0))&&(c.budgetMaxExclusive?p.price<c.maxBudget:p.price<=c.maxBudget),'Trong khoảng ngân sách','Ngoài ngân sách','Chưa đủ trần ngân sách/giá thuê xác định');
 if(num(p.price)!=null&&c.minBudget!=null&&(c.budgetMinExclusive?p.price<=c.minBudget:p.price<c.minBudget))failed.push('Thấp hơn phân khúc ngân sách tối thiểu');
 if(c.minBudget!=null&&c.maxBudget!=null&&c.minBudget>c.maxBudget)failed.push('Khoảng ngân sách khách bị ngược');
 for(const [value,key,cmp,label] of [[c.minSize,'size',(a,b)=>a>=b,'diện tích tối thiểu'],[c.maxSize,'size',(a,b)=>a<=b,'diện tích tối đa'],[c.minFrontage,'frontage',(a,b)=>a>=b,'mặt tiền tối thiểu']])if(value!=null)check(num(p[key])!=null,cmp(p[key],value),'Đạt '+label,'Không đạt '+label,'Nguồn chưa rõ '+label);
 if(c.transaction==='transfer'){if(!p.isTransfer)failed.push('Khách cần sang nhượng');check(c.transferBudget!=null&&num(p.transferPrice)!=null,p.transferPrice<=c.transferBudget,'Phí sang nhượng trong ngân sách','Phí sang nhượng vượt ngân sách','Chưa đủ ngân sách/phí sang nhượng')}else if(p.isTransfer)failed.push('Nguồn yêu cầu sang nhượng, khách chưa chọn sang nhượng');
 if(c.industry.includes('/')&&!c.requirementsReviewed)missing.push('Nhóm ngành ghép chưa được xác nhận thành mục đích cụ thể');
 if(c.industry){const industry=industryState(c,p);if(industry==='no')failed.push('Ngành nghề bị hạn chế/không phù hợp');else if(industry==='unknown')missing.push('Chưa có xác nhận phù hợp ngành nghề');else reasons.push('Có căn cứ phù hợp ngành nghề')}else if(!['can ho chung cu','can ho dich vu','phong tro'].includes(matcher.typeKey(c.type)))missing.push('Khách chưa rõ mục đích/ngành nghề');
 for(const feature of c.requiredFeatures){if((p.features||[]).map(fold).includes(fold(feature)))reasons.push('Có '+feature);else missing.push('Chưa xác nhận '+feature)}
 if(c.requirements.trim()&&!c.requirementsReviewed)missing.push('Có yêu cầu tự do chưa được chuẩn hóa/xác nhận');
 return {level:failed.length?'rejected':missing.length?'review':'criteria',reasons,missing,failed,slug:p.slug,code:p.code,title:p.title,price:p.price,size:p.size,href:(p.slug?.startsWith('hn-')?'/bds/'+p.slug+'/':'/tin?slug='+encodeURIComponent(p.slug||'')),signature:digest([c.key,c.criteriaHash,p.slug,p.title,p.description,p.categories,p.matchingCriteriaStale,p.price,p.size,p.frontage,p.area,p.type,p.isTransfer,p.transferPrice,p.availability,p.allowedIndustries,p.industries,p.deniedIndustries,p.features])};
}
export function matchUnified(c,stock){return stock.map(p=>evaluateMatch(c,p)).filter(m=>m.level!=='rejected').sort((a,b)=>(a.level==='criteria'?0:1)-(b.level==='criteria'?0:1)||a.missing.length-b.missing.length||b.reasons.length-a.reasons.length||a.price-b.price)}
