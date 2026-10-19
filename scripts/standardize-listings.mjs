// Run after exporting reviewed public source data, before build-listing-pages.py.
import {readFile,writeFile} from 'node:fs/promises';
import {standardizeListing,prefixFor} from '../lib/listing-identity.mjs';
const file=new URL('../public/listings.json',import.meta.url),rows=JSON.parse(await readFile(file,'utf8')),counters={};
const index=new Map([...rows].sort((a,b)=>a.id-b.id).map(row=>{const prefix=prefixFor(row.type),sequence=(counters[prefix]||0)+1;counters[prefix]=sequence;return [row.id,standardizeListing(row,sequence)]}));
await writeFile(file,JSON.stringify(rows.map(row=>index.get(row.id)),null,2)+'\n');
console.log('Standardized '+rows.length+' static listings: '+JSON.stringify(counters));
