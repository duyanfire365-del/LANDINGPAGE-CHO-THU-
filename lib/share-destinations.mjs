import {randomUUID} from 'node:crypto';
import {db,problem} from './platform.mjs';
const CONFIG_ID='9fd66b40-7f81-4f69-b731-86ba721acf9d',KIND='share-destinations:v1';
export function destinationURL(value,platform){
 if(typeof value!=='string'||value.length>500||/[\u0000-\u001f]/.test(value))throw problem(400,'Link nhóm tối đa 500 ký tự, không chứa ký tự điều khiển.');
 let url;try{url=new URL(value.trim())}catch{throw problem(400,'Link nhóm chưa hợp lệ. Dán đầy đủ https://…')}
 if(url.protocol!=='https:'||url.username||url.password||url.port)throw problem(400,'Chỉ nhận link nhóm HTTPS, không kèm tài khoản hoặc cổng riêng.');
 if(platform==='facebook'){
  if(!['facebook.com','www.facebook.com','m.facebook.com'].includes(url.hostname.toLowerCase())||!/^\/(?:groups\/[A-Za-z0-9._-]+|share\/g\/[A-Za-z0-9_-]+)\/?$/.test(url.pathname))throw problem(400,'Facebook: dùng link trang nhóm dạng https://www.facebook.com/groups/…; không dùng link một bài đăng.');
  return 'https://www.facebook.com'+url.pathname.replace(/\/$/,'')+'/';
 }
 if(platform==='zalo'){
  if(url.hostname.toLowerCase()!=='zalo.me'||!/^\/g\/[A-Za-z0-9_-]+\/?$/.test(url.pathname))throw problem(400,'Zalo: dùng link mời nhóm dạng https://zalo.me/g/…');
  return 'https://zalo.me'+url.pathname.replace(/\/$/,'');
 }
 throw problem(400,'Chọn Facebook hoặc Zalo.');
}
export function validateDestinations(input){
 if(!Array.isArray(input)||input.length>60)throw problem(400,'Danh sách tối đa 60 nhóm.');const urls=new Set(),ids=new Set();
 return input.map((item,index)=>{const name=typeof item?.name==='string'?item.name.replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim():'';if(!name||name.length>100)throw problem(400,'Nhóm '+(index+1)+': nhập tên từ 1–100 ký tự.');const url=destinationURL(item.url,item.platform),key=item.platform==='facebook'?url.toLowerCase():url;if(urls.has(key))throw problem(400,'Nhóm '+(index+1)+': link đã có trong danh sách.');urls.add(key);const id=item.id||randomUUID();if(!/^[a-f0-9-]{36}$/i.test(id)||ids.has(id))throw problem(400,'Mã nhóm không hợp lệ hoặc trùng.');ids.add(id);return {id,name,platform:item.platform,url}});
}
async function record(){return (await db('notification_log',{query:'?id=eq.'+CONFIG_ID+'&kind=eq.'+KIND+'&select=id,record_id,created_at&limit=1'}))[0]}
function decode(row){if(!row)return {items:[],revision:null};try{const data=JSON.parse(row.record_id);if(!/^[a-f0-9-]{36}$/i.test(data.revision||''))throw Error();return {items:validateDestinations(data.items),revision:data.revision}}catch{throw problem(503,'Chưa đọc được danh sách nhóm đã lưu. Giữ dữ liệu cũ và kiểm tra lại.')}}
export async function shareDestinations(){return decode(await record())}
export async function saveShareDestinations(body){
 const items=validateDestinations(body.items),old=await record(),previous=decode(old);if((body.revision??null)!==previous.revision)throw problem(409,'Danh sách vừa được sửa ở nơi khác. Bấm Tải lại danh sách rồi thử lại.');const payload={items,revision:randomUUID()},record_id=JSON.stringify(payload);let rows;
 if(old){const time=Date.parse(old.created_at);if(!Number.isFinite(time))throw problem(503,'Phiên bản danh sách nhóm chưa hợp lệ.');rows=await db('notification_log',{method:'PATCH',query:'?id=eq.'+CONFIG_ID+'&kind=eq.'+KIND+'&created_at=eq.'+encodeURIComponent(old.created_at),body:{record_id,sent:true,created_at:new Date(Math.max(Date.now(),time+1)).toISOString()}})}
 else rows=await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{id:CONFIG_ID,kind:KIND,record_id,sent:true}});
 if(!rows?.length)throw problem(409,'Danh sách vừa thay đổi. Bấm Tải lại danh sách trước khi lưu.');return payload;
}
