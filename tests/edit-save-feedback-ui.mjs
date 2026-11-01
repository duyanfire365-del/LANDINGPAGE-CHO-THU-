import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let mode='success',requests=0,release,received;const post={id:'fixture',status:'published',public_data:{slug:'live-1234567890123456',code:'MB - 0070',type:'Mặt bằng kinh doanh',title:'Cho thuê Nguyễn Khuyến',area:'Hà Đông',address:'Nguyễn Khuyến, Văn Quán',description:'Mặt bằng kinh doanh.',size:60,price:15,media:[]},private_data:{address:'Số 18 Nguyễn Khuyến',hashtags:[],sourceInfo:{sourceName:'Nguồn riêng'}}};
 await page.route('https://save-ui.test/**',async route=>{const u=new URL(route.request().url());if(u.pathname==='/api/admin')return route.fulfill({json:{authenticated:true,listings:[]}});if(u.pathname==='/api/workspace'){
  if(route.request().method()==='POST'){
   const body=route.request().postDataJSON();if(body.action!=='edit-post')return route.fulfill({json:{saved:true}});requests++;received?.();if(mode==='hold')await new Promise(r=>release=r);
   if(mode==='401')return route.fulfill({status:401,json:{error:'Vui lòng đăng nhập quản trị.'}});
   if(mode==='422')return route.fulfill({status:422,json:{error:'Mã tin đã được sử dụng. Chọn mã khác.'}});
   if(mode==='network')return route.abort('failed');
   if(mode==='html')return route.fulfill({body:'<html>Bad gateway</html>',contentType:'text/html'});
   if(mode==='unconfirmed')return route.fulfill({json:{saved:false}});
   Object.assign(post.public_data,{title:body.title,price:Number(body.price)});return route.fulfill({json:{saved:true,post:post.public_data}});
  }
  return route.fulfill({json:{members:[],inquiries:[],posts:[post],notifications:[],items:[],imports:[],commands:[],runs:[],sources:[],storageConfigured:true,storageReady:true}});
 }
 if(u.pathname.startsWith('/api/'))return route.fulfill({json:{posts:[],items:[],listings:[],sources:[],configuration:{}}});const file=u.pathname==='/admin'?'admin.html':u.pathname.slice(1);try{return route.fulfill({body:await readFile('public/'+file),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined})}catch{return route.fulfill({status:404,body:''})}});
 await page.goto('https://save-ui.test/admin');await page.locator('[data-admin-view=tools]').click();await page.locator('[data-manage=posts]').click();
 async function open(){const row=page.locator('#management-posts details.source-row');if(!await row.evaluate(e=>e.open))await row.locator('summary').click();await row.locator('[data-edit-post]').click();}
 await open();const dialog=page.locator('#post-edit-dialog'),save=dialog.locator('[data-edit-save]'),note=dialog.locator('[data-edit-status]'),title=dialog.locator('[name=title]');
 await title.fill('');await save.click();assert.match(await note.textContent(),/Chưa lưu/);assert.equal(requests,0);
 await title.fill('Mặt bằng đã sửa');await dialog.locator('[name=price]').fill('18');mode='hold';const pending=new Promise(r=>received=r);await save.click();await pending;
 assert.equal(await save.textContent(),'Đang lưu…');assert(await save.isDisabled());assert(await title.isDisabled());await page.keyboard.press('Escape');assert(await dialog.isVisible());
 await dialog.locator('form').evaluate(f=>f.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true})));assert.equal(requests,1);release();await dialog.locator('[data-edit-done]').waitFor();assert.match(await note.textContent(),/Đã lưu xong MB - 0070/);assert.equal(await note.getAttribute('data-state'),'success');assert(await dialog.isVisible());assert.equal(post.public_data.price,18);await dialog.locator('[data-edit-done]').click();await dialog.waitFor({state:'detached'});assert.equal(await dialog.count(),0);
 for(const failure of ['401','422','network','html','unconfirmed']){
  await open();await title.fill('Giữ nguyên bản sửa '+failure);mode=failure;await save.click();await note.locator(':scope[data-state=error]').waitFor();assert(await dialog.isVisible());assert.equal(await title.inputValue(),'Giữ nguyên bản sửa '+failure);assert(await title.isEnabled());assert.equal(await save.textContent(),'Thử lưu lại');
  const text=await note.textContent();if(failure==='401'){assert.match(text,/phiên đăng nhập/);assert(await dialog.locator('[data-edit-login]').isVisible());assert.equal(await dialog.locator('[data-edit-login]').getAttribute('target'),'_blank')}else if(failure==='422')assert.match(text,/Mã tin đã được sử dụng/);else assert.match(text,/Chưa xác nhận/);
  mode='success';await save.click();await dialog.locator('[data-edit-done]').waitFor();assert(await dialog.locator('[data-edit-login]').isHidden());assert.equal(post.public_data.title,'Giữ nguyên bản sửa '+failure);await dialog.locator('[data-edit-done]').click();await dialog.waitFor({state:'detached'});
 }
 await open();await page.setViewportSize({width:390,height:844});await save.scrollIntoViewIfNeeded();assert(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth));await dialog.locator('[data-cancel]').last().click();assert.deepEqual(errors,[]);
 console.log('Save UI: validation, pending lock, duplicate prevention, Escape guard, persistent success, 401 re-login, server reasons, network/JSON ambiguity, retry and mobile passed');
}finally{await browser.close()}
