import {readFile} from 'node:fs/promises';
import {db,configured} from './platform.mjs';
import {standardizeRows} from './listing-identity.mjs';
export async function canonicalRows(){
 if(!configured())return [];
 const rows=[];
 for(let offset=0;;offset+=500){const page=await db('posts',{query:'?select=id,status,created_at,public_data&order=created_at.asc,id.asc&limit=500&offset='+offset});rows.push(...page);if(page.length<500)break;}
 const original=JSON.parse(await readFile(new URL('../public/listings.json',import.meta.url),'utf8'));
 return standardizeRows(rows,original);
}
export async function canonicalizeSubset(rows){const all=await canonicalRows(),index=new Map(all.map(p=>[p.id,p.public_data]));return rows.map(row=>({...row,public_data:index.get(row.id)||row.public_data}))}
// An admin can persist the visible standardized identities without a schema migration.
export async function persistIdentities(){const rows=await canonicalRows();let count=0;for(const row of rows){await db('posts',{method:'PATCH',query:'?id=eq.'+row.id,body:{public_data:row.public_data}});count++;}return count}
