// Only reviewed public fields are used; never load private data into browser assets.
import {readFile,writeFile} from 'node:fs/promises';
import {refreshLegacyDescription} from '../lib/listing-description.mjs';
const file=new URL('../public/listings.json',import.meta.url),rows=JSON.parse(await readFile(file,'utf8'));
let changed=0;const next=rows.map(p=>{const updated=refreshLegacyDescription(p);if(updated!==p)changed++;return updated});
await writeFile(file,JSON.stringify(next,null,2)+'\n');console.log('Updated legacy descriptions:',changed);
