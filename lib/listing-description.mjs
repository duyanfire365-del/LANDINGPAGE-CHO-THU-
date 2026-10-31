import {publicSourceCopy} from './editor-copy.mjs';
import {sourceNarrative} from './source-narrative.mjs';
import {polishListingCopy} from './listing-copy-polish.mjs';
import {safePublicText} from './posts.mjs';
import {hideNarrowFrontageText} from './frontage-privacy.mjs';
// Only these previous generated sentences are retired. Authored details are not matched by broad keywords.
export function removeLegacyCopy(value){return String(value||'').replace(/Khách có thể lên phương án bố trí sinh hoạt theo nhu cầu ở;\s*số người sử dụng và thời điểm nhận nên được trao đổi trước khi hẹn xem\.?/gu,'').replace(/Phù hợp tham khảo nhu cầu lưu trữ hoặc vận hành kho xưởng\.\s*Cần đối chiếu loại hàng, tải trọng, đường vận chuyển và yêu cầu phòng cháy trước khi lựa chọn\.?/gu,'').replace(/Với quy mô [^\n]*phân chia khu tiếp đón, trưng bày và vận hành[^\n]*/gu,'').replace(/Khách có thể cân nhắc các mô hình phù hợp như cửa hàng, showroom hoặc không gian dịch vụ;?\s*(?:\n\s*)?mô hình cụ thể cần phù hợp hiện trạng và quy định sử dụng\.?/gu,'').replace(/Phù hợp tham khảo các mô hình kinh doanh sạch như cửa hàng, showroom, văn phòng giao dịch hoặc dịch vụ; cần đối chiếu công năng khi xem\.?/gu,'').replace(/Anh\/chị quan tâm vui lòng trao đổi mô hình dự kiến và thời điểm nhận để được tư vấn trước khi hẹn xem\.?/gu,'').trim()}
function amenities(source){let internal=false;const found=new Set();for(const raw of String(source).split(/[\n;|]/)){const s=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();if(/^(?:\W)*(?:noi dung|thong tin|phan) cong khai/.test(s)){internal=false;continue}if(/(?:ghi chu|thong tin|phan|muc)\s+(?:kin|noi bo|rieng tu)|khong cong khai/.test(s))internal=true;if(internal||/khong|chua|du kien|\bxa\b|gia chot|thuong luong|chu nha|doi tac|nguon\s*[:=]/.test(s))continue;for(const [pattern,label]of [[/\bgan truong hoc\b/,'trường học'],[/\bgan benh vien\b/,'bệnh viện'],[/\bgan sieu thi\b/,'siêu thị'],[/\bgan cong vien\b/,'công viên'],[/\bgan cho\b/,'chợ'],[/\bgan ga metro\b/,'ga metro']])if(pattern.test(s))found.add(label)}return found.size?'Tiện ích khu vực được đề cập trong bài gốc: '+[...found].join(', ')+'.':''}
export function listingDescription(item,{source='',text='',sourceInfo={}}={}){
 const context={...item,location:item.location||String(item.address||'').replace(/,?\s*Hà Nội$/iu,'').replace(item.area||'','').replace(/^[, ]+|[, ]+$/g,'')};
 const supplied=publicSourceCopy(removeLegacyCopy(text||source),context,sourceInfo).text;
 const facts=sourceNarrative(context,source,{includeConsideration:supplied.length<200});
 const opening=/cho thuê|sang nhượng|chuyển nhượng/iu.test(supplied)?'':facts[0];
 const contactText='Liên hệ để xác nhận hiện trạng, nhận thông tin chi tiết và hẹn xem'+(item.type==='Văn phòng'?' văn phòng':/Căn hộ|Phòng trọ|Nhà nguyên căn/.test(item.type)?' không gian ở':' thực tế')+'.';
 const copy=hideNarrowFrontageText(polishListingCopy({title:item.title,text:[opening,supplied].filter(Boolean).join('\n\n'),facts:[...facts.slice(1),amenities(source)],contactText}));
 return safePublicText(copy)?copy:polishListingCopy({title:item.title,text:supplied,facts:[]});
}
// Read projection for previously generated copy. Does not overwrite private archives or edits.
export function refreshLegacyDescription(publicData,privateData={}){
 const old=String(publicData.description||'');if(removeLegacyCopy(old)===old)return publicData;
 const source=[privateData.sourceText||privateData.originalText||'',...(privateData.supplements||[]).map(s=>s.text)].filter(Boolean).join('\n');
 const description=listingDescription(publicData,{source,text:source||old,sourceInfo:privateData.sourceInfo||{}});
 const shareText=String(publicData.shareText||'').includes(old)?publicData.shareText.replace(old,description):[publicData.title,'Mã tin: '+publicData.code,'Khu vực: '+publicData.address,description,'Liên hệ: 0906215365'].filter(Boolean).join('\n');
 return {...publicData,description,shareText,descriptionVersion:2};
}
