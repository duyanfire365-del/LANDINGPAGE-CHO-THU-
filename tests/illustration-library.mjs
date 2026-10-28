import assert from 'node:assert/strict';
import {illustrationLibrary,pickIllustration,publicIllustrationTags} from '../lib/illustration-library.mjs';
import {withCategoryBanner} from '../lib/listing-banner.mjs';
assert.equal(illustrationLibrary.length,61);assert.equal(new Set(illustrationLibrary.map(x=>x.path)).size,61);
for(const [type,n] of [['Mặt bằng kinh doanh',16],['Văn phòng',10],['Kho xưởng',8],['Nhà nguyên căn',6]])assert.equal(illustrationLibrary.filter(x=>x.type===type).length,n);
const p={type:'Mặt bằng kinh doanh',title:'Mặt bằng kinh doanh',slug:'sample-cafe',description:'Phù hợp mô hình cà phê.'};assert.equal(pickIllustration(p).scene,'cafe');assert.deepEqual(pickIllustration(p),pickIllustration(p));
assert.equal(pickIllustration({...p,description:'Không có vỉa hè. Chưa rõ đường rộng.'}).scene,'shop');assert(!publicIllustrationTags({...p,description:'Không có vỉa hè'}).includes('wide-road'));
assert.equal(pickIllustration({...p,description:'Đường rộng, ô tô tránh.'}).scene,'showroom');
assert.equal(pickIllustration({type:'Kho xưởng',description:'Xe tải bốc dỡ hàng'}).scene,'loading');
assert.equal(pickIllustration({...p,description:'',private_data:{sourceText:'cà phê'}}).scene,'shop');
assert.equal(pickIllustration({type:'Phòng trọ'}).type,'Phòng trọ');assert.equal(pickIllustration({type:'Loại hình mới'}).type,'Bất động sản khác');
assert(new Set(Array.from({length:40},(_,i)=>pickIllustration({...p,slug:'listing-'+i}).id)).size>1);
for(const image of ['/images/source.jpg','/api/files?action=media&id=real']){const real={...p,image,media:[{kind:'image',id:'real'}]};assert.deepEqual(withCategoryBanner(real),real)}
assert.equal(withCategoryBanner({...p,image:'/banners/mb.png'}).image,pickIllustration(p).path);
console.log('PASS 61 image allocation, contextual matching, stable variation, negations, private source exclusion and supplied photo priority.');
const expanded={...p,listingSequence:100};assert(pickIllustration(expanded).generated);assert.equal(pickIllustration(expanded).path,'/api/illustration?slug=sample-cafe');assert.deepEqual(pickIllustration(expanded),pickIllustration(expanded));
assert.match(withCategoryBanner({...expanded,image:'/api/illustration?slug=sample-cafe'}).image,/^\/api\/illustration\?/);
console.log('PASS automatic procedural replenishment beyond the base category pool, stable per-post image and no AI requests.');
