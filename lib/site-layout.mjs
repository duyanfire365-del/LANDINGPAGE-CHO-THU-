import sharp from 'sharp';
import schema from '../public/site-layout-schema.json' with {type:'json'};
import {problem} from './platform.mjs';
export function validateLayout(input,safeURL){
 if(input==null)return null;
 const fail=()=>{throw problem(400,'Cấu hình giao diện không hợp lệ. Tải lại hoặc kiểm tra bản sao lưu.');};
 if(typeof input!=='object'||Array.isArray(input))fail();
 const obj=x=>{if(!x||typeof x!=='object'||Array.isArray(x))fail();return x;};
 const txt=(x,n=2000,empty=true)=>{if(typeof x!=='string'||x.length>n||(!empty&&!x.trim()))fail();return x.trim().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');};
 const list=(x,n)=>{if(!Array.isArray(x)||x.length>n)fail();return x;};
 const fields={};if(!input.fields||typeof input.fields!=='object'||Array.isArray(input.fields))fail();for(const [k,v] of Object.entries(input.fields)){if(!schema.fields.some(x=>x.id===k))fail();fields[k]=txt(v);}
 const imageURL=v=>{if(typeof v==='string'&&v.startsWith('data:')){if(v.length>500000||!/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(v))fail();const b=Buffer.from(v.slice(23),'base64');if(b.subarray(0,4).toString()!=='RIFF'||b.subarray(8,12).toString()!=='WEBP')fail();return v;}return safeURL(txt(v,2000),true);};
 const seen=new Set(),sections=list(input.sections,36).map(x=>{obj(x);const id=txt(x.id,80,false);if(seen.has(id))fail();seen.add(id);if(schema.sections.some(s=>s.id===id))return {id,hidden:x.hidden===true};if(!/^custom-[a-z0-9-]{1,60}$/.test(id))fail();return {id,hidden:x.hidden===true,title:txt(x.title,300,false),text:txt(x.text,12000),image:imageURL(x.image),links:list(x.links,20).map(l=>({label:txt(obj(l).label,100,false),url:safeURL(l.url)}))};});
 for(const s of schema.sections)if(!seen.has(s.id))sections.push({id:s.id,hidden:true});
 const menu=input.menu===null?null:list(input.menu,30).map(x=>({label:txt(obj(x).label,100,false),url:safeURL(x.url)}));
 const categories=list(input.categories,schema.categories.length).map(x=>{obj(x);if(!schema.categories.includes(x.id))fail();return {id:x.id,label:txt(x.label,100,false),hidden:x.hidden===true};});if(new Set(categories.map(x=>x.id)).size!==categories.length)fail();
 const theme={};for(const k of ['primary','background']){const v=input.theme?.[k];if(v!=null){if(!/^#[0-9a-f]{6}$/i.test(v))fail();theme[k]=v;}}
 return {fields,sections,menu,categories,theme,banner:imageURL(input.banner||''),quick:{badge:txt(input.quick?.badge||'CLICK XEM NGAY',60,false),title:txt(input.quick?.title||'TÌM NGUỒN THUÊ NGAY',150,false),text:txt(input.quick?.text||'Hỗ trợ tìm thuê nhanh & chính xác theo nhu cầu',300,false),hidden:input.quick?.hidden===true},footerHidden:input.footerHidden===true};
}

export async function prepareSiteImage(base64){
 if(typeof base64!=='string'||base64.length>2800000||! /^[A-Za-z0-9+/]+={0,2}$/.test(base64))throw problem(400,'Chọn ảnh PNG/JPEG/WebP tối đa 2 MB.');
 try{const bytes=Buffer.from(base64,'base64');if(bytes.length>2097152)throw Error();const image=sharp(bytes,{limitInputPixels:16000000}),meta=await image.metadata();if(!['png','jpeg','webp'].includes(meta.format)||(meta.pages||1)>1)throw Error();const data=await image.rotate().resize({width:1920,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer();if(data.length>350000)throw problem(400,'Ảnh nhiều chi tiết quá lớn. Hãy dùng ảnh nhỏ hơn.');return 'data:image/webp;base64,'+data.toString('base64');}catch(e){if(e.status)throw e;throw problem(400,'Không đọc được ảnh. Chọn ảnh tĩnh PNG/JPEG/WebP tối đa 2 MB, 16 triệu điểm ảnh.');}
}
