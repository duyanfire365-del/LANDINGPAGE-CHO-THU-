import {validateLayout,prepareSiteImage} from './site-layout.mjs';
import defaults from './site-content-defaults.json' with {type:'json'};
import saleDefaults from '../public/sale-content-defaults.json' with {type:'json'};
import {randomUUID} from 'node:crypto';
import {db,configured,problem} from './platform.mjs';
import {prepareWebsiteLogo,websiteLogoMetadata,websiteLogoImage} from './website-logo.mjs';
const IDS={rent:'3e8dab88-35f0-44ee-9d22-918e139c18bd',sale:'b514c8e9-461f-4a29-a6d3-8273a84f9fb2'},KIND='site-content:v1';
export function siteTransaction(value){if(value==null||value==='rent')return 'rent';if(value==='sale')return 'sale';throw problem(400,'Tab chỉnh sửa không hợp lệ.');}
const defaultContent=transaction=>transaction==='sale'?saleDefaults:defaults;
async function record(transaction='rent'){const ID=IDS[transaction];return configured()?(await db('notification_log',{query:'?id=eq.'+ID+'&kind=eq.'+KIND+'&limit=1'}))[0]:null}
function decode(row,transaction='rent'){if(!row)return {revision:null,content:structuredClone(defaultContent(transaction)),logo:null};try{const d=JSON.parse(row.record_id);if(!d.content||!d.revision)throw Error();return d}catch{throw problem(503,'Chưa đọc được nội dung website.')}}
function text(v,max=500,required=true){if(typeof v!=='string'||v.length>max||required&&!v.trim())throw problem(400,'Nội dung trống hoặc quá dài.');return v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim()}
export function safeContentURL(v,empty=false){v=text(v,2000,!empty);if(!v&&empty)return '';if(/^#[a-z0-9_-]*$/i.test(v)||/^\/(?!\/)[a-z0-9/_#?=&.%+-]*$/i.test(v))return v;try{const u=new URL(v);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href}catch{}throw problem(400,'Liên kết phải dùng https://, đường dẫn nội bộ hoặc #mục.');}
export function safeSocialURL(v){if(typeof v==='string'&&/^viber:\/\/chat\?number=(?:%2[Bb]|\+)[1-9][0-9]{6,14}$/.test(v.trim()))return 'viber://chat?number=%2B'+decodeURIComponent(v.trim().split('number=')[1]).slice(1);return safeContentURL(v,true);}
export function validateSiteContent(input,transaction='rent'){if(!input||typeof input!=='object')throw problem(400,'Nội dung không hợp lệ.');const c={};for(const k of Object.keys(defaults)){if(['faqs','faqGroups','socials','links'].includes(k))continue;c[k]=text(input[k],['faqIntro','faqNote','description','phoneNote','copyright'].includes(k)?2000:300)}
 if(!/^\+?[0-9 ()-]{7,25}$/.test(c.phone))throw problem(400,'Hotline không hợp lệ.');c.mapUrl=safeContentURL(c.mapUrl);
 if(!Array.isArray(input.faqGroups)||input.faqGroups.length!==2)throw problem(400,'Cần hai nhóm câu hỏi.');c.faqGroups=input.faqGroups.map(x=>text(x,150));
 if(!Array.isArray(input.faqs)||input.faqs.length<1||input.faqs.length>40)throw problem(400,'Danh sách từ 1 đến 40 câu hỏi.');c.faqs=input.faqs.map(x=>({question:text(x.question,500),answer:text(x.answer,6000),group:x.group===1?1:0}));
 for(const key of ['socials','links']){if(!Array.isArray(input[key])||input[key].length>20)throw problem(400,'Tối đa 20 liên kết mỗi danh sách.');c[key]=input[key].map(x=>({label:text(x.label,100),url:key==='socials'?safeSocialURL(x.url):safeContentURL(x.url)}))}c.layout=validateLayout(input.layout,safeContentURL);if(transaction==='sale'){const layout=c.layout,base=structuredClone(saleDefaults.layout);c.layout={...base,...layout,fields:{...base.fields,...layout?.fields},banner:layout?.banner||base.banner,menu:layout?.menu??base.menu,quick:Object.fromEntries(Object.keys(base.quick).map(k=>[k,input.layout?.quick&&Object.hasOwn(input.layout.quick,k)?layout.quick[k]:base.quick[k]]))};}return c;
}
async function dto(d,transaction='rent'){const header=d.logo?{}:await websiteLogoMetadata();return {transaction,revision:d.revision,faqCustomized:JSON.stringify(d.content.faqs)!==JSON.stringify(defaultContent(transaction).faqs),content:d.content,canUndo:!!d.history?.length,logo:{custom:!!d.logo,mode:d.logo?'custom':'header',alt:d.logo?.alt||header.alt,url:d.logo?'/api/files?action=footer-logo&transaction='+transaction+'&rev='+d.revision:header.url||'/logo.png'}}}
export async function siteContent(value){const transaction=siteTransaction(value);return dto(decode(await record(transaction),transaction),transaction)}
export async function footerLogoImage(value){const transaction=siteTransaction(value),d=decode(await record(transaction),transaction);if(d.logo)return {bytes:Buffer.from(d.logo.base64,'base64'),revision:d.revision};return websiteLogoImage()}
export async function saveSiteContent(body){const transaction=siteTransaction(body.transaction),ID=IDS[transaction],old=await record(transaction),d=decode(old,transaction);if((body.revision??null)!==d.revision)throw problem(409,'Nội dung vừa được thay đổi. Tải lại trước khi lưu.');if(body.action==='site-content-validate')return {validated:true,content:validateSiteContent(body.content,transaction)};if(body.action==='site-content-image')return {image:await prepareSiteImage(body.base64)};let next={...d,revision:randomUUID()};
 if(body.action==='site-content-save')next.content=validateSiteContent(body.content,transaction);
 else if(body.action==='site-content-undo'){if(!d.history?.length)throw problem(400,'Chưa có bản lưu trước để khôi phục.');next.content=d.history.at(-1);next.history=d.history.slice(0,-1);}
 else if(body.action==='site-content-reset')next.content=structuredClone(defaultContent(transaction));
 else if(body.action==='site-content-logo-save')next.logo={...await prepareWebsiteLogo(body.base64),alt:text(body.alt||'Logo cuối trang',120)};
 else if(body.action==='site-content-logo-reset')next.logo=null;
 else throw problem(400,'Thao tác không hợp lệ.');
 if(['site-content-save','site-content-reset'].includes(body.action))next.history=[...(d.history||[]),d.content].slice(-8);
 while(next.history?.length&&JSON.stringify(next).length>6000000)next.history.shift();
 if(JSON.stringify(next.content).length>2000000)throw problem(413,'Nội dung và ảnh vượt 2 MB. Giảm số ảnh hoặc dùng liên kết ảnh để lưu.');
 const patch={record_id:JSON.stringify(next),created_at:new Date(Math.max(Date.now(),Date.parse(old?.created_at)||0)+1).toISOString()};const rows=old?await db('notification_log',{method:'PATCH',query:'?id=eq.'+ID+'&kind=eq.'+KIND+'&created_at=eq.'+encodeURIComponent(old.created_at),body:patch}):await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{id:ID,kind:KIND,sent:true,...patch}});if(!rows.length)throw problem(409,'Nội dung vừa thay đổi. Tải lại trước khi lưu.');return {saved:true,...await dto(next,transaction)};
}
