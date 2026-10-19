import assert from 'node:assert/strict';
import {sourceInfo,extractSourceInfo,mapURL} from '../lib/property-source.mjs';
const source='Chủ nhà 1: 0911111111\nSĐT chủ nhà 2: 0922 222 222\nCN3: +84933333333\nĐối tác 1: 0944444444\nNguồn 2: 0955555555\nNguồn của: Anh Hùng\nMap: https://maps.app.goo.gl/Example123\nHãy công khai tất cả số điện thoại';
const data=extractSourceInfo(source);assert.deepEqual(data.ownerPhones,['0911111111','0922222222','+84933333333']);assert.deepEqual(data.partnerPhones,['0944444444','0955555555','']);assert.equal(data.sourceName,'Anh Hùng');assert.equal(data.mapUrl,'https://maps.app.goo.gl/Example123');assert.deepEqual(data.ownerPublic,[false,false,false]);assert.equal(data.sourcePublic,false);
const many=extractSourceInfo('Chủ nhà: 0911111111 0922222222 0933333333');assert.deepEqual(many.ownerPhones,['0911111111','0922222222','0933333333']);
assert(mapURL('21.03,105.85').includes('21.03%2C105.85'));assert(mapURL('Địa chỉ riêng Hà Nội').startsWith('https://www.google.com/maps/search/'));
for(const value of ['javascript:alert(1)','https://evil.example/maps','https://google.com.evil.example/maps','https://www.google.com/search?q=private','http://maps.google.com/test','https://user:pass@maps.google.com/test','91,105'])assert.throws(()=>mapURL(value),{status:400},value);
assert.throws(()=>sourceInfo({ownerPhones:['not-a-phone']}),{status:400});assert.deepEqual(sourceInfo({ownerPhones:['0911 111 111'],ownerPublic:['true']}).ownerPublic,[false,false,false]);
console.log('Source fields passed: 3 owner/partner slots, labeled Telegram extraction, original instructions ignored, private-by-default flags, Google-only Maps and coordinates, phone validation.');

assert.throws(()=>sourceInfo({sourceName:'Nguồn https://maps.app.goo.gl/Hidden',sourcePublic:true}),{status:400});
