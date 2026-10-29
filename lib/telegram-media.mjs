import {linkedBot} from './linked-telegram-bots.mjs';
import {db,problem} from './platform.mjs';
export async function providedImage(media,sourceId,index){
 const token=media.bot?linkedBot(media.bot)?.token:process.env.TELEGRAM_SOURCE_BOT_TOKEN;if(!token)throw problem(503,'Bot gửi ảnh chưa được cấu hình.');
 if(media.kind!=='image')throw problem(422,'Chế độ dùng ảnh gửi kèm chỉ nhận ảnh JPEG/PNG/WebP.');
 const result=await fetch('https://api.telegram.org/bot'+token.trim()+'/getFile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_id:media.file_id}),signal:AbortSignal.timeout(10000)});
 const info=await result.json(),file=info.result;
 if(!result.ok||!info.ok||!file?.file_path||file.file_size>10*1024*1024||!/^[\w/.-]+$/.test(file.file_path)||file.file_path.includes('..'))throw problem(502,'Chưa lấy được ảnh Telegram, hoặc ảnh lớn hơn 10 MB.');
 const response=await fetch('https://api.telegram.org/file/bot'+token.trim()+'/'+file.file_path,{signal:AbortSignal.timeout(20000)});
 if(!response.ok||Number(response.headers.get('content-length'))>10*1024*1024)throw problem(502,'Chưa tải được ảnh Telegram.');
 const reader=response.body.getReader(),chunks=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>10*1024*1024){await reader.cancel();throw problem(413,'Ảnh vượt quá 10 MB.')}chunks.push(value)}
 const bytes=Buffer.concat(chunks.map(c=>Buffer.from(c)));
 let mime,ext;
 if(bytes[0]===255&&bytes[1]===216){mime='image/jpeg';ext='jpg'}
 else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){mime='image/png';ext='png'}
 else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'){mime='image/webp';ext='webp'}
 else throw problem(422,'Tệp gửi kèm không phải ảnh JPEG/PNG/WebP hợp lệ.');
 const path='telegram/'+sourceId+'-'+index+'.'+ext,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const upload=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/storage/v1/object/rental-private/'+path,{method:'POST',headers:{apikey:key,...(key.startsWith('sb_')?{}:{Authorization:'Bearer '+key}),'Content-Type':mime,'x-upsert':'true'},body:bytes,signal:AbortSignal.timeout(20000)});
 if(!upload.ok)throw problem(502,'Chưa lưu được ảnh Telegram vào kho website.');
 const assets=await db('assets',{method:'POST',query:'?on_conflict=path',body:{path,name:'anh-nguon-'+(index+1)+'.'+ext,mime,kind:'image',size:bytes.length,owner_id:null},headers:{Prefer:'resolution=merge-duplicates,return=representation'}});return assets[0];
}
