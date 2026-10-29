import {illustrationCandidates} from './stock-illustrations.mjs';
import {withCategoryBanner} from './listing-banner.mjs';
export const IMAGE_REUSE_GAP=20;
export const usesLibrary=p=>!p.media?.some(m=>m.kind==='image')&&(!p.image||p.illustrationKind==='banner'||/^\/(?:banners|illustrations)\//.test(p.image)||p.image==='/banner.png'||p.image.startsWith('/api/files?action=illustration&'));
export function allocateIllustrations(rows,{hot={}}={}){
 const ordered=rows.filter(r=>r.status==='published').sort((a,b)=>Number(hot[b.public_data.slug]===true)-Number(hot[a.public_data.slug]===true)||String(b.reviewed_at||b.created_at||'').localeCompare(String(a.reviewed_at||a.created_at||''))||Number(b.public_data.listingSequence||0)-Number(a.public_data.listingSequence||0)||a.public_data.slug.localeCompare(b.public_data.slug));
 const reserved=new Set(ordered.map(r=>r.public_data.illustrationAssetId).filter(Boolean)),globalLast=new Map(),typeLast=new Map(),usage=new Map(),positions=new Map(),assigned=new Map();
 for(const [index,row]of ordered.entries()){
  const p=row.public_data,type=p.type,pos=positions.get(type)||0;positions.set(type,pos+1);if(!usesLibrary(p))continue;
  const pool=illustrationCandidates({...p,noFood:/không.*hàng ăn|không.*ăn uống/iu.test(p.description||'')}),history=typeLast.get(type)||new Map();typeLast.set(type,history);
  const eligible=pool.filter(a=>index-(globalLast.get(a.distinctOriginal||a.id)??-Infinity)>20&&pos-(history.get(a.distinctOriginal||a.id)??-Infinity)>20);
  if(!eligible.length){assigned.set(row.id||p.slug,{...p,illustrationAllocationWarning:'Kho ảnh đúng loại chưa đủ khoảng cách 20 bài.'});continue;}
  eligible.sort((a,b)=>Number(b.id===p.illustrationAssetId)-Number(a.id===p.illustrationAssetId)||Number(reserved.has(a.id))-Number(reserved.has(b.id))||(usage.get(a.id)||0)-(usage.get(b.id)||0)||Number(!!b.distinctOriginal)-Number(!!a.distinctOriginal)||Number(!!p.illustrationScene&&b.scene===p.illustrationScene)-Number(!!p.illustrationScene&&a.scene===p.illustrationScene)||a.id.localeCompare(b.id));
  const asset=eligible[0],key=asset.distinctOriginal||asset.id;globalLast.set(key,index);history.set(key,pos);usage.set(asset.id,(usage.get(asset.id)||0)+1);
  assigned.set(row.id||p.slug,withCategoryBanner({...p,illustrationAssetId:asset.id,illustrationOriginalId:key,illustrationAllocationVersion:'spacing20-v1'}));
 }return rows.map(r=>assigned.has(r.id||r.public_data.slug)?{...r,public_data:assigned.get(r.id||r.public_data.slug)}:r);
}
