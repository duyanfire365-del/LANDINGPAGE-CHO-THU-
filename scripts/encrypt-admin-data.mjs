// Usage: ADMIN_SECRET=... node scripts/encrypt-admin-data.mjs /outside/repo/private.json
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,createCipheriv,randomBytes} from 'node:crypto';
const secret=process.env.ADMIN_SECRET;
if(!secret||secret.length<32)throw Error('ADMIN_SECRET must contain at least 32 characters');
const records=JSON.parse(await readFile(process.argv[2],'utf8'));
const iv=randomBytes(12),key=createHash('sha256').update('rental-admin-data:'+secret).digest();
const cipher=createCipheriv('aes-256-gcm',key,iv);
const data=Buffer.concat([cipher.update(JSON.stringify(records),'utf8'),cipher.final()]);
await writeFile(new URL('../lib/admin-listings.enc.json',import.meta.url),JSON.stringify({version:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')}));
console.log('Encrypted private listing data. No plaintext written to the repository.');
