import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {allocateIllustrations,IMAGE_REUSE_GAP} from '../lib/illustration-allocation.mjs';
import {pickIllustration} from '../lib/illustration-library.mjs';
import {renderLibraryIllustration} from '../lib/illustration-library-build.mjs';
import {extractSourceInfo} from '../lib/property-source.mjs';
const rows=Array.from({length:180},(_,i)=>({id:'spacing-'+i,status:'published',created_at:String(9999-i),public_data:{slug:'live-'+(1793410000000+i),type:'Mặt bằng kinh doanh',floors:5,title:'Cho thuê mặt bằng',image:'/banner.png',illustrationKind:'banner',media:[]}}));
const context=Object.fromEntries(rows.map(r=>[r.id,'street']));
const result=allocateIllustrations(rows,{contexts:context}),last=new Map();
for(const [i,r]of result.entries()){
 const p=r.public_data,key=p.illustrationOriginalId;
 assert(key,'Every illustration needs a tracked original or diagram style');
 assert(i-(last.get(key)??-Infinity)>IMAGE_REUSE_GAP,'No reuse inside 20 intervening listings: '+key);last.set(key,i);
 if(p.illustrationProcedural){assert.equal(p.illustrationAssetId,null);assert(pickIllustration(p).procedural);}
}
assert(result.some(r=>r.public_data.illustrationProcedural));
assert.deepEqual(allocateIllustrations(rows,{contexts:context}),result,'Stable repeat allocation');
const real={...rows[0],public_data:{...rows[0].public_data,image:'/real.jpg',media:[{kind:'image',id:'photo'}]}};assert.equal(allocateIllustrations([real])[0].public_data.image,'/real.jpg');
const held=rows.slice(0,60).map(r=>({...r,public_data:{...r.public_data,image:'/api/files?action=media&id=private',media:[{kind:'image',id:'private',visibility:'owner'}]}}));
const heldResult=allocateIllustrations(held,{contexts:context});
assert(heldResult.every(r=>r.public_data.illustrationOriginalId&&r.public_data.image.startsWith('/api/files?action=illustration&')),'Held photos must receive rotated safe public illustrations too');
// Render every composition using local graphics; no network/provider call allowed.
const oldFetch=global.fetch;global.fetch=()=>{throw Error('No external requests allowed for free illustrations')};
const thumbs=[],hashes=new Set();
try{for(let i=0;i<8;i++){
 const item=pickIllustration({...rows[0].public_data,illustrationProcedural:true,illustrationStyleIndex:i*9});
 const bytes=await renderLibraryIllustration(item,item.variant,undefined,'MB - 0104'),meta=await sharp(bytes).metadata();
 assert.equal(meta.width,1200);assert.equal(meta.height,800);hashes.add(createHash('sha256').update(bytes).digest('hex'));
 thumbs.push({input:await sharp(bytes).resize(420,280).toBuffer(),left:(i%2)*420,top:Math.floor(i/2)*280});
}assert.equal(hashes.size,8);await writeFile('/tmp/telegram-free-illustrations-preview.jpg',await sharp({create:{width:840,height:1120,channels:3,background:'white'}}).composite(thumbs).jpeg().toBuffer());}finally{global.fetch=oldFetch;}
const info=extractSourceInfo('Cho thuê kho 300m2 giá 35tr\nVui lòng xem các loại nguồn hàng cho thuê cần tìm: https://nguonchothue.vn\nThông tin nội bộ:\nNguồn: VA\nSĐT nguồn: 0987654321\nPhí môi giới: 50%');assert.equal(info.sourceName,'VA');assert(info.partnerPhones.includes('0987654321'));assert.match(info.commission,/50%/);
console.log('PASS: 180 listings respect a strict 20-listing original/style gap, local fallback stays stable, real photos preserved, eight distinct compositions render at 1200×800 with zero API requests, source attribution correct.');
