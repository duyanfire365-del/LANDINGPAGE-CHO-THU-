import {actor,db,problem,clean} from './platform.mjs';
import {randomUUID} from 'node:crypto';
import {logPostHistory} from './post-history.mjs';
export const isDeleted=row=>['pending','approved'].includes(row?.private_data?.deletion?.state);
export async function deletionAction(req,body){return changeDeletion(await actor(req),body)}
export async function changeDeletion(who,body){
 if(!/^[a-f0-9-]{36}$/i.test(body.id||''))throw problem(400,'Mã tin không hợp lệ.');
 if(!['delete-post','restore-post','approve-deletion'].includes(body.action))throw problem(400,'Thao tác không hợp lệ.');
 if(body.action!=='delete-post'&&!who.admin)throw problem(403,'Chỉ quản trị viên được duyệt xóa hoặc khôi phục.');
 const row=(await db('posts',{query:'?id=eq.'+body.id}))[0];
 if(!row||!who.admin&&row.author_id!==who.id)throw problem(404,'Không tìm thấy tin hoặc không có quyền xóa.');
 const previous=row.private_data?.deletion,deleted=isDeleted(row),now=new Date().toISOString();let deletion,status=row.status,event;
 if(body.action==='delete-post'){
  if(deleted)return {saved:true,unchanged:true};
  deletion={state:'pending',requestedAt:now,requestedBy:who.admin?'admin':who.id,requestedName:who.admin?'Quản trị viên':clean(who.full_name,150)||'Thành viên',reason:clean(body.reason,1000),previousStatus:row.status};status='rejected';event='delete-requested';
 }else{
  if(!deleted)throw problem(409,'Tin không nằm trong danh sách đã xóa. Tải lại để kiểm tra.');
  if(body.action==='approve-deletion'){
   if(previous.state==='approved')return {saved:true,unchanged:true};
   deletion={...previous,state:'approved',reviewedAt:now,reviewedBy:'admin'};status='rejected';event='delete-approved';
  }else{
   deletion={...previous,state:'restored',restoredAt:now,restoredBy:'admin'};status=['published','pending','rejected'].includes(previous.previousStatus)?previous.previousStatus:'pending';event='restored';
   if(status==='published'){const {safePublicText}=await import('./posts.mjs');const p=row.public_data;if(!p?.title||p.hashtags||!safePublicText([p.title,p.address,p.description].join(' ')))throw problem(400,'Nội dung có thông tin riêng tư; cần kiểm tra trước khi khôi phục công khai.');}
  }
 }
 // Compare revision and state so two review clicks cannot silently overwrite one another.
 const revision=row.public_data?.contentRevision,query='?id=eq.'+row.id+'&status=eq.'+row.status+'&public_data->>contentRevision='+(revision?'eq.'+encodeURIComponent(revision):'is.null');
 const saved=await db('posts',{method:'PATCH',query,body:{status,public_data:{...row.public_data,contentRevision:randomUUID(),codeReleased:body.action!=='restore-post',...(body.action==='restore-post'?{codeMode:'auto'}:{})},private_data:{...row.private_data,deletion}}});
 if(!saved.length)throw problem(409,'Tin vừa được thay đổi. Tải lại rồi thử lại.');
 await logPostHistory(row.public_data.slug,event);
 return {saved:true,status,deletion};
}
