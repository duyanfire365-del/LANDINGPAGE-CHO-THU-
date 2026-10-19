import assert from 'node:assert/strict';
await import('../public/need-matching.js');
const rows=[{slug:'a',area:'Cầu Giấy',type:'Văn phòng',price:25,size:100,description:'Văn phòng có chỗ để xe'},{slug:'b',area:'Hà Đông',type:'Kho xưởng',price:150,size:1000},{slug:'c',area:'Cầu Giấy',type:'Văn phòng',price:20,size:120,availability:'rented'}];
const {match}=globalThis.RentalNeedMatching;
let matches=match(rows,{area:'Cầu Giấy',type:'Văn phòng',maxBudget:30,minSize:80,industry:'Văn phòng / Showroom'});assert.equal(matches[0].post.slug,'a');assert.equal(matches[0].gaps.length,0);assert(!matches.some(m=>m.post.slug==='c'));assert(matches.find(m=>m.post.slug==='b').gaps.includes('Vượt ngân sách'));
matches=match(rows,{budget:'over-100'});assert.equal(matches[0].post.slug,'b');assert.equal(matches[0].gaps.length,0);
matches=match(rows,{industry:'Phòng khám / Nha khoa'});assert.equal(matches.length,0);
console.log('PASS: criteria ranking, budget ranges, rented exclusion, no unsupported industry suitability claims');
