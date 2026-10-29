import {parseSourceNumber,monthlyFromUnit} from './source-pricing.mjs';
import {fileURLToPath} from 'node:url';
import {problem} from './platform.mjs';
export async function exportDocument(rows,format,title){
 const columns=[...new Set(rows.flatMap(row=>Object.keys(row)))];
 if(format==='txt')return {buffer:Buffer.from('\uFEFF'+title+'\n\n'+rows.map((row,i)=>'=== '+(i+1)+' ===\n'+columns.map(key=>key+': '+String(row[key]??'')).join('\n')).join('\n\n'),'utf8'),mime:'text/plain; charset=utf-8'};
 if(format==='xlsx'){
  const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Du lieu');
  sheet.columns=columns.map(key=>({header:key,key,width:28}));
  for(const row of rows)sheet.addRow(Object.fromEntries(columns.map(key=>[key,String(row[key]??'')])));
  sheet.getRow(1).font={bold:true};sheet.views=[{state:'frozen',ySplit:1}];sheet.autoFilter={from:'A1',to:{row:1,column:Math.max(columns.length,1)}};
  return {buffer:Buffer.from(await book.xlsx.writeBuffer()),mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
 }
 if(format==='docx'){
  const {Document,Packer,Paragraph,HeadingLevel}=await import('docx');
  const children=[new Paragraph({text:title,heading:HeadingLevel.TITLE})];
  for(const [i,row] of rows.entries()){children.push(new Paragraph({text:`${i+1}. ${row['Tiêu đề']||row['Họ và tên']||row['Mã']||'Hồ sơ'}`,heading:HeadingLevel.HEADING_2}));for(const key of columns)children.push(new Paragraph({text:key+': '+String(row[key]??'')}))}
  return {buffer:await Packer.toBuffer(new Document({sections:[{children}]})),mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
 }
 if(format==='pdf'){
  const {default:PDFDocument}=await import('pdfkit');const document=new PDFDocument({margin:45,autoFirstPage:true}),chunks=[];
  const done=new Promise((resolve,reject)=>{document.on('data',c=>chunks.push(c));document.on('end',()=>resolve(Buffer.concat(chunks)));document.on('error',reject)});
  document.font(fileURLToPath(new URL('./fonts/DejaVuSans.ttf',import.meta.url))).fontSize(19).text(title).moveDown();
  for(const [i,row] of rows.entries()){document.fontSize(13).text(`${i+1}. ${row['Tiêu đề']||row['Họ và tên']||row['Mã']||'Hồ sơ'}`).moveDown(.4);for(const key of columns)document.fontSize(10).text(key+': '+String(row[key]??''));document.moveDown()}
  document.end();return {buffer:await done,mime:'application/pdf'};
 }
 throw problem(400,'Chọn định dạng Excel, Word, PDF hoặc Text.');
}
export async function extractDocument(buffer,mime){
 if(mime.includes('openxmlformats')){
  const {default:JSZip}=await import('jszip');const zip=await JSZip.loadAsync(buffer);
  const entries=Object.values(zip.files);
  if(entries.length>1500||entries.reduce((sum,file)=>sum+(file._data?.uncompressedSize||0),0)>40*1024*1024)throw problem(413,'Tài liệu có quá nhiều nội dung giải nén. Vui lòng chia nhỏ tệp.');
 }
 if(mime==='text/plain')return buffer.toString('utf8').slice(0,60000);
 if(mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
  const {default:mammoth}=await import('mammoth');return (await mammoth.extractRawText({buffer})).value.slice(0,60000);
 }
 if(mime==='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
  const {default:ExcelJS}=await import('exceljs');const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer);const lines=[];
  for(const sheet of workbook.worksheets){sheet.eachRow(row=>{if(lines.length<600)lines.push(row.values.slice(1).map(value=>typeof value==='object'?value?.text||value?.result||'':value??'').join(' | '))})}
  return lines.join('\n').slice(0,60000);
 }
 if(mime==='application/pdf'){
  const {PDFParse}=await import('pdf-parse');const parser=new PDFParse({data:new Uint8Array(buffer)});
  try{return (await parser.getText({first:30})).text.slice(0,60000)}finally{await parser.destroy()}
 }
 throw problem(400,'Tệp chưa được hỗ trợ trích xuất nội dung.');
}
export async function spreadsheetDrafts(buffer){
 const {default:ExcelJS}=await import('exceljs');const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer);
 const items=[];const normalized=value=>String(value??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().trim();
 for(const sheet of workbook.worksheets){
  const header=sheet.getRow(1).values.slice(1).map(normalized);
  const find=(row,terms)=>{const index=header.findIndex(h=>terms.some(t=>h===t||h.startsWith(t+' (')));return index<0?'':String(row.getCell(index+1).text||'')};
  sheet.eachRow((row,i)=>{if(i===1||items.length>=30)return;
   const title=find(row,['tieu de cong khai','tieu de']),type=find(row,['danh muc','loai bds']),area=find(row,['khu vuc']);if(!title&&!type&&!area)return;
   const pricePerM2=parseSourceNumber(find(row,['don gia','don gia dong/m²/thang'])),size=parseSourceNumber(find(row,['dien tich']).replace(/(?:m²|m2)/giu,'')),price=pricePerM2>0?monthlyFromUnit(pricePerM2,size):parseSourceNumber(find(row,['gia thue','gia thue trieu/thang']));
   items.push({title,area,type,floors:find(row,['so tang']),bedrooms:find(row,['so phong ngu','phong ngu','pn']),bathrooms:find(row,['so phong wc','phong wc','so wc','wc']),transferPrice:parseSourceNumber(find(row,['gia chuyen nhuong','gia sang nhuong','gia nhuong']))||null,transferNegotiable:/^(?:có|co|true|yes|1|on)$/i.test(find(row,['co the thuong luong gia chuyen nhuong','co the thuong luong'])),priceBasis:pricePerM2>0?'per_m2':'monthly',pricePerM2:pricePerM2>0?pricePerM2:null,location:find(row,['ten duong cong khai','vi tri cong khai','duong / vi tri cong khai']),description:find(row,['mo ta cong khai','mo ta bai dang']),price:Number.isFinite(price)?price:null,size:Number.isFinite(size)?size:null,sourceInfo:{ownerPhones:[1,2,3].map(i=>find(row,['sdt chu nha '+i,'chu nha '+i,'sdt chu '+i])),partnerPhones:[1,2,3].map(i=>find(row,['sdt doi tac '+i,'doi tac '+i])),sourceName:find(row,['ten nguon','nguon cua','nguon cung cap']),commission:find(row,['hoa hong','phi moi gioi','hoa hong — rieng tu']),mapUrl:find(row,['map','vi tri map','google maps','google maps — rieng tu'])},privateAddress:find(row,['dia chi rieng tu','dia chi day du','dia chi cu the — rieng tu']),hashtags:find(row,['hashtag'])});
  });
 }
 return items;
}
