import {extractByRules} from './source-rules.mjs';import {briefDimensions} from './source-inline.mjs';import {listingDescription} from './listing-description.mjs';import {standardTitle,standardizeListing} from './listing-identity.mjs';import {displayAddress} from './location-display.mjs';import {monthlyFromUnit} from './source-pricing.mjs';
// Plan only missing, evidenced values. IDs, codes, supplied photos, category and original source are preserved.
export function primaryAreaRepair(row){
 const p=row.public_data,text=row.source_text??row.private_data?.sourceText??'',supplements=row.supplements??row.private_data?.supplements??[];if(!text||p.priceVisibilityReview)return null;
 const source=[text,...supplements.map(s=>s.text||'')].filter(Boolean).join('\n'),parsed=extractByRules(source,{allowIncomplete:true,allowUncertain:true});
 const missingSize=!(Number(p.size)>0)&&Number(parsed.size)>0,missingPrice=!(Number(p.price)>0)&&Number(parsed.price)>0&&parsed.priceBasis==='per_m2';if(!missingSize&&!missingPrice)return null;
 const next={...p};if(missingSize)next.size=parsed.size;
 const rate=missingPrice?parsed.pricePerM2:p.priceBasis==='per_m2'?p.pricePerM2:null;
 if(rate&&Number(next.size)>0&&!(Number(p.price)>0)){next.priceBasis='per_m2';next.pricePerM2=rate;next.price=monthlyFromUnit(rate,next.size);next.priceFrom=missingPrice?parsed.priceFrom:p.priceFrom===true;}
 next.areaPerFloor=p.areaPerFloor||briefDimensions(text).perFloor;next.areaText=next.size+' m²'+(next.areaPerFloor?'/sàn':'');if(next.floors==null&&parsed.floors!=null)next.floors=parsed.floors;
 next.address=displayAddress(p.address||parsed.location,p.area);next.facts=(p.facts||[]).filter(f=>!/^Diện tích|^Đơn giá:|^Số tầng:/iu.test(f));if(next.floors)next.facts.push('Số tầng: '+next.floors+'.');if(next.pricePerM2)next.facts.push('Đơn giá: '+(next.priceFrom?'Từ ':'')+new Intl.NumberFormat('vi-VN').format(next.pricePerM2)+' đồng/m²/tháng.');
 next.notes=(p.notes||[]).filter(n=>!/^Diện tích đang cập nhật/.test(n)&&!(next.price&&/^Giá thuê đang cập nhật/.test(n)));
 if(p.titleMode!=='custom'||/Diện tích đang cập nhật/.test(p.title))next.title=standardTitle(next);
 let previousCopy=String(p.description||'').replace(/^\s*Diện tích đang cập nhật[.!]?\s*$/gmu,'');if(next.price)previousCopy=previousCopy.replace(/^\s*Giá thuê: liên hệ để được tư vấn mức chào hiện tại[.!]?\s*$/gmu,'');
 next.description=listingDescription({...next,location:parsed.location},{source,text:previousCopy,sourceInfo:row.private_data?.sourceInfo||{}});
 const normalized=standardizeListing(next,p.listingSequence);return {id:row.id,expectedRevision:p.contentRevision,public_data:normalized,reason:{sizeEvidence:parsed.sizeEvidence,priceEvidence:missingPrice?parsed.priceEvidence:'',areaPerFloor:next.areaPerFloor}};
}
