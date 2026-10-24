import assert from 'node:assert/strict';
import {prepareTrustedText} from '../lib/trusted-intake.mjs';
import {polishListingCopy} from '../lib/listing-copy-polish.mjs';
const sparse=prepareTrustedText('#KX\nĐịa chỉ: Số 12 Hoàng Văn Thái, Thanh Xuân\nDiện tích: 105m2\nGiá thuê: 12 triệu/tháng\nChủ nhà: 0987654321\nGhi chú kín: mật mã 9876');
assert(sparse.description.includes('105 m²'));assert(sparse.description.includes('xác nhận hiện trạng'));assert(!/0987654321|mật mã|Số 12/.test(sparse.description));assert(!/điện ba pha|xe tải|nội thất cao cấp/.test(sparse.description));
const line='Kho có điện ba pha theo thông tin nguồn cung cấp.';
const long=polishListingCopy({title:'Kho cho thuê',text:Array(40).fill(line).join('\n')+'\nLiên hệ để xem.\nLiên hệ ngay.\nHotline để xem.',facts:['Diện tích: 105 m².']});
assert.equal(long.split(line).length-1,1);assert(long.length<1000);assert(long.includes('105 m²'));
console.log('PASS: short copy gains a factual structure and neutral contact text; long copy is deduplicated; private data and invented amenities stay out.');
