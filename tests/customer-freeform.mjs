import assert from 'node:assert/strict';
import {parseCustomers,customerData} from '../lib/customer-rules.mjs';
import {isCustomerDemand} from '../lib/source-inline.mjs';
import {normalizeCustomer,evaluateMatch} from '../lib/unified-match-rules.mjs';
const sample='Khách (của đối tác Mr Mạnh): tìm gấp mặt bằng mở Showroom dt trên 100m2, mt >=6m, ưu tiên khu vực Thái Hà, bán kính xê dịch 1km, tc <=120tr, ưu tiên mặt phố, chân đế chung cư cũng OK';
const parse=text=>{const result=parseCustomers(text,{allowAnonymous:true});assert.equal(result.items.length,1,text);return result.items[0]};
assert(isCustomerDemand(sample));assert(!isCustomerDemand('Cho thuê mặt bằng dt 100m2, mt 6m, giá 120tr'));
for(const text of [sample,sample.replace('dt trên 100m2, mt >=6m','DT ≥100m²; MT ≥6m').replace('tc <=120tr','NS ≤120 triệu'),sample.replace('dt trên 100m2, mt >=6m','dt100m2 mt>=6m').replace('tc <=120tr','TC<=120.000.000đ'),sample.replace('Khách (của đối tác','khách (đối tác').replace('bán kính xê dịch 1km','bk1000m')]){
 const c=parse(text);assert.equal(c.name,'Nguồn đối tác Mr Mạnh');assert.equal(c.minSize,100);assert.equal(c.minFrontage,6);assert.equal(c.maxBudget,120);assert.equal(c.type,'Mặt bằng kinh doanh');assert.equal(c.searchRadiusKm,1);assert.equal(c.locationAnchor,'Thái Hà');assert(c.area.includes('Thái Hà'));assert.equal(c.sourceText,text);assert.equal(c.requirements,text);assert.equal(c.phone,'');
}
const trang='KH của Mrs Trang Nguyễn; Tài chính 15tr làm giặt là, mong tìm ở khu vực Quận Cầu giấy, Nam Từ Liêm, Thanh Xuân, Bắc Từ Liêm; Đình Thôn, Yên Hòa, Cổ Nhuế, Khương Trung. Mặt bằng có chỗ ở lại.';
for(const separator of [';',':',',',' — ',' | ','\n',' ','. ']){const c=parse(trang.replace('; Tài chính',separator+' Tài chính'));assert.equal(c.name,'Nguồn đối tác Mrs Trang Nguyễn');assert.equal(c.source,'Mrs Trang Nguyễn');assert.equal(c.maxBudget,15);assert.equal(c.industry,'Giặt là / Giặt sấy');assert(!c.area.includes('Mặt bằng'));assert(c.requirements.includes('có chỗ ở lại'));}
const range=parse('KH của A: tìm gấp kho 300-500m2, container vào dc, có PCCC, quanh Hà Nội, giá thuê phụ thuộc vị trí khu vực');assert.equal(range.source,'A');assert.equal(range.name,'Nguồn đối tác A');assert.equal(range.minSize,300);assert.equal(range.maxSize,500);assert.equal(range.maxBudget,null);assert.equal(range.area,'quanh Hà Nội');
assert.equal(parse('KH: Anh An; dt>=80m2; mt>=5,5m; tc<=30tr; kv. Hà Đông').name,'Anh An');
assert.equal(parse('KH của A: cần thuê vp; ns khoảng 30tr; dt80m2').maxBudget,null);
assert.equal(parse('KH của A: cần thuê vp; ns khoảng 30tr; dt80m2').budgetApproximate,true);
const lower=parse('KH của A: cần thuê VP; tc từ 30tr; dt dưới 100m2');assert.equal(lower.maxBudget,null);assert.equal(lower.maxSize,100);assert.equal(lower.minSize,null);
assert.equal(parse('KH của A: tìm MB; tc 20-30tr; dt 80-100m2').maxBudget,30);
assert.equal(parse('KH của A: tìm MB; dt100m2; tối đa 120tr').maxBudget,120);
const maximum=parse('KH của A: cần thuê MB; tc<=40tr; dt 100m2; mt <=6m');assert.equal(maximum.minFrontage,null);assert.equal(maximum.maxBudget,40);assert(maximum.parseWarnings.length);
const invalid=parse('KH của A: cần thuê MB; dt 100m2; mt 6000m; tc 30tr');assert.equal(invalid.minSize,100);assert.equal(invalid.maxBudget,30);assert.equal(invalid.minFrontage,null);assert(invalid.parseWarnings.length);
assert.equal(parse('KH của A: cần thuê mb; ko yêu cầu khu vực; tc 30tr').area,'');
assert.throws(()=>customerData({name:'A',searchRadiusKm:-1}),{status:400});
const c=normalizeCustomer(parse(sample),{key:'example',ownerId:null});assert.equal(c.searchRadiusKm,1);
const candidate={slug:'test',status:'published',availability:'available',area:'Đống Đa',address:'Thái Hà',type:'Mặt bằng kinh doanh',size:120,frontage:7,price:110,description:'Mặt phố. Nhận showroom, văn phòng, mô hình sạch.'};const match=evaluateMatch(c,candidate);assert.equal(match.level,'review');assert(match.missing.some(s=>s.includes('1 km')),'Radius must not be declared verified without coordinates');assert(!match.failed.includes('Sai khu vực'));
console.log('PASS free-form customer intake: exact screenshot, partner identity, operators/abbreviations/units, inline locations/radius, bare warehouse ranges, soft budgets, invalid-field isolation, shared-bot routing, original retention and honest radius matching.');
