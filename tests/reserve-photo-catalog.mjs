import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import assets from '../lib/reserve-photo-catalog.json' with {type:'json'};
import {contextualPhotos} from '../lib/contextual-photo-catalog.mjs';
import {illustrationCandidates} from '../lib/stock-illustrations.mjs';
import {illustrationProfile} from '../lib/illustration-profile.mjs';
import {allocateIllustrations} from '../lib/illustration-allocation.mjs';
assert.equal(assets.length,108);assert.equal(contextualPhotos.length,140);
assert.equal(new Set(assets.map(a=>a.id)).size,108);
const hashes=new Set();let bytes=0;
for(const a of assets){const b=await readFile(new URL(a.localSource,new URL('../lib/',import.meta.url))),m=await sharp(b).metadata();assert.equal(m.format,'jpeg');assert(m.width>=400&&m.height>=400);bytes+=b.length;hashes.add(createHash('sha256').update(b).digest('hex'));assert.equal(a.distinctOriginal,a.id);}
assert.equal(hashes.size,108,'All files have independent image content');
for(const [word,sector]of [['quán ăn','restaurant'],['cafe','cafe'],['spa','spa'],['nail','nail'],['nối mi','lashes'],['salon tóc','hair'],['showroom thời trang','retail'],['văn phòng','office'],['kho xưởng','warehouse']])for(const size of [50,100,200]){
 const p={type:sector==='office'?'Văn phòng':sector==='warehouse'?'Kho xưởng':'Mặt bằng kinh doanh',title:'Cho thuê '+word,size};const pool=illustrationCandidates(p);assert(pool.some(a=>a.sourceBatch==='reserve-108-20261126'),word+' '+size);assert(pool.every(a=>a.sector===sector||(sector==='office'&&a.setting==='street'&&!a.sector)));
}
assert.deepEqual(illustrationProfile({type:'Nhà nguyên căn',title:'Cho thuê nhà',description:'Đầy đủ nội thất.'}).sectors,[],'Home furnishing is not a furniture showroom');
const types=['Mặt bằng kinh doanh','Nhà nguyên căn','Văn phòng','Kho xưởng'];
const rows=Array.from({length:500},(_,i)=>({id:'reserve-'+i,status:'published',created_at:String(99999-i),public_data:{slug:'live-'+(1797000000000+i),type:types[i%4],title:['Sang nhượng cafe','Cho thuê nhà','Cho thuê văn phòng','Cho thuê kho xưởng'][i%4],size:[50,100,200][Math.floor(i/4)%3],illustrationKind:'banner',image:'/banner.png',media:[]}}));
const result=allocateIllustrations(rows),last=new Map(),byType=new Map(),positions=new Map();
for(const [i,{public_data:p}]of result.entries()){const n=positions.get(p.type)||0;positions.set(p.type,n+1);const h=byType.get(p.type)||new Map();byType.set(p.type,h);const key=p.illustrationOriginalId;assert(i-(last.get(key)??-Infinity)>50);assert(n-(h.get(key)??-Infinity)>50);last.set(key,i);h.set(key,n);}
assert(result.some(r=>r.public_data.illustrationAssetId?.startsWith('context-reserve-')));
assert.deepEqual(allocateIllustrations(rows),result);
console.log('PASS 108 unique JPEGs / 140 contextual photos, all sector-scale combinations, public-copy semantics, 500 mixed-category 50-gap simulation. Added bytes:',bytes);
