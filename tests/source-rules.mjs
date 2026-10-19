import assert from 'node:assert/strict';
import {extractByRules} from '../lib/source-rules.mjs';
import {validateExtraction} from '../lib/source-automation.mjs';
const text='Loại BĐS: Văn phòng\nĐịa chỉ: Số 987 đường Lạc Long Quân, Tây Hồ, Hà Nội\nKhu vực: Tây Hồ\nDiện tích: 123 m²\nGiá thuê: 32 triệu/tháng\n#Nguon';
const parsed=validateExtraction(extractByRules(text),text);assert.equal(parsed.price,32);assert.equal(parsed.size,123);assert.equal(parsed.location,'Lạc Long Quân');assert.equal(parsed.type,'Văn phòng');
const alley=text.replace('Số 987 đường','Số 12 ngõ 45');assert.equal(validateExtraction(extractByRules(alley),alley).location,'Tây Hồ');assert.equal(validateExtraction(extractByRules(alley+'\nTên đường: Lạc Long Quân'),alley+'\nTên đường: Lạc Long Quân').location,'Lạc Long Quân');
assert.throws(()=>extractByRules(text+'\nGiá thuê: 40 triệu/tháng'),{status:422});
assert.throws(()=>extractByRules(text+'\nDiện tích: 200m2'),{status:422});
assert.throws(()=>extractByRules(text+'\nĐịa chỉ: 23 Đỗ Quang'),{status:422});
assert.equal(validateExtraction(extractByRules('100m2 Cầu Giấy giá thuê 20tr'),'100m2 Cầu Giấy giá thuê 20tr').location,'Cầu Giấy');
const transfer=text+'\nSang nhượng: 200 triệu';assert.equal(validateExtraction(extractByRules(transfer),transfer).transferPrice,200);
console.log('Rule parsing: standard template, alley privacy, rent/area ambiguity, missing data and separate transfer price passed.');

const warehouse='🏭 THÔNG TIN KHO XƯỞNG\n✅ Diện tích: 280m²\n✅ Đất full thổ cư\n✅ Điện 3 pha\n✅ Khung xưởng chắc chắn, chiều cao khoảng 6–8m\n✅ Cốt nền chắc chắn\n✅ Có WC khép kín\n✅ Đường vào rộng, thuận tiện vận chuyển và bốc dỡ hàng hóa\n🎯 Phù hợp:\n* Kho chứa hàng\n* Kho phân phối\n* Xưởng sản xuất\n* Xưởng gia công\n* Kinh doanh, tập kết hàng hóa\n💰 Giá thuê: 16 triệu/tháng\n📞 Anh/chị quan tâm vui lòng liên hệ để xem vị trí\n#pc';
const open=validateExtraction(extractByRules(warehouse),warehouse);assert.equal(open.size,280);assert.equal(open.price,16);assert.equal(open.type,'Kho xưởng');assert.equal(open.area,'Hà Nội');assert.equal(open.location,'Liên hệ để biết vị trí');assert.equal(open.privateAddress,'');
