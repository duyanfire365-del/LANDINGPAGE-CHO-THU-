import assert from 'node:assert/strict';
await import('../public/need-matching.js');
const rows=[{slug:'a',area:'Cầu Giấy',type:'Văn phòng',price:25,size:100,description:'Văn phòng có chỗ để xe'},{slug:'b',area:'Hà Đông',type:'Kho xưởng',price:150,size:1000},{slug:'c',area:'Cầu Giấy',type:'Văn phòng',price:20,size:120,availability:'rented'}];
const {match}=globalThis.RentalNeedMatching;
let matches=match(rows,{area:'Cầu Giấy',type:'Văn phòng',maxBudget:30,minSize:80,industry:'Văn phòng / Showroom'});assert.equal(matches[0].post.slug,'a');assert.equal(matches[0].gaps.length,0);assert(!matches.some(m=>m.post.slug==='c'));assert(matches.find(m=>m.post.slug==='b').gaps.includes('Vượt ngân sách'));
matches=match(rows,{budget:'over-100'});assert.equal(matches[0].post.slug,'b');assert.equal(matches[0].gaps.length,0);
matches=match(rows,{industry:'Phòng khám / Nha khoa'});assert.equal(matches.length,0);
console.log('PASS: criteria ranking, budget ranges, rented exclusion, no unsupported industry suitability claims');
const {locations}=globalThis.RentalNeedMatching;
assert.deepEqual(locations({area:'Cầu Giấy',requirements:'quanh khu vực Hà Đông cũng được'}).areas,['Cầu Giấy','Hà Đông']);
assert.deepEqual(locations({area:'Cầu Giấy',requirements:'quanh Mỹ Đình, nam từ liêm'}).areas,['Cầu Giấy','Nam Từ Liêm']);
assert.deepEqual(locations({area:'Cầu Giấy',requirements:'chỉ tìm Hà Đông'}).areas,['Hà Đông']);
assert(!locations({area:'Cầu Giấy',requirements:'không ở Hà Đông'}).areas.includes('Hà Đông'));
const expanded=match([{slug:'hd',area:'Hà Đông',type:'Văn phòng',price:20,size:100},{slug:'cg',area:'Cầu Giấy',type:'Văn phòng',price:20,size:100}],{area:'Cầu Giấy',requirements:'Hà Đông cũng được'});assert.equal(expanded.length,2);assert(expanded.find(r=>r.post.slug==='hd').reasons.some(r=>r.includes('bổ sung')));
const publicRows=[{slug:'xom',code:'MB - 0025',title:'Sang nhượng mặt bằng kinh doanh — Xốm, Hà Đông',area:'Hà Đông',price:16,size:100,availability:'available'},{slug:'other',code:'MB - 0026',title:'Mặt bằng Cầu Giấy',area:'Cầu Giấy',price:16,size:100},{slug:'gone',title:'Xốm',availability:'rented'},{slug:'paused',title:'Xốm',availability:'paused'}];
for(const query of ['133 xốm','133 Xom','anh muốn tìm 133 Xốm'])assert.equal(match(publicRows,{requirements:query,textSearch:true}).length,0,'guest address input must never identify a listing');
assert.equal(match(publicRows,{area:'Hà Đông',textSearch:true})[0].post.slug,'xom','public district selection still works');
assert.equal(match(publicRows,{requirements:'MB0025',textSearch:true})[0].post.slug,'xom');
assert.equal(match(publicRows,{requirements:'đường Không Tồn Tại ABCXYZ',textSearch:true}).length,0);
assert.equal(match(publicRows,{requirements:'133 Xốm'}).length,0,'private automated customer matching remains opt-in for free text');
console.log('PASS: guest address queries disabled, public district/code search without contact fields, rented/paused excluded, private matching unchanged.');

const lowerBound=match([{slug:'from',price:15,priceFrom:true,size:100}],{maxBudget:20});assert(lowerBound[0].gaps.includes('Cần xác nhận giá thuê chính xác từ mức khởi điểm'));

for(const q of ['xốm','Xom','đường Xốm','anh muốn tìm mặt bằng Xốm'])assert.equal(match(publicRows,{requirements:q,textSearch:true})[0].post.slug,'xom');
const keywords=[{slug:'lift',title:'Văn phòng Trần Duy Hưng',description:'Có thang máy, chỗ để xe',area:'Cầu Giấy',availability:'available'}];for(const q of ['Trần Duy Hưng','tran duy hung','thang máy','chỗ để xe'])assert.equal(match(keywords,{requirements:q,textSearch:true})[0].post.slug,'lift');
for(const q of ['số 133 Xốm','133 Xom','ngõ 12 Xốm','12/3 Xom','133, Xốm','133 - Xom'])assert.equal(match(publicRows,{area:'Hà Đông',requirements:q,textSearch:true}).length,0);
assert.equal(match([{slug:'secret',title:'Nguồn',private_data:{address:'133 Xốm'}}],{requirements:'Xốm',textSearch:true}).length,0);
console.log('PASS public street/title/amenity keywords with accents, private house/alley queries blocked even with other criteria, private data never indexed.');

assert.equal(match([{slug:'address-field',address:'Xốm, Hà Đông',title:'Nguồn kinh doanh'}],{requirements:'xom',textSearch:true})[0].post.slug,'address-field');
