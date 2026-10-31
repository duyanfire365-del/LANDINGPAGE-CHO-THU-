import {illustrationCandidates,illustrationAssetSetting} from './stock-illustrations.mjs';
import {withCategoryBanner,categoryBanner} from './listing-banner.mjs';
export const IMAGE_REUSE_GAP=20;
export const usesLibrary=p=>!p.media?.some(m=>m.kind==='image')&&(!p.image||p.illustrationKind==='banner'||/^\/(?:banners|illustrations)\//.test(p.image)||p.image==='/banner.png'||p.image.startsWith('/api/files?action=illustration&'));
export function allocateIllustrations(rows,{hot={},contexts={}}={}){
 const ordered=rows.filter(r=>r.status==='published').sort((a,b)=>Number(hot[b.public_data.slug]===true)-Number(hot[a.public_data.slug]===true)||String(b.reviewed_at||b.created_at||'').localeCompare(String(a.reviewed_at||a.created_at||''))||Number(b.public_data.listingSequence||0)-Number(a.public_data.listingSequence||0)||a.public_data.slug.localeCompare(b.public_data.slug));
 const reserved=new Set(ordered.map(r=>r.public_data.illustrationAssetId).filter(Boolean)),globalLast=new Map(),typeLast=new Map(),usage=new Map(),positions=new Map(),assigned=new Map(),identity=a=>a.visualFamily||a.distinctOriginal||a.id;
 for(const [index,row]of ordered.entries()){
  const p=row.public_data,type=p.type,pos=positions.get(type)||0;positions.set(type,pos+1);if(!usesLibrary(p))continue;
  const all=illustrationCandidates({...p,noFood:/không.*hàng ăn|không.*ăn uống/iu.test(p.description||'')}),wantTall=Number(p.floors)>=4&&['Nhà nguyên căn','Mặt bằng kinh doanh','Văn phòng'].includes(type),tall=wantTall?all.filter(a=>a.depictedFloors>=4):[],pool=wantTall?tall:all,history=typeLast.get(type)||new Map();typeLast.set(type,history);
  let eligible=pool.filter(a=>index-(globalLast.get(identity(a))??-Infinity)>IMAGE_REUSE_GAP&&pos-(history.get(identity(a))??-Infinity)>IMAGE_REUSE_GAP),relaxed=false;
  // A small exact-context pool rotates least-recently-used originals; never keep an untracked duplicate.
  if(!eligible.length){relaxed=true;eligible=pool.filter(a=>index-(globalLast.get(identity(a))??-Infinity)>1&&pos-(history.get(identity(a))??-Infinity)>1);}
  if(!eligible.length){assigned.set(row.id||p.slug,{...p,image:categoryBanner(type),shareImage:categoryBanner(type),isIllustration:true,illustrationKind:'banner',illustrationAssetId:null,illustrationOriginalId:null,illustrationAllocationWarning:'Chưa đủ ảnh đúng bối cảnh để tránh lặp liền nhau; dùng banner danh mục.'});continue;}
  const context=contexts[row.id]||'unknown',penalty=a=>(Number(p.floors)>0&&Number(p.floors)<4&&a.depictedFloors>=4?4:0)+(context==='street'?(illustrationAssetSetting(a)==='street'?2-Math.min(2,a.streetActivity||0):6):['alley','interior'].includes(context)?(illustrationAssetSetting(a)==='interior'?0:3):0);
  eligible.sort((a,b)=>(relaxed?(globalLast.get(identity(a))??-Infinity)-(globalLast.get(identity(b))??-Infinity):0)||penalty(a)-penalty(b)||Number(b.id===p.illustrationAssetId)-Number(a.id===p.illustrationAssetId)||Number(reserved.has(a.id))-Number(reserved.has(b.id))||(usage.get(identity(a))||0)-(usage.get(identity(b))||0)||Number(!!b.distinctOriginal)-Number(!!a.distinctOriginal)||Number(!!p.illustrationScene&&b.scene===p.illustrationScene)-Number(!!p.illustrationScene&&a.scene===p.illustrationScene)||a.id.localeCompare(b.id));
  const asset=eligible[0],key=identity(asset);globalLast.set(key,index);history.set(key,pos);usage.set(key,(usage.get(key)||0)+1);
  assigned.set(row.id||p.slug,withCategoryBanner({...p,illustrationAssetId:asset.id,illustrationOriginalId:key,illustrationAllocationVersion:'context-rotation-v2',illustrationAllocationWarning:relaxed?'Kho ảnh đúng bối cảnh chưa đủ giãn cách 20 tin; đã luân phiên ảnh ít dùng gần đây, không lặp liền nhau.':null}));
 }return rows.map(r=>assigned.has(r.id||r.public_data.slug)?{...r,public_data:assigned.get(r.id||r.public_data.slug)}:r);
}
