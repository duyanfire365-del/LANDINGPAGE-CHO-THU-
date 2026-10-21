import {trackedPriceNotes} from './source-price-notes.mjs';
import {db} from './platform.mjs';
import {readFile} from 'node:fs/promises';
import {listings} from '../api/admin.mjs';
import {canonicalRows} from './listing-catalog.mjs';
import {inventoryData,inventoryLabels} from './inventory.mjs';
import {extractSourceInfo} from './property-source.mjs';
export const stockHeaders=['Mã BĐS','Tiêu đề công khai','Khu vực','Loại BĐS','Diện tích (m²)','Giá thuê (triệu/tháng)','Giá chuyển nhượng (triệu đồng)','Có thể thương lượng','Trạng thái nguồn','HOT','Địa chỉ cụ thể — riêng tư','Đường / vị trí công khai','Mô tả bài đăng','SĐT đối tác 1','SĐT đối tác 2','SĐT đối tác 3','SĐT chủ 1','SĐT chủ 2','SĐT chủ 3','Nguồn cung cấp','Hoa hồng — riêng tư','Ngày giờ đăng (VN)','Lần xác nhận gần nhất (VN)','Cập nhật nguồn (VN)','Mặt tiền (m)','Đường rộng (m)','Vỉa hè','Đơn giá (đồng/m²/tháng)','Link bài đăng','Link ảnh','Google Maps — riêng tư','Trạng thái đăng','Số tầng','Số phòng ngủ','Số phòng WC','Ghi chú giá — chỉ quản trị','Mã định danh'];
const vnDate=value=>value&&Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'medium',hour12:false}).format(new Date(value)):'';
async function all(table,query=''){const rows=[];for(let offset=0;;offset+=500){const page=await db(table,{query:'?'+query+'limit=500&offset='+offset});rows.push(...page);if(page.length<500)return rows}}
export function stockSheetRow(p,record={},source={},inventory={}){
 const privateData=record.private_data||{},info={...extractSourceInfo(privateData.sourceText||''),...(privateData.sourceInfo||{}),...(source.data||{})},slug=p.slug;
 return [p.code,p.title,p.area,p.type,p.size??'',p.price??'',p.transferPrice??'',p.transferNegotiable?'Có':'Không',inventoryLabels[inventory.states?.[slug]||p.availability||'available'],inventory.hot?.[slug]?'HOT':'',privateData.address||record.address||'',p.address||'',p.description||'',...[0,1,2].map(i=>info.partnerPhones?.[i]||''),...[0,1,2].map(i=>info.ownerPhones?.[i]||''),info.sourceName||'',info.commission||'',vnDate(record.reviewed_at||p.publishedDate||record.created_at),vnDate(inventory.confirmedAt?.[slug]),vnDate(source.updated_at||record.updated_at),p.frontage??'',p.roadWidth??'',p.sidewalk===true||p.sidewalk==='yes'?'Có':p.sidewalk===false||p.sidewalk==='no'?'Không':'Chưa rõ',p.pricePerM2??'','https://nguonchothue.vn'+(slug.startsWith('hn-')?'/bds/'+slug+'/':'/tin?slug='+slug),[...new Set([p.image,...(p.media||[]).filter(m=>m.kind==='image').map(m=>'/api/files?action=media&id='+m.id)].filter(Boolean))].map(url=>url.startsWith('/')?'https://nguonchothue.vn'+url:url).join('\n'),info.mapUrl||'',({published:'Đã đăng',pending:'Chờ duyệt',rejected:'Đã gỡ'})[record.status||'published']||record.status,p.floors??'',p.bedrooms??'',p.bathrooms??'',trackedPriceNotes(privateData),slug].map(v=>v??'');
}
export async function managedStock(){
 // Never export private columns through the public stock endpoint.
 const [legacy,canonical,privateRows,sources,publicBase]=await Promise.all([listings(),canonicalRows(),all('posts','select=id,private_data,created_at,reviewed_at,status&'),all('property_sources','select=slug,data,updated_at&'),readFile(new URL('../public/listings.json',import.meta.url),'utf8').then(JSON.parse)]);
 const privateIndex=new Map(privateRows.map(r=>[r.id,r])),sourceIndex=new Map(sources.map(r=>[r.slug,r]));
 const records=[...legacy.map(p=>({public_data:publicBase.find(row=>row.slug===p.slug)||p,address:p.address,status:'published'})),...canonical.map(r=>({...r,...privateIndex.get(r.id),public_data:r.public_data}))];
 const inventory=await inventoryData(records.map(r=>({...r.public_data,publishedAt:r.reviewed_at||r.public_data.publishedDate||r.created_at})));
 return [stockHeaders,...records.map(r=>stockSheetRow(r.public_data,r,sourceIndex.get(r.public_data.slug),inventory))];
}
export function sheetColumn(n){let result='';for(;n>0;n=Math.floor((n-1)/26))result=String.fromCharCode(65+(n-1)%26)+result;return result}
export function sheetFormatting(sheetId,rows,columns,{stock=false}={}){
 const range={sheetId,startRowIndex:0,endRowIndex:Math.max(rows,2),startColumnIndex:0,endColumnIndex:columns};
 const requests=[{setBasicFilter:{filter:{range}}},{repeatCell:{range:{...range,endRowIndex:1},cell:{userEnteredFormat:{backgroundColor:{red:.16,green:.25,blue:.36},textFormat:{bold:true,foregroundColor:{red:1,green:1,blue:1}},wrapStrategy:'WRAP',verticalAlignment:'MIDDLE'}},fields:'userEnteredFormat'}},{updateDimensionProperties:{range:{sheetId,dimension:'ROWS',startIndex:0,endIndex:1},properties:{pixelSize:48},fields:'pixelSize'}},{repeatCell:{range:{...range,startRowIndex:1},cell:{userEnteredFormat:{wrapStrategy:'CLIP',verticalAlignment:'TOP'}},fields:'userEnteredFormat.wrapStrategy,userEnteredFormat.verticalAlignment'}},{updateDimensionProperties:{range:{sheetId,dimension:'COLUMNS',startIndex:0,endIndex:columns},properties:{pixelSize:155},fields:'pixelSize'}}];
 if(stock){for(const [index,width]of [[0,110],[1,360],[10,300],[12,420],[20,230],[28,260]])requests.push({updateDimensionProperties:{range:{sheetId,dimension:'COLUMNS',startIndex:index,endIndex:index+1},properties:{pixelSize:width},fields:'pixelSize'}});for(const [text,color]of [['Còn hàng',{red:.83,green:.95,blue:.86}],['Đã cho thuê',{red:.9,green:.9,blue:.9}],['Chờ xác nhận',{red:1,green:.94,blue:.75}],['Tạm dừng cho thuê',{red:1,green:.83,blue:.8}]])requests.push({addConditionalFormatRule:{index:0,rule:{ranges:[{sheetId,startRowIndex:1,endRowIndex:Math.max(rows,2),startColumnIndex:8,endColumnIndex:9}],booleanRule:{condition:{type:'TEXT_EQ',values:[{userEnteredValue:text}]},format:{backgroundColor:color}}}}})}
 return requests;
}
