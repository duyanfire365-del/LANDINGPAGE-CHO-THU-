import format from '../public/article-format.js';
import {problem} from './platform.mjs';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const isArticleCredit=text=>/^\s*Biên soạn\s*:/iu.test(text);
export function safeArticleLink(value){if(typeof value!=='string'||value.length>2000||/[\u0000-\u0020]/u.test(value))throw problem(400,'Liên kết trong bài viết không hợp lệ.');if(value.startsWith('/')&&!value.startsWith('//'))return value;try{const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error();return u.href}catch{throw problem(400,'Liên kết bài viết cần bắt đầu bằng https:// hoặc http://.')}}
export function normalizeRichArticle(doc){
 if(doc==null)return null;
 const fail=()=>{throw problem(400,'Định dạng bài viết không hợp lệ. Hãy dùng các lựa chọn trên thanh soạn thảo.');};
 if(typeof doc!=='object'||Array.isArray(doc)||(doc.version!==undefined&&doc.version!==1)||!Array.isArray(doc.ops)||doc.ops.length>4000||JSON.stringify(doc).length>300000)fail();
 const known=new Set(['bold','italic','underline','strike','script','font','size','color','background','link','header','list','indent','align','blockquote']);let length=0,newlines=0;
 const ops=doc.ops.map(op=>{
  if(!op||typeof op!=='object'||Array.isArray(op)||Object.keys(op).some(k=>!['insert','attributes'].includes(k))||typeof op.insert!=='string')fail();
  const insert=op.insert.replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');length+=insert.length;newlines+=(insert.match(/\n/g)||[]).length;if(length>50001||newlines>2000)fail();
  if(op.attributes!==undefined&&(!op.attributes||typeof op.attributes!=='object'||Array.isArray(op.attributes)))fail();const attributes={};
  for(const [k,v]of Object.entries(op.attributes||{})){
   if(!known.has(k))fail();if(v===false||v==null)continue;
   if(['bold','italic','underline','strike','blockquote'].includes(k)){if(v!==true)fail();attributes[k]=true;}
   else if(k==='font'){if(typeof v!=='string'||!Object.hasOwn(format.fonts,v))fail();attributes[k]=v;}
   else if(k==='size'){if(!format.sizes.includes(v))fail();attributes[k]=v;}
   else if(k==='color'||k==='background'){if(typeof v!=='string'||!/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(v))fail();attributes[k]=(v.length===4?'#'+[...v.slice(1)].map(c=>c+c).join(''):v).toLowerCase();}
   else if(k==='link')attributes.link=safeArticleLink(v);
   else if(k==='script'){if(!['super','sub'].includes(v))fail();attributes[k]=v;}
   else if(k==='header'){if(!Number.isInteger(v)||v<1||v>6)fail();attributes[k]=v;}
   else if(k==='list'){if(!['ordered','bullet'].includes(v))fail();attributes[k]=v;}
   else if(k==='indent'){if(!Number.isInteger(v)||v<0||v>6)fail();if(v)attributes[k]=v;}
   else if(k==='align'){if(!['left','center','right','justify'].includes(v))fail();if(v!=='left')attributes[k]=v;}
  }
  return {insert,...(Object.keys(attributes).length?{attributes}:{})};
 }).filter(op=>op.insert.length);
 if(!ops.length||!ops.map(op=>op.insert).join('').trim())throw problem(400,'Vui lòng nhập nội dung bài viết.');
 if(!ops.at(-1).insert.endsWith('\n'))ops.push({insert:'\n'});
 const result={version:1,ops};if(Buffer.byteLength(JSON.stringify(result))>300000)fail();return result;
}
export const richArticleText=doc=>doc.ops.map(op=>op.insert).join('').replace(/\n$/,'').trim();
function inline(text,a,linkify){let html=a.link?escape(text):linkify(text);for(const [key,tag]of [['bold','strong'],['italic','em'],['underline','u'],['strike','s']])if(a[key])html='<'+tag+'>'+html+'</'+tag+'>';if(a.script)html='<'+(a.script==='super'?'sup':'sub')+'>'+html+'</'+(a.script==='super'?'sup':'sub')+'>';const style=[];if(a.font)style.push('font-family:'+format.fonts[a.font].family);if(a.size)style.push('font-size:'+a.size);if(a.color)style.push('color:'+a.color);if(a.background)style.push('background-color:'+a.background);if(style.length)html='<span style="'+escape(style.join(';'))+'">'+html+'</span>';return a.link?'<a href="'+escape(a.link)+'" target="_blank" rel="noopener noreferrer">'+html+'</a>':html;}
export function renderRichArticle(doc,linkify=escape){
 const normalized=normalizeRichArticle(doc);if(!normalized)return '';
 const lines=[];let html='',text='';for(const op of normalized.ops){const a=op.attributes||{},parts=op.insert.split('\n');for(let i=0;i<parts.length;i++){if(parts[i]){html+=inline(parts[i],a,linkify);text+=parts[i];}if(i<parts.length-1){lines.push({html:html||'<br>',text,a});html='';text='';}}}
 let out='',list='';for(const line of lines){const a=line.a,type=a.list==='ordered'?'ol':a.list==='bullet'?'ul':'';if(list&&list!==type){out+='</'+list+'>';list='';}if(type&&!list){out+='<'+type+'>';list=type;}const tag=type?'li':a.header?'h'+Math.max(2,a.header):a.blockquote?'blockquote':'p',classes=[];if(isArticleCredit(line.text))classes.push('news-credit');if(a.align)classes.push('article-align-'+a.align);if(a.indent)classes.push('article-indent-'+a.indent);out+='<'+tag+(classes.length?' class="'+classes.join(' ')+'"':'')+'>'+line.html+'</'+tag+'>';}
 return out+(list?'</'+list+'>':'');
}
