import {publicSourceCopy} from './editor-copy.mjs';
import {safePublicText} from './posts.mjs';
import {standardTitle} from './listing-identity.mjs';
import {polishListingCopy} from './listing-copy-polish.mjs';
import {sensitiveCopy,foldPrivate} from './listing-privacy.mjs';
import {splitPrivateNotes} from './source-private-notes.mjs';
import {extractRentPricing,extractTransferPricing,parseSourceNumber} from './source-pricing.mjs';
import {copyClauses} from './listing-privacy.mjs';
import {splitPriceNotes,mergePriceNotes} from './source-price-notes.mjs';
const key=value=>foldPrivate(value).replace(/m\s*[²2]/g,' m2 ').replace(/[\p{P}\p{S}\s]+/gu,' ').trim();
const distinct=values=>[...new Map(values.filter(Boolean).map(value=>[key(value),value])).values()];
// Pure backfill planner: preserve identity, prices, media and inventory. No DB writes.
export function protectPublishedCopy(original,{sourceText='',sourceInfo={},privateAddress=''}={}){
 const p=structuredClone(original),allText=[p.title,p.address,p.description,...(p.facts||[]),...(p.notes||[]),sourceText].filter(Boolean).join('\n');
 const separated=splitPrivateNotes(allText),priceNotes=splitPriceNotes(allText).priceTrackingNotes;
 const pricingInput=sourceText||[original.description,...(original.facts||[]),...(original.notes||[])].join('\n'),pricingParts=splitPriceNotes(pricingInput);
 const secretMoney=[...foldPrivate(pricingParts.priceTrackingNotes).matchAll(/(\d+(?:[.,]\d+)*)\s*(trieu|tr\b|ty\b|nghin|ngan|k\b|dong|vnd|d\b)/g)].map(m=>parseSourceNumber(m[1])*(m[2]==='ty'?1e9:/^tr/.test(m[2])?1e6:/nghin|ngan|k/.test(m[2])?1000:1));
 const publicPrices=copyClauses(pricingParts.publicSource).map(clause=>{try{return extractRentPricing((p.size?'Diện tích: '+p.size+'m²\n':'')+clause,{allowIncomplete:true,allowUncertain:true}).price}catch{return null}});
 const rentPrivate=p.price!=null&&!publicPrices.some(v=>v!=null&&Math.abs(v-p.price)<.000001)&&secretMoney.some(v=>Math.abs(v/1e6-p.price)<.000001||p.pricePerM2&&Math.abs(v-p.pricePerM2)<.000001);
 const transferPrivate=p.transferPrice!=null&&extractTransferPricing(pricingParts.publicSource).transferPrice!==p.transferPrice&&secretMoney.some(v=>Math.abs(v/1e6-p.transferPrice)<.000001);
 if(rentPrivate){p.price=null;p.pricePerM2=null;p.priceBasis='monthly';if(p.priceOptions)p.priceOptions=[];}
 if(transferPrivate)p.transferPrice=null;
 const redactMoney=value=>rentPrivate||transferPrivate?copyClauses(value).filter(line=>!/(?:gia|tien thue|don gia|tong tien|trieu|\d\s*(?:tr\b|dong\b|d\/))/i.test(foldPrivate(line))).join('\n'):value;
 const address=safePublicText(p.address||'')&&!sensitiveCopy(p.address)?p.address:[p.area,'Hà Nội'].filter(Boolean).join(', ');
 const item={privateAddress,location:address.split(',')[0],area:p.area},info=sourceInfo||{};
 const copy=value=>publicSourceCopy(redactMoney(String(value||'')),item,info).text;
 const titlePrivate=rentPrivate||transferPrivate||sensitiveCopy(p.title)||!safePublicText(p.title||'')||/\b(?:quan|cua hang|nha hang|spa|salon|tiem)\b/.test(foldPrivate(p.title));
 p.address=address;if(titlePrivate){p.title=standardTitle({...p,titleMode:'auto'});p.titleMode='custom';}
 const facts=distinct((p.facts||[]).map(copy)),notes=distinct((p.notes||[]).map(note=>{const cleaned=copy(note);if(cleaned)return cleaned;const folded=foldPrivate(note);if(!sensitiveCopy(note)&&/can xac nhan|chua khop|chua thong nhat|mau thuan|chua ro/.test(folded))return /dien tich/.test(folded)?'Thông tin diện tích cần được xác nhận lại trước khi giao dịch.':/gia/.test(folded)?'Mức giá cần được xác nhận lại trước khi giao dịch.':'Thông tin cần được xác nhận lại trước khi giao dịch.';return '';}));
 p.description=polishListingCopy({title:p.title,text:copy(p.description),facts:[p.size?'Diện tích: '+p.size+' m².':'',p.price?'Giá thuê: '+p.price+' triệu đồng/tháng.':'']});
 p.facts=facts.filter(f=>!key(p.description).includes(key(f)));p.notes=notes.filter(f=>!key(p.description).includes(key(f)));p.transferNegotiable=false;
 if(p.priceOptions)p.priceOptions=p.priceOptions.filter(o=>!sensitiveCopy(o.label)&&safePublicText(o.label||''));
 if(p.imageAlt&&(titlePrivate||!safePublicText(p.imageAlt)))p.imageAlt=(p.isIllustration===false?'Ảnh BĐS: ':'Ảnh minh họa BĐS: ')+p.type;
 p.shareText=[p.title,'Mã tin: '+p.code,'Khu vực: '+p.address,p.description,...p.facts,...p.notes,p.transferPrice?'Giá chuyển nhượng: '+p.transferPrice+' triệu đồng.':'','Liên hệ: 0906215365'].filter(Boolean).join('\n');
 const publicText=[p.title,p.address,p.description,...p.facts,...p.notes,p.imageAlt||'',...(p.priceOptions||[]).map(x=>x.label)].join('\n');
 if(sensitiveCopy(publicText))throw Error('Public privacy validation failed: '+p.slug);
 // Removed words remain private even when an old listing had no original source text.
 const extra=[...(original.facts||[]),...(original.notes||[])].filter(value=>sensitiveCopy(value)||!safePublicText(value)).concat([titlePrivate?original.title:'',original.address!==address?original.address:'',...(original.priceOptions||[]).filter(o=>sensitiveCopy(o.label)).map(o=>o.label+': '+o.price)].filter(Boolean));
 return {publicData:p,privateNotes:mergePriceNotes(separated.privateNotes,priceNotes,...extra,rentPrivate?'Giá thuê trước đây chỉ khớp giá nội bộ; giữ kín để kiểm tra: '+original.price+' triệu/tháng.':'',transferPrivate?'Giá sang nhượng trước đây chỉ khớp giá nội bộ; giữ kín để kiểm tra: '+original.transferPrice+' triệu.':''),priceTrackingNotes:priceNotes,priceVisibilityReview:rentPrivate||transferPrivate};
}
