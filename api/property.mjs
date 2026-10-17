import {readFile} from 'node:fs/promises';
import {configured,db} from '../lib/platform.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default async function handler(req,res){
 if(req.method!=='GET'){res.writeHead(405);return res.end('Method not allowed')}
 try{
  const slug=new URL(req.url,'http://localhost').searchParams.get('slug');
  if(!/^live-\d{10,20}$/.test(slug||'')||!configured()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});return res.end('Tin chưa được đăng hoặc đã được gỡ.')}
  const rows=await db('posts',{query:'?status=eq.published&public_data->>slug=eq.'+encodeURIComponent(slug)+'&select=public_data&limit=1'});
  const post=rows[0]?.public_data;if(!post){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});return res.end('Không tìm thấy tin.')}
  const origin=(process.env.SITE_URL||'https://webchothue.vercel.app').replace(/\/$/,'');
  let page=await readFile(new URL('../public/tin.html',import.meta.url),'utf8');
  page=page.replace('<title>Chi tiết BĐS | Nguồn cho thuê Hà Nội</title>',`<title>${escape(post.title)} | Nguồn cho thuê Hà Nội</title><meta name="description" content="${escape(post.description)}"><meta property="og:type" content="article"><meta property="og:title" content="${escape(post.title)}"><meta property="og:description" content="${escape(post.description)}"><meta property="og:url" content="${escape(origin+post.href)}"><meta property="og:image" content="${escape(new URL(post.image,origin).href)}">`);
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(page);
 }catch{res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('Chưa tải được tin. Vui lòng thử lại.')}
}
