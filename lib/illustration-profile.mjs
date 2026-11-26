// Selection uses public copy only. Artwork is illustrative, never evidence of actual premises.
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
const rules={cafe:/\b(?:ca phe|cafe|coffee)\b/,restaurant:/\b(?:hang an|quan an|bun cha|bun pho|nha hang|an uong|am thuc)\b/,spa:/\b(?:spa|massage|cham soc sac dep)\b/,nail:/\b(?:nail|mong|manicure)\b/,hair:/\b(?:toc|salon|hair)\b/,lashes:/\b(?:noi mi|mi mong|eyelash)\b/,office:/\b(?:van phong|workspace)\b/,warehouse:/\b(?:kho xuong|nha xuong|kho hang|warehouse)\b/};
export function illustrationProfile(p){
 if(p.visualProfile)return p.visualProfile;
 const raw=fold([p.title,p.description,...(p.facts||[])].join('\n')).replace(/#[^\s]+/g,'');
 const text=raw.replace(/\b(?:khong|cam|khong nhan|khong phu hop)\b[^\n,;.]*|\b(?:gan|doi dien|canh|cach)\b[^\n,;.]*/g,' ');
 const headline=text.split('\n')[0],specific=Object.keys(rules).filter(k=>rules[k].test(headline));
 let sectors=specific.length?specific:Object.keys(rules).filter(k=>rules[k].test(text));
 if(p.type==='Kho xưởng')sectors=['warehouse'];else if(p.type==='Văn phòng')sectors=['office'];
 // Keep specialist uses out of apartment, land and hotel illustrations.
 if(!['Mặt bằng kinh doanh','Nhà nguyên căn','Văn phòng','Kho xưởng','Ki-ốt'].includes(p.type))sectors=[];
 const size=Number(p.size),floors=Number(p.floors),frontage=Number(p.frontage);
 return {sectors,size:size>0?size:null,scale:size>0?(size<75?'small':size<150?'medium':'large'):null,floors:floors>0?floors:null,frontage:frontage>0?frontage:null,corner:/\b(?:khong|chua)\s+(?:ro\s+)?lo goc\b/.test(raw)?null:/\b(?:lo goc|hai mat tien|2 mat tien)\b/.test(text)?true:/\b(?:lo thuong|mot mat tien|1 mat tien)\b/.test(text)?false:null,noFood:/\b(?:khong|cam|khong nhan)[^\n,;.]*\b(?:hang an|an uong|quan an)\b/.test(raw)};
}
export function matchesIllustrationProfile(asset,p){
 const v=illustrationProfile(p),interior=asset.setting==='interior';
 if(v.noFood&&['restaurant','cafe'].includes(asset.sector))return false;
 if(!v.sectors.length&&p.type==='Nhà nguyên căn'&&asset.sector&&asset.sector!=='office')return false;
 if(v.sectors.length&&(!asset.sector||!v.sectors.includes(asset.sector))&&!(v.sectors.includes('office')&&!interior&&!asset.sector))return false;
 if(v.scale&&asset.scale&&asset.scale!==v.scale)return false;
 if(!interior){
  if(v.floors&&(!asset.depictedFloors||asset.depictedFloors!==v.floors))return false;
  if(v.frontage&&(!asset.depictedFrontage||Math.abs(asset.depictedFrontage-v.frontage)>Math.max(1,v.frontage*.25)))return false;
  if(v.corner!==null&&asset.corner!==v.corner)return false;
 }
 return true;
}
