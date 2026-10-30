import defaults from './site-content-defaults.json' with {type:'json'};
import {randomUUID} from 'node:crypto';
import {db,configured,problem} from './platform.mjs';
import {prepareWebsiteLogo,websiteLogoMetadata,websiteLogoImage} from './website-logo.mjs';
const ID='3e8dab88-35f0-44ee-9d22-918e139c18bd',KIND='site-content:v1';
async function record(){return configured()?(await db('notification_log',{query:'?id=eq.'+ID+'&kind=eq.'+KIND+'&limit=1'}))[0]:null}
function decode(row){if(!row)return {revision:null,content:structuredClone(defaults),logo:null};try{const d=JSON.parse(row.record_id);if(!d.content||!d.revision)throw Error();return d}catch{throw problem(503,'Chưa đọc được nội dung website.')}}
function text(v,max=500,required=true){if(typeof v!=='string'||v.length>max||required&&!v.trim())throw problem(400,'Nội dung trống hoặc quá dài.');return v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim()}
export function safeContentURL(v,empty=false){v=text(v,2000,!empty);if(!v&&empty)return '';if(/^#[a-z0-9_-]*$/i.test(v)||/^\/(?!\/)[a-z0-9/_#?=&.%+-]*$/i.test(v))return v;try{const u=new URL(v);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href}catch{}throw problem(400,'Liên kết phải dùng https://, đường dẫn nội bộ hoặc #mục.');}
export function validateSiteContent(input){if(!input||typeof input!=='object')throw problem(400,'Nội dung không hợp lệ.');const c={};for(const k of Object.keys(defaults)){if(['faqs','faqGroups','socials','links'].includes(k))continue;c[k]=text(input[k],['faqIntro','faqNote','description','phoneNote','copyright'].includes(k)?2000:300)}
 if(!/^\+?[0-9 ()-]{7,25}$/.test(c.phone))throw problem(400,'Hotline không hợp lệ.');c.mapUrl=safeContentURL(c.mapUrl);
 if(!Array.isArray(input.faqGroups)||input.faqGroups.length!==2)throw problem(400,'Cần hai nhóm câu hỏi.');c.faqGroups=input.faqGroups.map(x=>text(x,150));
 if(!Array.isArray(input.faqs)||input.faqs.length<1||input.faqs.length>40)throw problem(400,'Danh sách từ 1 đến 40 câu hỏi.');c.faqs=input.faqs.map(x=>({question:text(x.question,500),answer:text(x.answer,6000),group:x.group===1?1:0}));
 for(const key of ['socials','links']){if(!Array.isArray(input[key])||input[key].length>20)throw problem(400,'Tối đa 20 liên kết mỗi danh sách.');c[key]=input[key].map(x=>({label:text(x.label,100),url:safeContentURL(x.url,key==='socials')}))}return c;
}
async function dto(d){const header=d.logo?{}:await websiteLogoMetadata();return {revision:d.revision,faqCustomized:JSON.stringify(d.content.faqs)!==JSON.stringify(defaults.faqs),content:d.content,logo:{custom:!!d.logo,mode:d.logo?'custom':'header',alt:d.logo?.alt||header.alt,url:d.logo?'/api/files?action=footer-logo&rev='+d.revision:header.url||'/logo.png'}}}
export async function siteContent(){return dto(decode(await record()))}
export async function footerLogoImage(){const d=decode(await record());if(d.logo)return {bytes:Buffer.from(d.logo.base64,'base64'),revision:d.revision};return websiteLogoImage()}
export async function saveSiteContent(body){const old=await record(),d=decode(old);if((body.revision??null)!==d.revision)throw problem(409,'Nội dung vừa được thay đổi. Tải lại trước khi lưu.');let next={...d,revision:randomUUID()};
 if(body.action==='site-content-save')next.content=validateSiteContent(body.content);
 else if(body.action==='site-content-reset')next.content=structuredClone(defaults);
 else if(body.action==='site-content-logo-save')next.logo={...await prepareWebsiteLogo(body.base64),alt:text(body.alt||'Logo cuối trang',120)};
 else if(body.action==='site-content-logo-reset')next.logo=null;
 else throw problem(400,'Thao tác không hợp lệ.');
 const patch={record_id:JSON.stringify(next),created_at:new Date(Math.max(Date.now(),Date.parse(old?.created_at)||0)+1).toISOString()};const rows=old?await db('notification_log',{method:'PATCH',query:'?id=eq.'+ID+'&kind=eq.'+KIND+'&created_at=eq.'+encodeURIComponent(old.created_at),body:patch}):await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{id:ID,kind:KIND,sent:true,...patch}});if(!rows.length)throw problem(409,'Nội dung vừa thay đổi. Tải lại trước khi lưu.');return {saved:true,...await dto(next)};
}
