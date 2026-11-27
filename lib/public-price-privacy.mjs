import {foldPrivate} from './listing-privacy.mjs';
import {splitPriceNotes} from './source-price-notes.mjs';
// Applies even to authored copies and older saved posts. Internal originals are not changed.
export function publicPriceProjection(post){
 const out={...post,transferPrice:null,transferNegotiable:false};
 const clean=value=>splitPriceNotes(value).publicSource.split('\n').filter(line=>{const s=foldPrivate(line);return !(/\b(?:sang nhuong|chuyen nhuong|nhuong|trao doi)\b/.test(s)&&/\d[\d.,]*\s*(?:trieu|tr\b|ty|dong|vnd)/.test(s)&&!/\b(?:gia thue|tien thue)\b|\/\s*(?:thang|th)\b/.test(s));}).join('\n').replace(/^[\p{P}\p{S}\s]*(?:giá (?:sang nhượng|chuyển nhượng|nhượng)|phương án giá trao đổi)\s*[:：][^\n]*(?:\n|$)/gimu,'').trim();
 for(const key of ['title','description','shareText','imageAlt'])if(typeof out[key]==='string')out[key]=clean(out[key]);
 for(const key of ['facts','notes'])if(Array.isArray(out[key]))out[key]=out[key].map(clean).filter(Boolean);
 if(out.transactionCopySource)out.transactionCopySource=publicPriceProjection(out.transactionCopySource);
 for(const key of ['privateTransferPrice','priceTrackingNotes','private_data','sourceText','originalText'])delete out[key];
 if(!out.title&&post.title)out.title=post.isTransfer?'Sang nhượng BĐS':'Thông tin BĐS';
 return out;
}
