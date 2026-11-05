const slash=/^\s*\/(tintuc|nhaptintuc|gotintuc)(?:@\w+)?(?:\s|$)/iu;
const tag=/(?<!\S)#tintuc(?![\p{L}\p{N}_])/giu;
const prefix=/^[ \t]*(?:tin[ \t]+tức|tin[ \t]+tuc)(?=$|[\s:：–—-])[ \t]*(?:[:：–—-][ \t]*)?/iu;
const label=/^[ \t]*(?:tin[ \t]+tức|tin[ \t]+tuc)[ \t]*[:：–—-]?[ \t]*$/gimu;
const experienceTag=/(?<!\S)#kinhnghiemmbkd(?![\p{L}\p{N}_])/giu;
const experiencePrefix=/^[ \t]*(?:kinh[ \t]+nghiệm[ \t]+(?:tìm[ \t]+)?mbkd|kinh[ \t]+nghiem[ \t]+(?:tim[ \t]+)?mbkd)(?=$|[\s:：–—-])[ \t]*(?:[:：–—-][ \t]*)?/iu;
const experienceLabel=/^[ \t]*(?:kinh[ \t]+nghiệm[ \t]+(?:tìm[ \t]+)?mbkd|kinh[ \t]+nghiem[ \t]+(?:tim[ \t]+)?mbkd)[ \t]*[:：–—-]?[ \t]*$/gimu;
const experienceCommand=/^\s*\/(kinhnghiemmbkd|nhapkinhnghiemmbkd)(?:@\w+)?(?:\s|$)/iu;
const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().trim();
function industryKey(raw){const n=fold(raw),aliases={cafe:['cafe','ca phe','do uong','ca phe / do uong'],food:['food','an uong','nha hang','hang an','nha hang / an uong'],spa:['spa','tham my','spa / tham my'],office:['office','van phong'],retail:['retail','ban le','cua hang','ban le / cua hang'],warehouse:['warehouse','kho','xuong','kho / xuong'],other:['other','nganh khac'],'':['chung','tong hop','kinh nghiem chung']};return Object.entries(aliases).find(([,values])=>values.includes(n))?.[0]??raw;}
const sourceLine=/^[ \t]*(?:nguồn(?:[ \t]+tin[ \t]+tức|[ \t]+tham[ \t]+khảo)?(?:[ \t]+để[ \t]+kiểm[ \t]+chứng)?|source)[ \t]*[:：][ \t]*(.*)$/iu;
export function messageNewsLinks(message){return [...new Set([...(Array.isArray(message.entities)?message.entities:[]),...(Array.isArray(message.caption_entities)?message.caption_entities:[])].filter(e=>e?.type==='text_link'&&typeof e.url==='string').map(e=>e.url))].slice(0,5);}
export function parseNewsMessage(text,{force=false,links=[],section='news'}={}){
 text=String(text||'').replace(/\r\n?/g,'\n');const exp=text.match(experienceCommand),isExperience=!!exp||[...text.matchAll(experienceTag)].length>0||experiencePrefix.test(text)||new RegExp(experienceLabel.source,experienceLabel.flags).test(text);if(isExperience){if([...text.matchAll(tag)].length>0||text.match(slash))return {kind:'tintuc',help:true};section='experience';text=exp?text.slice(exp[0].length):text.replace(experienceTag,'').replace(experienceLabel,'').replace(experiencePrefix,'');text=(exp?.[1].toLowerCase()==='nhapkinhnghiemmbkd'?'/nhaptintuc ':'#tintuc\n')+text;}const match=text.match(slash);let kind,marked=false;
 if(match){kind=match[1].toLowerCase();text=text.slice(match[0].length);}
 else{const tagged=[...text.matchAll(tag)].length>0,starts=prefix.test(text),standalone=new RegExp(label.source,label.flags).test(text);if(!tagged&&!starts&&!standalone&&!force)return null;kind='tintuc';marked=true;text=text.replace(tag,'').replace(label,'').replace(prefix,'');}
 if(kind==='gotintuc')return {kind};
 const lines=text.trim().split('\n'),title=(lines.shift()||'').replace(/^tiêu đề:[ \t]*/iu,'').trim();let source_url='',excerpt='',hasSource=false,industry;
 const body=lines.filter(line=>{if(section==='experience'&&/^[ \t]*ngành(?:[ \t]+hàng)?[ \t]*[:：]/iu.test(line)){industry=industryKey(line.replace(/^[ \t]*ngành(?:[ \t]+hàng)?[ \t]*[:：][ \t]*/iu,''));return false;}const source=line.match(sourceLine);if(source){hasSource=true;const url=source[1].match(/https?:\/\/[^\s<>"']+/iu)?.[0]?.replace(/[.,;]+$/,'');if(!source_url)source_url=url||(/^[a-z][a-z\d+.-]*:/iu.test(source[1])?source[1]:'');return marked||!url;}if(/^tóm tắt:[ \t]*/iu.test(line)){excerpt=line.replace(/^tóm tắt:[ \t]*/iu,'').trim();return false;}return true}).join('\n').trim();
 if(!title||!body)return {kind,help:true};
 let content=body;const additional=links.filter(link=>/^https:\/\//iu.test(link)&&!text.includes(link));if(additional.length){content+='\n\n'+(section==='experience'?'Nguồn tham khảo':'Nguồn tin tức để kiểm chứng')+':\n'+additional.join('\n');hasSource=true;}
 if(marked&&!source_url)source_url=(additional[0]||content.match(/https:\/\/[^\s<>"']+/iu)?.[0]||'').replace(/[.,;]+$/,'');
 if(marked&&!hasSource&&!source_url){const http=content.match(/http:\/\/[^\s<>"']+/iu)?.[0];content+='\n\n'+(section==='experience'?'Nguồn tham khảo':'Nguồn tin tức')+': '+(http||'Nội dung do người đăng cung cấp.');}
 return {kind,section,...(industry!==undefined?{industry}:{}),title,content,excerpt,source_url,status:kind==='nhaptintuc'?'draft':'published'};
}
