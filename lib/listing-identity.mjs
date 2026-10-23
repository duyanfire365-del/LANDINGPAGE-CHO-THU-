import {inferCategory,houseBusinessCategories,formatDescription} from './listing-content.mjs';
export const categoryPrefixes={'Mặt bằng kinh doanh':'MB','Văn phòng':'VP','Kho xưởng':'KX','Nhà nguyên căn':'NC','Căn hộ dịch vụ':'CHDV','Căn hộ chung cư':'CHCC','Phòng trọ':'PT','Biệt thự, nhà liền kề':'BT','Ki-ốt':'KO','Đất cho thuê':'DT','Bất động sản khác':'BDS'};
export const prefixFor=type=>categoryPrefixes[type]||'BDS';
export const codeFor=(type,sequence)=>prefixFor(type)+' - '+String(sequence).padStart(4,'0');
export function standardTitle(post,address=post.address){
 const size=Number(post.size)>0?String(post.size).replace('.',',')+' m²':post.areaText||'';
 const location=String(address||'').replace(/,?\s*Hà Nội\s*$/iu,'').replace(/Hà Nội\s*—\s*/iu,'').trim();
 const where=location&&!/liên hệ để biết vị trí/iu.test(location)?' — '+location:' — liên hệ để biết vị trí';
 return (post.transferPrice||post.isTransfer?'Sang nhượng ':'Cho thuê ')+String(post.type||'BĐS').toLocaleLowerCase('vi')+(size?' '+size:'')+(Number.isInteger(Number(post.floors))&&Number(post.floors)>0&&Number(post.floors)<=200?', '+Number(post.floors)+' tầng':'')+where;
}
export function standardizeListing(post,sequence){
 const code=codeFor(post.type,sequence),title=post.titleMode==='custom'&&String(post.title||'').trim()?post.title.trim():standardTitle(post),legacyCodes=[...new Set([...(post.legacyCodes||[]),...(post.code&&post.code!==code?[post.code]:[])])];
 const lines=formatDescription(post.shareText||(post.title+'\n'+(post.description||'')+'\nHotline/Zalo: 0906215365')).split('\n').filter(line=>!/^Mã tin:/u.test(line));lines[0]=title;lines.splice(1,0,'Mã tin: '+code);const shareText=lines.join('\n').trimEnd();
 return {...post,code,title,legacyCodes,listingSequence:sequence,shareText};
}
export function standardizeRows(rows,staticListings=[]){
 rows=rows.map(row=>{
  const p=row.public_data,text=[p.title,p.description].join(' ');
  const dual=p.categoryMode!=='manual'&&houseBusinessCategories(text);
  const inferred=dual?'Mặt bằng kinh doanh':p.type==='Bất động sản khác'&&p.categoryMode!=='manual'?inferCategory(text):null;
  const selected=dual|| (inferred?[inferred,...(p.categories||[]).filter(t=>t!==p.type&&t!==inferred)]:null);
  return {...row,public_data:{...p,description:formatDescription(p.description),...(inferred?{type:inferred,categories:[...new Set([...selected,...(dual?(p.categories||[]).filter(t=>t!=='Bất động sản khác'):[])])]}:{})}};
 });
 const counters={},used=new Map();
 const reserve=(prefix,sequence)=>{if(!used.has(prefix))used.set(prefix,new Set());used.get(prefix).add(sequence);counters[prefix]=Math.max(counters[prefix]||0,sequence)};
 const manual=rows.filter(r=>r.public_data.codeMode==='manual');
 for(const row of manual){const p=row.public_data,n=Number(p.listingSequence);if(n>0&&p.code===codeFor(p.type,n))reserve(prefixFor(p.type),n);}
 for(const row of rows)for(const old of row.public_data.legacyCodes||[]){const match=String(old).match(/^([A-Z]+)\s*-\s*(\d{1,6})$/);if(match&&Object.values(categoryPrefixes).includes(match[1]))reserve(match[1],Number(match[2]));}
 for(const p of staticListings){const n=Number(p.listingSequence);if(Number.isSafeInteger(n)&&n>0)reserve(prefixFor(p.type),n)}
 const ordered=[...rows].sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||''))||String(a.id).localeCompare(String(b.id)));
 const assigned=new Map(manual.filter(r=>r.public_data.code===codeFor(r.public_data.type,Number(r.public_data.listingSequence))).map(r=>[r.id,Number(r.public_data.listingSequence)]));
 // Keep previously persisted codes, including gaps left by withdrawn listings.
 for(const row of ordered){if(assigned.has(row.id))continue;const p=row.public_data,prefix=prefixFor(p.type),n=Number(p.listingSequence);if(Number.isSafeInteger(n)&&n>0&&p.code===codeFor(p.type,n)&&!used.get(prefix)?.has(n)){reserve(prefix,n);assigned.set(row.id,n)}}
 for(const row of ordered)if(!assigned.has(row.id)){const prefix=prefixFor(row.public_data.type),n=(counters[prefix]||0)+1;reserve(prefix,n);assigned.set(row.id,n)}
 return rows.map(row=>({...row,public_data:standardizeListing(row.public_data,assigned.get(row.id))}));
}
