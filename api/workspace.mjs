import {splitPriceNotes,mergePriceNotes,trackedPriceNotes} from '../lib/source-price-notes.mjs';
import {prepareTrustedText} from '../lib/trusted-intake.mjs';
import {applySourceUpdate} from '../lib/source-updates.mjs';
import {trustedDraft} from '../lib/trusted-intake.mjs';
import {randomUUID} from 'node:crypto';
import {formatDescription} from '../lib/listing-content.mjs';
import {editedMedia} from '../lib/post-media.mjs';
import {postHistory,logPostHistory} from '../lib/post-history.mjs';
import {propertyDimensions,dimensionFacts,extractDimensions,syncRoomDescription} from '../lib/property-dimensions.mjs';
import {saveCommand,previewCommand,executeRun} from '../lib/google-commands.mjs';
import {customerRows,getCustomer,saveCustomer,refreshCustomer,customerScope,matchNewStock} from '../lib/customers.mjs';
import {customerHook,connectCustomerBot,createCustomerImport,processCustomerImport,retryCustomerImport} from '../lib/customer-imports.mjs';
import {syncCustomerSheet,sheetReady,autoCustomerSheet} from '../lib/customer-sheets.mjs';
import {findSourceMembers,getSource,publicSource,saveSource,createMapShare,revokeMapShares,mapShare,sharedSources,sourceAccess} from '../lib/property-source.mjs';
import {formPricing,transferPricing,syncPricingDescription} from '../lib/source-pricing.mjs';
import {updateInventory,updateHot} from '../lib/inventory.mjs';
import {waitUntil} from '@vercel/functions';
import {canonicalizeSubset,persistIdentities} from '../lib/listing-catalog.mjs';
import {readJson,send,sameOrigin,limited} from '../lib/http.mjs';
import {actor,requireAdmin,db,clean,notify,configured,telegramConfiguration} from '../lib/platform.mjs';
import {draft,categories} from '../lib/posts.mjs';
import {intentLabels,inquiryCriteria} from '../lib/inquiries.mjs';
export default async function handler(req,res){
 try{
  const customerParams=new URL(req.url,'http://localhost').searchParams;
  if(customerParams.has('google-docs-hook'))return await (await import('../lib/google-doc-automation.mjs')).googleDocsHook(req,res,p=>waitUntil(p));
  if(req.method==='POST'&&customerParams.has('customer-hook'))return await customerHook(req,res,promise=>waitUntil(promise));
  if(req.method==='GET'){
   const params=new URL(req.url,'http://localhost').searchParams;
   if(params.get('view')==='google-commands'){requireAdmin(req);const commands=await db('google_commands',{query:'?order=created_at.desc&limit=100'}),runs=await db('google_runs',{query:'?select=id,command_id,status,config,result,error,created_at&order=created_at.desc&limit=20'});return send(res,200,{commands,runs});}
   if(params.get('view')==='google-run'){requireAdmin(req);const id=params.get('id');if(!/^[a-f0-9-]{36}$/i.test(id||''))return send(res,400,{error:'Mã lượt không hợp lệ.'});const run=(await db('google_runs',{query:'?id=eq.'+id}))[0];if(!run)return send(res,404,{error:'Không tìm thấy lượt chạy.'});return send(res,200,{run});}
   if(params.get('view')==='post-history')return send(res,200,await postHistory(req,params.get('slug')));
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
   if(params.get('view')==='inquiry-matches'){
    requireAdmin(req);const id=params.get('id');if(!/^[a-f0-9-]{36}$/i.test(id||''))return send(res,400,{error:'Mã hồ sơ không hợp lệ.'});
    const row=(await db('inquiries',{query:'?id=eq.'+id}))[0];if(!row)return send(res,404,{error:'Không tìm thấy hồ sơ khách.'});if(row.intent!=='tenant')return send(res,400,{error:'Gợi ý nguồn áp dụng cho khách quan tâm thuê (nhượng).'});
    const criteria=inquiryCriteria(row),missing=[!criteria.area&&!criteria.requirements?'khu vực':'',!criteria.type?'loại BĐS':'',!criteria.maxBudget&&!criteria.budget?'ngân sách':'',!criteria.minSize?'diện tích':''].filter(Boolean),warning=missing.length?'Chưa ghi rõ '+missing.join(', ')+'. Kết quả chỉ lọc theo các tiêu chí đã có.':'';
    if(!criteria.area&&!criteria.type&&!criteria.maxBudget&&!criteria.budget&&!criteria.minSize&&!criteria.requirements)return send(res,200,{matches:[],warning:'Hồ sơ chưa có tiêu chí tìm nguồn. Cần bổ sung nhu cầu của khách trước khi đối chiếu.'});
    const {customerMatches,publicStock}=await import('../lib/customers.mjs');const matches=customerMatches(criteria,await publicStock()).slice(0,20);return send(res,200,{matches,warning});
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
    const rows=await db('inquiries',{query});return send(res,200,{inquiries:rows.slice(0,20).map(row=>({...row,criteria:inquiryCriteria(row)})),hasMore:rows.length>20,page});
   }
   const who=await actor(req),query=who.admin?'?order=created_at.desc&limit=500':'?author_id=eq.'+who.id+'&order=created_at.desc&limit=100';
   if(who.admin){const [members,inquiries,posts,notifications]=await Promise.all([db('profiles',{query:'?order=created_at.desc&limit=500'}),db('inquiries',{query:'?order=created_at.desc&limit=500'}),db('posts',{query}),db('notification_log',{query:'?sent=eq.false&order=created_at.desc&limit=100'})]);const standardized=await canonicalizeSubset(posts);return send(res,200,{members,inquiries,posts:standardized.map(row=>({...row,private_data:{...row.private_data,priceTrackingNotes:trackedPriceNotes(row.private_data)},suggestedRooms:extractDimensions(row.private_data?.sourceText||row.private_data?.originalText||row.public_data.description||'')} )),notifications,identityNeedsSync:posts.some((row,i)=>JSON.stringify(row.public_data)!==JSON.stringify(standardized[i].public_data))})}
   const [posts,inquiries]=await Promise.all([db('posts',{query}),db('inquiries',{query:'?member_id=eq.'+who.id+'&select=id,intent,area,type,created_at&order=created_at.desc&limit=100'})]);return send(res,200,{posts:(await canonicalizeSubset(posts)).map(({private_data,...post})=>post),inquiries,canPost:who.kind==='sales'&&who.can_post,autoPublish:who.kind==='sales'&&who.can_post&&who.auto_publish===true});
  }
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!sameOrigin(req))return send(res,403,{error:'Yêu cầu không hợp lệ.'});
  if(limited(req,30))return send(res,429,{error:'Vui lòng chờ rồi thử lại.'});
  const body=await readJson(req,customerParams.has('customers')?4500000:100000);
  if(body.action?.startsWith('google-')){requireAdmin(req);if(body.action==='google-save')return send(res,200,await saveCommand(body));if(body.action==='google-preview')return send(res,200,{run:await previewCommand(body)});if(body.action==='google-execute'){const run=await executeRun(body.id);return send(res,200,{result:run});}return send(res,400,{error:'Lệnh Google không hợp lệ.'});}
  if(body.action==='customer-save'){const result=await saveCustomer(req,body),who=await actor(req);waitUntil(refreshCustomer(who,result.id).then(()=>autoCustomerSheet()).catch(()=>{}));return send(res,200,result);}
  if(body.action==='customer-refresh'){const who=await actor(req);const matches=await refreshCustomer(who,body.id);waitUntil(autoCustomerSheet());return send(res,200,{matches,warning:matches.warning||''});}
  if(body.action==='customer-import'){const id=await createCustomerImport(req,body);waitUntil(processCustomerImport(id));return send(res,202,{queued:true,id});}
  if(body.action==='customer-import-retry'){const id=await retryCustomerImport(req,body);waitUntil(processCustomerImport(id));return send(res,202,{queued:true,id});}
  if(body.action==='customer-bot-connect')return send(res,200,await connectCustomerBot(req));
  if(body.action==='customer-sheets'){requireAdmin(req);return send(res,200,await syncCustomerSheet());}
  if(body.action==='source-save'){const result=await saveSource(req,body);waitUntil(autoCustomerSheet());return send(res,200,result);}
  if(body.action==='source-link')return send(res,200,await createMapShare(req,body));
  if(body.action==='source-revoke')return send(res,200,await revokeMapShares(req,body));
  if(body.action==='inventory'){const result=await updateInventory(req,body);waitUntil(matchNewStock().catch(()=>{}).then(()=>autoCustomerSheet()));return send(res,200,result);}
  if(body.action==='submit'||body.action==='submit-original'){
   const who=await actor(req,{posting:true});if(body.action==='submit-original'&&!who.admin)return send(res,403,{error:'Chỉ quản trị viên được đăng trực tiếp từ bài gốc.'});const record=body.action==='submit-original'?await trustedDraft({text:body.text||body.originalText,assetIds:body.assetIds}):await draft(body,who);const published=who.admin||(who.kind==='sales'&&who.can_post&&who.auto_publish===true);const hot=body.hot===true||body.hot==='on';if(hot&&!who.admin)return send(res,403,{error:'Chỉ quản trị viên được ưu tiên tin HOT.'});record.public_data.hot=hot;record.public_data.titleMode='custom';record.public_data.categoryMode=body.categoryMode==='manual'?'manual':'auto';record.status=published?'published':'pending';if(published)record.reviewed_at=new Date().toISOString();record.private_data.publishMode=who.admin?'admin':published?'member_grant':'review';const rows=await db('posts',{method:'POST',body:record});
   const canonical=(await canonicalizeSubset(rows))[0];await db('posts',{method:'PATCH',query:'?id=eq.'+rows[0].id,body:{public_data:canonical.public_data}});
   await logPostHistory(canonical.public_data.slug,record.status);
   const notice=await notify(published?'Có tin mới đã đăng':'Có tin đang chờ duyệt',{id:canonical.public_data.code,name:canonical.public_data.title});await db('notification_log',{method:'POST',body:{kind:'post',record_id:rows[0].id,sent:notice.sent}}).catch(()=>{});
   waitUntil((published?matchNewStock():Promise.resolve()).catch(()=>{}).then(()=>autoCustomerSheet()).catch(()=>{}));
   return send(res,201,{submitted:true,id:rows[0].id,published,status:record.status,href:canonical.public_data.href});
  }
  requireAdmin(req);
  if(body.action==='supplement-original'){const updated=await applySourceUpdate({id:body.requestId||randomUUID(),content:String(body.text||''),assetIds:body.assetIds||[]});waitUntil(matchNewStock().catch(()=>{}).then(()=>autoCustomerSheet()));return send(res,200,{saved:true,post:updated.public_data});}
  if(body.action==='highlight'){const result=await updateHot(req,body);waitUntil(autoCustomerSheet());return send(res,200,result);}
  if(body.action==='normalize-identities'){waitUntil(persistIdentities().then(()=>autoCustomerSheet()).catch(()=>{}));return send(res,202,{queued:true});}
  if(body.action==='telegram-test'){
   if(!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID)return send(res,503,{error:'Cần thêm TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID vào Vercel, rồi Redeploy.'});
   const result=await notify('Thông báo thử — đã kết nối website với Telegram',{id:'kiem-tra-ket-noi'});
   return send(res,result.sent?200:502,result.sent?{sent:true}:{error:result.error});
  }
  if(body.action==='reparse-source-prices'){if(!/^[-\da-f]{36}$/i.test(body.id||''))throw problem(400,'Mã tin không hợp lệ.');const row=(await db('posts',{query:'?id=eq.'+body.id}))[0];if(!row)throw problem(404,'Không tìm thấy tin.');const text=row.private_data?.sourceText||row.private_data?.originalText;if(!text)throw problem(400,'Tin này chưa lưu bài nguồn gốc.');const prepared=prepareTrustedText(text),p=prepared.item;return send(res,200,{fields:{floors:p.floors,bedrooms:p.bedrooms,bathrooms:p.bathrooms,price:p.price,priceMode:p.priceBasis,pricePerM2:p.pricePerM2,transferPrice:p.transferPrice,transferNegotiable:p.transferNegotiable,description:prepared.description,priceTrackingNotes:mergePriceNotes(trackedPriceNotes(row.private_data),prepared.priceTrackingNotes)}});}
  if(body.action==='edit-post'){
   if(!/^[-\da-f]{36}$/i.test(body.id))return send(res,400,{error:'Mã tin không hợp lệ.'});
   const rows=await db('posts',{query:'?id=eq.'+body.id});if(!rows[0])return send(res,404,{error:'Không tìm thấy tin.'});
   const {safePublicText}=await import('../lib/posts.mjs');
   const separated=splitPriceNotes(clean(body.description,3000));let description=formatDescription(separated.publicSource);const {size,price,priceBasis,pricePerM2}=formPricing(body,{allowIncomplete:true});
   if(!description||!safePublicText(description)||size!==null&&(!Number.isFinite(size)||size<=0||size>10000000)||price!==null&&(!Number.isFinite(price)||price<=0||price>1000000))return send(res,400,{error:'Kiểm tra diện tích, giá và mô tả. Phần công khai không chứa số nhà/ngõ/ngách, hashtag hoặc liên kết.'});
   const p=rows[0].public_data;
   const title=body.title===undefined?p.title:clean(body.title,160),type=body.type===undefined?p.type:clean(body.type);
   if(!title||!safePublicText(title)||!categories.includes(type))return send(res,400,{error:'Kiểm tra tiêu đề và danh mục. Tiêu đề công khai không chứa số nhà, ngõ/ngách, SĐT nguồn, hoa hồng hoặc liên kết.'});
   const titleMode=body.title===undefined?p.titleMode:body.autoTitle===true||body.autoTitle==='on'?'auto':'custom';
   const transfer=transferPricing(body,p);
   const mediaChanges=await editedMedia(body,p,{admin:true,id:null});
   if(rows[0].private_data?.automation){description=description.replace(`Diện tích ${p.size} m², giá thuê tham khảo ${p.price} triệu đồng/tháng.`,(size===null?'Diện tích đang cập nhật.':'Diện tích '+size+' m².')+' '+(price===null?'Giá thuê: liên hệ.':'Giá thuê tham khảo '+price+' triệu đồng/tháng.'));if(p.pricePerM2){const format=n=>new Intl.NumberFormat('vi-VN').format(n),old=`Đơn giá: ${format(p.pricePerM2)} đồng/m²/tháng; tổng tiền thuê tính theo ${format(p.size)} m² là ${format(p.price)} triệu đồng/tháng.`;description=description.replace(old,pricePerM2&&size&&price?`Đơn giá: ${format(pricePerM2)} đồng/m²/tháng; tổng tiền thuê tính theo ${format(size)} m² là ${format(price)} triệu đồng/tháng.`:'')}}
   const dimensions=propertyDimensions({floors:body.floors===undefined?p.floors:body.floors,bedrooms:body.bedrooms===undefined?p.bedrooms:body.bedrooms,bathrooms:body.bathrooms===undefined?p.bathrooms:body.bathrooms,frontage:body.frontage===undefined?p.frontage:body.frontage,roadWidth:body.roadWidth===undefined?p.roadWidth:body.roadWidth,sidewalk:body.sidewalk===undefined?p.sidewalk:body.sidewalk});
   const public_data={...p,...mediaChanges,...dimensions,...transfer,contentRevision:randomUUID(),title,titleMode,type,categories:[type,...(p.categories||[]).filter(t=>t!==p.type&&t!==type)],categoryMode:body.type===undefined?p.categoryMode:'manual',description,size,price,priceBasis,pricePerM2,areaText:size===null?'Diện tích đang cập nhật':size+' m²',facts:[...(p.facts||[]).filter(f=>!/^Đơn giá:|^Mặt tiền:|^Đường rộng:|^Vỉa hè:|^Số tầng:|^Phòng ngủ:|^Phòng WC:/.test(f)),...dimensionFacts(dimensions),...(pricePerM2?['Đơn giá: '+new Intl.NumberFormat('vi-VN').format(pricePerM2)+' đồng/m²/tháng.']:[])]};
   public_data.description=syncRoomDescription(syncPricingDescription(public_data.description,p,public_data),p,public_data);public_data.notes=(public_data.notes||[]).filter(n=>!(price!==null&&/^Giá thuê đang cập nhật/.test(n))&&!(size!==null&&/^Diện tích đang cập nhật/.test(n)));description=public_data.description;
   public_data.shareText=`${title}\nKhu vực: ${p.address}\nDiện tích: ${size===null?'Đang cập nhật':size+' m²'}\nGiá thuê: ${price===null?'Liên hệ':price+' triệu đồng/tháng'}\n${description}\nLiên hệ: 0906215365`;
   if(pricePerM2)public_data.shareText+='\nĐơn giá: '+new Intl.NumberFormat('vi-VN').format(pricePerM2)+' đồng/m²/tháng.';
   public_data.shareText+='\n'+dimensionFacts(dimensions).join('\n');
   if((public_data.media||[]).some(m=>m.isIllustration))public_data.shareText+='\nCó ảnh minh họa AI, không phải ảnh chụp thực tế.';
   if(transfer.isTransfer)public_data.shareText+='\nGiá chuyển nhượng: '+(transfer.transferPrice===null?'Liên hệ':transfer.transferPrice+' triệu đồng')+(transfer.transferNegotiable?' (Có thể thương lượng)':'')+'.';
   const private_data={...rows[0].private_data,priceTrackingNotes:mergePriceNotes(body.priceTrackingNotes===undefined?trackedPriceNotes(rows[0].private_data):clean(body.priceTrackingNotes,8000),separated.priceTrackingNotes),address:clean(body.privateAddress,500),hashtags:clean(body.hashtags,1500).match(/#[\p{L}\p{N}_]+/gu)||[]};
   await db('posts',{method:'PATCH',query:'?id=eq.'+body.id,body:{public_data,private_data}});
   const canonical=(await canonicalizeSubset([{...rows[0],public_data,private_data}]))[0];
   await db('posts',{method:'PATCH',query:'?id=eq.'+body.id,body:{public_data:canonical.public_data}});
   if(body.assetIds!==undefined)await logPostHistory(p.slug,'photos-updated');
   if(body.title!==undefined||body.type!==undefined)await logPostHistory(p.slug,'content-updated');
   waitUntil((rows[0].status==='published'?matchNewStock():Promise.resolve()).catch(()=>{}).then(()=>autoCustomerSheet()));return send(res,200,{saved:true,post:canonical.public_data});
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
  if(body.action==='publish-permission'){
   if(!/^[a-f0-9-]{36}$/i.test(body.id||'')||!['review','auto'].includes(body.mode))return send(res,400,{error:'Chọn đúng thành viên và chế độ duyệt.'});
   const profile=(await db('profiles',{query:'?id=eq.'+body.id+'&kind=eq.sales'}))[0];if(!profile)return send(res,404,{error:'Không tìm thấy tài khoản Sale/CTV.'});
   if(!Object.hasOwn(profile,'auto_publish'))return send(res,503,{error:'Cần chạy database/009_member_auto_publish.sql trong Supabase SQL Editor để bật cấp quyền đăng tự động.'});
   if(body.mode==='auto'&&!profile.can_post)return send(res,400,{error:'Cấp quyền gửi tin cho thành viên này trước khi cho đăng tự động.'});
   const saved=await db('profiles',{method:'PATCH',query:'?id=eq.'+body.id+'&kind=eq.sales'+(body.mode==='auto'?'&can_post=eq.true':''),body:{auto_publish:body.mode==='auto'}});if(!saved.length)return send(res,409,{error:'Quyền thành viên đã thay đổi. Tải lại danh sách rồi thử lại.'});
   return send(res,200,{ok:true,autoPublish:body.mode==='auto'});
  }
  if(body.action==='permission'){
   if(!/^[-\da-f]{36}$/i.test(body.id)||typeof body.canPost!=='boolean')return send(res,400,{error:'Thông tin cấp quyền không hợp lệ.'});
   const profile=(await db('profiles',{query:'?id=eq.'+body.id+'&kind=eq.sales'}))[0];if(!profile)return send(res,404,{error:'Không tìm thấy tài khoản Sale/CTV.'});
   await db('profiles',{method:'PATCH',query:'?id=eq.'+body.id+'&kind=eq.sales',body:{can_post:body.canPost,...(!body.canPost&&Object.hasOwn(profile,'auto_publish')?{auto_publish:false}:{})}});return send(res,200,{ok:true});
  }
  if(body.action==='review'){
   if(!/^[-\da-f]{36}$/i.test(body.id)||!['published','rejected'].includes(body.status))return send(res,400,{error:'Thông tin duyệt không hợp lệ.'});
   const posts=await db('posts',{query:'?id=eq.'+body.id});if(!posts[0])return send(res,404,{error:'Không tìm thấy tin.'});
   // Revalidate public fields, including data imported/edited outside this interface.
   const {safePublicText}=await import('../lib/posts.mjs');const p=posts[0].public_data;
   if(body.status==='published'&&(!safePublicText([p.title,p.address,p.description].join(' '))||p.hashtags||!p.title))return send(res,400,{error:'Tin có thông tin riêng tư trong phần công khai. Cần sửa bản nháp trước khi duyệt.'});
   if(posts[0].status===body.status)return send(res,200,{ok:true,unchanged:true,status:body.status});
   await db('posts',{method:'PATCH',query:'?id=eq.'+body.id,body:{status:body.status,reviewed_at:new Date().toISOString()}});
   await logPostHistory(posts[0].public_data.slug,body.status);waitUntil(matchNewStock().catch(()=>{}).then(()=>autoCustomerSheet()));return send(res,200,{ok:true});
  }
  return send(res,400,{error:'Yêu cầu không hợp lệ.'});
 }catch(error){return send(res,error.status||502,{error:error.message||'Chưa xử lý được yêu cầu.'})}
}
