import {displayAddress} from './location-display.mjs';
import {protectLocation} from './private-location.mjs';
import {photoInstructions,photoUpdateCommand} from './photo-instructions.mjs';
import {privateMediaCommand} from './media-access.mjs';
import {transactionType,saleCopy} from './transactions.mjs';
import {compactPrivateNotes} from './private-notes.mjs';
import {listingDescription} from './listing-description.mjs';
import {publicLocation} from './public-location.mjs';
import {telegramEditContent} from './telegram-edit-content.mjs';
import {protectFrontage} from './frontage-privacy.mjs';
import {briefDimensions,sourceIllustrationScene} from './source-inline.mjs';
import {inferCategory} from './listing-content.mjs';
import {sourceFeatures} from './source-features.mjs';
import {splitPrivateNotes} from './source-private-notes.mjs';
import {polishListingCopy} from './listing-copy-polish.mjs';
import {editCommands,inferUpdateTarget} from './telegram-edit-commands.mjs';
import {publicSourceCopy} from './editor-copy.mjs';
import {taggedCategories,privatePhones} from './source-tags.mjs';
import {standardTitle} from './listing-identity.mjs';
import {isDeleted} from './post-deletion.mjs';
import {dimensionFacts,syncRoomDescription} from './property-dimensions.mjs';
import {splitPriceNotes,mergePriceNotes,trackedPriceNotes} from './source-price-notes.mjs';
import {randomUUID,createHash} from 'node:crypto';
import {db,problem} from './platform.mjs';
import {canonicalRows,canonicalizeSubset} from './listing-catalog.mjs';
import {extractRentPricing,extractTransferPricing,foldVietnamese,syncPricingDescription,monthlyFromUnit} from './source-pricing.mjs';
import {extractByRules} from './source-rules.mjs';
import {extractSourceInfo,sourceInfo,mergeSourceInformation} from './property-source.mjs';
import {editedMedia} from './post-media.mjs';
import {providedImage,inspectTelegramAsset as inspectAsset} from './telegram-media.mjs';
import {logPostHistory} from './post-history.mjs';

export const isUpdateCommand=text=>photoUpdateCommand(text)||editCommands(text).active||/^(?:\/capnhat\b|\/?update\b|(?:(?:anh|em)\s+)?(?:hay\s+)?(?:bo sung|cap nhat|chinh sua|sua tin|them du lieu|them anh|thay anh)(?:\s|:|$))/.test(foldVietnamese(String(text||'').trim()).slice(0,160));
export function updateReference(text){const slug=String(text||'').match(/\blive-\d{10,20}\b/)?.[0];if(slug)return {slug};const m=String(text||'').toUpperCase().match(/\b(CHDV|CHCC|BDS|DA|MB|VP|KX|NC|BT|KO|DT|PT)(?:\s*[-–—]\s*|(?=\d))(\d{1,6})\b/);return m?{code:m[1]+' - '+m[2].padStart(4,'0')}:null;}
function mergeSource(previous,patch,text=''){
 const merged={...previous},norm=v=>String(v||'').replace(/^\+?84/,'0');
 for(const group of ['owner','partner']){merged[group+'Phones']=[...(previous[group+'Phones']||['','',''])];merged[group+'Public']=[...(previous[group+'Public']||[false,false,false])];}
 for(const key of ['sourceName','commission','mapUrl','mapLabel','privateNotes'])if(patch[key]){
  merged[key]=key==='privateNotes'?compactPrivateNotes(previous.privateNotes,patch.privateNotes):patch[key];if(key==='sourceName')merged.sourcePublic=false;
 }
 for(const group of ['owner','partner'])for(let i=0;i<3;i++)if(patch[group+'Phones']?.[i]){
  const value=patch[group+'Phones'][i];
  const explicit=text&&new RegExp((group==='owner'?'(?:chu nha|chinh chu)':'doi tac')+'\\s*'+(i+1)+'\\b').test(foldVietnamese(text));
  const existing=merged[group+'Phones'].findIndex(v=>norm(v)===norm(value));
  const slot=text&&!explicit?(existing>=0?existing:merged[group+'Phones'].findIndex(v=>!v)):i;
  if(slot>=0){merged[group+'Phones'][slot]=value;merged[group+'Public'][slot]=false;}
  const other=group==='owner'?'partner':'owner';merged[other+'Phones']=merged[other+'Phones'].map(v=>norm(v)===norm(value)?'':v);
 }
 return sourceInfo(merged);
}
async function syncSource(row){const previous=(await db('property_sources',{query:'?slug=eq.'+row.public_data.slug}))[0];const data=mergeSource(mergeSourceInformation(row.private_data.sourceInfo,previous?.data),row.private_data.sourceInfo||{});await db('property_sources',{method:'POST',query:'?on_conflict=slug',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:{slug:row.public_data.slug,owner_id:row.author_id||null,data,shared_with:previous?.shared_with||[],map_shares:previous?.map_shares||[],updated_at:new Date().toISOString()}});}
export async function applySourceUpdate(source,{targetSlug,appendOnly=false}={}){
 if(source.assetIds!==undefined&&!Array.isArray(source.assetIds))throw problem(400,'Danh sách ảnh bổ sung không hợp lệ.');
 let ref=targetSlug?{slug:targetSlug}:updateReference(source.content);
 if(!ref&&photoInstructions(source.content).active)throw problem(422,'Ảnh có ghi chú quyền xem cần mã tin hoặc Reply trực tiếp bài gốc; chưa gắn vào bài nào.');
 const canonical=await canonicalRows();
 if(!ref&&editCommands(source.content).active){const records=[];for(let offset=0;;offset+=500){const page=await db('posts',{query:'?select=id,status,public_data,private_data&order=id.asc&limit=500&offset='+offset});records.push(...page);if(page.length<500)break;}ref={slug:await inferUpdateTarget(source,records)};}
 if(!ref)throw problem(422,'Cần mã tin hoặc trả lời bài gốc để cập nhật đúng bài.');
 const active=canonical.filter(r=>!r.public_data.codeReleased);
 const exact=active.filter(r=>ref.slug?r.public_data.slug===ref.slug:r.public_data.code===ref.code);
 const matches=exact.length?exact:active.filter(r=>r.public_data.legacyCodes?.includes(ref.code));
 if(matches.length!==1)throw problem(422,matches.length?'Mã tham chiếu trùng nhiều tin; hãy dùng đường dẫn hoặc trả lời bài gốc.':'Chưa tìm thấy tin cần cập nhật. Anh kiểm tra mã tin hoặc đường dẫn.');
 const row=(await db('posts',{query:'?id=eq.'+matches[0].id}))[0];if(!row)throw problem(404,'Không tìm thấy tin cần cập nhật.');
 if(isDeleted(row))throw problem(409,'Tin đã xóa; quản trị cần khôi phục trong Duyệt bài đã xóa trước khi bổ sung.');
 if(row.private_data?.telegramUpdates?.includes(source.id)){await syncSource(row);await syncTelegramStatus(row,source.id);return {...row,reused:true};}
 const commands=editCommands(source.content);
 const p=matches[0].public_data,private_data={...row.private_data},text=telegramEditContent(source.content).text,parsed=extractByRules(text,{allowIncomplete:true,allowUncertain:true}),pricing=extractRentPricing(text,{allowIncomplete:true,allowUncertain:true,transaction:p.transactionType==='both'||parsed.transactionType==='both'||transactionType(p)==='rent'&&parsed.transactionType==='sale'?'rent':null}),transfer=extractTransferPricing(text);const public_data={...p};if(commands.mode==='replace'&&!text.trim()&&!(source.assetIds||[]).length&&!(source.media||[]).some(m=>m.kind==='image'))throw problem(422,'Gửi nội dung mới sau Thay thế; chưa sửa bài cũ.');
 if(!appendOnly&&(commands.edit||!commands.active)){
  if(parsed.transactionType==='both'){Object.assign(public_data,{transactionType:'both',salePrice:parsed.salePrice,salePricePerM2:parsed.salePricePerM2,salePricePeriod:'one_time',titleMode:'auto'});}else if(parsed.transactionType==='sale'&&parsed.price>0&&transactionType(p)!=='sale'){Object.assign(public_data,{transactionType:'both',salePrice:parsed.price,salePricePerM2:parsed.pricePerM2,salePricePeriod:'one_time',titleMode:'auto'});}else if(transactionType(p)==='sale'&&parsed.transactionType==='rent'&&pricing.price>0){Object.assign(public_data,{transactionType:'both',salePrice:p.price,salePricePerM2:p.pricePerM2||null,salePricePeriod:'one_time',titleMode:'auto'});}
  const requestedType=telegramEditContent(source.content).category;const tags=requestedType?[requestedType]:taggedCategories(text),inferred=inferCategory(text),fullReply=pricing.size!==null&&(!!parsed.privateAddress||/cho thue|sang nhuong|chuyen nhuong/.test(foldVietnamese(text)));if(!tags.length&&inferred&&(fullReply||/(?:loai bds|danh muc|loai hinh)\s*[:=]/.test(foldVietnamese(text))))tags.push(inferred);if(tags.length){public_data.type=tags[0];public_data.categories=tags;public_data.categoryMode='manual';if(public_data.type!==p.type)public_data.codeMode='auto';private_data.hashtags=[...new Set([...(private_data.hashtags||[]),...(text.match(/#[\p{L}\p{N}_]+/gu)||[])])];}
  private_data.sourcePhones=[...new Set([...(private_data.sourcePhones||[]),...privatePhones(text)])];
  const folded=foldVietnamese(splitPriceNotes(text).publicSource);
  if(pricing.price!==null||pricing.pricePerM2!==null||/\bgia\s*thue\b|\btien\s*thue\b|\bgia\s*[:=]/.test(folded)){public_data.price=pricing.price;public_data.pricePerM2=pricing.pricePerM2;public_data.priceBasis=pricing.priceBasis;public_data.priceFrom=pricing.priceFrom===true;if(pricing.priceBasis!=='per_m2')public_data.facts=(public_data.facts||[]).filter(f=>!/^Đơn giá:/.test(f));public_data.notes=(public_data.notes||[]).filter(n=>!/^Giá thuê đang cập nhật/.test(n));}
  if(pricing.floorAreas?.length)public_data.floorAreas=pricing.floorAreas;if(briefDimensions(text).perFloor)public_data.areaPerFloor=true;
  if(pricing.size!==null){public_data.size=pricing.size;public_data.areaText=pricing.size+' m²'+(public_data.areaPerFloor?'/sàn':'');public_data.notes=(public_data.notes||[]).filter(n=>!/^Diện tích đang cập nhật/.test(n));if(public_data.priceBasis==='per_m2'&&public_data.pricePerM2)public_data.price=Math.round(public_data.pricePerM2*pricing.size)/1000000;}
  if(pricing.pricePerM2&&(pricing.pricingNotes||[]).some(n=>n.startsWith('Diện tích chưa xác định'))){public_data.size=null;public_data.areaText='Diện tích đang cập nhật';}
  if(public_data.priceBasis==='per_m2'&&public_data.pricePerM2){public_data.price=Number(public_data.size)>0?monthlyFromUnit(public_data.pricePerM2,public_data.size):null;public_data.facts=(public_data.facts||[]).filter(f=>!/^Đơn giá:/.test(f));public_data.facts.push('Đơn giá: '+(public_data.priceFrom?'Từ ':'')+new Intl.NumberFormat('vi-VN').format(public_data.pricePerM2)+' đồng/m²/tháng.');if(public_data.price)public_data.notes=(public_data.notes||[]).filter(n=>!/^Giá thuê đang cập nhật/.test(n));}
  if(transfer.isTransfer){public_data.isTransfer=true;if(transfer.transferPrice!==null)public_data.transferPrice=transfer.transferPrice;if(/thuong luong|\b(?:ctl|tl)\b|gia chot/.test(folded))public_data.transferNegotiable=transfer.transferNegotiable;}
  for(const key of ['floors','bedrooms','bathrooms','frontage','roadWidth','sidewalk'])if(parsed[key]!=null)public_data[key]=parsed[key];
  const geography=parsed.locationResolution,explicitLocationEdit=/(?:dia chi|vi tri|ten duong|khu vuc|phuong|xa|quan|huyen)\s*[:=]/.test(folded);
  if((!p.adminAuthoredCopy||explicitLocationEdit)&&(geography?.hasAddress||parsed.privateAddress)){
   if(parsed.privateAddress){const oldAddress=private_data.address||'';if(!(/\d/.test(oldAddress)&&foldVietnamese(publicLocation(oldAddress))===foldVietnamese(publicLocation(parsed.privateAddress))))private_data.address=parsed.privateAddress;}
   const named=parsed.street||(parsed.location&&parsed.location!==parsed.area&&parsed.location!=='Liên hệ để biết vị trí'?parsed.location:'');
   public_data.area=parsed.area;public_data.street=named||p.street||'';
   public_data.ward=parsed.ward||(named?'':p.ward||'');
   public_data.address=displayAddress([public_data.street,public_data.ward].filter(Boolean).join(', '),public_data.area);
   private_data.locationResolution=geography;
  }
  const previous=(await db('property_sources',{query:'?slug=eq.'+p.slug}))[0];private_data.sourceInfo=mergeSource(mergeSourceInformation(private_data.sourceInfo,previous?.data),extractSourceInfo(text),text);
  private_data.priceTrackingNotes=mergePriceNotes(trackedPriceNotes(private_data),splitPriceNotes(text).priceTrackingNotes);private_data.supplements=[...(private_data.supplements||[]),{sourceId:source.id,text}].slice(-100);private_data.pricingNotes=[...(private_data.pricingNotes||[]),...(pricing.pricingNotes||[])];
 }
 if(!appendOnly){
  if(commands.active&&!commands.edit)private_data.supplements=[...(private_data.supplements||[]),{sourceId:source.id,text}].slice(-100);
  if(commands.availability){public_data.availability=commands.availability;private_data.telegramAvailability=commands.availability;}
  if(commands.hot!==undefined){public_data.hot=commands.hot;private_data.telegramHot=commands.hot;}
 }
 if(photoInstructions(source.content).active){
  const keys=private_data.telegramMediaKeys||{},ids=[...new Set([...(source.assetIds||[]),...(source.media||[]).map(m=>keys[m.unique_id||m.file_id]).filter(Boolean)])];
  if(!(source.media||[]).some(m=>m.kind==='image')&&!ids.length)throw problem(422,'Gửi kèm ảnh với ghi chú quyền xem và mã tin, hoặc Reply bài gốc để xác định ảnh cần cập nhật.');
  for(const id of ids){const asset=(await db('assets',{query:'?id=eq.'+id}))[0];if(asset)await inspectAsset(asset,{forcePrivate:privateMediaCommand(source.content),forcePublic:photoInstructions(source.content).visibility==='public'});}
 }
 const replacePhotos=(commands.replaceMedia||commands.mode==='replace')&&((source.assetIds||[]).length||(source.media||[]).some(m=>m.kind==='image'));
 let assetIds=[...new Set([...(replacePhotos?[]:p.media||[]).map(m=>m.id),...(source.assetIds||[])])];if(source.assetIds?.length)Object.assign(public_data,await editedMedia({assetIds},p,{admin:true,id:null}));const keys={...(!replacePhotos?private_data.telegramMediaKeys||{}:{})},photos=[...new Map((source.media||[]).filter(m=>m.kind==='image').map(m=>[m.unique_id||m.file_id,m])).values()].filter(m=>!keys[m.unique_id||m.file_id]);if(assetIds.length+photos.length>12)throw problem(422,'Tin đã đạt giới hạn 12 ảnh/video. Bỏ bớt ảnh trong quản trị trước khi bổ sung.');
 for(const [i,photo] of photos.entries()){const found=await db('assets',{query:'?path=like.telegram/'+source.id+'-'+i+'.*'});const a=found[0]?await inspectAsset(found[0],{forcePrivate:privateMediaCommand(source.content),forcePublic:photoInstructions(source.content).visibility==='public'}):await providedImage(photo,source.id,i,{forcePrivate:privateMediaCommand(source.content),forcePublic:photoInstructions(source.content).visibility==='public'});assetIds.push(a.id);keys[photo.unique_id||photo.file_id]=a.id;}
 if(photos.length||photoInstructions(source.content).active)Object.assign(public_data,await editedMedia({assetIds},p,{admin:true,id:null}));
 if(photoInstructions(source.content).cover){const incoming=[...(source.assetIds||[]),...(source.media||[]).map(m=>keys[m.unique_id||m.file_id]).filter(Boolean)],cover=incoming.find(id=>(public_data.media||[]).some(m=>m.id===id&&m.visibility==='public'));if(cover){assetIds=[cover,...assetIds.filter(id=>id!==cover)];Object.assign(public_data,await editedMedia({assetIds},p,{admin:true,id:null}));}}
 if(!appendOnly&&(commands.edit||!commands.active)&&(taggedCategories(text).length||p.titleMode!=='custom')){public_data.title=standardTitle(public_data);public_data.titleMode='auto';}
 if(!appendOnly&&commands.edit){
  const body=text;
  const full=commands.mode==='replace'||commands.mode==='edit'&&body.length>=60&&(pricing.size!==null||parsed.privateAddress);
  if(full)private_data.sourceTextHistory=[...(private_data.sourceTextHistory||[]),{sourceId:source.id,text:private_data.sourceText||'',at:new Date().toISOString()}].slice(-10);
  if(full){private_data.sourceText=body;public_data.areaPerFloor=briefDimensions(body).perFloor;public_data.facts=sourceFeatures(body);}else public_data.facts=[...new Set([...(public_data.facts||[]),...sourceFeatures(body)])];
  const narrativeSource=full?body:[private_data.sourceText,...(private_data.supplements||[]).map(s=>'Nội dung công khai:\n'+s.text)].filter(Boolean).join('\n');
  public_data.illustrationScene=sourceIllustrationScene(narrativeSource);
  public_data.title=standardTitle(public_data);public_data.titleMode='auto';
  const item={...public_data,location:String(public_data.address||'').replace(/,?\s*Hà Nội$/iu,'').replace(new RegExp(',?\\s*'+public_data.area+'$','iu'),'').trim(),floorDescription:pricing.floorDescription||''};
  const explicitDescription=text.match(/(?:^|\n)\s*(?:Mô tả|Nội dung)\s*[:：]\s*([^\n]+(?:\n(?!\s*(?:Giá|Diện tích|Địa chỉ|Vị trí|#))[^\n]+)*)/iu)?.[1];
  const explicitCopy=explicitDescription?publicSourceCopy(explicitDescription,item,extractSourceInfo(text)).text:'';
  public_data.description=listingDescription(item,{source:narrativeSource,text:explicitCopy?(commands.mode==='append'?[p.description,explicitCopy].filter(Boolean).join('\n'):explicitCopy):'',sourceInfo:private_data.sourceInfo||{}});
 }
 private_data.sourceInfo=sourceInfo({...private_data.sourceInfo,privateNotes:mergePriceNotes(private_data.sourceInfo?.privateNotes,splitPrivateNotes(text).privateNotes,transfer.transferPrice?'Giá sang nhượng — giữ kín: '+transfer.transferPrice+' triệu đồng.':'',splitPrivateNotes(public_data.description).privateNotes)});
 if(transfer.transferPrice!=null)private_data.privateTransferPrice=transfer.transferPrice;
 public_data.transferPrice=null;public_data.transferNegotiable=false;
 public_data.description=splitPrivateNotes(public_data.description).publicSource;
 public_data.facts=[...(public_data.facts||[]).filter(f=>!/^Số tầng:|^Phòng ngủ:|^Phòng WC:|^Mặt tiền:|^Đường rộng:|^Vỉa hè:/.test(f)),...dimensionFacts(public_data)];
 if(public_data.transactionType==='both'&&(!(public_data.price>0)||!(public_data.salePrice>0)))throw problem(422,'Chưa có đủ hai mức giá xác định. Tin cũ được giữ nguyên để kiểm tra.');
 public_data.description=syncRoomDescription(syncPricingDescription(public_data.description,p,public_data),p,public_data);
 public_data.description=polishListingCopy({title:public_data.title,text:public_data.description,facts:[public_data.size?'Diện tích: '+public_data.size+' m².':'',public_data.price?'Giá thuê: '+(public_data.priceFrom?'Từ ':'')+public_data.price+' triệu đồng/tháng.':'']});
 if(transactionType(public_data)==='sale'){public_data.description=saleCopy(public_data.description);public_data.facts=(public_data.facts||[]).map(saleCopy);}
 public_data.contentRevision=randomUUID();public_data.shareText=[public_data.title,'Khu vực: '+public_data.address,public_data.size?'Diện tích: '+public_data.size+' m²':'Diện tích đang cập nhật.',public_data.price?'Giá thuê: '+(public_data.priceFrom?'Từ ':'')+public_data.price+' triệu đồng/tháng':'Giá thuê: liên hệ.',public_data.description,...dimensionFacts(public_data),public_data.isTransfer?'Giá chuyển nhượng: '+(public_data.transferPrice?public_data.transferPrice+' triệu đồng':'Liên hệ')+(public_data.transferNegotiable?' (Có thể thương lượng)':''):'','Liên hệ: 0906215365'].filter(Boolean).join('\n');
 private_data.telegramMediaKeys=keys;private_data.telegramUpdates=[...(private_data.telegramUpdates||[]),source.id].slice(-100);
 protectLocation(protectFrontage({public_data,private_data}));
 if(transactionType(public_data)==='sale')public_data.shareText=saleCopy(public_data.shareText);
 const revision=row.public_data.contentRevision,updated=await db('posts',{method:'PATCH',query:'?id=eq.'+row.id+'&public_data->>contentRevision='+(revision?'eq.'+encodeURIComponent(revision):'is.null'),body:{public_data,private_data}});if(!updated.length)throw problem(409,'Tin vừa được sửa ở nơi khác. Hệ thống giữ lệnh để thử lại, không ghi đè bản mới.');
 const final=(await canonicalizeSubset(updated))[0];await db('posts',{method:'PATCH',query:'?id=eq.'+row.id+'&public_data->>contentRevision=eq.'+public_data.contentRevision,body:{public_data:final.public_data}});await syncSource(final);await syncTelegramStatus(final,source.id);await logPostHistory(p.slug,'content-updated');return {...final,updateSummary:{mode:commands.mode,changed:['price','pricePerM2','priceBasis','size','floors','frontage','roadWidth','type','address','bedrooms','bathrooms','description','media'].filter(k=>JSON.stringify(p[k])!==JSON.stringify(final.public_data[k]))}};
}

async function syncTelegramStatus(row,sourceId){
 const commands=editCommands((row.private_data.supplements||[]).find(s=>s.sourceId===sourceId)?.text||'');
 const kinds=[...(commands.availability?['inventory:'+commands.availability]:[]),...(commands.hot!==undefined?['hot:'+(commands.hot?'on':'off')]:[])];
 for(const kind of kinds){const h=createHash('sha256').update('telegram-status:'+sourceId+':'+kind).digest('hex').slice(0,32),id=[h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-');await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{id,kind,record_id:row.public_data.slug,sent:true}});}
}
