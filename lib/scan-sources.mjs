import {randomUUID} from 'node:crypto';
import {isIP} from 'node:net';
import {db,problem} from './platform.mjs';
const ID='b8f705a1-9b62-41cd-85a9-60d736244155',KIND='scan-sources:v1';
export const defaultScanSchedule={timezone:'Asia/Ho_Chi_Minh',times:['05:30','10:30','13:30','15:30','17:30','20:00','22:00'],enabled:false};
export function scanURL(value){
 if(typeof value!=='string'||value.length>2000||/[\u0000-\u0020]/u.test(value))throw problem(400,'Link không hợp lệ hoặc dài quá 2.000 ký tự.');
 let u;try{u=new URL(value)}catch{throw problem(400,'Cần link đầy đủ bắt đầu bằng https:// hoặc http://.')}
 if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port)throw problem(400,'Chỉ nhận link web không kèm tài khoản hoặc cổng riêng.');
 const host=u.hostname.toLowerCase();
 if(isIP(host)||host.startsWith('[')||!host.includes('.')||/^(?:localhost|metadata\.google\.internal)$/.test(host)||/\.(?:local|localhost|internal|test|invalid)$/.test(host))throw problem(400,'Không nhận link mạng nội bộ hoặc địa chỉ IP.');
 u.hash='';for(const k of [...u.searchParams.keys()])if(/^(utm_|fbclid$|gclid$|ref$|refsrc$|mibextid$)/i.test(k))u.searchParams.delete(k);
 if(['facebook.com','www.facebook.com','m.facebook.com','mbasic.facebook.com'].includes(host)){
  if(!/^\/(?:groups\/[\w.-]+|share\/g\/[\w-]+)\/?$/.test(u.pathname))throw problem(400,'Facebook: nhập link nhóm /groups/… hoặc /share/g/…; không dùng link bài đăng hay hồ sơ cá nhân.');
  u.protocol='https:';u.hostname='www.facebook.com';u.pathname=u.pathname.replace(/\/$/,'')+'/';u.search='';
  return {url:u.href,platform:'facebook',status:'requires-access'};
 }
 return {url:u.href,platform:'website',status:'pending-adapter'};
}
export function scanSchedule(input){
 if(!input||typeof input!=='object')throw problem(400,'Thiếu cấu hình lịch.');
 const timezone=String(input.timezone||'');try{new Intl.DateTimeFormat('en',{timeZone:timezone}).format()}catch{throw problem(400,'Múi giờ không hợp lệ.')}
 if(!Array.isArray(input.times)||!input.times.length||input.times.length>24||input.times.some(t=>typeof t!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)))throw problem(400,'Nhập 1–24 giờ theo dạng HH:MM.');
 return {timezone,times:[...new Set(input.times)].sort(),enabled:input.enabled===true};
}
const MAX_LINKS=500;
export function linkPreview(text,existing=[]){
 if(typeof text!=='string'||text.length>200000)throw problem(413,'Nội dung tối đa 200.000 ký tự.');
 const found=[...text.matchAll(/(?:https?:\/\/|www\.)[^\s<>"“”'|]+/gi)];
 if(found.length>MAX_LINKS)throw problem(413,'Mỗi lượt tối đa 500 link. Chia nhỏ danh sách.');
 const seen=new Set(existing.map(x=>x.url)),items=[],errors=[];let duplicates=0;
 for(const match of found){const raw=match[0].replace(/[),.;\]}]+$/g,'');try{const entry=scanURL(raw.startsWith('www.')?'https://'+raw:raw);if(seen.has(entry.url)){duplicates++;continue}seen.add(entry.url);items.push({...entry,name:new URL(entry.url).hostname,enabled:true})}catch(e){errors.push({value:raw.slice(0,200),error:e.message})}}
 const lines=text.split(/\r?\n/);let ignored=0;for(const line of lines)if(line.trim()&&!/(?:https?:\/\/|www\.)/i.test(line))ignored++;
 return {items,errors,duplicates,ignored,found:found.length};
}
export async function scanUpload(file){
 if(!file||typeof file.name!=='string'||typeof file.base64!=='string')throw problem(400,'Thiếu tệp tải lên.');
 const ext=file.name.split('.').pop().toLowerCase(),mimes={pdf:'application/pdf',txt:'text/plain',csv:'text/plain',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
 if(!mimes[ext])throw problem(400,'Nhận .pdf, .docx, .xlsx, .txt, .csv. Với Word .doc / Excel .xls cũ, hãy Lưu thành .docx / .xlsx.');
 if(file.base64.length>2800000||(file.base64.length%4!==0||! /^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)))throw problem(413,'Tệp không hợp lệ hoặc vượt 2 MB.');
 const buffer=Buffer.from(file.base64,'base64');if(!buffer.length||buffer.length>2*1024*1024)throw problem(413,'Tệp phải từ 1 byte đến 2 MB.');
 if(ext==='pdf'){
  if(!buffer.subarray(0,1024).toString('latin1').includes('%PDF-'))throw problem(400,'Nội dung tệp không đúng định dạng PDF.');
  const {PDFParse}=await import('pdf-parse');const parser=new PDFParse({data:new Uint8Array(buffer)});
  try{
   const info=await parser.getInfo();if(info.total>100)throw problem(413,'PDF tối đa 100 trang. Hãy chia nhỏ để đọc đủ danh sách.');
   const extracted=await parser.getText(),details=await parser.getInfo({parsePageInfo:true});
   const text=extracted.pages.map(p=>p.text).join('\n'),links=details.pages.flatMap(p=>p.links.map(l=>l.url));
   if(!text.trim()&&!links.length)throw problem(400,'PDF không có văn bản hoặc link đọc được. Nếu là ảnh scan, cần OCR hoặc chuyển danh sách sang text/Excel trước khi up.');
   const combined=text+'\n'+links.join('\n');if(combined.length>200000)throw problem(413,'Nội dung PDF quá dài; hãy chia nhỏ tệp.');return combined;
  }catch(error){if(error.status)throw error;throw problem(400,error.name==='PasswordException'?'PDF có mật khẩu. Hãy xuất bản PDF không khóa rồi up lại.':'Chưa đọc được PDF. Kiểm tra tệp hợp lệ, không bị khóa hoặc hỏng.')}finally{await parser.destroy()}
 }
 if(ext==='txt'||ext==='csv')return buffer[0]===0xff&&buffer[1]===0xfe?buffer.subarray(2).toString('utf16le'):buffer.toString('utf8').replace(/^\uFEFF/,'');
 const {default:JSZip}=await import('jszip');const zip=await JSZip.loadAsync(buffer),entries=Object.values(zip.files);
 if(entries.length>1500||entries.reduce((n,e)=>n+(e._data?.uncompressedSize||0),0)>40*1024*1024)throw problem(413,'Tài liệu giải nén quá lớn; hãy chia nhỏ.');
 if(!zip.file('[Content_Types].xml')||!zip.file(ext==='docx'?'word/document.xml':'xl/workbook.xml'))throw problem(400,'Nội dung không đúng định dạng Word/Excel đã chọn.');
 let text='',extra='';
 if(ext==='docx'){
  const {default:mammoth}=await import('mammoth');text=(await mammoth.extractRawText({buffer})).value;
  for(const rels of entries.filter(e=>/^word\/_rels\/(?:document|header\d+|footer\d+)\.xml\.rels$/.test(e.name))){const xml=await rels.async('string');for(const m of xml.matchAll(/<Relationship\b[^>]*>/g)){if(!/\/hyperlink["']/.test(m[0]))continue;const target=m[0].match(/\bTarget=["']([^"']+)["']/)?.[1];if(target)extra+='\n'+target.replace(/&amp;/g,'&')}}
 }else{
  const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.load(buffer);
  for(const sheet of book.worksheets)sheet.eachRow(row=>row.eachCell(cell=>{text+='\n'+cell.text;const v=cell.value;if(v&&typeof v==='object'){if(v.hyperlink)extra+='\n'+v.hyperlink;const literal=v.formula?.match(/^HYPERLINK\(\s*"([^"\n]+)"/i)?.[1];if(literal)extra+='\n'+literal}if(text.length+extra.length>200000)throw problem(413,'Nội dung quá dài; hãy chia nhỏ tệp.')}));
 }
 if(text.length+extra.length>200000)throw problem(413,'Nội dung link quá dài. Chia nhỏ tệp.');
 return text+'\n'+extra;
}
async function record(){return (await db('notification_log',{query:'?id=eq.'+ID+'&kind=eq.'+KIND+'&limit=1'}))[0]}
function decode(row){
 if(!row)return {items:[],schedule:{...defaultScanSchedule,times:[...defaultScanSchedule.times]},revision:null};
 try{const data=JSON.parse(row.record_id);if(!/^[a-f0-9-]{36}$/i.test(data.revision)||!Array.isArray(data.items)||data.items.length>1000)throw Error();data.schedule=scanSchedule(data.schedule);for(const item of data.items){const normalized=scanURL(item.url);if(item.platform!==normalized.platform||item.status!==normalized.status||typeof item.enabled!=='boolean'||! /^[a-f0-9-]{36}$/i.test(item.id))throw Error()}return data}catch{throw problem(503,'Chưa đọc được danh sách nguồn; giữ nguyên dữ liệu đã lưu và kiểm tra lại.')}
}
export async function scanSources(){return {...decode(await record()),runtime:{ready:true,scheduled:false,message:'Quét ngay đã sẵn sàng cho website công khai có dữ liệu đọc được. Facebook cần kết nối có quyền đọc nhóm. Lịch chỉ được lưu; chưa có bộ chạy theo các khung giờ này.'}}}
export async function saveScanSources(body){
 const old=await record(),state=decode(old);if((body.revision??null)!==state.revision)throw problem(409,'Danh sách vừa thay đổi. Tải lại danh sách rồi thử lại.');
 let added=0,duplicates=0;
 if(body.action==='scan-import'){
  const preview=linkPreview(body.text,state.items);if(preview.errors.length)throw problem(400,'Có link không hợp lệ. Xem trước và loại link lỗi trước khi lưu.');
  if(!preview.items.length)throw problem(400,'Không có link mới hợp lệ để thêm.');
  if(state.items.length+preview.items.length>1000)throw problem(413,'Tối đa 1.000 nguồn đã lưu.');
  state.items.push(...preview.items.map(item=>({...item,id:randomUUID(),createdAt:new Date().toISOString()})));added=preview.items.length;duplicates=preview.duplicates;
 }else if(body.action==='scan-schedule')state.schedule=scanSchedule(body.schedule);
 else if(body.action==='scan-remove'||body.action==='scan-toggle'){
  if(!state.items.some(x=>x.id===body.id))throw problem(404,'Không tìm thấy nguồn.');
  if(body.action==='scan-remove')state.items=state.items.filter(x=>x.id!==body.id);else state.items=state.items.map(x=>x.id===body.id?{...x,enabled:!x.enabled}:x);
 }else throw problem(400,'Thao tác không hợp lệ.');
 const payload={...state,revision:randomUUID()},record_id=JSON.stringify(payload);let rows;
 if(old){const stamp=Math.max(Date.now(),Date.parse(old.created_at)+1);rows=await db('notification_log',{method:'PATCH',query:'?id=eq.'+ID+'&kind=eq.'+KIND+'&created_at=eq.'+encodeURIComponent(old.created_at),body:{record_id,sent:true,created_at:new Date(stamp).toISOString()}})}
 else rows=await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{id:ID,kind:KIND,record_id,sent:true}});
 if(!rows?.length)throw problem(409,'Danh sách vừa thay đổi. Tải lại trước khi lưu.');return {added,duplicates,...payload};
}
