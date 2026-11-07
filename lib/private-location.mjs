// Address privacy is independent of who authored/edited the public copy.
const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const tower=()=>/(^|[^\p{L}\p{N}])((?:CT|HH|TT|LK|BT|NƠ|NO|N0|CC|CH)\s*\d+[A-Z]?(?:\s*[-./–—]\s*[A-Z]?\d+[A-Z]?)*)(?![\p{L}\p{N}])/giu;
const labeled=()=>/((?:\btòa|\btoà|\bblock|\bcăn(?:\s+hộ)?|\blô|\bô|\bki[- ]?ốt|\bshophouse)\s*(?:(?:số|mã)\s*)?[:：]?\s*)([A-Z]{1,4}\s*[-.]?\s*\d{1,5}[A-Z]?(?:[-./–—]\d{1,5}[A-Z]?)*|\d{1,5}(?:[-./]\d{1,5})?)(?![\p{L}\p{N}²])(?!\s*(?:m[²2]|mét|tầng|phòng|triệu|tỷ|tr|%)(?![\p{L}\p{N}]))/giu;
export function buildingIdentifiers(value){const found=new Set();for(const m of String(value||'').matchAll(tower()))found.add(m[2].trim());for(const m of String(value||'').matchAll(labeled()))if(/[A-Z]/iu.test(m[2]))found.add(m[2].trim());return [...found];}
export function hidePrivateLocation(value,privateAddress=''){
 let text=String(value||'');
 const numbered=String(privateAddress||'').match(/^(?:số(?: nhà)?\s*)?(\d+[a-z]?(?:\/\d+)*)\s+((?:(?:đường|phố)\s+)?[\p{L}]+(?:\s+[\p{L}]+)?)/iu);
 if(numbered){const number=escaped(numbered[1]),street=escaped(numbered[2]).replace(/\s+/g,'\\s+');text=text.replace(new RegExp('(^|[^\\p{L}\\p{N}])(?:số(?: nhà)?\\s*)?'+number+'(?=\\s+'+street+'(?:$|[^\\p{L}]))','giu'),'$1');}
 text=text.replace(/(?:số\s*(?:nhà|căn)?|nhà\s+số)\s*[:：]?\s*\d+[a-z]?(?:\s*\/\s*\d+)*[ \t]*/giu,'').replace(/(?:ngõ|ngách|hẻm|ngo|ngach|hem)\s*\d+[a-z]?(?:\s*\/\s*\d+)*[ \t]*/giu,'');
 for(const code of buildingIdentifiers(privateAddress)){const parts=code.split(/[\s\-./–—]+/).filter(Boolean),pattern=parts.map(escaped).join('[\\s\\-./–—]*');text=text.replace(new RegExp('(^|[^\\p{L}\\p{N}])'+pattern+'(?![\\p{L}\\p{N}])','giu'),'$1');}
 text=text.replace(tower(),'$1').replace(labeled(),'$1');
 return text.replace(/[ \t]{2,}/g,' ').replace(/[ \t]+([,.;:])/g,'$1').replace(/(?:\s*[,;]\s*){2,}/g,', ').replace(/^[ \t]+|[ \t]+$/gm,'').trim();
}
const fields=['title','address','street','ward','location','description','shareText','imageAlt','floorDescription'];
export function publicLocation(post,privateAddress=''){
 const out={...post};for(const key of fields)if(typeof out[key]==='string'){out[key]=hidePrivateLocation(out[key],privateAddress);if(['address','street','location'].includes(key))out[key]=out[key].replace(/^\d+[a-z]?(?:\s*\/\s*\d+)*\s+(?=[\p{L}])/iu,'');}
 for(const key of ['image','shareImage'])if(typeof out[key]==='string'){let decoded=out[key];try{decoded=decodeURIComponent(decoded)}catch{}if(buildingIdentifiers(decoded).length){out[key]='/banner.png';out.isIllustration=true;out.illustrationKind='banner';out.imageAlt='Ảnh minh họa BĐS';}}
 if(Array.isArray(out.media))out.media=out.media.map(m=>({...m,...(typeof m.name==='string'?{name:hidePrivateLocation(m.name,privateAddress)}:{})}));
 for(const key of ['facts','notes'])if(Array.isArray(out[key]))out[key]=out[key].map(v=>typeof v==='string'?hidePrivateLocation(v,privateAddress):v).filter(Boolean);
 return out;
}
export function protectLocation(record){
 const p=record.public_data;if(!p)return record;const q=record.private_data||(record.private_data={}),safe=publicLocation(p,q.address||'');
 const changed=[...fields,'image','shareImage'].filter(k=>p[k]!==safe[k]);if(changed.length){q.locationPrivacyBackup={...(q.locationPrivacyBackup||{})};for(const k of changed)if(q.locationPrivacyBackup[k]===undefined)q.locationPrivacyBackup[k]=p[k];}
 Object.assign(p,safe);return record;
}
