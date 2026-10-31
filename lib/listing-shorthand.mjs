import {extractRentPricing} from './source-pricing.mjs';
import {sourceShorthand} from './source-shorthand.mjs';
import {extractDimensions} from './property-dimensions.mjs';
import {briefDimensions} from './source-inline.mjs';
import {listingDescription} from './listing-description.mjs';
// Read repair fills only missing, unambiguous fields; existing decisions and raw archives are unchanged.
export function enrichShorthandListing(post,privateData={}){
 const source=privateData.sourceText||privateData.originalText||'';if(!source)return post;
 const shorthand=sourceShorthand(source),dimensions=extractDimensions(source),updates={};
 if(post.size==null&&shorthand.size!=null&&extractRentPricing(source,{allowIncomplete:true,allowUncertain:true}).size===shorthand.size){updates.size=shorthand.size;updates.areaText=shorthand.size+' m²';updates.areaPerFloor=briefDimensions(source).perFloor;updates.notes=(post.notes||[]).filter(n=>!/^Diện tích đang cập nhật/.test(n));}
 for(const key of ['floors','roadWidth'])if(post[key]==null&&dimensions[key]!=null)updates[key]=dimensions[key];
 if(post.frontage==null&&!privateData.privateFrontage&&Number(dimensions.frontage)>=3.5)updates.frontage=dimensions.frontage;
 if(!Object.keys(updates).length)return post;
 const p={...post,...updates},text=String(post.description||'').replace(/Diện tích đang cập nhật\.?/giu,'');p.description=listingDescription(p,{source,text,sourceInfo:privateData.sourceInfo||{}});p.shareText=String(post.shareText||'').includes(post.description)?post.shareText.replace(post.description,p.description):[p.title,p.description,'Liên hệ: 0906215365'].join('\n');return p;
}
