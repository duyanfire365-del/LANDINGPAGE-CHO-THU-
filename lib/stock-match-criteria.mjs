import {db,problem} from './platform.mjs';
import {digest} from './unified-match-rules.mjs';
export const stockSignature=p=>digest([p.slug,p.area,p.type,p.categories,p.price,p.size,p.frontage,p.description,p.isTransfer,p.features,p.contentRevision]);
export async function matchRows(table,query=''){const rows=[];for(let offset=0;offset<10000;offset+=500){const page=await db(table,{query:'?'+query+(query?'&':'')+'order=created_at.asc,id.asc&limit=500&offset='+offset});rows.push(...page);if(page.length<500)return rows}throw problem(413,'Kho '+table+' vượt giới hạn đối chiếu; cần phân trang thêm.')}
export function enrichMatchingStock(stock,posts,profiles,{privateTransfer=true}={}){
 const privateBySlug=new Map(posts.filter(r=>r.status==='published').map(r=>[r.public_data?.slug,r.private_data||{}]));
 const savedBySlug=new Map(profiles.map(r=>{const data=JSON.parse(r.record_id);return [data.slug,{...data.criteria,revision:r.created_at,sourceSignature:data.sourceSignature}]}));
 return stock.map(p=>{const priv=privateBySlug.get(p.slug)||{},saved=savedBySlug.get(p.slug),m=saved?{...saved,stale:saved.sourceSignature!==stockSignature(p)}:priv.matchingCriteria||{};return {...p,status:'published',matchingCriteria:m,matchingCriteriaStale:m.stale===true,transferPrice:privateTransfer&&typeof priv.privateTransferPrice==='number'?priv.privateTransferPrice:p.transferPrice,...(!m.stale&&Array.isArray(m.allowedIndustries)?{allowedIndustries:m.allowedIndustries}:{}),...(!m.stale&&Array.isArray(m.deniedIndustries)?{deniedIndustries:m.deniedIndustries}:{}),...(!m.stale&&Array.isArray(m.features)?{features:m.features}:{})}});
}
