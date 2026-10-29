import sharp from 'sharp';
import {randomUUID} from 'node:crypto';
import {db,configured,problem} from './platform.mjs';
const ID='9138033b-3fd9-45b0-9b6f-9f6e7ab597c1',KIND='website-logo:v1',DEFAULT='Nguồn cho thuê BĐS Hà Nội';
async function record(){if(!configured())return null;return (await db('notification_log',{query:'?id=eq.'+ID+'&kind=eq.'+KIND+'&limit=1'}))[0]}
function decode(row){if(!row)return {custom:false,revision:null,alt:DEFAULT};try{const data=JSON.parse(row.record_id);if(typeof data.custom!=='boolean'||! /^[a-f0-9-]{36}$/i.test(data.revision))throw Error();if(data.custom&&(!data.base64||data.mime!=='image/webp'))throw Error();return data}catch{throw problem(503,'Chưa đọc được cấu hình logo; giữ nguyên giao diện mặc định.')}}
function metadata(data){return {custom:data.custom,revision:data.revision,alt:data.alt||DEFAULT,width:data.width||0,height:data.height||0,url:data.custom?'/api/files?action=website-logo&rev='+encodeURIComponent(data.revision):''}}
export async function websiteLogoMetadata(){return metadata(decode(await record()))}
export async function websiteLogoImage(){const data=decode(await record());if(!data.custom)throw problem(404,'Chưa có logo tùy chỉnh.');return {bytes:Buffer.from(data.base64,'base64'),revision:data.revision}}
export async function prepareWebsiteLogo(base64){
 if(typeof base64!=='string'||base64.length>2800000||base64.length%4||! /^[A-Za-z0-9+/]*={0,2}$/.test(base64))throw problem(400,'Logo phải là ảnh PNG, JPEG hoặc WebP, tối đa 2 MB.');
 const bytes=Buffer.from(base64,'base64');if(!bytes.length||bytes.length>2*1024*1024)throw problem(413,'Logo tối đa 2 MB.');
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255,webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';if(!png&&!jpeg&&!webp)throw problem(400,'Chỉ nhận nội dung ảnh PNG, JPEG hoặc WebP; không nhận SVG/tệp khác.');
 try{const image=sharp(bytes,{limitInputPixels:12000000}),meta=await image.metadata();if(!['png','jpeg','webp'].includes(meta.format)||meta.width<24||meta.height<24||(meta.pages||1)>1)throw problem(400,'Logo tối thiểu 24×24 px, là ảnh tĩnh và không quá 12 triệu điểm ảnh.');
 const {data,info}=await image.rotate().resize({width:900,height:200,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toBuffer({resolveWithObject:true});if(data.length>250000)throw problem(413,'Logo sau tối ưu còn quá lớn; dùng ảnh ít chi tiết hơn.');return {base64:data.toString('base64'),mime:'image/webp',width:info.width,height:info.height};
 }catch(e){if(e.status)throw e;throw problem(400,'Ảnh logo không đọc được hoặc vượt kích thước cho phép. Hãy xuất lại PNG/JPEG/WebP.')}
}
export async function saveWebsiteLogo(body){
 const old=await record(),current=decode(old);if((body.revision??null)!==(current.revision??null))throw problem(409,'Logo vừa được thay ở nơi khác. Tải lại trước khi lưu.');
 let data;if(body.action==='website-logo-reset')data={custom:false,revision:randomUUID(),alt:DEFAULT};else if(body.action==='website-logo-save'){const image=await prepareWebsiteLogo(body.base64);data={...image,custom:true,revision:randomUUID(),alt:typeof body.alt==='string'?body.alt.replace(/[\u0000-\u001f]/g,' ').trim().slice(0,120)||DEFAULT:DEFAULT}}else throw problem(400,'Thao tác logo không hợp lệ.');
 const record_id=JSON.stringify(data),rows=old?await db('notification_log',{method:'PATCH',query:'?id=eq.'+ID+'&kind=eq.'+KIND+'&created_at=eq.'+encodeURIComponent(old.created_at),body:{record_id,created_at:new Date(Math.max(Date.now(),Date.parse(old.created_at)+1)).toISOString()}}):await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{id:ID,kind:KIND,record_id,sent:true}});if(!rows.length)throw problem(409,'Logo vừa thay đổi. Tải lại trước khi lưu.');return {saved:true,...metadata(data)};
}
