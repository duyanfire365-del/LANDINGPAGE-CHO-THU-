import {extractByRules} from './source-rules.mjs';
import {foldVietnamese} from './source-pricing.mjs';
export const normalizedSource=s=>foldVietnamese(String(s||'')).replace(/#[\p{L}\p{N}_]+/gu,'').replace(/^(?:bo sung|sua tin|sua lai tin|them thong tin)\s*/,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
// A street, phone or similar rent alone never identifies a property/unit.
export function automaticSourceTarget(text,rows){
 const clean=normalizedSource(text);if(clean.length<25)return {};
 let item;try{item=extractByRules(text,{allowIncomplete:true,allowUncertain:true})}catch{}
 const matches=rows.filter(r=>{const p=r.public_data||{},q=r.private_data||{};if(r.status!=='published'||p.codeReleased||q.deletion)return false;
 const originals=[q.sourceText,q.originalText,...(q.supplements||[]).map(x=>x.text)].filter(Boolean);
 if(originals.some(s=>normalizedSource(s)===clean))return true;
 const address=normalizedSource(item?.privateAddress),oldAddress=normalizedSource(q.address);
 if(!address||!/[0-9]/.test(address)||address!==oldAddress||!item.size||Number(item.size)!==Number(p.size)||item.type!==p.type)return false;
 if(item.floors!=null&&p.floors!=null&&Number(item.floors)!==Number(p.floors))return false;
 // Require most descriptive words to agree as well as the exact address/unit facts.
 const words=new Set(clean.split(' ').filter(w=>w.length>2&&!/^\d/.test(w)));return originals.some(s=>{const old=new Set(normalizedSource(s).split(' ').filter(w=>w.length>2&&!/^\d/.test(w)));const overlap=[...words].filter(w=>old.has(w)).length;return Math.min(words.size,old.size)>=6&&overlap/Math.min(words.size,old.size)>=0.8;});
 });return matches.length===1?{reference:{slug:matches[0].public_data.slug}}:matches.length>1?{ambiguous:true}:{};
}
