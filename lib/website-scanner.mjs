import https from 'node:https';
import http from 'node:http';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {randomUUID} from 'node:crypto';
import {db,problem} from './platform.mjs';
import {scanURL,scanSources} from './scan-sources.mjs';
import {ingestResults} from './scan-results.mjs';
const RUN='scan-run:v1',LOCK='f48c8753-fdfa-4eab-a85f-712e01e7ed02',AGENT='NguonChoThueScanner';
export function publicIP(ip){
 if(isIP(ip)===6)return /^2[0-9a-f]{3}:/i.test(ip)&&!/^200[12]:/i.test(ip);
 if(isIP(ip)!==4)return false;const [a,b]=ip.split('.').map(Number);
 return !([0,10,127].includes(a)||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&[0,168].includes(b))||(a===100&&b>=64&&b<=127)||(a===198&&[18,19].includes(b)));
}
// Pin the validated DNS answer to the connection; validate every redirect again.
export async function readPage(raw,redirects=0){
 const {url}=scanURL(raw),u=new URL(url);if(redirects>3)throw Error('Quá nhiều chuyển hướng.');
 if(/(^|\.)facebook\.com$/i.test(u.hostname))throw Error('Facebook cần kết nối có quyền đọc bài.');
 const addresses=await Promise.race([lookup(u.hostname,{all:true}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('DNS quá thời gian chờ.')),6000);timer.unref()})]);
 if(!addresses.length||addresses.some(x=>!publicIP(x.address)))throw Error('Từ chối địa chỉ mạng riêng.');
 return new Promise((resolve,reject)=>{
  const request=(u.protocol==='https:'?https:http).get(u,{headers:{'User-Agent':AGENT+'/1.0 (+https://nguonchothue.vn)','Accept':'text/html,application/xhtml+xml,text/plain'},lookup:(_h,opts,cb)=>opts?.all?cb(null,[addresses[0]]):cb(null,addresses[0].address,addresses[0].family)},res=>{
   if([301,302,303,307,308].includes(res.statusCode)&&res.headers.location){res.resume();const next=new URL(res.headers.location,u);if(next.hostname!==u.hostname){reject(Error('Nguồn chuyển tên miền. Lưu link đích để kiểm tra lại.'));return}resolve(readPage(next.href,redirects+1));return}
   if(res.statusCode>=400){res.resume();reject(Object.assign(Error('HTTP '+res.statusCode),{httpStatus:res.statusCode}));return}
   if(!/text\/|application\/(?:xhtml\+xml|xml|json)/i.test(res.headers['content-type']||'')){res.resume();reject(Error('Nguồn không trả nội dung văn bản.'));return}
   let size=0,parts=[];res.on('data',b=>{size+=b.length;if(size>2*1024*1024){request.destroy(Error('Trang vượt 2 MB.'));return}parts.push(b)});res.on('end',()=>resolve({url:u.href,text:Buffer.concat(parts).toString('utf8')}));res.on('error',reject);
  });request.setTimeout(6000,()=>request.destroy(Error('Nguồn quá thời gian chờ.')));const total=setTimeout(()=>request.destroy(Error('Nguồn quá thời gian chờ.')),9000);total.unref();request.on('close',()=>clearTimeout(total));request.on('error',reject);
 });
}
export function robotsAllowed(text,path){
 let agents=[],rules=[],groups=[],hasRules=false;
 for(const line of text.split(/\r?\n/)){const m=line.replace(/#.*/,'').trim().match(/^([\w-]+)\s*:\s*(.*)$/);if(!m)continue;const key=m[1].toLowerCase(),value=m[2].trim();if(key==='user-agent'){if(hasRules){groups.push({agents,rules});agents=[];rules=[];hasRules=false}agents.push(value.toLowerCase())}else if(['allow','disallow'].includes(key)&&agents.length){rules.push({allow:key==='allow',path:value});hasRules=true}}
 groups.push({agents,rules});const exact=groups.filter(g=>g.agents.some(a=>a!=='*'&&AGENT.toLowerCase().includes(a))),selected=exact.length?exact:groups.filter(g=>g.agents.includes('*'));
 const matching=selected.flatMap(g=>g.rules).filter(r=>r.path&&new RegExp('^'+r.path.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\\\$$/,'$')).test(path)).sort((a,b)=>b.path.length-a.path.length||Number(b.allow)-Number(a.allow));return !matching.length||matching[0].allow;
}
const plain=v=>String(v??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const rentText=/cho\s*thuê|sang\s*nhượng|cần\s*thuê|tìm\s*(?:thuê|mặt bằng)/i;
export function pageListings(html,url){
 const candidates=[],seen=new Set();
 function walk(v,depth=0){if(!v||depth>12)return;if(Array.isArray(v)){v.slice(0,200).forEach(x=>walk(x,depth+1));return}if(typeof v!=='object')return;
 const title=plain(v.headline||v.name),description=plain(v.description||v.articleBody),type=String(v['@type']||'');
 if(title&&rentText.test(title)&&(/Product|RealEstateListing|Offer|Apartment|House|Article|Residence/i.test(type)||description.length>60)){
  const address=typeof v.address==='string'?v.address:Object.values(v.address||{}).filter(x=>typeof x==='string'&&!x.startsWith('http')).join(', ');const content=plain(title+'\n'+description+'\n'+address);
  let originalUrl;try{originalUrl=new URL(v.url||v.mainEntityOfPage?.['@id']||url,url).href}catch{return}
  if(new URL(originalUrl).hostname!==new URL(url).hostname)return;
  if(!seen.has(originalUrl)&&content.length>=60){seen.add(originalUrl);candidates.push({kind:/cần\s*thuê|tìm\s*(?:thuê|mặt bằng)/i.test(title)?'tenant':'owner',originalUrl,content,address:plain(address),authorName:plain(v.author?.name||v.seller?.name),postedAt:v.datePosted||v.datePublished||'',phone:plain(v.telephone||v.seller?.telephone||''),sources:[{name:new URL(url).hostname,url}],evidence:'Nội dung công khai đọc từ dữ liệu cấu trúc của trang; chưa xác minh.'})}
 }
 for(const value of Object.values(v))if(typeof value==='object')walk(value,depth+1);
 }
 for(const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{walk(JSON.parse(m[1]))}catch{}}
 return candidates.slice(0,30).map(r=>{const n=v=>v?Number(v.replace(',','.')):null;r.size=n(r.content.match(/(?:diện tích\s*[:：]?\s*)?(\d+(?:[.,]\d+)?)\s*m[²2]/i)?.[1]);r.frontage=n(r.content.match(/(?:mặt tiền|ngang)\s*[:：]?\s*(\d+(?:[.,]\d+)?)\s*m\b/i)?.[1]);r.rent=n(r.content.match(/(?:giá thuê|tiền thuê|cho thuê[^.]{0,20}giá)\s*[:：]?\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)\b/i)?.[1]);r.district=r.content.match(/Cầu Giấy|Hà Đông|Nam Từ Liêm|Bắc Từ Liêm|Thanh Xuân|Đống Đa|Ba Đình|Hoàn Kiếm|Hoàng Mai|Long Biên|Tây Hồ|Hai Bà Trưng|Chương Mỹ|Hoài Đức|Đông Anh|Gia Lâm|Thanh Trì/i)?.[0]||'';r.propertyType=/kho|xưởng/i.test(r.content)?'Kho xưởng':/văn phòng/i.test(r.content)?'Văn phòng':/mặt bằng|cửa hàng|ki.?ốt|sang\s*nhượng/i.test(r.content)?'Mặt bằng kinh doanh':/nguyên căn|nhà riêng/i.test(r.content)?'Nhà nguyên căn':'';if(r.postedAt&&(!Number.isFinite(Date.parse(r.postedAt))||Date.parse(r.postedAt)>Date.now()+60000))r.postedAt='';return r});
}
export function discoveryLinks(html,url){const found=[];for(const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){if(!rentText.test(plain(m[2])))continue;try{const u=new URL(m[1].replace(/&amp;/g,'&'),url);u.hash='';if(u.hostname===new URL(url).hostname&&u.href!==url)found.push(u.href)}catch{}}return [...new Set(found)].slice(0,3)}
export async function scanWebsite(source,{read=readPage}={}){
 const u=new URL(source.url);let robots='';
 try{robots=(await read(u.origin+'/robots.txt')).text}catch(e){if(e.httpStatus!==404&&e.httpStatus!==410)throw Error('Chưa kiểm tra được robots.txt: '+e.message)}
 const allowed=url=>robotsAllowed(robots,new URL(url).pathname+new URL(url).search);
 if(!allowed(source.url))return {status:'robots-blocked',message:'Nguồn không cho máy quét đọc đường dẫn này.',items:[]};
 const first=await read(source.url);if(new URL(first.url).origin!==u.origin)throw Error('Nguồn chuyển tên miền; cần lưu link đích để kiểm tra lại.');
 if(!allowed(first.url))throw Error('Đường dẫn đích bị robots.txt hạn chế.');
 const items=pageListings(first.text,first.url),links=discoveryLinks(first.text,first.url);let pages=1,failedPages=0;
 for(const link of links){if(!allowed(link))continue;try{const page=await read(link);if(new URL(page.url).origin!==u.origin||!allowed(page.url))continue;items.push(...pageListings(page.text,page.url));pages++}catch{failedPages++}}
 const unique=[...new Map(items.map(x=>[x.originalUrl,x])).values()].slice(0,50);
 return {status:unique.length?'read':'no-readable-listings',message:unique.length?`Đọc ${pages} trang, tìm ${unique.length} tin; ${failedPages} trang con lỗi.`:`Đọc ${pages} trang nhưng chưa trích được tin thuê/nhượng. Nguồn có thể cần bộ đọc riêng hoặc link danh mục.`,items:unique};
}
export async function latestScanRun(){const rows=await db('notification_log',{query:'?id=eq.'+LOCK+'&kind=eq.'+RUN+'&limit=1'});if(!rows[0])return null;try{const run=JSON.parse(rows[0].record_id);if(run.status==='running'&&Date.now()-Date.parse(run.at)>280000)return {...run,status:'interrupted',error:'Lượt quét bị gián đoạn. Bấm Quét ngay để chạy lại; tin đã lưu được lọc trùng.'};return run}catch{return null}}
export async function startScan(){
 const config=await scanSources(),old=(await db('notification_log',{query:'?id=eq.'+LOCK+'&limit=1'}))[0];let previous;try{previous=JSON.parse(old?.record_id||'null')}catch{}
 if(previous?.status==='running'&&Date.now()-Date.parse(previous.at)<280000)return {run:previous,started:false};
 const deferred=new Set(previous?.results?.filter(x=>x.status==='deferred').map(x=>x.sourceId)||[]);const enabled=config.items.filter(x=>x.enabled).sort((a,b)=>Number(deferred.has(b.id))-Number(deferred.has(a.id)));if(!enabled.length)throw problem(400,'Chưa có nguồn đang bật. Thêm link và chọn nguồn trước.');
 const run={id:randomUUID(),at:new Date().toISOString(),status:'running',received:0,added:0,total:enabled.length,results:[]};
 const row={id:LOCK,kind:RUN,record_id:JSON.stringify(run),sent:true,created_at:run.at};const rows=await db('notification_log',old?{method:'PATCH',query:'?id=eq.'+LOCK+'&created_at=eq.'+encodeURIComponent(old.created_at),body:row}:{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:row});
 if(!rows.length)throw problem(409,'Một lượt quét vừa bắt đầu. Tải lại để xem kết quả.');return {run,started:true,sources:enabled};
}
export async function executeScan(run,sources,{scan=scanWebsite}={}){
 const deadline=Date.now()+220000;
 async function save(){const rows=await db('notification_log',{method:'PATCH',query:'?id=eq.'+LOCK+'&created_at=eq.'+encodeURIComponent(run.at),body:{record_id:JSON.stringify(run)}});if(!rows.length)throw Error('Lượt quét đã được thay thế.')}
 try{
  for(const source of sources){
   let result={sourceId:source.id,url:source.url,added:0};
   if(source.platform==='facebook')result={...result,status:'requires-access',message:'Chưa có kết nối được cấp quyền đọc nhóm Facebook; chưa thu thập bài.'};
   else if(Date.now()>deadline)result={...result,status:'deferred',message:'Hết thời gian lượt này. Cần quét tiếp nguồn này.'};
   else try{const out=await scan(source);result={...result,status:out.status,message:out.message};if(out.items.length){const saved=await ingestResults({items:out.items});run.added+=saved.added;run.received+=saved.received;result.added=saved.added;result.received=saved.received}}catch(e){result={...result,status:'error',message:String(e.message).slice(0,300)}}
   run.results.push(result);if(source.platform!=='facebook'||run.results.length%25===0)await save();
  }
  run.status='completed';run.finishedAt=new Date().toISOString();await save();
 }catch{run.status='failed';run.error='Lượt quét bị gián đoạn khi lưu. Tin đã lưu được lọc trùng khi chạy lại.';try{await save()}catch{}}
 return run;
}
