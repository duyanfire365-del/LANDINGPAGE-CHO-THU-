import {readFile,writeFile,access} from 'node:fs/promises';
import {randomBytes,scryptSync,createHash,createCipheriv} from 'node:crypto';
const root=new URL('../',import.meta.url);
try{await access(new URL('.env',root));throw Error('Đã có .env. Không ghi đè khóa hiện có.')}catch(e){if(e.code!=='ENOENT')throw e}
const secret=randomBytes(48).toString('base64url'),password=randomBytes(18).toString('base64url'),salt=randomBytes(24).toString('hex');
const rows=JSON.parse(await readFile(new URL('public/listings.json',root),'utf8'));
// Generate the IV separately so it can accompany the authenticated ciphertext.
const iv=randomBytes(12),enc=createCipheriv('aes-256-gcm',createHash('sha256').update('rental-admin-data:'+secret).digest(),iv);
const data=Buffer.concat([enc.update(JSON.stringify(rows),'utf8'),enc.final()]);
await writeFile(new URL('lib/admin-password.json',root),JSON.stringify({salt,hash:scryptSync(password,salt,64).toString('hex')}));
await writeFile(new URL('lib/admin-listings.enc.json',root),JSON.stringify({version:1,iv:iv.toString('base64'),tag:enc.getAuthTag().toString('base64'),data:data.toString('base64')}));
const example=await readFile(new URL('.env.example',root),'utf8');
await writeFile(new URL('.env',root),example.replace(/^ADMIN_SECRET=.*$/m,'ADMIN_SECRET='+secret),{mode:0o600});
await writeFile(new URL('.credentials-local.txt',root),'Mật khẩu quản trị của riêng bản cài này: '+password+'\nKhông chia sẻ tệp này, .env hoặc bản lib/admin-password.json đã khởi tạo.\n',{mode:0o600});
console.log('Đã tạo khóa mới và dữ liệu quản trị mẫu. Mật khẩu ở .credentials-local.txt. Chạy npm start, mở http://localhost:3000/admin.');
