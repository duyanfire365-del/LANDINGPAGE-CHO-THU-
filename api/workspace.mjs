import {saveCommand,previewCommand,executeRun} from '../lib/google-commands.mjs';
import {customerRows,getCustomer,saveCustomer,refreshCustomer,customerScope,matchNewStock} from '../lib/customers.mjs';
import {customerHook,connectCustomerBot,createCustomerImport,processCustomerImport,retryCustomerImport} from '../lib/customer-imports.mjs';
import {syncCustomerSheet,sheetReady,autoCustomerSheet} from '../lib/customer-sheets.mjs';
import {findSourceMembers,getSource,publicSource,saveSource,createMapShare,revokeMapShares,mapShare,sharedSources,sourceAccess} from '../lib/property-source.mjs';
import {formPricing} from '../lib/source-pricing.mjs';
import {updateInventory} from '../lib/inventory.mjs';
import {waitUntil} from '@vercel/functions';
import {canonicalizeSubset,persistIdentities} from '../lib/listing-catalog.mjs';
import {readJson,send,sameOrigin,limited} from '../lib/http.mjs';
import {actor,requireAdmin,db,clean,notify,configured,telegramConfiguration} from '../lib/platform.mjs';
import {draft} from '../lib/posts.mjs';
import {intentLabels} from '../lib/inquiries.mjs';
export default async function handler(req,res){
 try{
  const customerParams=new URL(req.url,'http://localhost').searchParams;
  if(req.method==='POST'&&customerParams.has('customer-hook'))return await customerHook(req,res,promise=>waitUntil(promise));
  if(req.method==='GET'){
   const params=new URL(req.url,'http://localhost').searchParams;
   if(params.get('view')==='google-commands'){requireAdmin(req);const commands=await db('google_commands',{query:'?order=created_at.desc&limit=100'}),runs=await db('google_runs',{query:'?select=id,command_id,status,config,result,error,created_at&order=created_at.desc&limit=20'});return send(res,200,{commands,runs});}
   if(params.get('view')==='google-run'){requireAdmin(req);const id=params.get('id');if(!/^[a-f0-9-]{36}$/i.test(id||''))return send(res,400,{error:'Mã lượt không hợp lệ.'});const run=(await db('google_runs',{query:'?id=eq.'+id}))[0];if(!run)return send(res,404,{error:'Không tìm thấy lượt chạy.'});return send(res,200,{run});}
   if(params.get('view')==='customers'){const who=await actor(req),offset=Math.max(0,Math.min(100000,Number(params.get('offset'))||0));const rows=await customerRows(who,{offset,limit:21,q:params.get('q'),status:params.get('status'),type:params.get('type'),area:params.get('area'),budget:params.get('budget'),sort:params.get('sort')});const imports=await db('customer_imports',{query:'?order=created_at.desc&limit=10'+customerScope(who)});let items=rows.slice(0,20),matchError='';if(items.length)try{const {publicStock,customerMatches}=await import('../lib/customers.mjs'),stock=await publicStock();items=items.map(row=>({...row,matchCount:row.status==='closed'?0:customerMatches(row.data,stock).length}))}catch{matchError='Chưa cập nhật được nguồn; bấm Gợi ý nguồn phù hợp để thử lại.'}return send(res,200,{items,matchError,hasMore:rows.length>20,imports:imports.map(({payload,...r})=>({...r,text:payload.text||payload.extractedText||'',name:payload.name||payload.media?.name||'',hasFile:!!payload.rawPath})),admin:who.admin,sheets:who.admin&&sheetReady(),bot:who.admin&&!!process.env.TELEGRAM_CUSTOMER_BOT_TOKEN});}
   if(params.get('view')==='customer-matches'){const who=await actor(req);const {customerMatches,publicStock}=await import('../lib/customers.mjs');const row=await getCustomer(who,params.get('id'));return send(res,200,{matches:row.status==='closed'?[]:customerMatches(row.data,await publicStock()).slice(0,20)});}
   if(params.get('view')==='customer-original'){const who=await actor(req),id=params.get('id');if(!/^[a-f0-9-]{36}$/i.test(id||''))throw Object.assign(Error('Mã tệp không hợp lệ.'),{status:400});const row=(await db('customer_imports',{query:'?id=eq.'+id+customerScope(who)}))[0];if(!row?.payload?.rawPath)throw Object.assign(Error('Không tìm thấy tệp.'),{status:404});const {supa}=await import('../lib/platform.mjs');const signed=await supa('/storage/v1/object/sign/rental-private/'+row.payload.rawPath,{method:'POST',body:{expiresIn:60}});return send(res,200,{url:process.env.SUPABASE_URL.replace(/\/$/,'')+'/storage/v1'+signed.signedURL});}
   if(params.get('view')==='source-public')return send(res,200,await publicSource(params.get('slug')));
   if(params.get('view')==='source-access')return send(res,200,await sourceAccess(req,params.get('slug')));
   if(params.get('view')==='source-members')return send(res,200,{members:await findSourceMembers(req,params.get('slug'),params.get('q'))});
   if(params.get('view')==='source-private')return send(res,200,await getSource(req,params.get('slug')));
   if(params.get('view')==='source-shared')return send(res,200,{sources:await sharedSources(req)});
   if(params.get('view')==='source-map'){
    const entry=await mapShare(params.get('slug'),params.get('token')),esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"});return res.end(`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Vị trí được chia sẻ riêng</title><style>body{font:17px/1.7 Arial;background:#fff9f3;color:#382820;margin:10vh auto;padding:24px;max-width:620px}a{display:inline-block;padding:14px 22px;background:#a73228;color:white;border-radius:8px;text-decoration:none}</style><h1>Vị trí Map chỉ đường</h1><p>Mã BĐS: ${esc(entry.code)}</p><p>${esc(entry.mapLabel)}</p><a href="${esc(entry.mapUrl)}" target="_blank" rel="noopener noreferrer">Mở Google Maps để chỉ đường</a><p>Được chia sẻ riêng bởi người quản lý nguồn BĐS.</p></html>`);
   }
   if(params.get('view')==='connections'){
    requireAdmin(req);let storageReady=false;
    if(configured())try{await Promise.all([db('inquiries',{query:'?select=id&limit=1'}),db('profiles',{query:'?select=id&limit=1'})]);storageReady=true}catch{}
    return send(res,200,{storageConfigured:configured(),storageReady,telegramConfigured:telegramConfiguration().ready,telegramError:telegramConfiguration().error||null});
   }
   if(params.get('view')==='inquiries'){
    requireAdmin(req);
    const page=Number(params.get('page')||0),intent=params.get('intent')||'',state=params.get('status')||'';
    if(!Number.isInteger(page)||page<0||page>100000||(intent&&!Object.hasOwn(intentLabels,intent))||(state&&!['new','contacted','following','closed'].includes(state)))return send(res,400,{error:'Bộ lọc hồ sơ không hợp lệ.'});
    let query='?order=created_at.desc&limit=21&offset='+page*20;
    if(intent)query+='&intent=eq.'+intent;
    if(state)query+='&management_status=eq.'+state;
    const search=clean(params.get('q'),100).replace(/[^\p{L}\p{N}\s+@.-]/gu,'').trim();
    if(search)query+='&or=(name.ilike.*'+encodeURIComponent(search)+'*,phone.ilike.*'+encodeURIComponent(search)+'*,area.ilike.*'+encodeURIComponent(search)+'*)';
    const rows=await db('inquiries',{query});return send(res,200,{inquiries:rows.slice(0,20),hasMore:rows.length>20,page});
   }
   const who=await actor(req),query=who.admin?'?order=created_at.desc&limit=500':'?author_id=eq.'+who.id+'&order=created_at.desc&limit=100';
   if(who.admin){const [members,inquiries,posts,notifications]=await Promise.all([db('profiles',{query:'?order=created_at.desc&limit=500'}),db('inquiries',{query:'?order=created_at.desc&limit=500'}),db('posts',{query}),db('notification_log',{query:'?sent=eq.false&order=created_at.desc&limit=100'})]);const standardized=await canonicalizeSubset(posts);return send(res,200,{members,inquiries,posts:standardized,notifications,identityNeedsSync:posts.some((row,i)=>row.public_data.code!==standardized[i].public_data.code||row.public_data.title!==standardized[i].public_data.title)})}
   const [posts,inquiries]=await Promise.all([db('posts',{query}),db('inquiries',{query:'?member_id=eq.'+who.id+'&select=id,intent,area,type,created_at&order=created_at.desc&limit=100'})]);return send(res,200,{posts:(await canonicalizeSubset(posts)).map(({private_data,...post})=>post),inquiries,canPost:who.kind==='sales'&&who.can_post});
  }
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!sameOrigin(req))return send(res,403,{error:'Yêu cầu không hợp lệ.'});
  if(limited(req,30))return send(res,429,{error:'Vui lòng chờ rồi thử lại.'});
  const body=await readJson(req,customerParams.has('customers')?4500000:20000);
  if(body.action?.startsWith('google-')){requireAdmin(req);if(body.action==='google-save')return send(res,200,await saveCommand(body));if(body.action==='google-preview')return send(res,200,{run:await previewCommand(body)});if(body.action==='google-execute'){const run=await executeRun(body.id);return send(res,200,{result:run});}return send(res,400,{error:'Lệnh Google không hợp lệ.'});}
  if(body.action==='customer-save'){const result=await saveCustomer(req,body),who=await actor(req);waitUntil(refreshCustomer(who,result.id).then(()=>autoCustomerSheet()).catch(()=>{}));return send(res,200,result);}
  if(body.action==='customer-refresh'){const who=await actor(req);const matches=await refreshCustomer(who,body.id);waitUntil(autoCustomerSheet());return send(res,200,{matches,warning:matches.warning||''});}
  if(body.action==='customer-import'){const id=await createCustomerImport(req,body);waitUntil(processCustomerImport(id));return send(res,202,{queued:true,id});}
  if(body.action==='customer-import-retry'){const id=await retryCustomerImport(req,body);waitUntil(processCustomerImport(id));return send(res,202,{queued:true,id});}
  if(body.action==='customer-bot-connect')return send(res,200,await connectCustomerBot(req));
  if(body.action==='customer-sheets'){requireAdmin(req);return send(res,200,await syncCustomerSheet());}
  if(body.action==='source-save')return send(res,200,await saveSource(req,body));
  if(body.action==='source-link')return send(res,200,await createMapShare(req,body));
  if(body.action==='source-revoke')return send(res,200,await revokeMapShares(req,body));
  if(body.action==='inventory'){const result=await updateInventory(req,body);waitUntil(matchNewStock().then(()=>autoCustomerSheet()));return send(res,200,result);}
  if(body.action==='submit'){
   const who=await actor(req,{posting:true}),record=await draft(body,who),rows=await db('posts',{method:'POST',body:record});
   const canonical=(await canonicalizeSubset(rows))[0];await db('posts',{method:'PATCH',query:'?id=eq.'+rows[0].id,body:{public_data:canonical.public_data}});
   const notice=await notify('Có tin đang chờ duyệt',{id:canonical.public_data.code,name:canonical.public_data.title});await db('notification_log',{method:'POST',body:{kind:'post',record_id:rows[0].id,sent:notice.sent}}).catch(()=>{});
   return send(res,201,{submitted:true,id:rows[0].id});
  }
  requireAdmin(req);
  if(body.action==='normalize-identities'){waitUntil(persistIdentities().catch(()=>{}));return send(res,202,{queued:true});}
  if(body.action==='telegram-test'){
   if(!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID)return send(res,503,{error:'Cần thêm TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID vào Vercel, rồi Redeploy.'});
   const result=await notify('Thông báo thử — đã kết nối website với Telegram',{id:'kiem-tra-ket-noi'});
   return send(res,result.sent?200:502,result.sent?{sent:true}:{error:result.error});
  }
  if(body.action==='edit-post'){
   if(!/^[-\da-f]{36}$/i.test(body.id))return send(res,400,{error:'Mã tin không hợp lệ.'});
   const rows=await db('posts',{query:'?id=eq.'+body.id});if(!rows[0])return send(res,404,{error:'Không tìm thấy tin.'});
   const {safePublicText}=await import('../lib/posts.mjs');
   let description=clean(body.description,3000);const {size,price,priceBasis,pricePerM2}=formPricing(body);
   if(!description||!safePublicText(description)||!Number.isFinite(size)||size<=0||size>10000000||!Number.isFinite(price)||price<=0||price>1000000)return send(res,400,{error:'Kiểm tra diện tích, giá và mô tả. Phần công khai không chứa số nhà/ngõ/ngách, hashtag hoặc liên kết.'});
   const p=rows[0].public_data;
   if(rows[0].private_data?.automation){description=description.replace(`Diện tích ${p.size} m², giá thuê tham khảo ${p.price} triệu đồng/tháng.`,`Diện tích ${size} m², giá thuê tham khảo ${price} triệu đồng/tháng.`);if(p.pricePerM2){const format=n=>new Intl.NumberFormat('vi-VN').format(n),old=`Đơn giá: ${format(p.pricePerM2)} đồng/m²/tháng; tổng tiền thuê tính theo ${format(p.size)} m² là ${format(p.price)} triệu đồng/tháng.`;description=description.replace(old,pricePerM2?`Đơn giá: ${format(pricePerM2)} đồng/m²/tháng; tổng tiền thuê tính theo ${format(size)} m² là ${format(price)} triệu đồng/tháng.`:'')}}
   const public_data={...p,description,size,price,priceBasis,pricePerM2,areaText:size+' m²',facts:[...(p.facts||[]).filter(f=>!/^Đơn giá:/.test(f)),...(pricePerM2?['Đơn giá: '+new Intl.NumberFormat('vi-VN').format(pricePerM2)+' đồng/m²/tháng.']:[])]};
   public_data.shareText=`${p.title}\nKhu vực: ${p.address}\nDiện tích: ${size} m²\nGiá thuê: ${price} triệu đồng/tháng\n${description}\nLiên hệ: 0906215365`;
   if(pricePerM2)public_data.shareText+='\nĐơn giá: '+new Intl.NumberFormat('vi-VN').format(pricePerM2)+' đồng/m²/tháng.';
   const private_data={...rows[0].private_data,address:clean(body.privateAddress,500),hashtags:clean(body.hashtags,1500).match(/#[\p{L}\p{N}_]+/gu)||[]};
   await db('posts',{method:'PATCH',query:'?id=eq.'+body.id,body:{public_data,private_data}});
   const canonical=(await canonicalizeSubset([{...rows[0],public_data,private_data}]))[0];
   await db('posts',{method:'PATCH',query:'?id=eq.'+body.id,body:{public_data:canonical.public_data}});
   if(rows[0].status==='published')waitUntil(matchNewStock().then(()=>autoCustomerSheet()));return send(res,200,{saved:true});
  }
  if(body.action==='inquiry-update'){
   if(!/^[-\da-f]{36}$/i.test(body.id)||!['new','contacted','following','closed'].includes(body.status)||typeof body.notes!=='string'||body.notes.length>4000)return send(res,400,{error:'Thông tin cập nhật hồ sơ không hợp lệ.'});
   const rows=await db('inquiries',{method:'PATCH',query:'?id=eq.'+body.id,body:{management_status:body.status,admin_notes:body.notes.trim(),updated_at:new Date().toISOString()}});
   if(!rows.length)return send(res,404,{error:'Không tìm thấy hồ sơ.'});
   return send(res,200,{saved:true});
  }
  if(body.action==='retry'){
   if(!/^[-\da-f]{36}$/i.test(body.id))return send(res,400,{error:'Mã thông báo không hợp lệ.'});
   if(!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID)return send(res,503,{error:'Cần cấu hình Telegram trước khi gửi lại.'});
   const rows=await db('notification_log',{query:'?id=eq.'+body.id});if(!rows[0])return send(res,404,{error:'Không tìm thấy thông báo.'});
   const entry=rows[0],table=({member:'profiles',inquiry:'inquiries',post:'posts'})[entry.kind];if(!table)return send(res,400,{error:'Loại thông báo không hợp lệ.'});
   const records=await db(table,{query:'?id=eq.'+encodeURIComponent(entry.record_id)});if(!records[0])return send(res,404,{error:'Hồ sơ đã bị xóa.'});
   const notice=await notify('Thông báo gửi lại: '+entry.kind,records[0]);if(!notice.sent)return send(res,502,{error:notice.error||'Telegram chưa xác nhận nhận thông báo.'});
   await db('notification_log',{method:'PATCH',query:'?id=eq.'+body.id,body:{sent:true}});return send(res,200,{ok:true});
  }
  if(body.action==='permission'){
   if(!/^[-\da-f]{36}$/i.test(body.id)||typeof body.canPost!=='boolean')return send(res,400,{error:'Thông tin cấp quyền không hợp lệ.'});
   await db('profiles',{method:'PATCH',query:'?id=eq.'+body.id+'&kind=eq.sales',body:{can_post:body.canPost}});return send(res,200,{ok:true});
  }
  if(body.action==='review'){
   if(!/^[-\da-f]{36}$/i.test(body.id)||!['published','rejected'].includes(body.status))return send(res,400,{error:'Thông tin duyệt không hợp lệ.'});
   const posts=await db('posts',{query:'?id=eq.'+body.id});if(!posts[0])return send(res,404,{error:'Không tìm thấy tin.'});
   // Revalidate public fields, including data imported/edited outside this interface.
   const {safePublicText}=await import('../lib/posts.mjs');const p=posts[0].public_data;
   if(body.status==='published'&&(!safePublicText([p.title,p.address,p.description].join(' '))||p.hashtags||!p.title))return send(res,400,{error:'Tin có thông tin riêng tư trong phần công khai. Cần sửa bản nháp trước khi duyệt.'});
   await db('posts',{method:'PATCH',query:'?id=eq.'+body.id,body:{status:body.status,reviewed_at:new Date().toISOString()}});waitUntil(matchNewStock().then(()=>autoCustomerSheet()));return send(res,200,{ok:true});
  }
  return send(res,400,{error:'Yêu cầu không hợp lệ.'});
 }catch(error){return send(res,error.status||502,{error:error.message||'Chưa xử lý được yêu cầu.'})}
}
