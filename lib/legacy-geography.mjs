import directory from '../public/hanoi-legacy-wards.json' with {type:'json'};
// Streets with owner-confirmed legacy geography. Do not learn from listing areas:
// a misclassified listing must never become a geographic reference for others.
export const verifiedStreets=[
 {name:'Sa Đôi',area:'Nam Từ Liêm',ward:'Phường Đại Mỗ',source:'Chủ website xác nhận Sa Đôi / Đại Linh thuộc Đại Mỗ, Nam Từ Liêm'},
 {name:'Đại Linh',area:'Nam Từ Liêm',ward:'Phường Đại Mỗ',source:'Chủ website xác nhận Sa Đôi / Đại Linh thuộc Đại Mỗ, Nam Từ Liêm'},
 {name:'Triều Khúc',area:'Thanh Trì',ward:'',source:'Đính chính của chủ website trong luồng nhập nguồn'},
 {name:'Phạm Huy Thông',area:'Ba Đình',ward:'',source:'Đính chính của chủ website trong luồng nhập nguồn'}
];
const fold=v=>String(v||'').normalize('NFKC').normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const has=(text,name)=>String(text||'').split(/[,;|\n–—]/).some(part=>(' '+fold(part)+' ').includes(' '+fold(name)+' '));
const bare=v=>fold(v).replace(/^(?:phuong|xa|thi tran|quan|huyen|thi xa)\s+/,'');
const wards=Object.entries(directory.districts).flatMap(([area,names])=>names.map(name=>({area,name,key:bare(name)})));
const districts=Object.keys(directory.districts);
function locationLines(source){
 let internal=false;const out=[];
 for(const raw of String(source||'').split(/\r?\n/)){
  const line=raw.replace(/#[\p{L}\p{N}_]+|https?:\/\/\S+/gu,'').trim(),f=fold(line);
  if(/^(?:noi dung|thong tin|phan) cong khai\b/.test(f)){internal=false;continue;}
  if(/^(?:(?:ghi chu|thong tin|phan|muc) (?:kin|noi bo|rieng tu)|nguon(?: cua| tu)?\b|sdt nguon\b)/.test(f)){internal=true;continue;}
  if(internal||/^(?:lien he|hotline|sdt|dien thoai|moi gioi|chu nha\s*:|doi tac\s*:)/.test(f)||!f)continue;
  // Proximity is not the property's administrative address.
  let cut=line.length;
  for(const m of line.matchAll(/(?:[,;–—]\s*)?(?:gần|gan|cạnh|canh|sát|đối diện|doi dien|cách|phía sau|phia sau|xung quanh|lân cận)\s+/giu)){
   const before=fold(line.slice(0,m.index)),tail=fold(line.slice(m.index));
   if(/(?:phuong|xa|thi tran|duong|pho)\s*$/.test(before)||wards.some(w=>tail===w.key||tail.startsWith(w.key+' ')))continue;
   cut=m.index;break;
  }
  const primary=line.slice(0,cut).trim();
  if(!primary)continue;
  const key=fold(primary),address=/^(?:dia chi|vi tri|ten duong|duong|pho|khu vuc|quan|huyen|phuong|xa|thi tran|p |x |tt )\b/.test(key)||/^(?:so )?\d+[a-z]?(?:\s|$)/.test(key)||out.length===0||verifiedStreets.some(s=>has(primary,s.name))||wards.some(w=>fold(primary)===w.key);
  if(address||/\b(?:phuong|xa|thi tran|quan|huyen)\s+/.test(key))out.push({text:primary,address,first:out.length===0});
 }
 return out;
}
export function resolveLegacyLocation(source){
 const lines=locationLines(source),text=lines.map(l=>l.text).join('\n');
 const namedDistricts=[...new Set(lines.flatMap(l=>districts.filter(d=>String(l.text).split(/[,;|–—]/).some(part=>{
  if(!has(part,d))return false;const t=' '+fold(part)+' ',name=fold(d);let from=0;
  for(;;){const i=t.indexOf(' '+name+' ',from);if(i<0)return false;from=i+name.length+1;
   if(/(?:duong|pho|phuong|xa|thi tran|\bp|\bx|\btt)\s*$/.test(t.slice(0,i)))continue;
   const insideWard=wards.some(w=>w.key.length>name.length&&has(w.key,d)&&has(part,w.key)&&(()=>{const j=t.indexOf(' '+w.key+' ');return j<=i&&i<j+w.key.length+1;})());
   if(!insideWard)return true;
  }
 }))))];
 const streetScore=s=>Math.min(...lines.filter(l=>has(l.text,s.name)).map((l,i)=>(/^(?:dia chi|vi tri|ten duong)\b/.test(fold(l.text))?0:l.first?10000:20000)+i*100+fold(l.text).indexOf(fold(s.name))));
 const streets=verifiedStreets.filter(s=>has(text,s.name)).sort((a,b)=>streetScore(a)-streetScore(b));
 const wardHits=wards.filter(w=>lines.some(l=>{
  if(!has(l.text,w.key))return false;
  const t=fold(l.text),at=(' '+t+' ').indexOf(' '+w.key+' '),before=(' '+t+' ').slice(0,at);
  if(/(?:tinh|duong|pho)\s*$/.test(before))return false;
  const label=before.match(/(?:^|\s)(phuong|xa|thi tran|p|x|tt)\s*$/)?.[1],kind={p:'phuong',x:'xa',tt:'thi tran'}[label]||label;
  if(kind&&!fold(w.name).startsWith(kind+' '))return false;
  if(!label&&districts.some(d=>fold(d)===w.key))return false;
  // Unlabelled names can be streets or people (Nguyễn Du, Láng Hạ, ...).
  // Only an owner-confirmed administrative alias may bypass the ward label.
  if(!label&&!verifiedStreets.some(s=>s.ward&&bare(s.ward)===w.key))return false;
  return l.address||/(?:phuong|xa|thi tran|\bp|\bx|\btt)\s*$/.test(before);
 }));
 const matchedWards=wardHits.filter(w=>{let remaining=' '+fold(text)+' ';for(const other of wardHits)if(other.key.length>w.key.length&&has(other.key,w.key))remaining=remaining.replaceAll(' '+other.key+' ',' ');return has(remaining,w.key);});
 let candidates=lines.length?namedDistricts.slice():[],status='unknown',basis='unresolved',area='Hà Nội',ward='',street='',warnings=[];
 const inferredAreas=[...new Set([...streets.map(s=>s.area),...matchedWards.map(w=>w.area)])];
 // Multiple identical ward names are disambiguated only by explicit geography.
 if(namedDistricts.length===1){
  const selected=namedDistricts[0],streetConflict=streets.some(s=>s.area!==selected),wardConflict=matchedWards.length&&!matchedWards.some(w=>w.area===selected);
  if(streetConflict||wardConflict){status='conflict';warnings.push('Tên đường/phường và quận/huyện trong địa chỉ mâu thuẫn; cần xác nhận.');}
  else {area=selected;status='resolved';basis='explicit-district';}
 }else if(namedDistricts.length>1){status='ambiguous';warnings.push('Địa chỉ nhắc nhiều quận/huyện; chưa tự chọn một khu vực.');}
 else {
  const streetAreas=[...new Set(streets.map(s=>s.area))],wardAreas=[...new Set(matchedWards.map(w=>w.area))];
  candidates=streetAreas.length?streetAreas.filter(a=>!wardAreas.length||wardAreas.includes(a)):wardAreas;
  if(candidates.length===1){area=candidates[0];status='resolved';basis=streets.length?'verified-street':'legacy-ward-directory';}
  else if(streetAreas.length&&wardAreas.length&&!candidates.length){status='conflict';warnings.push('Tên đường và phường/xã không khớp dữ liệu địa giới cũ.');}
  else if(candidates.length>1){status='ambiguous';warnings.push('Tên phường/xã bị trùng ở nhiều quận/huyện; cần bổ sung địa chỉ.');}
 }
 if(status==='resolved'){
  const correctStreets=streets.filter(s=>s.area===area);street=correctStreets[0]?.name||'';
  const names=[...new Set([...correctStreets.map(s=>s.ward).filter(Boolean),...matchedWards.filter(w=>w.area===area).map(w=>w.name)])];
  if(names.length===1)ward=names[0];
  else if(names.length>1)warnings.push('Có nhiều phường/xã trong địa chỉ; giữ quận/huyện và chờ xác nhận phường/xã.');
 }
 const hasAddress=lines.some(l=>l.address&&(streets.length||matchedWards.length||namedDistricts.length||/^(?:dia chi|vi tri|ten duong|duong|pho|khu vuc|quan|huyen|phuong|xa)\b/.test(fold(l.text))));
 if(status==='unknown'&&hasAddress)warnings.push('Chưa đủ dữ liệu xác minh quận/huyện theo địa giới cũ; giữ nguyên địa danh để kiểm tra.');
 return {area,ward,street,status,basis,candidates:[...new Set([...candidates,...inferredAreas])],warnings,reference:directory.sourceCommit,hasAddress};
}
