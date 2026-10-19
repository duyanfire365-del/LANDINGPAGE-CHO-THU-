import assert from 'node:assert/strict';
import {extractRentPricing,parseSourceNumber} from '../lib/source-pricing.mjs';
import {extractByRules} from '../lib/source-rules.mjs';
import {safePublicText} from '../lib/posts.mjs';
import {validateExtraction} from '../lib/source-automation.mjs';
const sample='🏭 CHO THUÊ KHO XƯỞNG TRỤC CẦU BƯỚU – BỆNH VIỆN K\n📍 Vị trí: Trục Cầu Bướu, khu vực gần Bệnh viện K\n📐 Diện tích: 1.600m²\nKho đã có mái che, nhà xưởng đầy đủ, có thể vào sử dụng ngay.\n💰 Giá thuê: 110.000đ/m²/tháng (GIÁ CHỐT)\n#khoxuong #thanhtri #hadong\nH50%';
const item=validateExtraction(extractByRules(sample),sample);assert.equal(item.price,176);assert.equal(item.pricePerM2,110000);assert.equal(item.priceBasis,'per_m2');assert.equal(item.size,1600);assert.equal(item.type,'Kho xưởng');assert.match(item.location,/Cầu Bươu/);assert.equal(item.area,'Hà Nội','conflicting tags are not a district');assert(sample.includes(item.priceEvidence));assert(sample.includes(item.sizeEvidence));
for(const [text,expected,unit] of [
 ['Diện tích 1600m² Giá thuê 110.000đ/1m²/1tháng',176,110000],
 ['KX DT 1600m2 gia thue 110k/m2/th',176,110000],
 ['Cho thue kho xuog, dt 1,600 m^2, gia theu 110 nghin/m2/thang',176,110000],
 ['Diện tích: 1 600 m²\nGiá: 110 ngàn/m²/tháng',176,110000],
 ['DT 1.600,5m²\nGiá thuê 110.000đ/m²',176.055,110000],
 ['DT 1,600.5m2\nGia 110.000 VND/m2',176.055,110000],
 ['100 m2 giá thuê 20tr/tháng',20,null],
 ['100m² giá thuê 20.000.000đ/tháng',20,null],
 ['100m2, 18tr5/th',18.5,null],
 ['100m2, giá thuê 18tr500k',18.5,null],
 ['DT 100m2 Giá thuê 18,5 triệu/tháng',18.5,null],
 ['1600m2 giá thuê 110k/m2/tháng\nTổng tiền thuê 176 triệu/tháng',176,110000],
 ['100m² Giá thuê 20tr/tháng\nCọc 40tr\nSang nhượng: 300tr\nĐiện 4k/số\nNước 30k/m3\nPhí quản lý 5k/m2',20,null]
]){const p=extractRentPricing(text);assert.equal(p.price,expected,text);assert.equal(p.pricePerM2,unit,text);assert(text.includes(p.priceEvidence));assert(text.includes(p.sizeEvidence))}
for(const text of ['100m2 giá 20tr hoặc 25tr','100m2 giá từ 20-25tr/tháng','100-200m2 giá 20tr/tháng','1600m2 giá 110k/m2 tổng 20tr/tháng','100m2 Giá thuê 110 USD/m2','100m2 Giá thuê 20tr/năm','100m2 Giá thuê 20tr/ngày','100m2 Cọc 40tr','Giá thuê 20tr/tháng'])assert.throws(()=>extractRentPricing(text),{status:422},text);
for(const [raw,num] of [['1.600',1600],['1,600',1600],['110.000',110000],['1.600,5',1600.5],['1,600.5',1600.5],['18,5',18.5]])assert.equal(parseSourceNumber(raw),num);
console.log('Rent pricing passed: exact Telegram regression, thousands/decimal separators, per-m² calculation, shorthand, no accents, original evidence, deposits/fees excluded, conflicts/ranges rejected.');

assert(safePublicText('Đơn giá: 110.000 đồng/m²/tháng.'));assert(!safePublicText('Địa chỉ 110 Đồng Xuân'));

assert.throws(()=>extractByRules('Ban nha 100m2 gia 5 ty'),{status:422});assert.throws(()=>extractByRules('Can ban kho 1600m2 gia 20ty'),{status:422});
for(const [text,size,price] of [
 ['Tầng 1: 60m2; Tầng 2: 90m2; Tầng 3: 80m2\nGiá thuê 25tr/th',60,25],
 ['T1: 60m²\nT2: 90m²\nGiá thuê 30tr/tháng',60,30],
 ['Tầng 2: 90m2\nTầng 3: 80m2\nGiá thuê 20tr/th',90,20],
 ['DT 100m2\nGiá thuê 58K/m2',100,5.8],
 ['DT 100m2\nGiá thuê 58.000đ/m2/th',100,5.8]
]){const p=extractRentPricing(text);assert.equal(p.size,size,text);assert.equal(p.price,price,text);if(text.includes('Tầng')||text.includes('T1'))assert(p.floorDescription.includes('tầng 2'));}
assert.throws(()=>extractRentPricing('Diện tích 60m2 hoặc 90m2 giá 20tr/th'),{status:422});
