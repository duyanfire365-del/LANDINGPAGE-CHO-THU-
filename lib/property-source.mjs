import {splitPrivateNotes} from './source-private-notes.mjs';
import {extractCommission,stripCommission,hasCommission} from './commission.mjs';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {actor,db,clean,problem} from './platform.mjs';
import {foldVietnamese} from './source-pricing.mjs';
import {listings} from '../api/admin.mjs';
const validSlug=slug=>/^(?:hn-\d{3}|live-\d{10,20})$/.test(slug||'');
const phone=value=>String(value||'').replace(/[\s.()–—-]/g,'');
const isPhone=value=>/^\+?\d{8,15}$/.test(value);
export function mapURL(value){
 const input=clean(value,1500);if(!input)return '';let decoded=input;try{decoded=decodeURIComponent(input)}catch{}if(hasCommission(decoded.replace(/\+/g,' ')))throw problem(400,'Vị trí Map không chứa thỏa thuận hoa hồng; hãy đưa vào ô hoa hồng riêng.');
 if(/^https?:|^\/\//i.test(input)){
  let url;try{url=new URL(input)}catch{throw problem(400,'Vị trí Map chưa đúng định dạng.');}
  const host=url.hostname.toLowerCase();if(url.protocol!=='https:'||url.username||url.password||url.port||!((['www.google.com','google.com'].includes(host)&&url.pathname.startsWith('/maps'))||host==='maps.google.com'||host==='maps.app.goo.gl'||(host==='goo.gl'&&url.pathname.startsWith('/maps'))))throw problem(400,'Chỉ nhập liên kết Google Maps HTTPS hoặc địa chỉ/tọa độ để tìm trên bản đồ.');
  return url.href;
 }
 if(/[<>]|^[a-z][a-z0-9+.-]*:/i.test(input))throw problem(400,'Vị trí Map chưa hợp lệ.');
 const coordinates=input.match(/^(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)$/);if(coordinates&&(Math.abs(Number(coordinates[1]))>90||Math.abs(Number(coordinates[2]))>180))throw problem(400,'Tọa độ chưa hợp lệ.');
 return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(input);
}
export function sourceInfo(body={}){
 const result={privateNotes:clean(body.privateNotes,8000),ownerPhones:[],partnerPhones:[],ownerPublic:[],partnerPublic:[],sourceName:stripCommission(clean(body.sourceName,150)),sourcePublic:body.sourcePublic===true,commission:clean(body.commission||extractCommission([body.sourceName,body.mapLabel].filter(Boolean).join('\n')),1000),mapUrl:mapURL(body.mapUrl||body.mapLocation),mapLabel:stripCommission(clean(body.mapLabel,300))};
 if(/https?:\/\/|www\.|maps\.app\.goo\.gl/i.test(result.sourceName))throw problem(400,'Tên nguồn không chứa liên kết; hãy đưa link Map vào ô riêng tư.');
 for(const group of ['owner','partner'])for(let i=0;i<3;i++){
  const value=phone(body[group+'Phones']?.[i]??body[group+'Phone'+(i+1)]);if(value&&!isPhone(value))throw problem(400,'Số điện thoại chủ nhà/đối tác cần từ 8 đến 15 chữ số.');
  result[group+'Phones'][i]=value;result[group+'Public'][i]=body[group+'Public']?.[i]===true||body[group+'Phone'+(i+1)+'Public']===true;
 }
 return result;
}
export function extractSourceInfo(source){
 const result={ownerPhones:[],partnerPhones:[],sourceName:'',commission:extractCommission(source),mapUrl:'',mapLabel:''};
 for(const rawLine of String(source||'').split(/[\r\n]+/)){
  const line=/[:：=]/.test(rawLine)?rawLine:rawLine.replace(/^(\s*(?:nguồn(?:\s+của|\s+từ)?|người cung cấp|chủ nhà\s*[123]?|đối tác\s*[123]?))\s+(?=\S)/iu,'$1: ');
  const split=line.search(/[:：=]/),label=foldVietnamese(split<0?line:line.slice(0,split)).replace(/[^a-z0-9]+/g,' ').trim().replace(/^(?:so dien thoai|dien thoai)\s*/,'sdt ').replace(/^so\s+(chu|doi tac|nguon)/,'$1'),content=split<0?line:line.slice(split+1).trim();
  const owner=/^(?:sdt\s*)?(?:chu(?: nha)?|chinh chu|cn|c)\s*[123]?$/.test(label),partner=/^(?:sdt\s*)?(?:doi tac|dt|nguon|nguon doi tac|sdt nguon|nguon cua|nguoi cung cap)\s*[123]?$/.test(label);
  if(owner||partner){const group=owner?'ownerPhones':'partnerPhones',values=[...content.matchAll(/(?:\+84|0)(?:[ .()-]*\d){9}(?!\d)/g)].map(m=>phone(m[0])).filter(isPhone);const slot=Number(label.match(/[123]$/)?.[0]||0);if(slot&&values[0])result[group][slot-1]=values[0];else for(const value of values)if(!result[group].includes(value)){const empty=[0,1,2].find(i=>!result[group][i]);if(empty!==undefined)result[group][empty]=value}
   if(partner&&!/^sdt |^dt\b/.test(label)&&!result.sourceName){const name=content.replace(/https?:\/\/\S+/gi,'').replace(/(?:\+?\d[\d .()–—-]{6,22}\d)/g,'').replace(/[;,|–—-]+$/,'').trim();if(name&&!/^https?:/i.test(name))result.sourceName=name.slice(0,150)}
  }
  if(/^(?:nguon cua|nguoi cung cap|ten nguon|nguon tu|nguon)$/.test(label)&&!result.sourceName)result.sourceName=content.replace(/https?:\/\/\S+/gi,'').replace(/(?:\+?\d[\d .()–—-]{6,22}\d)/g,'').replace(/[;,|–—-]+$/,'').trim().slice(0,150);
  const links=content.match(/https:\/\/(?:maps\.app\.goo\.gl|maps\.google\.com|(?:www\.)?google\.com\/maps|goo\.gl\/maps)[^\s<>]*/gi)||[];
  if(!result.mapUrl&&links[0]){try{result.mapUrl=mapURL(links[0].replace(/[),.;]+$/,''))}catch{}}
  if(/^(?:map|maps|google maps|vi tri map|vi tri maps|dinh vi|toa do|map chi duong)$/.test(label)&&content&&!result.mapUrl){try{result.mapUrl=mapURL(content);result.mapLabel=/^https:/i.test(content)?'':content.slice(0,300)}catch{}}
 }
 // Accept labels with names, inline labels and phone-first forms.
 for(const clause of String(source||'').split(/[\r\n;|]+/)){
  const folded=foldVietnamese(clause);
  const labels=[...folded.matchAll(/(?:chu nha|chinh chu|doi tac|nguon doi tac)(?:\s*([123]))?/g)];
  for(const m of clause.matchAll(/(?:\+?84|0)(?:[ .()–—-]*\d){9}(?!\d)/g)){
   const value=phone(m[0]);if(value.replace(/^\+?84/,'0')==='0906215365')continue;
   const before=labels.filter(l=>l.index<=m.index).at(-1),after=labels.find(l=>l.index>=m.index+m[0].length);
   const parenthetic=after&&/^[\s,(（-]*[（(]/.test(clause.slice(m.index+m[0].length,after.index));
   const selected=parenthetic?after:before||after;
   const distance=selected?(selected.index<=m.index?m.index-selected.index-selected[0].length:selected.index-m.index-m[0].length):Infinity;
   if(!selected||distance>100)continue;
   const nearest={label:selected};
   const group=/chu nha|chinh chu/.test(nearest.label[0])?'ownerPhones':'partnerPhones';
   const normalize=v=>String(v||'').replace(/^\+?84/,'0');
   const other=group==='ownerPhones'?'partnerPhones':'ownerPhones';result[other]=result[other].map(v=>normalize(v)===normalize(value)?'':v);
   if(result[group].some(v=>normalize(v)===normalize(value)))continue;
   const slot=Number(nearest.label[1]||0)-1,empty=[0,1,2].find(i=>!result[group][i]);
   if(slot>=0)result[group][slot]=value;else if(empty!==undefined)result[group][empty]=value;
  }
 }
 for(const group of ['ownerPhones','partnerPhones'])result[group]=result[group].map(v=>String(v||'').replace(/^\+?84/,'0')==='0906215365'?'':v);
 result.privateNotes=splitPrivateNotes(source).privateNotes;
 return sourceInfo(result); // Input text never enables public visibility or member grants.
}
export async function sourceRecord(slug){
 if(!validSlug(slug))throw problem(400,'Mã BĐS không hợp lệ.');
 if(slug.startsWith('hn-')){const publicRows=JSON.parse(await readFile(new URL('../public/listings.json',import.meta.url),'utf8')),post=publicRows.find(p=>p.slug===slug);if(!post)throw problem(404,'Không tìm thấy tin.');return {slug,post,owner:null,published:true,privateAddress:async()=>{const row=(await listings()).find(r=>r.slug===slug);return row?.address||''},base:{}}}
 const rows=await db('posts',{query:'?public_data->>slug=eq.'+encodeURIComponent(slug)+'&limit=1'}),row=rows[0];if(!row)throw problem(404,'Không tìm thấy tin.');
 return {slug,post:row.public_data,owner:row.author_id,published:row.status==='published',privateAddress:async()=>row.private_data?.address||'',base:{...extractSourceInfo(row.private_data?.sourceText||''),...(row.private_data?.sourceInfo||{})}};
}
async function stored(slug){try{return (await db('property_sources',{query:'?slug=eq.'+slug+'&limit=1'}))[0]||null}catch{throw problem(503,'Cần chạy database/006_property_sources.sql trong Supabase SQL Editor để bật lưu thông tin nguồn và chia sẻ Map.')}}
async function context(req,slug,{write=false}={}){const who=await actor(req),record=await sourceRecord(slug),row=await stored(slug),canEdit=who.admin||!!record.owner&&record.owner===who.id&&who.kind==='sales'&&who.can_post;if(!who.admin&&record.owner!==who.id&&!row?.shared_with?.includes(who.id))throw problem(403,'Anh/chị chưa được chia sẻ nguồn BĐS này.');if(write&&!canEdit)throw problem(403,'Chỉ quản trị viên hoặc người đăng được cấp quyền mới sửa thông tin nguồn.');return {who,record,row,canEdit}}
async function save(record,row,patch){const data={slug:record.slug,owner_id:record.owner,data:row?.data||sourceInfo(record.base),shared_with:row?.shared_with||[],map_shares:row?.map_shares||[],updated_at:new Date().toISOString(),...patch};await db('property_sources',{method:'POST',query:'?on_conflict=slug',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:data});return data}
export async function getSource(req,slug){const {who,record,row,canEdit}=await context(req,slug);const canViewCommission=who.admin||record.owner===who.id;const data=sourceInfo({...record.base,...(row?.data||{})});if(!canViewCommission){delete data.commission;delete data.privateNotes;}if(!data.mapUrl){const address=await record.privateAddress();if(address){data.mapUrl=mapURL(address);data.mapLabel='Tìm theo địa chỉ nguồn; cần đối chiếu vị trí thực tế.'}}
 let sharedEmails=[],recipients=[];if(canEdit&&row?.shared_with?.length){const members=await db('profiles',{query:'?id=in.('+row.shared_with.join(',')+')&select=id,email,full_name,phone,kind'});sharedEmails=members.map(m=>m.email);recipients=members.map(p=>({...((row?.data?.sharingRecipients||[]).find(r=>r.id===p.id)||{}),id:p.id,email:p.email,fullName:p.full_name,phone:p.phone,kind:p.kind}))}
 return {slug,code:record.post.code,data,canEdit,canViewCommission,sharedEmails,recipients,activeShares:canEdit?(row?.map_shares||[]).filter(s=>s.expiresAt>Date.now()).length:0};}
export async function publicSource(slug){const record=await sourceRecord(slug);if(!record.published)throw problem(404,'Tin chưa được đăng.');const row=await stored(slug),data=sourceInfo({...record.base,...(row?.data||{})});return {ownerPhones:data.ownerPhones.filter((p,i)=>p&&data.ownerPublic[i]&&p.replace(/^\+?84/,'0')==='0906215365'),partnerPhones:data.partnerPhones.filter((p,i)=>p&&data.partnerPublic[i]&&p.replace(/^\+?84/,'0')==='0906215365'),sourceName:data.sourcePublic?data.sourceName:''};}
export async function saveSource(req,body){const {record,row}=await context(req,body.slug,{write:true}),data=sourceInfo({...record.base,...(row?.data||{}),...(body.data||{})}),emails=[...new Set(String(body.sharedEmails||'').toLowerCase().split(/[\s,;]+/).filter(Boolean))];if(emails.length>20||emails.some(e=>! /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(e)))throw problem(400,'Nhập tối đa 20 email thành viên hợp lệ, cách nhau bằng dấu phẩy.');
 const members=emails.length?await db('profiles',{query:'?email=in.('+emails.map(encodeURIComponent).join(',')+')&select=id,email'}):[];if(members.length!==emails.length)throw problem(400,'Có email chưa đăng ký thành viên. Anh/chị kiểm tra lại email cần cấp quyền.');
 const recipients=Array.isArray(body.recipients)?body.recipients:null;
 if(recipients){if(recipients.length>20)throw problem(400,'Chỉ chia sẻ tối đa 20 thành viên mỗi nguồn.');const ids=[...new Set(recipients.map(r=>String(r.id||'')))];if(ids.some(id=>! /^[a-f0-9-]{36}$/i.test(id)))throw problem(400,'Chọn tài khoản thành viên hợp lệ.');const profiles=ids.length?await db('profiles',{query:'?id=in.('+ids.join(',')+')&select=id,email,full_name,phone,kind'}):[];if(profiles.length!==ids.length)throw problem(400,'Có tài khoản không còn tồn tại.');data.sharingRecipients=profiles.map(p=>{const r=recipients.find(r=>r.id===p.id),year=String(r.birthYear||'');if(year&&(!/^\d{4}$/.test(year)||Number(year)<1900||Number(year)>new Date().getFullYear()))throw problem(400,'Năm sinh chưa hợp lệ.');return {id:p.id,email:p.email,fullName:p.full_name,phone:p.phone,kind:p.kind,birthYear:year,address:clean(r.address,300),purpose:clean(r.purpose,500),updatedAt:new Date().toISOString()}});await save(record,row,{data,shared_with:ids});}
 else await save(record,row,{data:{...data,sharingRecipients:row?.data?.sharingRecipients||[]},shared_with:members.map(m=>m.id)});return {saved:true};}
const digest=value=>createHash('sha256').update(value).digest('hex');
export async function createMapShare(req,body){const {record,row}=await context(req,body.slug,{write:true}),data=sourceInfo({...record.base,...(row?.data||{})});if(!data.mapUrl){const address=await record.privateAddress();if(address)data.mapUrl=mapURL(address)}if(!data.mapUrl)throw problem(400,'Chưa có vị trí Map để chia sẻ. Nhập Map rồi lưu thông tin trước.');const hours=Number(body.hours||24);if(![24,72,168].includes(hours))throw problem(400,'Thời hạn chia sẻ không hợp lệ.');const token=randomBytes(32).toString('base64url'),expiresAt=Date.now()+hours*3600000,shares=(row?.map_shares||[]).filter(s=>s.expiresAt>Date.now()).slice(-4);shares.push({hash:digest(token),expiresAt});await save(record,row,{data,map_shares:shares});return {url:'https://nguonchothue.vn/api/workspace?view=source-map&slug='+record.slug+'&token='+token,expiresAt};}
export async function revokeMapShares(req,body){const {record,row}=await context(req,body.slug,{write:true});await save(record,row,{map_shares:[]});return {revoked:true};}
export async function mapShare(slug,token){if(!/^[A-Za-z0-9_-]{43}$/.test(token||''))throw problem(404,'Liên kết không hợp lệ hoặc đã hết hạn.');const record=await sourceRecord(slug),row=await stored(slug);if(!record.published)throw problem(404,'Liên kết không còn khả dụng.');const hash=digest(token),grant=(row?.map_shares||[]).find(s=>s.expiresAt>Date.now()&&/^[a-f0-9]{64}$/.test(s.hash)&&timingSafeEqual(Buffer.from(s.hash),Buffer.from(hash)));if(!grant)throw problem(404,'Liên kết đã hết hạn hoặc được thu hồi.');const data=sourceInfo(row.data);if(!data.mapUrl)throw problem(404,'Chưa có vị trí Map.');return {code:record.post.code,mapUrl:data.mapUrl,mapLabel:data.mapLabel,expiresAt:grant.expiresAt};}
export async function sharedSources(req){const who=await actor(req);if(who.admin)return [];const rows=await db('property_sources',{query:'?shared_with=cs.'+encodeURIComponent('{'+who.id+'}')+'&select=slug&limit=100'});const result=[];for(const row of rows){try{const record=await sourceRecord(row.slug);result.push({slug:row.slug,code:record.post.code,title:record.post.title})}catch{}}return result}

export async function sourceAccess(req,slug){const {canEdit}=await context(req,slug);return {canView:true,canEdit}}

export async function findSourceMembers(req,slug,query){await context(req,slug,{write:true});const q=clean(query,100);if(q.length<2)throw problem(400,'Nhập ít nhất 2 ký tự để tìm thành viên.');const rows=await db('profiles',{query:'?select=id,email,full_name,phone,kind&order=created_at.desc&limit=500'}),needle=foldVietnamese(q),digits=q.replace(/[^0-9]/g,'');return rows.filter(p=>foldVietnamese(p.full_name||'').includes(needle)||String(p.email||'').toLowerCase().includes(q.toLowerCase())||(digits.length>=3&&String(p.phone||'').replace(/[^0-9]/g,'').includes(digits))).slice(0,20);}
