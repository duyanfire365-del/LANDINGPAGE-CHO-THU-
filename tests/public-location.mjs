import assert from 'node:assert/strict';
import {publicLocation,sourceLocation} from '../lib/public-location.mjs';
import {sensitiveCopy} from '../lib/listing-privacy.mjs';
import {extractByRules} from '../lib/source-rules.mjs';
import {telegramEditContent} from '../lib/telegram-edit-content.mjs';
assert.equal(publicLocation('Số 12 ngách 3/5 ngõ 68 Nguyễn Khuyến, Văn Quán, Hà Đông'),'Nguyễn Khuyến, Văn Quán, Hà Đông');
assert.equal(sensitiveCopy('Cho thuê mặt bằng kinh doanh tại Nguyễn Khuyến, Văn Quán, Hà Đông.'),false);
assert.equal(sensitiveCopy('Đang kinh doanh quán ăn tại Văn Quán'),true);
for(const raw of ['Bổ sung: Nguyễn Khuyến, Văn Quán, Hà Đông','Bổ sung địa chỉ:\nNguyễn Khuyến, Văn Quán, Hà Đông','Địa chỉ: Số 12 ngách 3/5 ngõ 68 Nguyễn Khuyến, Văn Quán, Hà Đông']){
 const item=extractByRules(telegramEditContent(raw).text,{allowIncomplete:true,allowUncertain:true});assert.equal(item.location,'Nguyễn Khuyến, Văn Quán');
}
assert.equal(sourceLocation('Có điện ba pha, phù hợp xưởng, Hà Đông','Hà Đông'),'');
const original=extractByRules('Cho thuê mặt bằng kinh doanh ngõ 68 Nguyễn Khuyến, Văn Quán, Hà Đông\nDiện tích:60m2\nGiá thuê:15tr',{allowIncomplete:true,allowUncertain:true});assert(original.privateAddress.includes('68'));assert.equal(original.location,'Nguyễn Khuyến, Văn Quán');
console.log('PASS: inline/multiline and bare Reply addresses retain street/ward, house and nested alley numbers stay private; Văn Quán is a place, active restaurant identity stays private.');
