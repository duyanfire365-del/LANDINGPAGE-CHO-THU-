import {getVercelOidcTokenSync} from '@vercel/functions/oidc';
import {createHash,randomUUID} from 'node:crypto';
import {db,problem} from './platform.mjs';
import {categories} from './listing-content.mjs';
const gatewayToken=()=>{if(process.env.AI_GATEWAY_API_KEY)return process.env.AI_GATEWAY_API_KEY;try{return getVercelOidcTokenSync()||process.env.VERCEL_OIDC_TOKEN||''}catch{return process.env.VERCEL_OIDC_TOKEN||''}};
const hash=v=>createHash('sha256').update(v).digest('hex');
const uuid=v=>{const s=hash(v);return s.slice(0,8)+'-'+s.slice(8,12)+'-4'+s.slice(13,16)+'-8'+s.slice(17,20)+'-'+s.slice(20,32)};
const concepts={generic:'a clean generic rental space',coffee_office:'a coffee and coworking design concept',retail:'a neutral retail interior',restaurant:'a generic dining interior',office:'a generic workspace',warehouse:'a generic storage interior',home:'a generic residential interior'};
export function illustrationConcept(text,type){
 const s=String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
 if(/ca phe|cafe|coffee/.test(s))return 'coffee_office';
 if(/quan an|nha hang|quan nhau|lau|banh cuon/.test(s))return 'restaurant';
 return type==='Kho xưởng'?'warehouse':type==='Văn phòng'?'office':type==='Mặt bằng kinh doanh'?'retail':/Nhà|Căn hộ|Biệt thự|Phòng/.test(type)?'home':'generic';
}
export function sourceImageConfiguration(){
 const gateway=gatewayToken();
 const provider=gateway?'gateway':process.env.OPENAI_API_KEY?'openai':'gateway';
 return {provider,ready:!!(gateway||process.env.OPENAI_API_KEY),model:process.env.SOURCE_IMAGE_MODEL||(provider==='gateway'?'google/gemini-3.1-flash-image':'gpt-image-1'),dailyLimit:null};
}
export function illustrationPrompt(type,concept){return 'Create a realistic architectural concept illustration for a Vietnamese rental property website. Property category: '+type+'. Concept: '+concepts[concept]+'. Balanced soft daylight, a restrained warm palette, clean and inviting composition, landscape 3:2, central content visible in mobile crops. Generic representative design, never a reconstruction of a specific real property. No people, text, numbers, house signs, addresses, branding, logos or watermarks. Do not depict an identifiable location or make claims about actual amenities, floor count, area or legal status.';}
function providerError(status){if(status===401||status===403)return problem(503,'Dịch vụ ảnh AI chưa được cấp quyền hoặc cần xác minh thanh toán trên Vercel AI Gateway.');if(status===402)return problem(503,'Dịch vụ ảnh AI chưa có số dư hoặc đã đạt ngân sách.');if(status===429)return problem(503,'Dịch vụ ảnh AI đang giới hạn lượt; đã giữ bài và dùng ảnh dự phòng.');return problem(502,'Dịch vụ ảnh AI chưa hoàn tất; bài nguồn được giữ để thử lại.');}
async function claimAttempt(jobId){
 const day=new Date().toISOString().slice(0,10),today=day+'T00:00:00.000Z';
 const attempts=await db('notification_log',{query:'?kind=eq.source-image:slot&record_id=eq.'+jobId+'&created_at=gte.'+encodeURIComponent(today)+'&select=id'});
 if(attempts.length>=3)throw problem(429,'Ảnh này đã thử 3 lần hôm nay; dùng ảnh dự phòng và thử lại sau.');
 await db('notification_log',{method:'POST',body:{id:randomUUID(),kind:'source-image:slot',record_id:jobId,sent:false}});
}
async function generateBytes(config,prompt){
 const gateway=config.provider==='gateway',key=gateway?gatewayToken():process.env.OPENAI_API_KEY;
 const response=await fetch(gateway?'https://ai-gateway.vercel.sh/v1/chat/completions':'https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(gateway?{model:config.model,messages:[{role:'user',content:prompt}],modalities:['image','text']}:{model:config.model,prompt,n:1,size:'1536x1024',quality:'low',output_format:'jpeg'}),signal:AbortSignal.timeout(150000)});
 if(!response.ok)throw providerError(response.status);
 if(Number(response.headers.get('content-length'))>20000000)throw problem(502,'Ảnh AI vượt giới hạn dung lượng.');
 const data=await response.json();let encoded;
 if(gateway){const message=data.choices?.[0]?.message,uri=message?.images?.[0]?.image_url?.url||(Array.isArray(message?.content)?message.content.find(p=>p.type==='image_url')?.image_url?.url:null);const match=typeof uri==='string'&&uri.match(/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);encoded=match?.[1];}
 else encoded=data.data?.[0]?.b64_json;
 if(typeof encoded!=='string'||encoded.length>14500000)throw problem(502,'Dịch vụ chưa trả ảnh AI hợp lệ.');
 const sharp=(await import('sharp')).default;
 try{return await sharp(Buffer.from(encoded,'base64'),{limitInputPixels:25000000}).rotate().resize(1536,1024,{fit:'cover',position:'attention'}).flatten({background:'#fff'}).toColourspace('srgb').jpeg({quality:88}).toBuffer()}catch{throw problem(502,'Ảnh AI không đọc được.');}
}
export async function createSourceIllustration({requestId,type,concept='generic',namespace='telegram'}){
 if(!categories.includes(type)||!Object.hasOwn(concepts,concept)||!['telegram','publishing'].includes(namespace)||!/^[-a-zA-Z0-9._:]{8,128}$/.test(requestId||''))throw problem(400,'Thông tin tạo ảnh minh họa không hợp lệ.');
 const id=uuid(namespace+':'+requestId),path='editor-ai/'+namespace+'/'+id+'.jpg',name='Ảnh minh họa AI — '+type+' — '+concept;
 const found=(await db('assets',{query:'?path=eq.'+path}))[0];if(found){if(found.name!==name)throw problem(409,'Mã ảnh đã được dùng với nội dung khác.');return {...found,reused:true};}
 const config=sourceImageConfiguration();if(!config.ready)throw problem(503,'Chưa kết nối dịch vụ tạo ảnh AI; cần AI Gateway hoặc khóa OpenAI có số dư.');
 const lockId=uuid('source-image-lock:'+id),nonce=randomUUID();let claimed=false;
 const lock=(await db('notification_log',{method:'POST',query:'?on_conflict=id',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:{id:lockId,kind:'source-image:working',record_id:nonce,sent:false}}))[0];
 if(lock)claimed=true;
 else{
  const old=(await db('notification_log',{query:'?id=eq.'+lockId}))[0];
  if(old&&(old.kind==='source-image:failed'||Date.now()-Date.parse(old.created_at)>360000))claimed=(await db('notification_log',{method:'PATCH',query:'?id=eq.'+lockId+'&record_id=eq.'+encodeURIComponent(old.record_id)+'&kind=eq.'+old.kind,body:{kind:'source-image:working',record_id:nonce,created_at:new Date().toISOString()}})).length>0;
 }
 if(!claimed)throw problem(409,'Ảnh đang được tạo; không gọi AI thêm lần nữa.');
 try{
  await claimAttempt(id);
  const bytes=await generateBytes(config,illustrationPrompt(type,concept)),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response=await fetch(process.env.SUPABASE_URL.replace(/\/$/,'')+'/storage/v1/object/rental-private/'+path,{method:'POST',headers:{apikey:key,...(key.startsWith('sb_')?{}:{Authorization:'Bearer '+key}),'Content-Type':'image/jpeg','x-upsert':'true'},body:bytes,signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw problem(502,'Chưa lưu được ảnh AI vào kho website.');
  const rows=await db('assets',{method:'POST',query:'?on_conflict=path',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:{owner_id:null,path,name,mime:'image/jpeg',kind:'image',size:bytes.length}});
  await db('notification_log',{method:'PATCH',query:'?id=eq.'+lockId+'&record_id=eq.'+nonce,body:{kind:'source-image:done',sent:true}});
  return rows[0];
 }catch(error){await db('notification_log',{method:'PATCH',query:'?id=eq.'+lockId+'&record_id=eq.'+nonce,body:{kind:'source-image:failed'}}).catch(()=>{});throw error;}
}
