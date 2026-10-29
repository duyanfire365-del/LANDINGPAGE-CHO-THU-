import {publicFrontage} from './frontage-privacy.mjs';
import {actor,db,problem} from './platform.mjs';
import {readFile} from 'node:fs/promises';
const labels={'post-history:delete-requested':'Xóa tin — chờ quản trị duyệt','post-history:delete-approved':'Quản trị đã duyệt xóa','post-history:restored':'Quản trị khôi phục tin','post-history:content-updated':'Cập nhật tiêu đề / danh mục / nội dung','post-history:photos-updated':'Cập nhật ảnh tin đăng','post-history:pending':'Gửi tin chờ duyệt','post-history:published':'Đăng lên website','post-history:rejected':'Gỡ / không duyệt','inventory:available':'Xác nhận còn hàng','inventory:awaiting':'Đánh dấu chờ xác nhận','inventory:rented':'Đã cho thuê','inventory:paused':'Tạm dừng cho thuê','hot:on':'Bật HOT','hot:off':'Tắt HOT'};
export async function postHistory(req,slug){
 const who=await actor(req);if(!/^(?:hn-\d{3}|live-\d{10,20})$/.test(slug||''))throw problem(400,'Mã tin không hợp lệ.');let row;
 if(slug.startsWith('hn-')){if(!who.admin)throw problem(403,'Chỉ quản trị viên được xem lịch sử nguồn chung.');const base=JSON.parse(await readFile(new URL('../public/listings.json',import.meta.url),'utf8'));const p=base.find(p=>p.slug===slug);if(!p)throw problem(404,'Không tìm thấy tin.');row={created_at:p.publishedDate||null,reviewed_at:p.publishedDate||null,status:'published'};}
 else{row=(await db('posts',{query:'?public_data->>slug=eq.'+slug+'&select=id,author_id,created_at,reviewed_at,status'}))[0];if(!row||!who.admin&&row.author_id!==who.id)throw problem(404,'Không tìm thấy tin hoặc không có quyền xem lịch sử.');}
 const logs=await db('notification_log',{query:'?record_id=eq.'+slug+'&order=created_at.desc,id.desc&limit=100'});
 return {createdAt:row.created_at||null,publishedAt:logs.find(e=>e.kind==='post-history:published')?.created_at||(row.status==='published'?row.reviewed_at:null)||null,events:logs.filter(e=>labels[e.kind]).map(e=>({at:e.created_at,label:labels[e.kind]}))};
}
export async function logPostHistory(slug,status){await db('notification_log',{method:'POST',body:{kind:'post-history:'+status,record_id:slug,sent:true}}).catch(()=>{});}
// Public catalog keeps its ranking but never exposes the owner's date history.
export function publicListing(record){const {publishedAt,publishedDate,created_at,reviewed_at,updated_at,createdAt,updatedAt,history,...publicData}=record;return publicFrontage(publicData);}
