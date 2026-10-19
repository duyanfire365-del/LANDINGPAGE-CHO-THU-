export const categoryPrefixes={'Mặt bằng kinh doanh':'MB','Văn phòng':'VP','Kho xưởng':'KX','Nhà nguyên căn':'NC','Căn hộ dịch vụ':'CHDV','Căn hộ chung cư':'CHCC','Phòng trọ':'PT','Biệt thự, nhà liền kề':'BT','Ki-ốt':'KO','Đất cho thuê':'DT','Bất động sản khác':'BDS'};
export const prefixFor=type=>categoryPrefixes[type]||'BDS';
export const codeFor=(type,sequence)=>prefixFor(type)+' - '+String(sequence).padStart(4,'0');
export function standardTitle(post,address=post.address){
 const size=Number(post.size)>0?String(post.size).replace('.',',')+' m²':post.areaText||'';
 const location=String(address||'').replace(/,?\s*Hà Nội\s*$/iu,'').replace(/Hà Nội\s*—\s*/iu,'').trim();
 const where=location&&!/liên hệ để biết vị trí/iu.test(location)?' — '+location:' — liên hệ để biết vị trí';
 return (post.transferPrice?'Sang nhượng ':'Cho thuê ')+String(post.type||'BĐS').toLocaleLowerCase('vi')+(size?' '+size:'')+where;
}
export function standardizeListing(post,sequence){
 const code=codeFor(post.type,sequence),title=standardTitle(post),legacyCodes=[...new Set([...(post.legacyCodes||[]),...(post.code&&post.code!==code?[post.code]:[])])];
 const lines=String(post.shareText||(post.title+'\n'+(post.description||'')+'\nHotline/Zalo: 0906215365')).split('\n').filter(line=>!/^Mã tin:/u.test(line));lines[0]=title;lines.splice(1,0,'Mã tin: '+code);const shareText=lines.join('\n').trimEnd();
 return {...post,code,title,legacyCodes,listingSequence:sequence,shareText};
}
export function standardizeRows(rows,staticListings=[]){
 const counters={},used=new Map();
 const reserve=(prefix,sequence)=>{if(!used.has(prefix))used.set(prefix,new Set());used.get(prefix).add(sequence);counters[prefix]=Math.max(counters[prefix]||0,sequence)};
 for(const p of staticListings){const n=Number(p.listingSequence);if(Number.isSafeInteger(n)&&n>0)reserve(prefixFor(p.type),n)}
 const ordered=[...rows].sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||''))||String(a.id).localeCompare(String(b.id)));
 const assigned=new Map();
 // Keep previously persisted codes, including gaps left by withdrawn listings.
 for(const row of ordered){const p=row.public_data,prefix=prefixFor(p.type),n=Number(p.listingSequence);if(Number.isSafeInteger(n)&&n>0&&p.code===codeFor(p.type,n)&&!used.get(prefix)?.has(n)){reserve(prefix,n);assigned.set(row.id,n)}}
 for(const row of ordered)if(!assigned.has(row.id)){const prefix=prefixFor(row.public_data.type),n=(counters[prefix]||0)+1;reserve(prefix,n);assigned.set(row.id,n)}
 return rows.map(row=>({...row,public_data:standardizeListing(row.public_data,assigned.get(row.id))}));
}
