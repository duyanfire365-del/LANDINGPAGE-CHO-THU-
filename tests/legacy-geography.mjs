import assert from 'node:assert/strict';
import directory from '../public/hanoi-legacy-wards.json' with {type:'json'};
import {resolveLegacyLocation} from '../lib/legacy-geography.mjs';
import {extractByRules} from '../lib/source-rules.mjs';
import {validateExtraction} from '../lib/source-automation.mjs';
import {trustedDraft} from '../lib/trusted-intake.mjs';
import {prepareEditorText} from '../lib/editor-ai.mjs';
import {postLocationFields} from '../lib/post-location-fields.mjs';
const cases=[
 ['Cho thuê kho 400m2 Đại Linh, đường Sa Đôi\nĐịa chỉ: Số 999 ngõ 129 Đại Linh, Hà Nội\nHợp đồng dài hạn 5 năm\nGiá thuê: 25tr/tháng','Nam Từ Liêm','Phường Đại Mỗ'],
 ['Bán nhà Sa Đôi\nDT 100m2, giá bán 5 tỷ\nHợp đồng dài hạn','Nam Từ Liêm','Phường Đại Mỗ'],
 ['Cho thuê mặt bằng\nĐịa chỉ: Đại Linh\nGiá thuê 25tr/tháng\nNguồn: Đối tác Đống Đa','Nam Từ Liêm','Phường Đại Mỗ'],
 ['Cho thuê nhà\nPhường: Đại Mỗ','Nam Từ Liêm','Phường Đại Mỗ'],
 ['Cho thuê nhà tại phường Yên Hòa\nGiá thuê 20tr','Cầu Giấy','Phường Yên Hoà'],
 ['Cho thuê kho\nĐịa chỉ: xã Hợp Đồng, Chương Mỹ','Chương Mỹ','Xã Hợp Đồng'],
 ['Cho thuê nhà tại phường Quang Trung','Hà Nội',''],
 ['Cho thuê nhà tại xã Quang Trung','Phú Xuyên','Xã Quang Trung'],
 ['Cho thuê nhà Thanh Xuân','Thanh Xuân',''],
 ['Địa chỉ: xã Thanh Xuân','Sóc Sơn','Xã Thanh Xuân'],
 ['Cho thuê nhà\nĐịa chỉ: Phường Quang Trung, Hà Đông','Hà Đông','Phường Quang Trung'],
 ['Cho thuê nhà\nHợp đồng dài hạn\nGiá thuê 20tr','Hà Nội',''],
 ['Cho thuê nhà tại Nguyễn Trãi\nDT 100m2\nGiá thuê 20tr','Hà Nội',''],
 ['Cho thuê nhà đường Yên Hòa\nGiá thuê 20tr','Hà Nội',''],
 ['Cho thuê nhà tại Nguyễn Du','Hà Nội',''],
 ['Anh Ngọc Hà cho thuê kho 100m2','Hà Nội',''],
 ['Cho thuê nhà Đại Mỗ','Nam Từ Liêm','Phường Đại Mỗ'],
 ['Cho thuê kho Sa Đôi, gần Đống Đa','Nam Từ Liêm','Phường Đại Mỗ'],
 ['Cho thuê kho\nĐịa chỉ: Sa Đôi, quận Đống Đa','Hà Nội',''],
 ['Cho thuê nhà\nNguồn: Quang Trung, Hà Đông\nLiên hệ Đống Đa','Hà Nội',''],
 ['Cho thuê nhà\nĐịa chỉ: tỉnh Vĩnh Phúc','Hà Nội',''],
 ['Cho thuê văn phòng tại Phạm Huy Thông','Ba Đình',''],
 ['Cho thuê nhà tại Triều Khúc','Thanh Trì','']
];
for(const [text,area,ward]of cases){const r=resolveLegacyLocation(text);assert.equal(r.area,area,text+' => '+JSON.stringify(r));assert.equal(r.ward,ward,text);}
assert.equal(resolveLegacyLocation(cases[6][0]).status,'ambiguous');assert.equal(resolveLegacyLocation('Địa chỉ: Sa Đôi, quận Đống Đa').status,'conflict');
for(const transaction of ['rent','sale','both']){
 const text=(transaction==='sale'?'Bán nhà':transaction==='both'?'Cho thuê và bán nhà':'Cho thuê kho')+' Sa Đôi, Đại Linh\nĐịa chỉ: Số 999 Đại Linh, Hà Nội\nDT: 100m2\n'+(transaction==='sale'?'Giá bán: 5 tỷ':transaction==='both'?'Giá thuê: 25tr/tháng\nGiá bán: 5 tỷ':'Giá thuê: 25tr/tháng')+'\nHợp đồng dài hạn 5 năm';
 const item=validateExtraction(extractByRules(text,{allowIncomplete:true,allowUncertain:true}),text,{allowIncomplete:true});assert.equal(item.area,'Nam Từ Liêm');assert.equal(item.ward,'Phường Đại Mỗ');
 const p=(await trustedDraft({text,item})).public_data;assert.equal(p.area,'Nam Từ Liêm');assert.equal(p.ward,'Phường Đại Mỗ');assert(p.address.includes('Đại Mỗ'));assert(!p.address.includes('999'));assert.equal(p.transactionType,transaction);
}
const manual={street:'Sa Đôi',ward:'Phường Đại Mỗ',area:'Nam Từ Liêm',address:'Sa Đôi, Phường Đại Mỗ, Nam Từ Liêm, Hà Nội',adminAuthoredCopy:true};assert.deepEqual(postLocationFields({},manual,{adminAuthored:true}),{street:manual.street,ward:manual.ward,area:manual.area,address:manual.address});
for(const [area,names]of Object.entries(directory.districts))for(const name of names){const r=resolveLegacyLocation('Địa chỉ: '+name+', '+area);assert.equal(r.area,area,name);assert.equal(r.ward,name,name);}
const groups=new Map();for(const [area,names]of Object.entries(directory.districts))for(const name of names){const key=globalThis.RentalLocations.fold(name);if(!groups.has(key))groups.set(key,{name,areas:new Set()});groups.get(key).areas.add(area);}
for(const {name,areas}of groups.values()){const result=resolveLegacyLocation('Địa chỉ: '+name);if(areas.size===1)assert.equal(result.area,[...areas][0],name);else {assert.equal(result.area,'Hà Nội',name);assert.equal(result.status,'ambiguous',name);}}
const originalFetch=global.fetch;global.fetch=()=>{throw Error('Location resolution must not call a geocoding/AI API');};
try{for(const kind of ['Cho thuê kho','Bán nhà']){const r=await prepareEditorText(kind+' Sa Đôi, Đại Linh\nĐịa chỉ: Số 999 Đại Linh\nDiện tích: 100m2\n'+(kind==='Bán nhà'?'Giá bán: 5 tỷ':'Giá thuê: 25tr/tháng')+'\nKhông gian sử dụng riêng biệt, có điện ba pha và nước máy theo thông tin được cung cấp. Phù hợp nhu cầu sử dụng cần khảo sát trước khi quyết định.');assert.equal(r.item.area,'Nam Từ Liêm');assert.equal(r.item.ward,'Phường Đại Mỗ');}}finally{global.fetch=originalFetch;}
console.log('PASS legacy geography: whole-word district matching, verified streets/wards, ambiguous/conflicting/nearby/private geography, rent/sale/both, private house numbers and manual fields preserved.');
