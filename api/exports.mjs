import {inventoryStates,inventoryLabels} from '../lib/inventory.mjs';
import {canonicalizeSubset} from '../lib/listing-catalog.mjs';
import {readFile} from 'node:fs/promises';
import {intentLabels,priceLabels} from '../lib/inquiries.mjs';
import {send} from '../lib/http.mjs';
import {requireAdmin,db,configured} from '../lib/platform.mjs';
import {listings} from './admin.mjs';
import {exportDocument} from '../lib/documents.mjs';
export default async function handler(req,res){
 try{
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});requireAdmin(req);
  const q=new URL(req.url,'http://localhost').searchParams,kind=q.get('kind')||'posts',format=q.get('format')||'xlsx';let rows;
  if(kind==='template'){
   rows=[{'Tiêu đề công khai':'Văn phòng cho thuê tại Cầu Giấy','Tên đường công khai':'Vũ Phạm Hàm','Khu vực':'Cầu Giấy','Danh mục':'Văn phòng','Giá thuê (triệu/tháng)':20,'Diện tích':80,'Mô tả công khai':'Không gian làm việc, liên hệ để xác nhận hiện trạng.','Địa chỉ riêng tư':'Điền số nhà và ngõ/ngách tại đây','Hashtag':'#VanPhongChoThue'}];
  }else if(kind==='posts'){
   const original=await listings(),states=await inventoryStates();const dynamic=configured()?await canonicalizeSubset(await db('posts',{query:'?status=eq.published&order=created_at.desc&limit=1000'})):[];
   rows=[...original.map(r=>({'Mã':r.code,'Tình trạng nguồn hàng':inventoryLabels[states[r.slug]||'available'],'Tiêu đề':r.title,'Địa chỉ riêng tư':r.address,'Danh mục':r.type,'Khu vực':r.area,'Giá thuê (triệu/tháng)':r.price,'Diện tích':r.areaText,'Hashtag':r.hashtags.join(' '),'Nội dung':r.shareText,'Ghi chú nguồn riêng tư':(r.privateNotes||[]).join(' ')})),...dynamic.map(p=>({'Mã':p.public_data.code,'Tình trạng nguồn hàng':inventoryLabels[states[p.public_data.slug]||'available'],'Tiêu đề':p.public_data.title,'Địa chỉ riêng tư':p.private_data.address,'Danh mục':p.public_data.type,'Khu vực':p.public_data.area,'Giá thuê (triệu/tháng)':p.public_data.price,'Diện tích':p.public_data.areaText,'Hashtag':(p.private_data.hashtags||[]).join(' '),'Trạng thái':p.status,'Nội dung':p.public_data.description}))];
  }else if(kind==='inquiries'){
   rows=(await db('inquiries',{query:'?order=created_at.desc&limit=1000'})).map(r=>({'Mã':r.id,'Họ và tên':r.name,'Điện thoại':r.phone,'Nhu cầu':intentLabels[r.intent]||r.intent,'Khu vực':r.area,'Loại BĐS':r.type,'Ngân sách':r.budget,'BĐS quan tâm':r.property,'Ngày xem':r.date,'Địa chỉ ký gửi':r.owner_address,'Diện tích':r.owner_size,'Giá ký gửi (triệu đồng)':r.owner_price??r.owner_rent,'Đơn vị giá':r.intent==='owner'?'triệu đồng/tháng':r.intent==='tenant'?'':'triệu đồng','Tiền thuê hiện tại (triệu/tháng)':r.transfer_monthly_rent,'Ghi chú':r.owner_notes,'Ngày đăng ký':r.created_at,'Trạng thái xử lý':({new:'Mới',contacted:'Đã liên hệ',following:'Đang chăm sóc',closed:'Đã hoàn tất'})[r.management_status||'new'],'Ghi chú nội bộ':r.admin_notes||'','Cập nhật gần nhất':r.updated_at||''}));
  }else if(kind==='members'){
   rows=(await db('profiles',{query:'?order=created_at.desc&limit=1000'})).map(r=>({'Mã':r.id,'Họ và tên':r.full_name,'Email':r.email,'Điện thoại':r.phone,'Nhóm':r.kind==='sales'?'Sale / CTV':'Khách hàng','Quyền gửi tin':r.can_post?'Được cấp':'Chưa cấp','Ngày đăng ký':r.created_at}));
  }else return send(res,400,{error:'Loại dữ liệu không hợp lệ.'});
  if(!rows.length)return send(res,404,{error:'Chưa có dữ liệu để xuất.'});
  const output=await exportDocument(rows,format,'Nguồn cho thuê Hà Nội — '+({template:'Mẫu nhập tin',posts:'Tin BĐS',members:'Thành viên',inquiries:'Nhu cầu và ký gửi'})[kind]);
  res.writeHead(200,{'Content-Type':output.mime,'Content-Disposition':`attachment; filename="${kind}.${format}"`,'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'});res.end(output.buffer);
 }catch(error){return send(res,error.status||502,{error:error.status?error.message:'Chưa xuất được dữ liệu. Vui lòng kiểm tra kết nối.'})}
}
