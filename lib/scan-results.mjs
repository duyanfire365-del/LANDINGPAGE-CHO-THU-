import {createHash,randomUUID} from 'node:crypto';
import {db,problem} from './platform.mjs';
import model from '../public/scan-results-model.js';
const KIND='scan-result:v1';
const text=(v,n=300)=>typeof v==='string'?v.trim().slice(0,n):'';
function web(v,optional=false){if(!v&&optional)return '';let u;try{u=new URL(v)}catch{throw problem(400,'Link bài gốc hoặc nguồn chưa hợp lệ.')}
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.href.length>2000)throw problem(400,'Chỉ nhận link HTTP/HTTPS không chứa tài khoản.');u.hash='';for(const k of [...u.searchParams.keys()])if(/^(?:utm_|fbclid$|gclid$)/i.test(k))u.searchParams.delete(k);return u.href}
function uuid(key){const h=createHash('sha256').update(key).digest('hex');return h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32)}
function date(v,optional=false){if(!v&&optional)return '';const d=new Date(v);if(!Number.isFinite(+d))throw problem(400,'Ngày dữ liệu không hợp lệ.');return d.toISOString()}
export function resultInput(input,now=new Date()){
 if(!input||!['owner','tenant'].includes(input.kind))throw problem(400,'Chọn nhóm mặt bằng hoặc khách tìm thuê.');
 const originalUrl=web(input.originalUrl),content=text(input.content,20000);if(!content)throw problem(400,'Cần giữ nội dung bài gốc để đối chiếu.');
 const numeric=k=>{if(input[k]==null||input[k]==='')return null;if(typeof input[k]!=='number'||!Number.isFinite(input[k])||input[k]<0)throw problem(400,'Số liệu '+k+' chưa hợp lệ.');return input[k]};
 if(input.sources!=null&&(!Array.isArray(input.sources)||input.sources.length>30))throw problem(400,'Tối đa 30 nguồn đối chiếu một tin.');
 const sources=(input.sources?.length?input.sources:[{name:new URL(originalUrl).hostname,url:originalUrl}]).map(s=>({name:text(s.name,180)||new URL(web(s.url)).hostname,url:web(s.url)}));
 const collectedAt=date(input.collectedAt||now);if(Date.parse(collectedAt)>Date.parse(now)+60000)throw problem(400,'Thời gian quét không được nằm trong tương lai.');
 const row={kind:input.kind,originalUrl,content,address:text(input.address,500),district:text(input.district,100),propertyType:text(input.propertyType,100),rent:numeric('rent'),size:numeric('size'),frontage:numeric('frontage'),budget:text(input.budget),requirements:text(input.requirements,2000),authorName:text(input.authorName,180),phone:text(input.phone,120),zalo:text(input.zalo,200),facebookUrl:web(input.facebookUrl,true),code:text(input.code,60),evidence:text(input.evidence,2000),industries:Array.isArray(input.industries)?[...new Set(input.industries.slice(0,30).map(x=>text(x,80)).filter(Boolean))]:[],sources:[...new Map(sources.map(s=>[s.url,s])).values()],priceChanged:input.priceChanged===true,postedAt:date(input.postedAt,true),collectedAt,verified:false,status:'new',revision:randomUUID()};
 return {id:uuid(KIND+input.kind+originalUrl),kind:KIND,record_id:JSON.stringify(row),sent:true,created_at:collectedAt};
}
export async function scanResults(){
 const items=[];for(let offset=0;offset<10000;offset+=500){const rows=await db('notification_log',{query:'?kind=eq.'+KIND+'&order=created_at.desc,id.desc&limit=500&offset='+offset});for(const row of rows){let data;try{data=JSON.parse(row.record_id);if(!model.labels[data.status]||!['owner','tenant'].includes(data.kind)||!data.revision||!Array.isArray(data.sources))throw Error()}catch{throw problem(503,'Một tin quét bị lỗi định dạng; chưa thể hiển thị hoặc xuất đầy đủ.')}items.push({...data,id:row.id})}if(rows.length<500){const runs=await db('notification_log',{query:'?kind=eq.scan-run:v1&order=created_at.desc&limit=1'});let lastRun=null;if(runs[0]){try{lastRun=JSON.parse(runs[0].record_id)}catch{throw problem(503,'Chưa đọc được thời gian quét gần nhất.')}}return {items,lastRun}}}
 throw problem(413,'Đã vượt 10.000 kết quả. Cần phân trang máy chủ trước khi xem/xuất toàn bộ.');
}
export async function ingestResults(body){
 if(!Array.isArray(body.items)||body.items.length>100)throw problem(400,'Mỗi lượt nhận tối đa 100 kết quả.');
 const now=new Date(),rows=body.items.map(x=>resultInput(x,now));let added=[];
 if(rows.length)added=await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:[...new Map(rows.map(x=>[x.id,x])).values()]});
 await db('notification_log',{method:'POST',body:{kind:'scan-run:v1',record_id:JSON.stringify({at:now.toISOString(),received:rows.length,added:added.length}),sent:true}});
 return {added:added.length,received:rows.length};
}
export async function updateResult(body){
 if(!/^[a-f0-9-]{36}$/i.test(body.id||'')||!body.revision)throw problem(400,'Thiếu mã tin hoặc phiên bản.');
 const row=(await db('notification_log',{query:'?id=eq.'+body.id+'&kind=eq.'+KIND+'&limit=1'}))[0];if(!row)throw problem(404,'Không tìm thấy tin quét.');
 const data=JSON.parse(row.record_id);if(data.revision!==body.revision)throw problem(409,'Tin vừa được xử lý ở nơi khác. Tải lại trước khi lưu.');
 if(body.action==='scan-result-status'){if(!Object.hasOwn(model.labels,body.status))throw problem(400,'Trạng thái không hợp lệ.');data.status=body.status}
 else if(body.action==='scan-result-verify'){if(typeof body.verified!=='boolean')throw problem(400,'Chọn trạng thái xác minh.');data.verified=body.verified;data.verifiedAt=body.verified?new Date().toISOString():''}
 else throw problem(400,'Thao tác không hợp lệ.');
 data.revision=randomUUID();data.updatedAt=new Date().toISOString();
 const changed=await db('notification_log',{method:'PATCH',query:'?id=eq.'+body.id+'&kind=eq.'+KIND+'&created_at=eq.'+encodeURIComponent(row.created_at),body:{record_id:JSON.stringify(data),created_at:new Date(Math.max(Date.now(),Date.parse(row.created_at)+1)).toISOString()}});
 if(!changed.length)throw problem(409,'Tin vừa thay đổi. Tải lại trước khi lưu.');return {item:{...data,id:row.id}};
}
export async function exportResults(filters){
 const {items}=await scanResults(),rows=model.filter(items,filters),{default:ExcelJS}=await import('exceljs'),book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Tin quet');
 const columns=['Nhóm','Ngày quét','Ngày đăng gốc','Địa chỉ','Quận / khu vực','Loại tin','Giá thuê (triệu/tháng)','Diện tích (m²)','Mặt tiền (m)','Ngân sách','Nhu cầu / mục đích','Tên người đăng','SĐT','Zalo','Tài khoản Facebook','Bài gốc','Tên nguồn','Link nguồn','Phù hợp ngành','Đổi giá','Trạng thái','Đã xác minh thủ công','Căn cứ','Nội dung gốc'];sheet.columns=columns.map(header=>({header,width:25}));
 for(const r of rows)sheet.addRow([r.kind==='owner'?'Mặt bằng':'Khách tìm mặt bằng',r.collectedAt,r.postedAt,r.address,r.district,r.propertyType,r.rent,r.size,r.frontage,r.budget,r.requirements,r.authorName,r.phone,r.zalo,r.facebookUrl,r.originalUrl,r.sources.map(s=>s.name).join('\n'),r.sources.map(s=>s.url).join('\n'),r.industries.join(', '),r.priceChanged?'Có':'Không',model.labels[r.status],r.verified?'Có':'Chưa',r.evidence,r.content]);
 sheet.getRow(1).font={bold:true};sheet.views=[{state:'frozen',ySplit:1}];sheet.autoFilter={from:'A1',to:'X1'};return {buffer:Buffer.from(await book.xlsx.writeBuffer()),count:rows.length};
}
