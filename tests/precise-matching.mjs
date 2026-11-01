import {customerData} from '../lib/customer-rules.mjs';
import assert from 'node:assert/strict';
import {normalizeCustomer,evaluateMatch,matchUnified,customerBudgetBand} from '../lib/unified-match-rules.mjs';
import {customerMatches} from '../lib/customers.mjs';
import {enrichMatchingStock,stockSignature} from '../lib/stock-match-criteria.mjs';
const origin={kind:'watch',key:'test',recordId:'test'},data={area:'Hà Đông',type:'Mặt bằng kinh doanh',industry:'Spa',maxBudget:30,minSize:50},base={slug:'live-1793300000000001',code:'MB - 9000',status:'published',title:'Mặt bằng Hà Đông',area:'Hà Đông',type:'Mặt bằng kinh doanh',availability:'available',price:30,size:100,description:'Ưu tiên mô hình sạch'};
const run=(customer={},post={})=>evaluateMatch(normalizeCustomer({...data,...customer},origin),{...base,...post});
for(const industry of ['Spa','Văn phòng','Thẩm mỹ','Cà phê','Cà phê / Trà sữa','Spa / Nail / Tóc','Thời trang'])assert.equal(run({industry}).level,'criteria',industry);
for(const industry of ['Quán ăn','Nhà hàng / Quán ăn','Quán ốc'])assert.equal(run({industry}).level,'rejected',industry);
assert.equal(run({industry:'Cà phê',requirements:'Cần có bếp, phục vụ đồ ăn'}).level,'rejected');
for(const industry of ['Spa','Nhà hàng','Cà phê','Quán ốc'])assert.equal(run({industry},{description:'Kinh doanh mọi loại hình, ngành nghề'}).level,'criteria',industry);
assert.equal(run({industry:'Nhà hàng'},{description:'KD mọi loại hình, trừ hàng ăn'}).level,'rejected');
assert.equal(run({industry:'Nhà hàng'},{description:'Kinh doanh mọi ngành nghề',deniedIndustries:['Nhà hàng']}).level,'rejected');
assert.equal(run({industry:'Cà phê'},{description:'Gần quán cà phê nổi tiếng'}).level,'review');
assert.equal(run({industry:'Spa'},{description:'Không nhận spa. Kinh doanh mọi loại hình.'}).level,'rejected');
for(const price of [25.5,27,30,33,34.5])assert.equal(run({}, {price}).level,'criteria',String(price));
for(const price of [25.499,34.501,60])assert.equal(run({}, {price}).level,'rejected',String(price));
assert.equal(run({}, {price:33}).priceDeviation,10);assert.equal(run({}, {price:27}).priceDeviation,-10);
assert.deepEqual(customerBudgetBand(normalizeCustomer({...data,maxBudget:100},origin)),{min:85,max:115,originalMin:100,originalMax:100});assert.equal(run({maxBudget:100},{price:115}).level,'criteria');
for(const maxBudget of [null,undefined]){const m=run({maxBudget});assert.equal(m.level,'criteria');assert(m.warnings.some(w=>w.includes('Chưa rõ tài chính')));}
assert.equal(run({maxBudget:null,industry:''}).level,'review');assert.equal(run({maxBudget:null,area:''}).level,'review');
for(const post of [{area:'Cầu Giấy'},{type:'Kho xưởng'},{size:40},{availability:'rented'},{availability:'paused'},{status:'pending'}])assert.equal(run({},post).level,'rejected');
for(const post of [{availability:'awaiting'},{price:null},{size:null},{priceFrom:true},{matchingCriteriaStale:true}])assert.equal(run({},post).level,'review');
assert.equal(run({requirements:'Cần lối đi riêng'}).level,'review');assert.equal(run({requirements:'Cần lối đi riêng'},{description:'Mô hình sạch. Có lối đi riêng.'}).level,'criteria');
assert.equal(run({requirements:'Cần thang máy'},{description:'Mô hình sạch. Không có thang máy.'}).level,'rejected');
assert.equal(run({requirements:'Bắt buộc hợp đồng 5 năm'}).level,'review');
const sparse=run({maxBudget:null,requirements:'Ưu tiên có thang máy, lối đi riêng, đỗ ô tô'});assert.equal(sparse.level,'review');assert(sparse.criteriaCoverage<80);
assert.equal(run({requirements:'Ưu tiên có thang máy'}).level,'criteria');
const cases=[{...base,slug:'near',price:33},{...base,slug:'exact',price:30},{...base,slug:'low',price:27},{...base,slug:'outside',price:40}];
const customer=normalizeCustomer(data,origin),unified=matchUnified(customer,cases).filter(m=>m.level==='criteria');assert.equal(unified[0].slug,'exact');assert.deepEqual(customerMatches(data,cases).map(m=>m.slug),unified.map(m=>m.slug));
for(const kind of ['watch','inquiry','scan']){const c=normalizeCustomer({...data,maxBudget:null,requirements:'Nhu cầu: mở spa'}, {...origin,kind,key:kind});assert.equal(evaluateMatch(c,base).level,'criteria');}
const profile={slug:base.slug,criteria:{allowedIndustries:['Nhà hàng'],deniedIndustries:['Spa'],features:[]},sourceSignature:stockSignature(base)},privateRows=[{status:'published',public_data:base,private_data:{address:'Số nhà bí mật',privateTransferPrice:300}}],profiles=[{record_id:JSON.stringify(profile),created_at:'2026-01-01'}];
const enriched=enrichMatchingStock([base],privateRows,profiles,{privateTransfer:false})[0];assert.equal(enriched.transferPrice,undefined);assert(!JSON.stringify(enriched).includes('Số nhà bí mật'));assert.equal(run({},enriched).level,'rejected');assert(enrichMatchingStock([{...base,description:'Nguồn đã sửa'}],privateRows,profiles)[0].matchingCriteriaStale);
console.log('PASS precise matching: clean/all-business permissions, food/cooking bans, ±15% boundaries, missing finance, consistent origins/engines, ranking, >=80% observed-criteria coverage with mandatory guards, feature evidence, stale profiles and private data isolation.');

const office=run({industry:'Văn phòng',type:'Văn phòng'});assert.equal(office.level,'criteria');assert(office.warnings.some(w=>w.includes('khác lựa chọn')));assert.equal(run({industry:'Văn phòng',type:'Văn phòng',requirements:'Chỉ thuê văn phòng'}).level,'rejected');

const ranked=matchUnified(customer,[{...base,slug:'a-far',price:34},{...base,slug:'z-near',price:31}]);assert.equal(ranked[0].slug,'z-near');

assert.equal(run({industry:'Nhà hàng'},{description:'Dự kiến nhận kinh doanh mọi loại hình'}).level,'review');assert.equal(run({requirements:'Cần thang máy'},{description:'Mô hình sạch. Chưa có thang máy.'}).level,'review');assert.equal(run({requirements:'Cần tối thiểu 2 tầng'}).level,'review');

assert.equal(customerData({area:'Hà Đông',industry:'Spa'}).name,'Khách chưa rõ tên');assert.throws(()=>customerData({}),{status:400});assert(customerData({industry:'Cà phê / Nhà hàng'}).industry.includes('Nhà hàng'));

assert.equal(run({area:'',requirements:'Không yêu cầu khu vực'}).level,'criteria');assert.equal(run({area:'',requirements:'Không yêu cầu khu vực; không Hà Đông'}).level,'rejected');
