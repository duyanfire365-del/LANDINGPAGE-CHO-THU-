import {dimensionFacts} from './property-dimensions.mjs';
import {sourceFeatures} from './source-features.mjs';
import {briefDimensions,operatingRestrictions,foldBrief} from './source-inline.mjs';
const amount=v=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(v);
// Structured copy from verified facts; source identities and commercial terms never enter it.
export function sourceNarrative(item,source=''){
 const place=[...new Set([item.location==='Liên hệ để biết vị trí'?'':item.location,item.area].filter(Boolean))].join(', '),brief=briefDimensions(source),restrictions=operatingRestrictions(source),business=item.type==='Mặt bằng kinh doanh';
 const size=item.size?'Diện tích'+(item.areaPerFloor||brief.perFloor?' mỗi sàn':'')+': '+amount(item.size)+' m².':'Diện tích đang cập nhật.';
 const dimensions=dimensionFacts(item).filter(s=>!/^Số tầng:/.test(s));
 const floors=item.floors?'Kết cấu sử dụng: '+amount(item.floors)+' tầng.':'';
 const price=item.price?'Giá thuê: '+amount(item.price)+' triệu đồng/tháng.':'Giá thuê: liên hệ để được tư vấn mức chào hiện tại.';
 const uses={
 'Mặt bằng kinh doanh':restrictions.some(x=>/hàng ăn/.test(x))?'Phù hợp tham khảo các mô hình kinh doanh sạch như cửa hàng, showroom, văn phòng giao dịch hoặc dịch vụ; cần đối chiếu công năng khi xem.':'Khách có thể cân nhắc các mô hình phù hợp như cửa hàng, showroom hoặc không gian dịch vụ; mô hình cụ thể cần phù hợp hiện trạng và quy định sử dụng.',
 'Văn phòng':'Có thể lên phương án bố trí khu làm việc, tiếp khách và trao đổi nhóm theo quy mô nhân sự; bố cục và trang thiết bị cần kiểm tra khi xem.',
 'Kho xưởng':'Phù hợp tham khảo nhu cầu lưu trữ hoặc vận hành kho xưởng. Cần đối chiếu loại hàng, tải trọng, đường vận chuyển và yêu cầu phòng cháy trước khi lựa chọn.',
 'Nhà nguyên căn':'Khách có thể lên phương án bố trí sinh hoạt theo nhu cầu ở; số người sử dụng và thời điểm nhận nên được trao đổi trước khi hẹn xem.',
 'Căn hộ chung cư':'Khách có thể trao đổi nhu cầu ở, số người sử dụng và thời điểm nhận để được tư vấn căn hộ phù hợp.',
 'Căn hộ dịch vụ':'Khách có thể trao đổi nhu cầu lưu trú và thời điểm nhận; nội thất, dịch vụ đi kèm cần kiểm tra trực tiếp.',
 'Phòng trọ':'Khách có thể trao đổi số người ở và thời điểm nhận; không gian sinh hoạt và chi phí đi kèm được tư vấn khi liên hệ.',
 'Biệt thự, nhà liền kề':'Khách có thể trao đổi nhu cầu sử dụng và phương án phân chia không gian để được tư vấn trước khi hẹn xem.',
 'Đất cho thuê':'Khách cần trao đổi mục đích sử dụng để được tư vấn và kiểm tra mức độ phù hợp thực tế.'};
 const opening=(item.isTransfer?'Sang nhượng ':'Cho thuê ')+String(item.type||'bất động sản').toLocaleLowerCase('vi')+(place?' tại '+place:'')+'.';
 const areaDetail=/đất|xây dựng|hầm|tầng nổi/iu.test(item.areaText||'')?'Quy mô theo thông tin cung cấp: '+item.areaText+'.':'';
 const facts=[size,areaDetail,floors,...dimensions,item.floorDescription,price,...sourceFeatures(source),...restrictions];
 const context=business&&item.size?'Với quy mô '+amount(item.size)+' m²'+(brief.perFloor?' mỗi sàn':'')+', khách có thể lên phương án phân chia khu tiếp đón, trưng bày và vận hành sau khi xem bố cục thực tế.':'';
 return [...new Set([opening,...facts,context,uses[item.type]||'Khách quan tâm có thể trao đổi nhu cầu sử dụng để được tư vấn và hẹn xem.',business?'Anh/chị quan tâm vui lòng trao đổi mô hình dự kiến và thời điểm nhận để được tư vấn trước khi hẹn xem.':''].filter(Boolean))];
}
