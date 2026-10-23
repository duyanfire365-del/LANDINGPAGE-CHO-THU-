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
 const parsed=extractByRules(original,{
  allowIncomplete:true,
  allowUncertain:true
 });
 item||=parsed;

 const floors=Number(
  original.match(
   /(?:^|[^\d.,])([1-9]\d{0,2})\s*tầng(?=$|[^\p{L}\p{N}])/iu
  )?.[1]
 );

 item={
  ...item,
  location:parsed.location,
  privateAddress:parsed.privateAddress||item.privateAddress,
  floors:Number.isInteger(floors)&&floors>0&&floors<=200?floors:null
 };

 const info=extractSourceInfo(original);
 const isTransfer=item.isTransfer||
  /sang nhượng|chuyển nhượng/iu.test(original);
 const size=Number(item.size)>0
  ?String(item.size).replace('.',',')+' m²'
  :'';
 const location=[...new Set(
  [item.location,item.area].filter(
   value=>value&&value!=='Liên hệ để biết vị trí'
  )
 )].join(', ');
 const title=
  (isTransfer?'Sang nhượng ':'Cho thuê ')+
  item.type.toLocaleLowerCase('vi')+
  (size?' '+size:'')+
  (item.floors?', '+item.floors+' tầng':'')+
  (location?' — '+location:' — liên hệ để biết vị trí');

 const copy=publicSourceCopy(original,item,info);
 const facts=[
  item.size?'Diện tích: '+item.size+' m².':'Diện tích đang cập nhật.',
  item.price
   ?'Giá thuê: '+item.price+' triệu đồng/tháng.'
   :'Giá thuê: liên hệ để được cung cấp thông tin chính xác.',
  item.floorDescription,
  ...sourceFeatures(original)
 ].filter(Boolean);

 let description=formatDescription(
  copy.complete
   ?[copy.text,...facts.filter(f=>!copy.text.includes(f))].join('\n\n')
   :polishSparseCopy(title,facts,copy.text)
 );
 if(!description||!safePublicText(description)){
  description=formatDescription([
   title,
   ...facts,
   'Liên hệ để xác nhận hiện trạng, thông tin còn thiếu và lịch xem.'
  ].join('\n\n'));
 }

 return {
  item,
  sourceInfo:info,
  title,
  description,
  original,
  priceTrackingNotes:splitPriceNotes(original).priceTrackingNotes
 };
}

export async function trustedDraft({text,assetIds=[],item}){
 if(!Array.isArray(assetIds)||assetIds.length>12){
  throw problem(400,'Mỗi tin tối đa 12 ảnh/video.');
 }
 if(!String(text||'').trim()&&!assetIds.length){
  throw problem(400,'Gửi bài viết hoặc ảnh trước khi đăng.');
 }

 const prepared=prepareTrustedText(text,item);
 const p=prepared.item;
 const post=await draft({
  ...p,
  priceMode:p.priceBasis,
  transferPrice:p.transferPrice,
  transferNegotiable:p.transferNegotiable,
  isTransfer:p.isTransfer,
  title:prepared.title,
  description:prepared.description,
  privateAddress:p.privateAddress,
  sourceInfo:sourceInfo(prepared.sourceInfo),
  hashtags:(prepared.original.match(/#[\p{L}\p{N}_]+/gu)||[]).join(' '),
  assetIds
 },{admin:true,id:null},{allowGeneralLocation:true});

 post.public_data.titleMode='custom';
 post.public_data.floors=p.floors;
 post.public_data.notes.push(
  ...(!p.price?['Giá thuê đang cập nhật; vui lòng liên hệ.']:[]),
  ...(!p.size?['Diện tích đang cập nhật.']:[])
 );
 if(p.transferPrice){
  post.public_data.transferPrice=p.transferPrice;
 }
 post.private_data.priceTrackingNotes=prepared.priceTrackingNotes;
 post.private_data.sourceText=prepared.original;
 post.private_data.originalText=prepared.original;
 post.private_data.pricingNotes=p.pricingNotes||[];
 return post;
}
