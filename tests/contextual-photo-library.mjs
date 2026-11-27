import assert from 'node:assert/strict';
import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {contextualPhotos} from '../lib/contextual-photo-catalog.mjs';
import {illustrationProfile} from '../lib/illustration-profile.mjs';
import {illustrationCandidates,stockForIllustration,illustrationAssetSetting} from '../lib/stock-illustrations.mjs';
import {allocateIllustrations,IMAGE_REUSE_GAP} from '../lib/illustration-allocation.mjs';
import {pickIllustration} from '../lib/illustration-library.mjs';
import {renderLibraryIllustration} from '../lib/illustration-library-build.mjs';
const post=(title,size=50,extra={})=>({slug:'live-1796000000000',type:'Mặt bằng kinh doanh',title,description:'',size,image:'/banner.png',illustrationKind:'banner',media:[],...extra});
assert.equal(IMAGE_REUSE_GAP,50);
for(const [word,sector] of [['hàng ăn','restaurant'],['cafe','cafe'],['spa','spa'],['nail','nail'],['tóc','hair'],['nối mi','lashes']]){
 const p=post('Sang nhượng '+word,sector==='spa'?100:50),pool=illustrationCandidates(p);assert(pool.length,word);assert(pool.every(a=>a.sector===sector));assert(pool.every(a=>a.scale===illustrationProfile(p).scale));
}
for(const [size,scale]of [[50,'small'],[100,'medium'],[200,'large']])assert(illustrationCandidates(post('Sang nhượng quán ăn',size)).every(a=>a.scale===scale));
assert(!illustrationProfile(post('Cho thuê mặt bằng','', {description:'Không nhận hàng ăn. Gần cafe. Phù hợp spa.'})).sectors.includes('restaurant'));
assert.deepEqual(illustrationProfile(post('Cho thuê mặt bằng gần khách sạn',50,{description:'Gần spa, đối diện cafe.'})).sectors,[]);
for(const [floors,frontage,corner]of [[3,4,false],[6,12,true]]){
 const pool=illustrationCandidates(post('Cho thuê nhà nguyên căn '+(corner?'lô góc':'lô thường'),100,{type:'Nhà nguyên căn',floors,frontage}));
 assert(pool.some(a=>a.depictedFloors===floors));assert(pool.every(a=>illustrationAssetSetting(a)==='interior'||(a.depictedFloors===floors&&a.corner===corner)));
}
const rows=Array.from({length:240},(_,i)=>({id:String(i),status:'published',created_at:String(99999-i),public_data:post('Sang nhượng cafe',50,{slug:'live-'+(1796000000000+i),type:i%3===0?'Nhà nguyên căn':'Mặt bằng kinh doanh'})}));
const result=allocateIllustrations(rows),last=new Map(),byType=new Map(),pos=new Map();
for(const [i,{public_data:p}]of result.entries()){
 const key=p.illustrationOriginalId,type=p.type,n=pos.get(type)||0;pos.set(type,n+1);const history=byType.get(type)||new Map();byType.set(type,history);
 assert(i-(last.get(key)??-Infinity)>50);assert(n-(history.get(key)??-Infinity)>50);last.set(key,i);history.set(key,n);
 if(p.illustrationAssetId)assert.equal(contextualPhotos.find(a=>a.id===p.illustrationAssetId)?.sector,'cafe');
 assert(p.image.includes('spacing50-v7'));assert.equal(pickIllustration(p).scene,'cafe');
}
assert.deepEqual(allocateIllustrations(rows),result);
await mkdir('public/stock',{recursive:true});for(const a of contextualPhotos)await writeFile('public/stock/'+a.id+'.jpg',await readFile(new URL(a.localSource,new URL('../lib/',import.meta.url))));
const original=global.fetch;global.fetch=()=>{throw Error('Paid or network call prohibited')};
try{
 const thumbs=[];
 for(const [i,p]of [post('Sang nhượng quán ăn',50),post('Sang nhượng quán ăn',200),post('Sang nhượng cafe',100),post('Sang nhượng nail',50),post('Sang nhượng spa',100),post('Sang nhượng salon tóc',70),post('Sang nhượng nối mi',50),post('Cho thuê nhà nguyên căn',100,{type:'Nhà nguyên căn',floors:6,frontage:12,description:'Lô góc'})].entries()){
  const a=allocateIllustrations([{id:'preview',status:'published',public_data:p}])[0].public_data,item=pickIllustration(a),bytes=await renderLibraryIllustration(item,0,undefined,'MB - 0999');
  assert.equal((await sharp(bytes).metadata()).width,1200);thumbs.push({input:await sharp(bytes).resize(400,267).toBuffer(),left:(i%2)*400,top:Math.floor(i/2)*267});
  const fallback=await renderLibraryIllustration({...item,procedural:true,variant:i},i,undefined,'MB - 0999');assert((await sharp(fallback).metadata()).height===800);
 }
 await writeFile('/tmp/contextual-illustrations-preview.jpg',await sharp({create:{width:800,height:1068,channels:3,background:'white'}}).composite(thumbs).jpeg().toBuffer());
}finally{global.fetch=original;}
console.log('PASS sector, size, negative/nearby context, floor/frontage/corner, 240 mixed listings with 50 intervening globally/per-type, deterministic photos+fallback renders without API.');
