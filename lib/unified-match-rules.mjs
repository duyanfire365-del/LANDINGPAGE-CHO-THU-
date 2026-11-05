import {extractCustomerCriteria} from './customer-input.mjs';
import {businessSuitability,requiredBusinessFeatures,featureSuitability,inferCustomerIndustry,industryGroups} from './business-suitability.mjs';
import {createHash} from 'node:crypto';
import {areas} from './posts.mjs';
import '../public/need-matching.js';
const matcher=globalThis.RentalNeedMatching;
export const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/\s+/g,' ').trim();
const num=v=>typeof v==='number'&&Number.isFinite(v)&&v>0?v:null;
export const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function moneyRange(value){
 const key=String(value||'');const ranges={'under-5':[0,5],'under-10':[0,10],'10-20':[10,20],'20-30':[20,30],'30-50':[30,50],'over-50':[50,null],'over-100':[100,null],'over-200':[200,null],'over-300':[300,null]};if(Object.hasOwn(ranges,key))return {min:ranges[key][0],max:ranges[key][1],...(key.startsWith('under-')?{exclusiveMax:true}:key.startsWith('over-')?{exclusiveMin:true}:{})};
 const text=fold(value);const estimated=text.match(/^(?:khoang|tam|tren duoi|xap xi)\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)(?:\b|\/)/);if(estimated){const amount=+estimated[1].replace(',','.');return {min:amount,max:amount};}let m=text.match(/^(?:tu\s*)?(\d+(?:[.,]\d+)?)\s*(?:-|–|den)\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)(?:\b|\/)/);if(m)return {min:+m[1].replace(',','.'),max:+m[2].replace(',','.')};
 m=text.match(/^(duoi|toi da|khong qua|tren|tu)\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)(?:\b|\/)/);if(m)return ['tren','tu'].includes(m[1])?{min:+m[2].replace(',','.'),max:null,exclusiveMin:m[1]==='tren'}:{min:0,max:+m[2].replace(',','.'),exclusiveMax:m[1]==='duoi'};return {min:null,max:null};
}
export function normalizeCustomer(data,origin){
 const extracted=extractCustomerCriteria(data.requirements||'');data={...extracted,...data};data.industry||=inferCustomerIndustry(data.requirements);
 const range=moneyRange(data.budget),maxBudget=num(data.maxBudget)??range.max,minBudget=num(data.minBudget)??range.min,phone=String(data.phone||'').replace(/[ .()-]/g,'').replace(/^\+84/,'0');
 const numericalReview=['minSize','maxSize','minFrontage'].some(k=>data[k]==null&&extracted[k]!=null);
 const c={numericalReview,parseReview:Array.isArray(data.parseWarnings)&&data.parseWarnings.length>0,budget:String(data.budget||''),name:String(data.name||'Chưa rõ tên').slice(0,120),phone,area:String(data.area||''),type:String(data.type||''),industry:String(data.industry||''),requirements:String(data.requirements||'').slice(0,3000),minBudget,maxBudget,budgetMinExclusive:data.minBudget==null&&range.exclusiveMin===true,budgetMaxExclusive:data.maxBudget==null&&range.exclusiveMax===true,minSize:num(data.minSize),maxSize:num(data.maxSize),minFrontage:num(data.minFrontage),locationAnchor:String(data.locationAnchor||''),searchRadiusKm:num(data.searchRadiusKm),transaction:data.transaction==='transfer'?'transfer':'rent',transferBudget:num(data.transferBudget),requiredFeatures:Array.isArray(data.requiredFeatures)?data.requiredFeatures.map(v=>String(v).trim()).slice(0,30):[],requirementsReviewed:data.requirementsReviewed===true,origins:[origin]};
 c.budgetApproximate=data.budgetApproximate===true;
 const identity=/^0\d{9}$/.test(phone)&&c.name.trim()&&!fold(c.name).includes('chua ro')?phone:origin.key;
 c.key=digest([origin.ownerId||'admin',identity,fold(c.name),c.area,c.type,c.industry,c.minBudget,c.maxBudget,c.budgetMinExclusive,c.budgetMaxExclusive,c.minSize,c.maxSize,c.minFrontage,c.transaction,c.transferBudget,c.requiredFeatures,c.requirements,c.requirementsReviewed,...(c.locationAnchor||c.searchRadiusKm?[{locationAnchor:c.locationAnchor,searchRadiusKm:c.searchRadiusKm}]:[]),...(c.parseReview?[{parseReview:true}]:[])]);return c;
}
export function combineCustomers(list){const map=new Map();for(const c of list){const old=map.get(c.key);if(old)old.origins.push(...c.origins.filter(o=>!old.origins.some(x=>x.key===o.key)));else map.set(c.key,{...c,origins:[...c.origins]})}return [...map.values()]}
function district(value){return fold(value).replace(/^(?:quan|huyen|thi xa)\s+/,'')}
export const MATCH_BUDGET_TOLERANCE=0.15;
export const MATCH_RULE_VERSION='area-industry-budget15-v2';
export function customerBudgetBand(c){
 const range=moneyRange(c.budget),hasRange=range.min!=null||range.max!=null,min=num(c.minBudget)??range.min,max=num(c.maxBudget)??range.max;
 if(min==null&&max==null)return null;
 const low=min??(hasRange?0:max),high=max;
 return {min:Math.round(Math.max(0,(low||0)*(1-MATCH_BUDGET_TOLERANCE))*1e6)/1e6,max:high==null?null:Math.round(high*(1+MATCH_BUDGET_TOLERANCE)*1e6)/1e6,originalMin:low||0,originalMax:high};
}
function unstructuredConstraint(c,features){
 if(c.requirementsReviewed)return false;if(c.numericalReview||c.parseReview)return true;
 const text=fold(c.requirements);if(!text)return false;
 // Known physical requirements are checked individually. Unparsed hard conditions stay in review.
 const lines=String(c.requirements).split(/[\n.;]/).map(fold);
 return lines.some(line=>(/\b(?:can|toi thieu|it nhat)\b/.test(line)&&/\d/.test(line)&&/\b(?:tang|phong|wc|duong rong|dien 3 pha)\b/.test(line)&&!features.some(f=>f.terms.some(t=>line.includes(t))))||/\b(?:bat buoc|phai co|hop dong|thoi han|dat coc|tien coc|phap ly|giay phep|yeu cau)\b/.test(line)&&!features.some(f=>f.terms.some(t=>line.includes(t)))&&!/\b(?:khong|ko) yeu cau khu vuc\b/.test(line)&&!/\b(?:dien tich|mat tien|ngan sach|tai chinh|khu vuc|nganh nghe)\b/.test(line));
}
export function evaluateMatch(c,p){
 const reasons=[],missing=[],failed=[],warnings=[];let totalWeight=0,matchedWeight=0;
 const check=(known,pass,yes,no,unknown,weight=1)=>{totalWeight+=weight;if(known&&pass)matchedWeight+=weight;if(!known)missing.push(unknown);else if(pass)reasons.push(yes);else failed.push(no)};
 if(p.matchingCriteriaStale)missing.push('Tiêu chí nguồn cần xác nhận lại sau khi tin thay đổi');
 if(p.transactionType!=='both'&&(p.isSale||p.transaction==='sale'||p.transactionType==='sale'))failed.push('Nguồn bán không phải nguồn cho thuê');
 if(p.status&&p.status!=='published')failed.push('Tin chưa công khai');
 if(['rented','sold','paused'].includes(p.availability))failed.push('Nguồn đã cho thuê/tạm dừng');else if(p.availability!=='available')missing.push('Tình trạng còn hàng chưa được xác nhận');else reasons.push('Nguồn đang công khai, còn hàng');
 const locations=matcher.locations({area:'',requirements:[c.area,c.requirements].join('\n')}),wanted=locations.areas.filter(a=>areas.includes(a));
 const anyArea=!wanted.length&&(/\b(?:khong|ko) (?:yeu cau|gioi han|bat buoc) (?:ve )?khu vuc\b|\b(?:toan|khap) ha noi\b/.test(fold(c.area+' '+c.requirements))||fold(c.area)==='ha noi');check((wanted.length>0||anyArea)&&!!p.area,(anyArea||wanted.some(a=>district(a)===district(p.area)))&&!locations.excluded.some(a=>district(a)===district(p.area)),anyArea?'Khách chấp nhận mọi khu vực Hà Nội':'Đúng khu vực','Sai khu vực','Khách hoặc nguồn chưa có khu vực chuẩn',3);
 if(c.searchRadiusKm)missing.push('Cần xác minh khoảng cách trong bán kính '+c.searchRadiusKm+' km quanh '+(c.locationAnchor||c.area)+'; chưa có dữ liệu tọa độ để xác nhận.');
 const place=fold([p.area,p.address,p.location,p.title,p.description].join(' '));if(locations.specific.some(a=>!place.includes(fold(a))))missing.push('Cần đối chiếu vị trí cụ thể: '+locations.specific.join(', '));if(locations.excluded.some(a=>place.includes(fold(a))))failed.push('Nguồn ở khu vực khách loại trừ');
 const suitability=c.industry?businessSuitability(c,p):null,types=[p.type,...(p.categories||[])].map(matcher.typeKey),wantedType=matcher.typeKey(c.type),exactType=types.includes(wantedType),compatible=!exactType&&['mat bang kinh doanh','van phong'].includes(wantedType)&&types.some(t=>['mat bang kinh doanh','van phong','nha nguyen can'].includes(t))&&suitability?.state==='yes'&&!/\b(?:chi thue|chi lay|bat buoc)\b/.test(fold(c.requirements));
 if(c.type){if(compatible){totalWeight++;matchedWeight+=0.5;reasons.push('Loại nguồn có công năng kinh doanh phù hợp theo thông tin nguồn');warnings.push('Loại BĐS khác lựa chọn ưu tiên: '+p.type+'; cần đối chiếu bố trí thực tế');}else check(!!p.type,exactType,'Đúng loại BĐS','Sai loại BĐS','Nguồn chưa rõ loại BĐS');}else warnings.push('Khách chưa chọn loại BĐS; đối chiếu theo khu vực và ngành nghề');
 const band=customerBudgetBand(c);let budgetTier=2,priceDeviation=null,budgetDistance=null;
 if(c.budgetApproximate)warnings.push('Tài chính khách là ước lượng; cần xác nhận khi trao đổi');
 if(band&&band.max==null)warnings.push('Tài chính chưa có mức trần; chưa xác nhận ngân sách tối đa');
 if(p.priceFrom&&!band)warnings.push('Giá nguồn là mức khởi điểm, chưa chốt giá thuê');
 if(!band){warnings.push('Chưa rõ tài chính khách; chưa xác nhận phù hợp ngân sách');if(!num(p.price))warnings.push('Nguồn chưa rõ giá thuê');}
 else{
  if(p.priceFrom)missing.push('Giá nguồn mới là mức khởi điểm, cần xác nhận giá thuê thực tế');
  check(num(p.price)!=null,p.price>=band.min&&(band.max==null||p.price<=band.max),'Giá trong biên linh động 15%','Giá ngoài biên linh động 15%','Nguồn chưa có giá thuê xác định',2);
  if(num(p.price)){const originalLow=band.originalMin,originalHigh=band.originalMax;budgetTier=p.price>=originalLow&&(originalHigh==null||p.price<=originalHigh)?0:1;
   if(originalHigh&&p.price>originalHigh)priceDeviation=Math.round((p.price/originalHigh-1)*1000)/10;
   else if(originalLow&&p.price<originalLow)priceDeviation=Math.round((p.price/originalLow-1)*1000)/10;else priceDeviation=0;
   budgetDistance=band.originalMax==null&&originalLow?Math.abs(p.price/originalLow-1):Math.abs(priceDeviation||0);if(band.originalMax==null)budgetTier=2;
   if(priceDeviation)warnings.push('Giá '+(priceDeviation>0?'cao':'thấp')+' hơn tài chính ghi nhận '+Math.abs(priceDeviation)+'% (biên cho phép 15%)');
  }
 }
 if(c.minBudget!=null&&c.maxBudget!=null&&c.minBudget>c.maxBudget)failed.push('Khoảng ngân sách khách bị ngược');
 for(const [value,key,cmp,label]of [[c.minSize,'size',(a,b)=>a>=b,'diện tích tối thiểu'],[c.maxSize,'size',(a,b)=>a<=b,'diện tích tối đa'],[c.minFrontage,'frontage',(a,b)=>a>=b,'mặt tiền tối thiểu']])if(value!=null)check(num(p[key])!=null,cmp(p[key],value),'Đạt '+label,'Không đạt '+label,'Nguồn chưa rõ '+label);
 if(c.transaction==='transfer'){if(!p.isTransfer)failed.push('Khách cần sang nhượng');check(c.transferBudget!=null&&num(p.transferPrice)!=null,p.transferPrice<=c.transferBudget,'Phí sang nhượng trong ngân sách','Phí sang nhượng vượt ngân sách','Chưa đủ ngân sách/phí sang nhượng')}else if(p.isTransfer)failed.push('Nguồn yêu cầu sang nhượng, khách chưa chọn sang nhượng');
 if(c.industry){totalWeight+=3;if(industryGroups(c.industry).length>1&&!c.requirementsReviewed)missing.push('Khách ghi nhiều nhóm ngành khác nhau; cần xác nhận mô hình');const industry=suitability;if(industry.state==='yes')matchedWeight+=3;if(industry.state==='no')failed.push(industry.reason);else if(industry.state==='unknown')missing.push(industry.reason);else reasons.push(industry.reason)}else if(!['can ho chung cu','can ho dich vu','phong tro'].includes(matcher.typeKey(c.type)))missing.push('Khách chưa rõ mục đích/ngành nghề');
 const featureSpecs=requiredBusinessFeatures(c);
 for(const f of featureSpecs){totalWeight++;const state=featureSuitability(p,f);if(state==='yes')matchedWeight++;if(state==='yes')reasons.push('Có '+f.label);else if(f.optional)warnings.push('Tiêu chí ưu tiên chưa xác nhận: '+f.label);else if(state==='no')failed.push('Nguồn không đáp ứng '+f.label);else missing.push('Chưa xác nhận '+f.label)}
 if(unstructuredConstraint(c,featureSpecs)){totalWeight++;missing.push('Có điều kiện bắt buộc chưa chuẩn hóa/xác nhận');}
 const criteriaCoverage=totalWeight?Math.round(matchedWeight/totalWeight*100):0;if(criteriaCoverage<80)missing.push('Chưa đáp ứng đủ 80% tiêu chí đã nhập');
 const level=failed.length?'rejected':missing.length?'review':'criteria';
 return {level,reasons,missing,failed,warnings,budgetTier,budgetDistance,priceDeviation,budgetBand:band,criteriaCoverage,score:criteriaCoverage,slug:p.slug,code:p.code,title:p.title,price:p.price,priceFrom:p.priceFrom===true,size:p.size,href:(p.slug?.startsWith('hn-')?'/bds/'+p.slug+'/':'/tin?slug='+encodeURIComponent(p.slug||'')),signature:digest([MATCH_RULE_VERSION,c.key,c.criteriaHash,c.minBudget,c.maxBudget,c.budget,c.industry,c.requirements,p.slug,p.title,p.description,p.categories,p.matchingCriteriaStale,p.price,p.priceFrom,p.size,p.frontage,p.area,p.type,p.isTransfer,p.transferPrice,p.availability,p.allowedIndustries,p.industries,p.deniedIndustries,p.features])};
}
export function matchUnified(c,stock){return stock.map(p=>evaluateMatch(c,p)).filter(m=>m.level!=='rejected').sort((a,b)=>(a.level==='criteria'?0:1)-(b.level==='criteria'?0:1)||a.missing.length-b.missing.length||a.budgetTier-b.budgetTier||(a.budgetDistance??Infinity)-(b.budgetDistance??Infinity)||a.warnings.length-b.warnings.length||b.score-a.score||String(a.slug).localeCompare(String(b.slug)))}
