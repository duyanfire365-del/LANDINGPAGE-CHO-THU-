import assert from 'node:assert/strict';
import {allocateIllustrations} from '../lib/illustration-allocation.mjs';
import {illustrationCandidates,stockIllustrations} from '../lib/stock-illustrations.mjs';
// Sizes/frontages reproduce the distribution in the current 28-card warehouse list; no owner data needed.
const specs=[[30,320,20],[29,198,10],[28,450,15],[27,1300,null],[26,100,5,true],[25,200,16],[24,800,null],[23,170,7],[22,300,12],[21,120,10],[20,200,10],[19,176,6],[18,750,20],[17,400,null,true],[16,1000,null],[15,300,16],[14,1000,null],[13,800,null,true],[12,100,null,true],[11,200,11,true],[10,200,null],[7,null,null,true],[6,140,6.8,true],[5,500,null,true],[4,800,null,true],[3,1600,null,true],[2,280,null,true],[1,200,null]];
const rows=specs.map(([code,size,frontage,real],i)=>({id:String(code),status:'published',created_at:String(99999-i),public_data:{slug:'live-'+(1799000000000+i),code:'KX - '+String(code).padStart(4,'0'),type:'Kho xưởng',title:'Cho thuê kho xưởng',size,frontage,image:real?'/provided-'+code+'.jpg':i%2?'':'/banner.png',illustrationKind:real?undefined:'banner',media:real?[{kind:'image',id:'provided-'+code}]:[]}}));
for(const contexts of [{},Object.fromEntries(rows.map(r=>[r.id,'street']))]){
 const result=allocateIllustrations(rows,{contexts}),families=new Set();
 for(const [i,r] of result.entries()){
  const p=r.public_data;if(rows[i].public_data.media.length){assert.equal(p.image,rows[i].public_data.image);continue;}
  assert(p.illustrationAssetId,'Every current banner-only warehouse must get a compatible photo');assert.equal(p.illustrationProcedural,false);assert(p.image.includes('spacing50-v7'));assert(!families.has(p.illustrationOriginalId));families.add(p.illustrationOriginalId);
 }
 assert.equal(families.size,17);assert.deepEqual(allocateIllustrations(rows,{contexts}),result);
}
const legacy=illustrationCandidates({type:'Kho xưởng',title:'Cho thuê kho xưởng',size:300}).filter(a=>a.id.startsWith('hanoi-warehouse-'));assert(legacy.length>=12);assert(legacy.every(a=>a.sector==='warehouse'&&a.visualFamily));assert.equal(stockIllustrations.find(a=>a.id==='hanoi-warehouse-004').visualFamily,stockIllustrations.find(a=>a.id==='hanoi-warehouse-024').visualFamily);
console.log('PASS 28 current warehouse distribution: 17 missing/banner covers become compatible photo families, all 11 supplied covers preserved, legacy sector tags restored, stable street/default allocation.');
