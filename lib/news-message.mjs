const slash=/^\s*\/(tintuc|nhaptintuc|gotintuc)(?:@\w+)?(?:\s|$)/iu;
const tag=/(?<!\S)#tintuc(?![\p{L}\p{N}_])/giu;
const prefix=/^[ \t]*(?:tin[ \t]+tức|tin[ \t]+tuc)(?=$|[\s:：–—-])[ \t]*(?:[:：–—-][ \t]*)?/iu;
const label=/^[ \t]*(?:tin[ \t]+tức|tin[ \t]+tuc)[ \t]*[:：–—-]?[ \t]*$/gimu;
const sourceLine=/^[ \t]*(?:nguồn(?:[ \t]+tin[ \t]+tức)?(?:[ \t]+để[ \t]+kiểm[ \t]+chứng)?|source)[ \t]*[:：][ \t]*(.*)$/iu;
export function messageNewsLinks(message){return [...new Set([...(Array.isArray(message.entities)?message.entities:[]),...(Array.isArray(message.caption_entities)?message.caption_entities:[])].filter(e=>e?.type==='text_link'&&typeof e.url==='string').map(e=>e.url))].slice(0,5);}
export function parseNewsMessage(text,{force=false,links=[]}={}){
 text=String(text||'').replace(/\r\n?/g,'\n');const match=text.match(slash);let kind,marked=false;
 if(match){kind=match[1].toLowerCase();text=text.slice(match[0].length);}
 else{const tagged=[...text.matchAll(tag)].length>0,starts=prefix.test(text),standalone=new RegExp(label.source,label.flags).test(text);if(!tagged&&!starts&&!standalone&&!force)return null;kind='tintuc';marked=true;text=text.replace(tag,'').replace(label,'').replace(prefix,'');}
 if(kind==='gotintuc')return {kind};
 const lines=text.trim().split('\n'),title=(lines.shift()||'').replace(/^tiêu đề:[ \t]*/iu,'').trim();let source_url='',excerpt='',hasSource=false;
 const body=lines.filter(line=>{const source=line.match(sourceLine);if(source){hasSource=true;const url=source[1].match(/https?:\/\/[^\s<>"']+/iu)?.[0]?.replace(/[.,;]+$/,'');if(!source_url)source_url=url||(/^[a-z][a-z\d+.-]*:/iu.test(source[1])?source[1]:'');return marked||!url;}if(/^tóm tắt:[ \t]*/iu.test(line)){excerpt=line.replace(/^tóm tắt:[ \t]*/iu,'').trim();return false;}return true}).join('\n').trim();
 if(!title||!body)return {kind,help:true};
 let content=body;const additional=links.filter(link=>/^https:\/\//iu.test(link)&&!text.includes(link));if(additional.length){content+='\n\nNguồn tin tức để kiểm chứng:\n'+additional.join('\n');hasSource=true;}
 if(marked&&!source_url)source_url=(additional[0]||content.match(/https:\/\/[^\s<>"']+/iu)?.[0]||'').replace(/[.,;]+$/,'');
 if(marked&&!hasSource&&!source_url){const http=content.match(/http:\/\/[^\s<>"']+/iu)?.[0];content+='\n\nNguồn tin tức: '+(http||'Nội dung do người đăng cung cấp.');}
 return {kind,title,content,excerpt,source_url,status:kind==='nhaptintuc'?'draft':'published'};
}
