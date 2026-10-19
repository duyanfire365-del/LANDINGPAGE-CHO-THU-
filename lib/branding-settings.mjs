import sharp from 'sharp';
import {db,supa,configured,problem} from './platform.mjs';
import {zaloQR,qrPlacement} from './image-branding.mjs';
let cached;
export async function prepareQR(bytes){const image=sharp(bytes,{limitInputPixels:4000000}),meta=await image.metadata();if(!['jpeg','png','webp'].includes(meta.format)||meta.width<120||meta.height<120||meta.width/meta.height<.7||meta.width/meta.height>1.3)throw problem(400,'Chọn ảnh QR vuông hoặc gần vuông, tối thiểu 120 px.');return image.rotate().resize(500,500,{fit:'contain',background:'#fff'}).png().toBuffer()}
export async function rawAsset(item){const result=await supa('/storage/v1/object/sign/rental-private/'+item.path,{method:'POST',body:{expiresIn:120}});const path=result.signedURL||result.signedUrl,url=new URL(path.startsWith('/storage/')?path:'/storage/v1'+path,process.env.SUPABASE_URL).href;const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok||Number(response.headers.get('content-length'))>2*1024*1024)throw problem(400,'Ảnh QR tối đa 2 MB.');const reader=response.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024){await reader.cancel();throw problem(400,'Ảnh QR tối đa 2 MB.')}chunks.push(Buffer.from(value))}return Buffer.concat(chunks)}
export async function brandingQR(){
 if(!configured())return {bytes:zaloQR(),revision:'default',custom:false};
 const rows=await db('notification_log',{query:'?kind=eq.branding-qr&order=created_at.desc,id.desc&limit=1'});if(!rows[0])return {bytes:zaloQR(),revision:'default',custom:false};
 const id=rows[0].record_id;if(cached?.revision===id)return cached;
 const assets=await db('assets',{query:'?id=eq.'+encodeURIComponent(id)});if(!assets[0]||assets[0].kind!=='image')throw problem(502,'Chưa đọc được ảnh QR mặc định.');
 cached={bytes:await prepareQR(await rawAsset(assets[0])),revision:id,custom:true};return cached;
}
export async function setBrandingQR(id){if(!/^[-\da-f]{36}$/i.test(id||''))throw problem(400,'Mã ảnh QR không hợp lệ.');const rows=await db('assets',{query:'?id=eq.'+id});if(!rows[0]||rows[0].kind!=='image')throw problem(400,'Chưa tìm thấy ảnh QR đã tải lên.');const bytes=await prepareQR(await rawAsset(rows[0]));await db('notification_log',{method:'POST',body:{kind:'branding-qr',record_id:id,sent:true}});cached={bytes,revision:id,custom:true};return {saved:true,revision:id}}
// Existing static photos already have phone/domain/code. Replace only their QR region.
export async function replaceQR(input,qrBytes,{code='',layout='photo'}={}){const {width,height}=await sharp(input).metadata(),{size,left,top}=qrPlacement(width,height,{code,layout});const qr=await sharp(qrBytes).resize(size,size,{fit:'contain',background:'#fff'}).png().toBuffer();return sharp(input).composite([{input:qr,left,top}]).jpeg({quality:90,mozjpeg:true}).toBuffer()}
