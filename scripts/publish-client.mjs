// Run after the owner has authorized this upload. Never print or persist the key.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const key=process.env.PUBLISHING_AUTOMATION_KEY;
if(!key||key.length<32)throw Error('Cần cấp PUBLISHING_AUTOMATION_KEY qua môi trường thực thi, không ghi vào mã hoặc chat.');
const file=process.argv[2];if(!file)throw Error('Usage: node scripts/publish-client.mjs /private/path/manifest.json');
const manifest=JSON.parse(await readFile(file,'utf8'));if(!Array.isArray(manifest.items)||manifest.items.length>100)throw Error('Manifest cần items gồm tối đa 100 tin.');
const delay=ms=>new Promise(done=>setTimeout(done,ms));
async function call(body){
 let error;
 for(let attempt=0;attempt<3;attempt++){
  try{const response=await fetch('https://nguonchothue.vn/api/publishing',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify(body),signal:AbortSignal.timeout(70000)});const result=await response.json();if(response.ok)return result;error=Object.assign(Error(result.error||'Yêu cầu chưa hoàn tất'),{status:response.status});if(response.status!==429&&response.status<500)throw error;}catch(e){error=e;if(e.status&&e.status!==429&&e.status<500)throw e;}
  if(attempt<2)await delay(1000*2**attempt);
 }
 throw error;
}
const health=await call({action:'health'});if(!health.storageReady)throw Error('Kho nguồn chưa sẵn sàng; chưa đăng tin.');
const results=[];
for(const entry of manifest.items){
 const requestId=entry.requestId||createHash('sha256').update(JSON.stringify({text:entry.text,fields:entry.fields||null,image:entry.image||null})).digest('hex');
 try{
  let assetIds=entry.assetIds||[];
  if(entry.image){const bytes=await sharp(await readFile(resolve(dirname(file),entry.image)),{limitInputPixels:40000000}).rotate().resize({width:1536,height:1536,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:88}).toBuffer();if(bytes.length>1000000)throw Error('Ảnh sau nén vượt 1 MB; giảm kích thước hoặc chất lượng trước khi nhập.');const upload=await call({action:'upload-image',illustration:entry.illustration===true,base64:bytes.toString('base64')});assetIds=[...new Set([...assetIds,upload.asset.id])];}
  let result=await call({action:'publish',requestId,text:entry.text,fields:entry.fields,assetIds});
  for(let poll=0;result.status==='importing'&&poll<12;poll++){await delay(5000);result=await call({action:'status',requestId});}
  if(result.notificationPending)result=await call({action:'retry-notification',requestId});
  results.push(result);console.log(JSON.stringify({requestId,status:result.status,href:result.href,telegramSent:result.telegramSent,notificationPending:result.notificationPending}));
 }catch(error){results.push({requestId,status:'error',error:error.message});console.log(JSON.stringify({requestId,status:'error',error:error.message}));}
 await writeFile(resolve(dirname(file),'publishing-results.json'),JSON.stringify(results,null,2),{mode:0o600});
}
if(results.some(row=>row.status==='error'||row.status==='importing'||row.notificationPending))process.exitCode=1;
