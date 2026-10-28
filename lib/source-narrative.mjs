import {dimensionFacts} from './property-dimensions.mjs';
import {sourceFeatures} from './source-features.mjs';
import {foldVietnamese} from './source-pricing.mjs';
// Editorial expansion from verified fields. Suggestions are conditional, never invented amenities.
export function sourceNarrative(item,source=''){
 const place=[...new Set([item.location==='Liên hệ để biết vị trí'?'':item.location,item.area].filter(Boolean))].join(', ');
 const intro=(item.isTransfer?'Sang nhượng ':'Cho thuê ')+String(item.type||'bất động sản').toLocaleLowerCase('vi')+(place?' tại '+place:'. Vị trí chi tiết sẽ được tư vấn khi liên hệ')+'.';
 const area=item.size?'Diện tích'+(/m[²2]\s*\/\s*(?:san|sàn)/i.test(foldVietnamese(source))?' mỗi sàn':'')+': '+item.size+' m².':'Diện tích đang cập nhật; vui lòng liên hệ để xác nhận.';
 const pricing=item.price?'Giá thuê: '+item.price+' triệu đồng/tháng.':'Giá thuê: liên hệ để xác nhận mức chào hiện tại.';
 const uses={
  'Mặt bằng kinh doanh':'Khách có thể tham khảo các mô hình phù hợp như cửa hàng, không gian dịch vụ, cà phê hoặc showroom; mô hình cụ thể cần được đối chiếu với mặt bằng và điều kiện thuê thực tế.',
  'Văn phòng':'Có thể tham khảo phương án bố trí nơi làm việc theo quy mô sử dụng. Cách chia khu vực và trang thiết bị cần được xác nhận trực tiếp.',
  'Kho xưởng':'Khách có nhu cầu lưu trữ hoặc sản xuất có thể trao đổi yêu cầu sử dụng để được tư vấn và hẹn xem để đánh giá mức độ phù hợp.',
  'Nhà nguyên căn':'Khách có thể tham khảo phương án bố trí không gian theo nhu cầu ở hoặc sử dụng; công năng và điều kiện thuê cần được trao đổi trực tiếp.',
  'Căn hộ chung cư':'Khách quan tâm có thể trao đổi nhu cầu chỗ ở, số người sử dụng và thời điểm nhận để được tư vấn trước khi hẹn xem.',
  'Căn hộ dịch vụ':'Khách quan tâm có thể trao đổi nhu cầu lưu trú và thời điểm nhận; nội thất, dịch vụ và chi phí đi kèm cần được xác nhận.',
  'Phòng trọ':'Khách quan tâm có thể trao đổi số người ở và thời điểm nhận; điều kiện sinh hoạt và chi phí đi kèm cần được xác nhận.',
  'Đất cho thuê':'Khách có nhu cầu thuê đất có thể trao đổi mục đích sử dụng để được tư vấn và đối chiếu điều kiện thực tế khi xem thực tế.'
 };
 const opportunity=item.type==='Mặt bằng kinh doanh'&&item.size?'Với quy mô '+item.size+' m², khách có thể lên phương án phân chia khu đón tiếp, trưng bày và vận hành theo nhu cầu, sau khi kiểm tra bố cục thực tế.':'';
 const planning=item.type==='Mặt bằng kinh doanh'?'Để lựa chọn mặt bằng phù hợp, nên trao đổi trước mô hình dự kiến, yêu cầu cải tạo và thời điểm nhận; bên tư vấn sẽ hỗ trợ đối chiếu trước khi hẹn xem.':'';
 const lines=[intro,area,pricing,opportunity,item.pricePerM2?'Đơn giá: '+new Intl.NumberFormat('vi-VN').format(item.pricePerM2)+' đồng/m²/tháng.':'',...dimensionFacts(item),item.floorDescription,...sourceFeatures(source),uses[item.type]||'Khách quan tâm có thể trao đổi nhu cầu sử dụng để được tư vấn và hẹn xem thực tế.',planning];
 if(item.floors>1)lines.push('Với nhiều tầng, khách có thể cân nhắc phân chia khu vực sử dụng theo nhu cầu sau khi xem và xác nhận hiện trạng.');
 return [...new Set(lines.filter(Boolean))];
}
