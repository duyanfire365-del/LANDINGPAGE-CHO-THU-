import {authenticated} from '../api/admin.mjs';
import {member,supa,db,problem} from './platform.mjs';
export const listingCountAccess=req=>({canViewTotal:authenticated(req)});
export async function ownListingCounts(req){
 const profile=await member(req);
 if(!(profile?.kind==='sales'&&profile.can_post===true&&profile.can_view_own_post_counts===true))return {visible:false};
 const base='/rest/v1/posts?select=id&status=eq.published&author_id=eq.'+encodeURIComponent(profile.id);
 const count=query=>supa(base+query,{method:'HEAD',headers:{Prefer:'count=exact'},count:true});
 const [published,rent,sale]=await Promise.all([count(''),count('&or=(public_data->>transactionType.in.(rent,both),and(public_data->>transactionType.is.null,or(public_data->>transaction.is.null,public_data->>transaction.neq.sale),or(public_data->>isSale.is.null,public_data->>isSale.neq.true)))'),count('&or=(public_data->>transactionType.in.(sale,both),and(public_data->>transactionType.is.null,or(public_data->>transaction.eq.sale,public_data->>isSale.eq.true)))')]);
 return {visible:true,published,rent,sale};
}
export async function setListingCountPermission(body){
 if(!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(body.id||'')||typeof body.enabled!=='boolean')throw problem(400,'Thông tin cấp quyền không hợp lệ.');
 const profile=(await db('profiles',{query:'?id=eq.'+body.id+'&kind=eq.sales&select=id,can_post,can_view_own_post_counts'}))[0];
 if(!profile)throw problem(404,'Không tìm thấy thành viên Sale/CTV.');
 if(body.enabled&&profile.can_post!==true)throw problem(400,'Cấp quyền gửi tin trước khi bật thống kê tin của thành viên.');
 const saved=await db('profiles',{method:'PATCH',query:'?id=eq.'+body.id+'&kind=eq.sales'+(body.enabled?'&can_post=eq.true':''),body:{can_view_own_post_counts:body.enabled}});
 if(!saved.length)throw problem(409,'Quyền thành viên vừa thay đổi. Tải lại danh sách rồi thử lại.');
 return {ok:true,enabled:body.enabled};
}
