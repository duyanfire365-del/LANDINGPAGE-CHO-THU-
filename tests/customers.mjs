import assert from 'node:assert/strict';
import {customerData,parseCustomers} from '../lib/customer-rules.mjs';
import {customerMatches,customerScope} from '../lib/customers.mjs';
assert.equal(customerScope({admin:false,id:'member-1'}),'&owner_id=eq.member-1');assert.equal(customerScope({admin:true}),'');
assert.throws(()=>customerData({name:'A',phone:'bad'}),{status:400});assert.throws(()=>customerData({name:'A',maxBudget:-10}),{status:400});
const parsed=parseCustomers('Tên: Anh Nam\nSĐT: 0912345678\nKhu vực: Cầu Giấy hoặc Mỹ Đình\nNgân sách tối đa: 30 triệu\nDiện tích tối thiểu: 80m²\nNhu cầu: Thuê văn phòng\n---\nTên: Chị Lan\nSĐT: 0987654321\nKhu vực: Hà Đông');assert.equal(parsed.items.length,2);assert.equal(parsed.items[0].maxBudget,30);assert.equal(parsed.items[0].minSize,80);assert.equal(parsed.items[0].industry,'Văn phòng / Showroom');
assert.equal(parseCustomers('Tên: A\nSĐT: 0912345678 hoặc 0987654321').unresolved.length,1);
const stock=[{slug:'hn-001',area:'Nam Từ Liêm',type:'Văn phòng',description:'Văn phòng tại Mỹ Đình',size:100,price:25},{slug:'hn-002',area:'Cầu Giấy',type:'Văn phòng',size:100,price:40,description:'Văn phòng'},{slug:'hn-003',area:'Cầu Giấy',type:'Văn phòng',size:100,price:20,availability:'rented',description:'Văn phòng'}];assert.deepEqual(customerMatches(parsed.items[0],stock).map(m=>m.slug),['hn-001']);
assert.equal(customerData({name:'Anh Nam',type:'VP',industry:'văn phòng'}).type,'Văn phòng');
console.log('PASS: private owner scopes, customer parsing, multi-customer boundaries, ambiguous phones retained, budget/size validation, matching expanded locations, exclusion of over-budget and unavailable stock');

const many=Array.from({length:12},(_,i)=>({...stock[0],slug:'live-'+(1791999999999000+i)}));assert.equal(customerMatches(parsed.items[0],many).length,12,'new matching sources beyond the first six remain eligible for alerts');
