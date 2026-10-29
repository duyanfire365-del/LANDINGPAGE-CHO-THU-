import assert from 'node:assert/strict';
import {inlineSourceDetails,isCustomerDemand} from '../lib/source-inline.mjs';
import {extractSourceInfo,mergeSourceInformation,sourceInfo} from '../lib/property-source.mjs';
import {prepareTrustedText,trustedDraft} from '../lib/trusted-intake.mjs';
import {safePublicText} from '../lib/posts.mjs';
const basic='188 Phố Mẫu, Hà Đông, 52m2, 4m, 18tr dưới 20, tt3c1, mô hình sạch (kh hàng ăn) phí khách, nguồn Người Mẫu';
const p=prepareTrustedText(basic),info=p.sourceInfo;
assert.equal(p.item.type,'Mặt bằng kinh doanh');assert.equal(p.item.price,18);assert.equal(p.item.frontage,4);assert.equal(info.sourceName,'Người Mẫu');assert.match(info.commission,/Khách trả phí/i);assert.match(info.privateNotes,/cọc: 1 tháng/);assert.match(info.privateNotes,/chưa ghi đơn vị/);
const draft=await trustedDraft({text:basic});assert(safePublicText(draft.public_data.description));assert(draft.public_data.description.includes('Không nhận mô hình kinh doanh hàng ăn'));assert(!/Người Mẫu|188|tt3c1|phí khách|hoa hồng/iu.test(JSON.stringify(draft.public_data)));assert(draft.public_data.title.includes('18 triệu/tháng'));
const short=prepareTrustedText('275 Phố Mẫu, 60m2 x 3t,4,5m. 35tr dưới 50 Cầu Giấy, tt6c1, lối chung, mô hình sạch, nguồn Người Mẫu phí 1/2');assert.equal(short.item.floors,3);assert.equal(short.item.frontage,4.5);assert.equal(short.item.areaPerFloor,true);assert.equal(short.sourceInfo.sourceName,'Người Mẫu');assert.match(short.sourceInfo.commission,/1\/2/);assert(!/50%|tiền thuê/.test(short.sourceInfo.commission));
for(const type of ['Văn phòng','Nhà nguyên căn','Kho xưởng'])assert.equal(prepareTrustedText('Loại BĐS: '+type+'\nĐịa chỉ: 12 Phố Mẫu, Cầu Giấy\nDiện tích: 80 m2\nGiá thuê: 20tr').item.type,type);
assert(isCustomerDemand('KH: Khách Mẫu\nThuê làm bánh\nTài chính: 15tr/tháng'));assert.throws(()=>prepareTrustedText('KH: Khách Mẫu\nThuê làm bánh\nTài chính: 15tr/tháng'),{status:422});
const recovered=mergeSourceInformation(extractSourceInfo(basic),{sourceName:'',commission:'',privateNotes:'Ghi chú tay'});assert.equal(recovered.sourceName,'Người Mẫu');assert(recovered.commission);assert(recovered.privateNotes.includes('Ghi chú tay'));
assert.equal(sourceInfo({privateNotes:'Nguồn: Người Mẫu\nPhí 50%'}).sourceName,'Người Mẫu');assert.match(sourceInfo({privateNotes:'Nguồn: Người Mẫu\nPhí 50%'}).commission,/50%/);
console.log('PASS inline source/fee/payer recovery, shorthand floors/frontage, category codes, privacy, restrictions, missing units, blank saved fields and demand rejection.');

const transfer=prepareTrustedText('70m2,5m,5,5tr dưới20 Hà Đông, mô hình sạch. Nhượng quán Bia90tr nguồn Người Mẫu phí10%');assert.equal(transfer.item.type,'Mặt bằng kinh doanh');assert.equal(transfer.item.price,5.5);assert.equal(transfer.item.transferPrice,90);
