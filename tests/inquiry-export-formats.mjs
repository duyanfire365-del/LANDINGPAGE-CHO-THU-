import assert from 'node:assert/strict';
import {exportDocument} from '../lib/documents.mjs';
import ExcelJS from 'exceljs';import JSZip from 'jszip';
const rows=[{'Họ và tên':'Khách thuê','Nhu cầu':'KH quan tâm thuê (nhượng)','Giá':30,'Đơn vị':'triệu/tháng'},{'Họ và tên':'Chủ bán','Nhu cầu':'Ký gửi bán','Giá':5500,'Đơn vị':'triệu đồng'},{'Họ và tên':'Chủ thuê','Nhu cầu':'Ký gửi cho thuê','Giá':15,'Đơn vị':'triệu/tháng'},{'Họ và tên':'Chủ nhượng','Nhu cầu':'Ký gửi chuyển nhượng','Giá':230,'Đơn vị':'triệu đồng'}];
const x=await exportDocument(rows,'xlsx','Khách và ký gửi'),book=new ExcelJS.Workbook();await book.xlsx.load(x.buffer);assert.equal(book.worksheets[0].rowCount,5);assert.equal(book.worksheets[0].getRow(3).getCell(3).text,'5500');assert.equal(book.worksheets[0].getRow(3).getCell(4).text,'triệu đồng');
const d=await exportDocument(rows,'docx','Khách và ký gửi'),zip=await JSZip.loadAsync(d.buffer),xml=await zip.file('word/document.xml').async('string');assert(xml.includes('Ký gửi bán'));assert(xml.includes('Ký gửi chuyển nhượng'));
const p=await exportDocument(rows,'pdf','Khách và ký gửi');assert.equal(p.buffer.slice(0,4).toString(),'%PDF');
const t=await exportDocument(rows,'txt','Khách và ký gửi');for(const row of rows)assert(t.buffer.toString().includes(row['Nhu cầu']));assert(t.mime.includes('charset=utf-8'));
console.log('PASS unified four-intent Excel, Word, Vietnamese PDF and UTF-8 Text exports with one-off and monthly price units kept separate.');
