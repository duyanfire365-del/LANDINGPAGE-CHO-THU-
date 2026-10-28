import {canonicalRows} from './listing-catalog.mjs';
import {pickIllustration} from './illustration-library.mjs';
import {renderLibraryIllustration} from './illustration-library-build.mjs';
import {brandingQR} from './branding-settings.mjs';
import {send} from './http.mjs';
export default async function handler(req,res){
 try{
  if(req.method!=='GET')return send(res,405,{error:'Chỉ hỗ trợ xem ảnh.'});
  const slug=new URL(req.url,'http://localhost').searchParams.get('slug');
  if(!slug||slug.length>180||!/^[-a-zA-Z0-9_]+$/.test(slug))return send(res,400,{error:'Mã tin không hợp lệ.'});
  // A public, published banner-only listing must exist. No arbitrary image prompts or generation requests.
  const rows=await canonicalRows(),post=rows.find(r=>r.public_data.slug===slug&&r.status==='published')?.public_data;
  if(!post||post.illustrationKind!=='banner'||post.media?.some(m=>m.kind==='image'))return send(res,404,{error:'Không tìm thấy ảnh minh họa.'});
  const item=pickIllustration(post);if(!item?.generated)return send(res,404,{error:'Tin dùng ảnh có sẵn trong kho.'});
  const qr=await brandingQR(),bytes=await renderLibraryIllustration(item,item.variant,qr.bytes);
  res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=3600, s-maxage=86400','X-Content-Type-Options':'nosniff'});return res.end(bytes);
 }catch(error){return send(res,error.status||502,{error:'Chưa dựng được ảnh minh họa.'});}
}
