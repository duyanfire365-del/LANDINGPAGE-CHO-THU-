import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import PDFDocument from 'pdfkit';
import {scanUpload,linkPreview} from '../lib/scan-sources.mjs';
async function pdf(draw,options={}){const doc=new PDFDocument(options),chunks=[];const done=new Promise((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject)});draw(doc);doc.end();return done}
const file=b=>({name:'nguon.PDF',base64:b.toString('base64')});
const fixture=await pdf(doc=>{doc.text('https://example.com/property');doc.text('Nhom Facebook',72,120,{link:'https://www.facebook.com/groups/123456/'});doc.text('https://example.com/property')});
const links=linkPreview(await scanUpload(file(fixture)));assert.equal(links.items.length,2);assert.equal(links.items[1].platform,'facebook');assert(links.duplicates>=1);
assert.equal(linkPreview(await scanUpload(file(await readFile('public/scan-template.pdf')))).items.length,0);
await assert.rejects(scanUpload(file(Buffer.from('not PDF'))),{status:400});
await assert.rejects(scanUpload(file(Buffer.from('%PDF-1.7\nbroken data'))),{status:400});
await assert.rejects(scanUpload(file(await pdf(doc=>doc.rect(10,10,50,50).fill('red')))),e=>e.status===400&&e.message.includes('OCR'));
await assert.rejects(scanUpload(file(await pdf(doc=>{for(let i=1;i<101;i++)doc.addPage()}))),{status:413});
await assert.rejects(scanUpload(file(await pdf(doc=>doc.text('https://example.com'),{userPassword:'locked-test-password'}))),e=>e.status===400&&e.message.includes('mật khẩu'));
console.log('PASS PDF upload: text URLs, embedded hyperlinks, deduplication, PDF template, wrong/corrupt format, scan/OCR feedback, 100-page cap and locked PDF.');
