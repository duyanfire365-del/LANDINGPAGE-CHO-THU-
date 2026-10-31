import {listingDescription} from './listing-description.mjs';
import {sourceFeatures} from './source-features.mjs';
import {dimensionFacts} from './property-dimensions.mjs';
import {safePublicText} from './posts.mjs';
import {standardTitle} from './listing-identity.mjs';
import {polishListingCopy} from './listing-copy-polish.mjs';
import {sensitiveCopy,foldPrivate} from './listing-privacy.mjs';
import {splitPrivateNotes} from './source-private-notes.mjs';
import {extractRentPricing,extractTransferPricing,parseSourceNumber} from './source-pricing.mjs';
import {copyClauses} from './listing-privacy.mjs';
import {splitPriceNotes,mergePriceNotes} from './source-price-notes.mjs';
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
 if(p.transferPrice!=null)p.isTransfer=true;
 p.transferPrice=null;

 const address=safePublicText(p.address||'')&&!sensitiveCopy(p.address)?p.address:[p.area,'Hà Nội'].filter(Boolean).join(', ');
 const titlePrivate=true;
 p.address=address;if(titlePrivate){p.title=standardTitle({...p,titleMode:'auto'});p.titleMode='custom';}
 const features=sourceFeatures([sourceText,original.description,...(original.facts||[])].filter(Boolean).join('\n'));
 p.description=listingDescription(p,{source:sourceText,text:sourceText||original.description,sourceInfo});
 p.facts=[];p.notes=[];p.transferNegotiable=false;
 const oldNotes=(original.notes||[]).join(' '),noteText=foldPrivate(oldNotes);
 if(/dien tich/.test(noteText)&&/can xac nhan|chua khop|mau thuan|chua ro/.test(noteText))p.notes.push('Thông tin diện tích cần được xác nhận lại trước khi giao dịch.');
 if(p.slug?.startsWith('hn-')||p.isIllustration||p.media?.some(m=>m.isIllustration))p.notes.push(p.illustrationKind==='banner'?'Banner minh họa theo danh mục, không phải ảnh hiện trạng BĐS.':'Ảnh minh họa bằng AI, không phải ảnh hiện trạng BĐS.');
 else p.notes.push('Ảnh do nguồn cung cấp; vui lòng đối chiếu hiện trạng.');
 if(p.priceOptions)p.priceOptions=p.priceOptions.filter(o=>!sensitiveCopy(o.label)&&safePublicText(o.label||''));
 if(p.imageAlt&&(titlePrivate||!safePublicText(p.imageAlt)))p.imageAlt=(p.isIllustration===false?'Ảnh BĐS: ':'Ảnh minh họa BĐS: ')+p.type;
 p.shareText=[p.title,'Mã tin: '+p.code,'Khu vực: '+p.address,p.description,...p.facts,...p.notes,p.transferPrice?'Giá chuyển nhượng: '+p.transferPrice+' triệu đồng.':'','Liên hệ: 0906215365'].filter(Boolean).join('\n');
 const publicText=[p.title,p.address,p.description,...p.facts,...p.notes,p.imageAlt||'',...(p.priceOptions||[]).map(x=>x.label)].join('\n');
 if(sensitiveCopy(publicText))throw Error('Public privacy validation failed: '+p.slug);
 // Removed words remain private even when an old listing had no original source text.
 const extra=[...(original.facts||[]),...(original.notes||[])].filter(value=>sensitiveCopy(value)||!safePublicText(value)).concat([titlePrivate?original.title:'',original.address!==address?original.address:'',...(original.priceOptions||[]).filter(o=>sensitiveCopy(o.label)).map(o=>o.label+': '+o.price)].filter(Boolean));
 return {privateTransferPrice:original.transferPrice??null,publicData:p,privateNotes:mergePriceNotes(original.transferPrice?'Giá sang nhượng — giữ kín: '+original.transferPrice+' triệu đồng.':'',separated.privateNotes,priceNotes,...extra,rentPrivate?'Giá thuê trước đây chỉ khớp giá nội bộ; giữ kín để kiểm tra: '+original.price+' triệu/tháng.':'',transferPrivate?'Giá sang nhượng trước đây chỉ khớp giá nội bộ; giữ kín để kiểm tra: '+original.transferPrice+' triệu.':''),priceTrackingNotes:priceNotes,priceVisibilityReview:rentPrivate||original.transferPrice!=null};
}
