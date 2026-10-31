import {enrichShorthandListing} from './listing-shorthand.mjs';
import {refreshLegacyDescription} from './listing-description.mjs';
import {propertyPhotoContext} from './illustration-context.mjs';
import {staticPhotoContexts} from './static-illustration-context.mjs';
import {allocateIllustrations} from './illustration-allocation.mjs';
import {inventoryData} from './inventory.mjs';
import {readFile} from 'node:fs/promises';
import {db,configured} from './platform.mjs';
import {standardizeRows} from './listing-identity.mjs';
export const staticCatalogRows=base=>base.map((p,i)=>({id:'static:'+p.slug,status:'published',created_at:'0000-'+String(100000-i).padStart(6,'0'),public_data:refreshLegacyDescription(p)}));
export async function canonicalRows({withOriginal=false,includeStatic=false}={}){
 if(!configured())return [];
 const rows=[];for(let offset=0;;offset+=500){const page=await db('posts',{query:'?select=id,status,created_at,reviewed_at,public_data,private_data&order=created_at.asc,id.asc&limit=500&offset='+offset});rows.push(...page);if(page.length<500)break;}
 const original=JSON.parse(await readFile(new URL('../public/listings.json',import.meta.url),'utf8'));
 const standardized=standardizeRows(rows.map(r=>({...r,public_data:{...refreshLegacyDescription(enrichShorthandListing(r.public_data,r.private_data),r.private_data),...(['pending','approved'].includes(r.private_data?.deletion?.state)?{codeReleased:true}:{})}})),original).map(({private_data,...r})=>r);
 const inventory=await inventoryData([...original,...standardized.filter(r=>r.status==='published').map(r=>r.public_data)]);
 const contexts={...staticPhotoContexts,...Object.fromEntries(rows.map(r=>[r.id,propertyPhotoContext(r.private_data||{},r.public_data)]))};
 const combined=allocateIllustrations([...standardized,...staticCatalogRows(original)],{hot:inventory.hot,contexts});const result=includeStatic?combined:combined.slice(0,rows.length);
 return withOriginal?result.map((row,i)=>({...row,originalPublicData:rows[i]?.public_data})):result;
}
export async function canonicalizeSubset(rows){const all=await canonicalRows(),index=new Map(all.map(p=>[p.id,p.public_data]));return rows.map(row=>({...row,public_data:index.get(row.id)||row.public_data}))}
export async function persistIdentities(){const rows=await canonicalRows({withOriginal:true});let count=0;for(const row of rows){if(JSON.stringify(row.public_data)===JSON.stringify(row.originalPublicData))continue;const saved=await db('posts',{method:'PATCH',query:'?id=eq.'+row.id+'&public_data->>contentRevision='+(row.originalPublicData.contentRevision?'eq.'+encodeURIComponent(row.originalPublicData.contentRevision):'is.null'),body:{public_data:row.public_data}});count+=saved.length;}return count}
