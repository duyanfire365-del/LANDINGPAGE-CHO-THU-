import assert from 'node:assert/strict';
import {extractByRules} from '../lib/source-rules.mjs';
import {validateExtraction} from '../lib/source-automation.mjs';
import {trustedDraft} from '../lib/trusted-intake.mjs';
import {extractRentPricing,extractTransferPricing} from '../lib/source-pricing.mjs';
import {extractDimensions} from '../lib/property-dimensions.mjs';
import {publicMedia} from '../lib/media-access.mjs';
import {publicListing} from '../lib/post-history.mjs';
const source='Cho thuê mặt bằng & sang nhượng quán bia – Hoàng Mai – 150m² – 33 triệu/tháng\nDiện tích: 150m²\nMặt tiền: 10–13m\nGiá thuê: 33 triệu/tháng\nThanh toán:2 tháng,cọc 1 tháng\nGiá sang nhượng:350 triệu (có thương lượng)\nPhương án giá trao đổi:330 triệu\nPhù hợp kinh doanh nhà hàng.\nGhi chú nội bộ:\nGiá sang nhượng báo:350 triệu (phí 10%)\nGiá thương lượng:330 triệu';
const checked=validateExtraction(extractByRules(source,{allowIncomplete:true,allowUncertain:true}),source);assert.equal(checked.price,33);assert.equal(checked.frontage,13);
const row=await trustedDraft({text:source});assert.equal(row.public_data.price,33);assert.equal(row.public_data.frontage,13);assert.equal(row.private_data.privateTransferPrice,350);assert.match(row.private_data.priceTrackingNotes,/330/);
for(const text of ['Giá trao đổi:330 triệu','Phương án giá trao đổi:330 triệu','Giá thương lượng:330 triệu','Giá nhượng:350 triệu','Giá chuyển nhượng:350 triệu']){
 const p=extractRentPricing('Cho thuê 150m²\nGiá thuê:33 triệu/tháng\n'+text,{allowIncomplete:true,allowUncertain:true});assert.equal(p.price,33,text);
}
assert.equal(extractRentPricing('Cho thuê 150m2 giá thuê 33tr/tháng, giá sang nhượng 350tr',{allowIncomplete:true,allowUncertain:true}).price,33);
assert.equal(extractTransferPricing(source).transferPrice,350);
for(const range of ['10-13m','10–13m','10 — 13 m','10m đến 13m','13-10m','10,5–13,5m'])assert.equal(extractDimensions('Mặt tiền:'+range).frontage,range.includes(',')?13.5:13);
assert.equal(extractDimensions('Mặt tiền:10-13m\nĐường rộng:5m').roadWidth,5);
assert.equal(extractRentPricing('Cho thuê 150m² giá thuê 30–33tr/tháng',{allowIncomplete:true,allowUncertain:true}).price,null,'Frontage policy must not guess price ranges');
const legacy={...row.public_data,adminAuthoredCopy:true,transferPrice:350,transferNegotiable:true,title:'Sang nhượng mặt bằng 150 m² – 33 triệu/tháng',description:'Giá thuê:33 triệu/tháng\nPhương án giá trao đổi:330 triệu\nGiá sang nhượng:350 triệu\nPhù hợp kinh doanh.',shareText:'Giá thuê:33 triệu/tháng\nGiá thương lượng:330 triệu\nGiá nhượng:350 triệu',facts:['Diện tích:150m²','Giá sang nhượng:350 triệu'],notes:['Giá trao đổi:330 triệu']};
legacy.transactionCopySource={description:legacy.description,facts:legacy.facts};
for(const p of [publicMedia(legacy),publicListing(legacy)]){assert.equal(p.transferPrice,null);assert(!JSON.stringify(p).includes('350'));assert(!JSON.stringify(p).includes('330'));assert.match(p.description,/33 triệu/);assert.equal(p.frontage,13);}
assert.equal(legacy.transferPrice,350,'Projection must not mutate owner data');
console.log('PASS screenshot: rent33/frontage13, transfer350 and exchange330 private, legacy/manual public projections and sharing, true rent ranges stay uncertain.');
