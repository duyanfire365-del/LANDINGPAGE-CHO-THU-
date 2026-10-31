import {dimensionFacts} from './property-dimensions.mjs';
import {sourceFeatures} from './source-features.mjs';
import {briefDimensions,operatingRestrictions} from './source-inline.mjs';
const amount=v=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(v);
// Questions describe how to assess a space, never assert an unverified fit-out or use permission.
export function spaceConsideration(item){
 const n=Number(item.size),type=item.type;
 if(type==='Mặt bằng kinh doanh'||type==='Ki-ốt')return n>0&&n<=40?'Đang tìm một điểm kinh doanh gọn? Hãy xem thực tế để đánh giá diện tích trưng bày và nhu cầu sử dụng của mô hình dự kiến.':n>=150?'Cần xem thực tế không gian kinh doanh quy mô lớn? Mang theo phương án sử dụng để đối chiếu luồng di chuyển, diện tích vận hành và điều kiện cho phép của địa điểm.':'Khi xem thực tế địa điểm kinh doanh, hãy đối chiếu diện tích sử dụng với cách bố trí sản phẩm và dịch vụ dự kiến.';
 if(type==='Văn phòng')return n>0&&n<=60?'Bạn đang tìm văn phòng cho nhóm làm việc nhỏ? Khi xem, nên đối chiếu chỗ ngồi thực tế, ánh sáng và chi phí vận hành.':'Bạn cần không gian làm việc cho đội ngũ? Hãy kiểm tra mặt sàn, hệ thống kỹ thuật và khả năng bố trí các bộ phận theo nhu cầu.';
 if(type==='Kho xưởng')return n>=500?'Với nhu cầu kho xưởng quy mô lớn, nên xem thực tế lối vận chuyển, tải trọng nền và điều kiện phòng cháy theo loại hàng hoặc hoạt động dự kiến.':'Bạn đang tìm nơi lưu trữ hoặc làm việc sản xuất? Hãy kiểm tra lối tiếp cận, chiều cao sử dụng và điều kiện vận hành trước khi chọn.';
 if(type==='Căn hộ chung cư')return 'Tìm một không gian ở phù hợp nhịp sinh hoạt của bạn? Hãy xem bố cục phòng, ánh sáng và các khoản phí của căn hộ khi xem thực tế.';
 if(type==='Căn hộ dịch vụ')return 'Bạn cần chỗ ở với dịch vụ đi kèm? Hãy đối chiếu danh mục nội thất, dịch vụ được cung cấp và chi phí ngoài tiền thuê.';
 if(type==='Phòng trọ')return 'Bạn đang tìm chỗ ở vừa nhu cầu? Khi xem phòng, nên kiểm tra không gian sinh hoạt, thông gió và cách tính điện nước.';
 if(type==='Nhà nguyên căn')return 'Cần thuê trọn một ngôi nhà? Hãy đối chiếu bố trí các tầng, số phòng và nhu cầu sinh hoạt thực tế khi xem.';
 if(type==='Biệt thự, nhà liền kề')return 'Khi chọn biệt thự hoặc nhà liền kề, nên xem thực tế cách kết nối các không gian và mức độ phù hợp với nhu cầu sử dụng của bạn.';
 if(type==='Đất cho thuê')return 'Trước khi chọn khu đất, hãy kiểm tra ranh giới, lối tiếp cận và mục đích sử dụng được phép.';
 return '';
}
export function sourceNarrative(item,source='',{includeConsideration=true}={}){
 let internal=false;source=String(source).split(/\r?\n/).filter(line=>{const key=line.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();if(/(?:noi dung|thong tin|phan) cong khai\s*[:=]/.test(key)){internal=false;return false}if(/(?:ghi chu|thong tin|phan|muc)\s+(?:kin|noi bo|rieng tu)|khong cong khai/.test(key))internal=true;return !internal}).join('\n');
 const location=item.location==='Liên hệ để biết vị trí'?'':item.location||'',place=[...new Set([location,item.area].filter(Boolean))].join(', '),brief=briefDimensions(source);
 const opening=(item.isTransfer?'Sang nhượng ':'Cho thuê ')+String(item.type||'bất động sản').toLocaleLowerCase('vi')+(place?' tại '+place:'')+'.';
 const facts=[opening,item.size?'Diện tích'+(item.areaPerFloor||brief.perFloor?' mỗi sàn':'')+': '+amount(item.size)+' m².':'Diện tích đang cập nhật.',/đất|xây dựng|hầm|tầng nổi/iu.test(item.areaText||'')?'Quy mô theo thông tin cung cấp: '+item.areaText+'.':'',...dimensionFacts(item),item.floorDescription,item.price?'Giá thuê: '+amount(item.price)+' triệu đồng/tháng.':'Giá thuê: liên hệ để được tư vấn mức chào hiện tại.',...sourceFeatures(source),...operatingRestrictions(source),includeConsideration?spaceConsideration(item):''];
 return [...new Set(facts.filter(Boolean))];
}
