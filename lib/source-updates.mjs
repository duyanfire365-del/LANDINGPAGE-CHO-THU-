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
import {extractRentPricing,extractTransferPricing,foldVietnamese,syncPricingDescription} from './source-pricing.mjs';
import {extractByRules} from './source-rules.mjs';
import {extractSourceInfo,sourceInfo} from './property-source.mjs';
import {editedMedia} from './post-media.mjs';
import {providedImage} from './telegram-media.mjs';
import {logPostHistory} from './post-history.mjs';

export const isUpdateCommand=text=>editCommands(text).active||/^(?:\/capnhat\b|\/?update\b|(?:(?:anh|em)\s+)?(?:hay\s+)?(?:bo sung|cap nhat|chinh sua|sua tin|them du lieu|them anh|thay anh)(?:\s|:|$))/.test(foldVietnamese(String(text||'').trim()).slice(0,160));
export function updateReference(text){const slug=String(text||'').match(/\blive-\d{10,20}\b/)?.[0];if(slug)return {slug};const m=String(text||'').toUpperCase().match(/\b(CHDV|CHCC|BDS|MB|VP|KX|NC|BT|KO|DT|PT)(?:\s*[-–—]\s*|(?=\d))(\d{1,6})\b/);return m?{code:m[1]+' - '+m[2].padStart(4,'0')}:null;}
function mergeSource(previous,patch){const merged={...previous};for(const key of ['sourceName','commission','mapUrl','mapLabel'])if(patch[key]){merged[key]=patch[key];if(key==='sourceName')merged.sourcePublic=false}for(const group of ['owner','partner']){merged[group+'Phones']=[...(previous[group+'Phones']||['','',''])];merged[group+'Public']=[...(previous[group+'Public']||[false,false,false])];for(let i=0;i<3;i++)if(patch[group+'Phones']?.[i]){merged[group+'Phones'][i]=patch[group+'Phones'][i];merged[group+'Public'][i]=false}}return sourceInfo(merged);}
async function syncSource(row){const previous=(await db('property_sources',{query:'?slug=eq.'+row.public_data.slug}))[0];const data=mergeSource({...row.private_data.sourceInfo,...previous?.data},row.private_data.sourceInfo||{});await db('property_sources',{method:'POST',query:'?on_conflict=slug',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:{slug:row.public_data.slug,owner_id:row.author_id||null,data,shared_with:previous?.shared_with||[],map_shares:previous?.map_shares||[],updated_at:new Date().toISOString()}});}
export async function applySourceUpdate(source,{targetSlug,appendOnly=false}={}){
 if(source.assetIds!==undefined&&!Array.isArray(source.assetIds))throw problem(400,'Danh sách ảnh bổ sung không hợp lệ.');
 let ref=targetSlug?{slug:targetSlug}:updateReference(source.content);
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
 const p=matches[0].public_data,private_data={...row.private_data},text=source.content||'',pricing=extractRentPricing(text,{allowIncomplete:true,allowUncertain:true}),transfer=extractTransferPricing(text),parsed=extractByRules(text,{allowIncomplete:true,allowUncertain:true});const public_data={...p};
 if(!appendOnly&&(commands.edit||!commands.active)){
  const tags=taggedCategories(text);if(tags.length){public_data.type=tags[0];public_data.categories=tags;public_data.categoryMode='manual';if(public_data.type!==p.type)public_data.codeMode='auto';private_data.hashtags=[...new Set([...(private_data.hashtags||[]),...(text.match(/#[\p{L}\p{N}_]+/gu)||[])])];}
  private_data.sourcePhones=[...new Set([...(private_data.sourcePhones||[]),...privatePhones(text)])];
  const folded=foldVietnamese(splitPriceNotes(text).publicSource);
  if(/\bgia\s*thue\b|\btien\s*thue\b|\bgia\s*[:=]/.test(folded)){public_data.price=pricing.price;public_data.pricePerM2=pricing.pricePerM2;public_data.priceBasis=pricing.priceBasis;public_data.notes=(public_data.notes||[]).filter(n=>!/^Giá thuê đang cập nhật/.test(n));}
  if(pricing.size!==null){public_data.size=pricing.size;public_data.areaText=pricing.size+' m²';public_data.notes=(public_data.notes||[]).filter(n=>!/^Diện tích đang cập nhật/.test(n));if(public_data.priceBasis==='per_m2'&&public_data.pricePerM2)public_data.price=Math.round(public_data.pricePerM2*pricing.size)/1000000;}
  if(transfer.isTransfer){public_data.isTransfer=true;if(transfer.transferPrice!==null)public_data.transferPrice=transfer.transferPrice;if(/thuong luong|\b(?:ctl|tl)\b|gia chot/.test(folded))public_data.transferNegotiable=transfer.transferNegotiable;}
  for(const key of ['floors','bedrooms','bathrooms'])if(parsed[key]!=null)public_data[key]=parsed[key];
  if(parsed.privateAddress){private_data.address=parsed.privateAddress;if(parsed.location&&parsed.location!=='Liên hệ để biết vị trí'){public_data.address=[...new Set([parsed.location,parsed.area==='Hà Nội'?p.area:parsed.area,'Hà Nội'])].join(', ');if(parsed.area!=='Hà Nội')public_data.area=parsed.area;}}
  if(parsed.location&&parsed.location!=='Liên hệ để biết vị trí'&&parsed.location!==parsed.area&&/(?:dia chi|vi tri|ten duong|duong)\s*[:=]/.test(folded)){
   public_data.address=[...new Set([parsed.location,parsed.area==='Hà Nội'?p.area:parsed.area,'Hà Nội'])].join(', ');if(parsed.area!=='Hà Nội')public_data.area=parsed.area;
  }
  const previous=(await db('property_sources',{query:'?slug=eq.'+p.slug}))[0];private_data.sourceInfo=mergeSource({...private_data.sourceInfo,...previous?.data},extractSourceInfo(text));
  private_data.priceTrackingNotes=mergePriceNotes(trackedPriceNotes(private_data),splitPriceNotes(text).priceTrackingNotes);private_data.supplements=[...(private_data.supplements||[]),{sourceId:source.id,text}].slice(-100);private_data.pricingNotes=[...(private_data.pricingNotes||[]),...(pricing.pricingNotes||[])];
 }
 if(!appendOnly){
  if(commands.active&&!commands.edit)private_data.supplements=[...(private_data.supplements||[]),{sourceId:source.id,text}].slice(-100);
  if(commands.availability){public_data.availability=commands.availability;private_data.telegramAvailability=commands.availability;}
  if(commands.hot!==undefined){public_data.hot=commands.hot;private_data.telegramHot=commands.hot;}
 }
 let assetIds=[...new Set([...(p.media||[]).map(m=>m.id),...(source.assetIds||[])])];if(source.assetIds?.length)Object.assign(public_data,await editedMedia({assetIds},p,{admin:true,id:null}));const keys={...(private_data.telegramMediaKeys||{})},photos=[...new Map((source.media||[]).filter(m=>m.kind==='image').map(m=>[m.unique_id||m.file_id,m])).values()].filter(m=>!keys[m.unique_id||m.file_id]);if(assetIds.length+photos.length>12)throw problem(422,'Tin đã đạt giới hạn 12 ảnh/video. Bỏ bớt ảnh trong quản trị trước khi bổ sung.');
 for(const [i,photo] of photos.entries()){const found=await db('assets',{query:'?path=like.telegram/'+source.id+'-'+i+'.*'});const a=found[0]||await providedImage(photo,source.id,i);assetIds.push(a.id);keys[photo.unique_id||photo.file_id]=a.id;}
 if(photos.length)Object.assign(public_data,await editedMedia({assetIds},p,{admin:true,id:null}));
 if(!appendOnly&&(commands.edit||!commands.active)&&(taggedCategories(text).length||p.titleMode!=='custom')){public_data.title=standardTitle(public_data);public_data.titleMode='auto';}
 if(!appendOnly&&commands.edit){
  const body=text.replace(/#[\p{L}\p{N}_]+/gu,'').replace(/(?:https?:\/\/\S+|\b(?:CHDV|CHCC|BDS|MB|VP|KX|NC|BT|KO|DT|PT)\s*-\s*\d{1,6}\b)/giu,'').trim();
  // A supplied full post replaces public copy; short price/status commands patch fields.
  const explicitDescription=text.match(/(?:^|\n)\s*(?:Mô tả|Nội dung)\s*[:：]\s*([^\n]+(?:\n(?!\s*(?:Giá|Diện tích|Địa chỉ|Vị trí|#))[^\n]+)*)/iu)?.[1];
  if(explicitDescription||body.length>=80&&body.split(/\n/).filter(Boolean).length>=3){
   const info=extractSourceInfo(text),copy=publicSourceCopy(explicitDescription||body,{...parsed,size:public_data.size,price:public_data.price,location:parsed.location==='Liên hệ để biết vị trí'?p.address:parsed.location},info);
   if(copy.text)public_data.description=copy.text;
  }
  public_data.title=standardTitle(public_data);public_data.titleMode='auto';
 }
 public_data.facts=[...(public_data.facts||[]).filter(f=>!/^Số tầng:|^Phòng ngủ:|^Phòng WC:|^Mặt tiền:|^Đường rộng:|^Vỉa hè:/.test(f)),...dimensionFacts(public_data)];
 public_data.description=syncRoomDescription(syncPricingDescription(public_data.description,p,public_data),p,public_data);
 public_data.contentRevision=randomUUID();public_data.shareText=[public_data.title,'Khu vực: '+public_data.address,public_data.size?'Diện tích: '+public_data.size+' m²':'Diện tích đang cập nhật.',public_data.price?'Giá thuê: '+public_data.price+' triệu đồng/tháng':'Giá thuê: liên hệ.',public_data.description,...dimensionFacts(public_data),public_data.isTransfer?'Giá chuyển nhượng: '+(public_data.transferPrice?public_data.transferPrice+' triệu đồng':'Liên hệ')+(public_data.transferNegotiable?' (Có thể thương lượng)':''):'','Liên hệ: 0906215365'].filter(Boolean).join('\n');
 private_data.telegramMediaKeys=keys;private_data.telegramUpdates=[...(private_data.telegramUpdates||[]),source.id].slice(-100);
 const revision=row.public_data.contentRevision,updated=await db('posts',{method:'PATCH',query:'?id=eq.'+row.id+'&public_data->>contentRevision='+(revision?'eq.'+encodeURIComponent(revision):'is.null'),body:{public_data,private_data}});if(!updated.length)throw problem(409,'Tin vừa được sửa ở nơi khác. Hệ thống giữ lệnh để thử lại, không ghi đè bản mới.');
 const final=(await canonicalizeSubset(updated))[0];await db('posts',{method:'PATCH',query:'?id=eq.'+row.id+'&public_data->>contentRevision=eq.'+public_data.contentRevision,body:{public_data:final.public_data}});await syncSource(final);await syncTelegramStatus(final,source.id);await logPostHistory(p.slug,'content-updated');return final;
}

async function syncTelegramStatus(row,sourceId){
 const commands=editCommands((row.private_data.supplements||[]).find(s=>s.sourceId===sourceId)?.text||'');
 const kinds=[...(commands.availability?['inventory:'+commands.availability]:[]),...(commands.hot!==undefined?['hot:'+(commands.hot?'on':'off')]:[])];
 for(const kind of kinds){const h=createHash('sha256').update('telegram-status:'+sourceId+':'+kind).digest('hex').slice(0,32),id=[h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-');await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{id,kind,record_id:row.public_data.slug,sent:true}});}
}
