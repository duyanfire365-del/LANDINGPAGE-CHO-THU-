import assert from 'node:assert/strict';
import {extractRentPricing} from '../lib/source-pricing.mjs';
import {trustedDraft} from '../lib/trusted-intake.mjs';
for(const area of ['70m²','70m2','70 m²','70 m2','70 mét vuông'])for(const dash of ['-','–','—','~']){
 const source=`Cho thuê mặt bằng tại Hà Đông – ${area} ${dash} 20 triệu/tháng\nDiện tích: 70m2\nMặt tiền: 4m\nGiá thuê: 20 triệu/tháng\nThanh toán 3 tháng, cọc 1 tháng\nGhi chú nội bộ:\nNhóm: Dưới 50 Hà Đông\nPhí môi giới: 1/2`;
 const pricing=extractRentPricing(source,{allowIncomplete:true,allowUncertain:true});assert.equal(pricing.price,20,area+dash);assert.equal(pricing.size,70);assert(pricing.priceEvidence.includes('20'));
 const row=await trustedDraft({text:source});assert.equal(row.public_data.price,20);assert(!row.public_data.description.includes('Giá thuê: liên hệ'));assert(!row.public_data.description.includes('môi giới'));assert(!row.public_data.description.includes('Nhóm:'));
}
for(const source of ['Cho thuê 70m2 giá 20–25 triệu/tháng','Cho thuê 70m2 giá20–25 triệu/tháng','Cho thuê 70m2 giá khoảng 20 triệu/tháng','Cho thuê 70m2\nGiá thuê 20 triệu/tháng\nGiá thuê 25 triệu/tháng'])assert.equal(extractRentPricing(source,{allowIncomplete:true,allowUncertain:true}).price,null,'Keep genuinely ambiguous prices unfilled');
assert.equal(extractRentPricing('Cho thuê 70m2\nGiá thuê 20 triệu/tháng\nSang nhượng 180 triệu\nCọc 20 triệu\nPhí môi giới 10 triệu',{allowIncomplete:true,allowUncertain:true}).price,20);
for(const price of ['20tr/tháng','20 tr/th','20 triệu đồng/tháng','20.000.000đ/tháng'])assert.equal(extractRentPricing('Cho thuê 70m² – '+price,{allowIncomplete:true,allowUncertain:true}).price,20);
assert.equal(extractRentPricing('Bán 70m² – 5 tỷ',{allowIncomplete:true,allowUncertain:true}).price,5000);
console.log('PASS 20 area-unit/separator combinations, repeated explicit rent, trusted drafts, privacy and genuine price ambiguity.');
