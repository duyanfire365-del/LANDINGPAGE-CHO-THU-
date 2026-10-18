import assert from 'node:assert/strict';
import http from 'node:http';
import {randomUUID,createHmac} from 'node:crypto';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
import {exportDocument,extractDocument,spreadsheetDrafts} from '../lib/documents.mjs';
// Local Supabase/Telegram doubles exercise the real handlers, not production services.
const tables={profiles:[],posts:[],inquiries:[],assets:[],notification_log:[]},users=[],files=new Map();
const fake=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');let raw='';for await(const chunk of req)raw+=chunk;
 let body;try{body=JSON.parse(raw)}catch{body=null}
 const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'});res.end(JSON.stringify(data))};
 if(req.method==='OPTIONS')return reply(200,{});
 if(url.pathname==='/auth/v1/signup'){
  const user={id:randomUUID(),email:body.email,password:body.password};users.push(user);
  tables.profiles.push({id:user.id,email:user.email,full_name:body.data.full_name,phone:body.data.phone,kind:body.data.kind,can_post:false,created_at:new Date().toISOString()});
  return reply(200,{user:{id:user.id,identities:[{id:randomUUID()}]}});
 }
 if(url.pathname==='/auth/v1/token'){
  const user=users.find(u=>u.email===body.email&&u.password===body.password);return user?reply(200,{access_token:user.id,expires_in:3600}):reply(400,{error:'invalid'});
 }
 if(url.pathname==='/auth/v1/user'){
  const user=users.find(u=>'Bearer '+u.id===req.headers.authorization);return user?reply(200,{id:user.id}):reply(401,{});
 }
 if(url.pathname.startsWith('/rest/v1/')){
  const name=url.pathname.split('/').pop(),table=tables[name];if(!table)return reply(404,{});
  const matches=row=>[...url.searchParams].every(([key,value])=>{
   if(['order','limit','select','offset'].includes(key))return true;
   if(key==='or')return value.slice(1,-1).split(',').some(part=>{const [field,pattern]=part.split('.ilike.');return String(row[field]||'').toLowerCase().includes(pattern.slice(1,-1).toLowerCase())});
   if(key==='public_data->>slug')return row.public_data.slug===value.slice(3);
   if(key==='public_data->media')return (row.public_data.media||[]).some(a=>JSON.parse(value.slice(3)).some(b=>a.id===b.id));
   if(value.startsWith('eq.'))return String(row[key])===value.slice(3);
   if(value.startsWith('in.('))return value.slice(4,-1).split(',').includes(row[key]);return true;
  });
  if(req.method==='POST'){const row={id:randomUUID(),created_at:new Date().toISOString(),...(name==='inquiries'?{management_status:'new',admin_notes:''}:{}),...body};table.push(row);return reply(201,[row])}
  let rows=table.filter(matches);
  if(req.method==='PATCH')rows.forEach(row=>Object.assign(row,body));
  if(url.searchParams.get('select')&&url.searchParams.get('select')!=='*'){const keys=url.searchParams.get('select').split(',');rows=rows.map(row=>Object.fromEntries(keys.map(key=>[key,row[key]])))}
  if(req.method==='GET')rows=rows.slice(Number(url.searchParams.get('offset')||0),Number(url.searchParams.get('offset')||0)+Number(url.searchParams.get('limit')||1000));
  return reply(200,rows);
 }
 if(url.pathname.startsWith('/storage/v1/object/upload/sign/'))return reply(200,{url:'/upload/'+url.pathname.split('/').pop()});
 if(url.pathname.startsWith('/storage/v1/upload/')){files.set(url.pathname.split('/').pop(),Buffer.from(raw));return reply(200,{ok:true})}
 if(url.pathname.startsWith('/storage/v1/object/sign/'))return reply(200,{signedURL:'/download/'+url.pathname.split('/').pop()+'?token=test'});
 if(url.pathname.startsWith('/storage/v1/download/')){const bytes=files.get(url.pathname.split('/').pop());if(!bytes)return reply(404,{});res.writeHead(200,{'Content-Type':'text/plain','Content-Length':bytes.length});return res.end(bytes)}
 reply(404,{});
});
await new Promise(resolve=>fake.listen(0,'127.0.0.1',resolve));
process.env.SUPABASE_URL='http://127.0.0.1:'+fake.address().port;process.env.SUPABASE_ANON_KEY='test-anon';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service';process.env.PORT='3006';
const originalFetch=globalThis.fetch;let telegramSuccess=false;
globalThis.fetch=async(url,options)=>String(url).startsWith('https://api.telegram.org/')?new Response(JSON.stringify({ok:telegramSuccess}),{status:telegramSuccess?200:502}):originalFetch(url,options);
await import('../server.mjs');
const base='http://127.0.0.1:3006';
const cookie=response=>(response.headers.get('set-cookie')||'').split(';')[0];
async function post(path,data,session=''){const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',cookie:session},body:JSON.stringify(data)});return {response,data:await response.json()}}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
try{
 const name='Nguyễn Văn An',email='sale@example.test',password='Test-password-123!';
 let result=await post('/api/members',{action:'register',name,phone:'0906215365',kind:'sales',email,password,consent:true,can_post:true});assert.equal(result.response.status,200);assert.equal(tables.profiles[0].can_post,false);
 result=await post('/api/members',{action:'login',email,password});assert.equal(result.response.status,200);const salesCookie=cookie(result.response);
 const oldKeyLogin=await post('/api/admin',{action:'login',password:process.env.ADMIN_SECRET});assert.equal(oldKeyLogin.response.status,401,'encryption key is not a login password');
 const login=await post('/api/admin',{action:'login',password:process.env.ADMIN_LOGIN_PASSWORD});assert.equal(login.response.status,200);const adminCookie=cookie(login.response);
 const input={action:'submit',title:'Văn phòng cho thuê tại Cầu Giấy',location:'Phạm Huy Thông',area:'Ba Đình',type:'Văn phòng',price:18,size:80,description:'Không gian văn phòng, liên hệ để xem thực tế.',privateAddress:'123 ngõ 99 Phạm Huy Thông',hashtags:'#NguonRieng',assetIds:[]};
 result=await post('/api/workspace',input,salesCookie);assert.equal(result.response.status,403,'unapproved sales cannot submit');
 result=await post('/api/workspace',{action:'permission',id:tables.profiles[0].id,canPost:true},salesCookie);assert.equal(result.response.status,401,'sales cannot grant privileges');
 result=await post('/api/workspace',{action:'permission',id:tables.profiles[0].id,canPost:true},adminCookie);assert.equal(result.response.status,200);
 result=await post('/api/workspace',{...input,description:'Địa chỉ số 123 ngõ 99'},salesCookie);assert.equal(result.response.status,400,'private details rejected in public text');
 result=await post('/api/workspace',input,salesCookie);assert.equal(result.response.status,201);const postId=result.data.id;
 assert.equal((await (await fetch(base+'/api/catalog')).json()).posts.length,0,'pending post must not be public');
 result=await post('/api/workspace',{action:'review',id:postId,status:'published'},salesCookie);assert.equal(result.response.status,401,'sales cannot publish');
 result=await post('/api/workspace',{action:'review',id:postId,status:'published'},adminCookie);assert.equal(result.response.status,200);
 const catalog=await (await fetch(base+'/api/catalog')).json();assert.equal(catalog.posts.length,1);assert(!JSON.stringify(catalog).includes('123 ngõ'));assert(!JSON.stringify(catalog).includes('#NguonRieng'));
 result=await post('/api/files',{action:'upload',name:'nguon.txt',mime:'text/plain',size:200},salesCookie);assert.equal(result.response.status,200);const sourceId=result.data.id;
 const source='Cho thuê Văn phòng tại Ba Đình\nGiá thuê: 18 triệu\nDiện tích: 80 m²\n#HashtagGoc';await fetch(result.data.url,{method:'PUT',body:source});
 result=await post('/api/files',{action:'parse',id:sourceId,useAI:false},salesCookie);assert.equal(result.response.status,200);assert.equal(result.data.items[0].type,'Văn phòng');assert.equal(result.data.items[0].area,'Ba Đình');assert.equal(result.data.items[0].price,18);assert(result.data.reviewRequired);
 result=await post('/api/files',{action:'parse',id:sourceId,useAI:true},salesCookie);assert.equal(result.response.status,503,'AI must not be claimed without a provider key');
 result=await post('/api/files',{action:'upload',name:'script.svg',mime:'image/svg+xml',size:100},salesCookie);assert.equal(result.response.status,400);
 result=await post('/api/files',{action:'upload',name:'video.mp4',mime:'video/mp4',size:55*1024*1024},salesCookie);assert.equal(result.response.status,400);
 const mediaUpload=await post('/api/files',{action:'upload',name:'video.mp4',mime:'video/mp4',size:12},salesCookie);assert.equal(mediaUpload.response.status,200);await fetch(mediaUpload.data.url,{method:'PUT',body:'sample-video'});
 const mediaPost=await post('/api/workspace',{...input,assetIds:[mediaUpload.data.id]},salesCookie);assert.equal(mediaPost.response.status,201);
 assert.equal((await fetch(base+'/api/files?action=media&id='+mediaUpload.data.id,{redirect:'manual'})).status,401,'pending video not public');
 await post('/api/workspace',{action:'review',id:mediaPost.data.id,status:'published'},adminCookie);
 const mediaResponse=await fetch(base+'/api/files?action=media&id='+mediaUpload.data.id+'&download=1',{redirect:'manual'});assert.equal(mediaResponse.status,302);assert(mediaResponse.headers.get('location').includes('download=video.mp4'));
 const template=await fetch(base+'/api/exports?kind=template&format=xlsx',{headers:{cookie:adminCookie}});assert.equal(template.status,200);const templateRows=await spreadsheetDrafts(Buffer.from(await template.arrayBuffer()));assert.equal(templateRows[0].price,20);assert.equal(templateRows[0].privateAddress,'Điền số nhà và ngõ/ngách tại đây');
 const connections=await (await fetch(base+'/api/workspace?view=connections',{headers:{cookie:adminCookie}})).json();assert(connections.storageReady);assert.equal(connections.telegramConfigured,false);assert.equal((await fetch(base+'/api/workspace?view=connections',{headers:{cookie:salesCookie}})).status,401);
 process.env.TELEGRAM_BOT_TOKEN='test';process.env.TELEGRAM_CHAT_ID='test';
 assert.equal((await post('/api/workspace',{action:'telegram-test'},salesCookie)).response.status,401);
 assert.equal((await post('/api/workspace',{action:'telegram-test'},adminCookie)).response.status,502);telegramSuccess=true;assert.equal((await post('/api/workspace',{action:'telegram-test'},adminCookie)).data.sent,true);telegramSuccess=false;
 result=await post('/api/leads',{intent:'owner',name,phone:'0906215365',area:'Ba Đình',type:'Văn phòng',ownerAddress:'Địa chỉ riêng',ownerSize:80,ownerRent:18,ownerAuthority:true,contactConsent:true},salesCookie);assert.equal(result.response.status,200);assert(result.data.received);assert.equal(tables.inquiries.length,1);assert.equal(tables.inquiries[0].member_id,tables.profiles[0].id);assert(tables.notification_log.some(n=>n.kind==='inquiry'&&!n.sent),'failed Telegram is retained and does not lose the saved lead');
 for(const [intent,price] of [['owner_sale',5500],['owner_transfer',350]]){
  const submission=await post('/api/leads',{intent,name,phone:'0906215365',area:'Ba Đình',type:'Nhà nguyên căn',ownerAddress:'Địa chỉ ký gửi riêng',ownerSize:80,ownerPrice:price,transferMonthlyRent:intent==='owner_transfer'?20:'',ownerAuthority:true,contactConsent:true},salesCookie);
  assert.equal(submission.response.status,200);const saved=tables.inquiries.at(-1);assert.equal(saved.intent,intent);assert.equal(saved.owner_price,price);assert.equal(saved.owner_rent,null);assert.equal(saved.transfer_monthly_rent,intent==='owner_transfer'?20:null);
 }
 const inquiry=tables.inquiries[0];
 assert.equal((await post('/api/workspace',{action:'inquiry-update',id:inquiry.id,status:'contacted',notes:'Không có quyền'},salesCookie)).response.status,401);
 assert.equal((await post('/api/workspace',{action:'inquiry-update',id:inquiry.id,status:'invalid',notes:''},adminCookie)).response.status,400);
 const update=await post('/api/workspace',{action:'inquiry-update',id:inquiry.id,status:'contacted',notes:'Đã gọi khách, hẹn trao đổi'},adminCookie);assert.equal(update.response.status,200);assert.equal(inquiry.admin_notes,'Đã gọi khách, hẹn trao đổi');
 const filtered=await (await fetch(base+'/api/workspace?view=inquiries&status=contacted',{headers:{cookie:adminCookie}})).json();assert.equal(filtered.inquiries.length,1);
 const own=await (await fetch(base+'/api/workspace',{headers:{cookie:salesCookie}})).json();assert(!JSON.stringify(own).includes('Đã gọi khách'));
 for(const format of ['xlsx','docx','pdf']){
  const response=await fetch(base+'/api/exports?kind=inquiries&format='+format,{headers:{cookie:adminCookie}});assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());const text=await extractDocument(bytes,response.headers.get('content-type'));assert(text.includes(name));
 }
 assert.equal((await fetch(base+'/api/exports?kind=members&format=xlsx',{headers:{cookie:salesCookie}})).status,401);
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.addCookies([{name:'rental_member',value:salesCookie.split('=')[1],url:base}]);await page.goto(base+'/thanh-vien');await page.locator('#member-posting').waitFor();assert(await page.locator('.editor-form').isVisible());
 for(const width of [375,768,1440]){await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'member overflow '+width)}
 await page.goto(base+'/tin?slug='+catalog.posts[0].slug);await page.locator('.property-title').waitFor();assert(!(await page.locator('body').innerText()).includes('123 ngõ'));
 await page.goto(base+'/admin');await page.locator('#admin-password').fill(process.env.ADMIN_LOGIN_PASSWORD);await page.locator('#admin-login button').click();await page.locator('[data-manage=members]').click();await page.locator('#management-members table').waitFor();
 await page.locator('[data-manage=inquiries]').click();await page.locator('.crm-card').first().waitFor();await page.locator('.crm-filters [name=intent]').selectOption('owner_sale');await page.locator('.crm-filters button').click();await page.waitForFunction(()=>document.querySelectorAll('.crm-card').length===1);assert((await page.locator('.crm-card').innerText()).includes('Ký gửi bán'));await page.locator('.crm-edit [name=notes]').fill('Ghi chú quản trị từ giao diện');await page.locator('.crm-edit [name=status]').selectOption('following');await page.locator('.crm-edit button').click();await page.locator('.crm-save-status').filter({hasText:'Đã lưu'}).waitFor();await page.locator('[data-crm-refresh]').click();await page.waitForFunction(()=>document.querySelector('.crm-edit textarea')?.value==='Ghi chú quản trị từ giao diện');assert((await page.locator('#management-inquiries').innerText()).includes(name));
 await page.locator('[data-manage=exports]').click();const download=page.waitForEvent('download');await page.locator('[data-panel=exports] [data-export=posts][data-format=xlsx]').click();assert.equal((await download).suggestedFilename(),'posts.xlsx');
 for(const width of [375,768,1440]){await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'admin overflow '+width)}
 await page.screenshot({path:'/tmp/management-platform.png'});assert.deepEqual(errors,[]);
 console.log('PASS: real API/member UI with local Supabase doubles; permissions, pending/review/publish, private field isolation, document upload/import, AI missing-key behavior, saved leads despite Telegram failure, 3 Vietnamese export formats, browser downloads and responsive portals');
}finally{await browser.close();fake.close();setTimeout(()=>process.exit(),100)}
