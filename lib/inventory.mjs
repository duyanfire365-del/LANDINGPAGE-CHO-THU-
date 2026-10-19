import {db,configured,problem,actor} from './platform.mjs';
export const inventoryLabels={available:'Còn hàng',rented:'Đã cho thuê',paused:'Tạm dừng cho thuê'};
export async function inventoryStates(){
 if(!configured())return {};
 const states={};for(let offset=0;;offset+=500){const rows=await db('notification_log',{query:'?kind=like.inventory:*&order=created_at.desc,id.desc&limit=500&offset='+offset});for(const row of rows){const state=row.kind.slice(10);if(Object.hasOwn(inventoryLabels,state)&&/^(?:hn-\d{3}|live-\d{10,20})$/.test(row.record_id)&&!Object.hasOwn(states,row.record_id))states[row.record_id]=state}if(rows.length<500)break}return states;
}
export async function updateInventory(req,body){
 const who=await actor(req),slug=String(body.slug||''),state=body.availability;
 if(!/^(?:hn-\d{3}|live-\d{10,20})$/.test(slug)||!Object.hasOwn(inventoryLabels,state))throw problem(400,'Trạng thái BĐS không hợp lệ.');
 if(slug.startsWith('hn-')){if(!who.admin)throw problem(403,'Chỉ quản trị viên được đổi trạng thái nguồn chung.');const {readFile}=await import('node:fs/promises');const rows=JSON.parse(await readFile(new URL('../public/listings.json',import.meta.url),'utf8'));if(!rows.some(p=>p.slug===slug))throw problem(404,'Không tìm thấy BĐS.');}
 else{const rows=await db('posts',{query:'?public_data->>slug=eq.'+slug+'&select=id,author_id'});if(!rows[0])throw problem(404,'Không tìm thấy tin.');if(!who.admin&&(!(who.kind==='sales'&&who.can_post)||rows[0].author_id!==who.id))throw problem(403,'Anh/chị chỉ được cập nhật trạng thái tin của mình khi có quyền đăng tin.');}
 await db('notification_log',{method:'POST',body:{kind:'inventory:'+state,record_id:slug,sent:true}});return {saved:true,slug,availability:state};
}
