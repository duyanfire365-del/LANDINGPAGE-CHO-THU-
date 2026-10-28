import {polishListingCopy} from './listing-copy-polish.mjs';
import {taggedCategories,privatePhones} from './source-tags.mjs';
import {standardTitle} from './listing-identity.mjs';
import {splitPriceNotes} from './source-price-notes.mjs';
import {extractByRules} from './source-rules.mjs';
import {extractSourceInfo,sourceInfo} from './property-source.mjs';
import {publicSourceCopy,polishSparseCopy} from './editor-copy.mjs';
import {formatDescription} from './listing-content.mjs';
import {sourceFeatures} from './source-features.mjs';
import {problem} from './platform.mjs';
import {draft,safePublicText} from './posts.mjs';

export function prepareTrustedText(text,item){
 const original=String(text||'').slice(0,16000);
 item||=extractByRules(original,{allowIncomplete:true,allowUncertain:true});
 // Use only the privacy-filtered location and floor count found in the source.
 const parsed=extractByRules(original,{allowIncomplete:true,allowUncertain:true});
 const floors=Number(original.match(/(?:^|[^\d.,])([1-9]\d{0,2})\s*tầng(?=$|[^\p{L}\p{N}])/iu)?.[1]);
 const tags=taggedCategories(original);
 item={...item,...(tags.length?{type:tags[0]}:{}),location:parsed.location,privateAddress:parsed.privateAddress||item.privateAddress,floors:Number.isInteger(floors)&&floors>0&&floors<=200?floors:null};
 const info=extractSourceInfo(original);
 const phones=privatePhones(original);info.ownerPhones=(info.ownerPhones||[]).filter(p=>p!=='0906215365');info.partnerPhones=[...new Set([...(info.partnerPhones||[]).filter(p=>p!=='0906215365'),...phones.filter(p=>!info.ownerPhones.some(v=>v.replace(/^\+?84/,'0')===p))])].slice(0,3);
 const title=standardTitle({...item,address:[...new Set([item.location,item.area].filter(Boolean))].join(', '),isTransfer:item.isTransfer||/sang nhượng|chuyển nhượng/iu.test(original)});
 const copy=publicSourceCopy(original,item,info),facts=[item.size?'Diện tích: '+item.size+' m².':'Diện tích đang cập nhật.',item.price?'Giá thuê: '+item.price+' triệu đồng/tháng.':'Giá thuê: liên hệ để được cung cấp thông tin chính xác.',item.pricePerM2?'Đơn giá: '+new Intl.NumberFormat('vi-VN').format(item.pricePerM2)+' đồng/m²/tháng.':'',item.floorDescription,...sourceFeatures(original)].filter(Boolean);
 let description=polishListingCopy({title,text:'',facts});
 if(!description||!safePublicText(description))description=formatDescription([title,...facts,'Liên hệ để xác nhận hiện trạng, thông tin còn thiếu và lịch xem.'].join('\n\n'));
 return {item,sourceInfo:info,title,description,original,priceTrackingNotes:splitPriceNotes(original).priceTrackingNotes};
}
export async function trustedDraft({text,assetIds=[],item}){
 if(!Array.isArray(assetIds)||assetIds.length>12)throw problem(400,'Mỗi tin tối đa 12 ảnh/video.');if(!String(text||'').trim()&&!assetIds.length)throw problem(400,'Gửi bài viết hoặc ảnh trước khi đăng.');
 const prepared=prepareTrustedText(text,item),p=prepared.item;
 const post=await draft({...p,priceMode:p.priceBasis,transferPrice:p.transferPrice,transferNegotiable:p.transferNegotiable,isTransfer:p.isTransfer,title:prepared.title,description:prepared.description,privateAddress:p.privateAddress,sourceInfo:sourceInfo(prepared.sourceInfo),hashtags:(prepared.original.match(/#[\p{L}\p{N}_]+/gu)||[]).join(' '),assetIds},{admin:true,id:null},{allowGeneralLocation:true});
 const tags=taggedCategories(prepared.original);if(tags.length){post.public_data.type=tags[0];post.public_data.categories=tags;post.public_data.categoryMode='manual';}
 post.private_data.sourcePhones=privatePhones(prepared.original);
 post.public_data.titleMode='custom';post.public_data.floors=p.floors;post.public_data.notes.push(...(!p.price?['Giá thuê đang cập nhật; vui lòng liên hệ.']:[]),...(!p.size?['Diện tích đang cập nhật.']:[]));
 if(p.transferPrice)post.private_data.privateTransferPrice=p.transferPrice;
 post.private_data.priceTrackingNotes=prepared.priceTrackingNotes;post.private_data.sourceText=prepared.original;post.private_data.originalText=prepared.original;post.private_data.pricingNotes=p.pricingNotes||[];
 return post;
}
