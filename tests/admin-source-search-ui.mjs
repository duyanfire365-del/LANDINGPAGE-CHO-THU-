import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<link rel="stylesheet" href="https://fixture.test/portal.css"><main id="smart"></main><main id="ordinary"></main>');
 await page.route('https://fixture.test/**',async r=>r.fulfill({body:await readFile('public/portal.css'),contentType:'text/css'}));
 await page.evaluate(()=>{window.RentalSharing={escape:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};window.RentalInventory={labels:{available:'Còn hàng'},state:()=> 'available',badge:()=>'',render:()=>{}}});
 for(const name of ['admin-source-search.js','source-library.js'])await page.addScriptTag({content:await readFile('public/'+name,'utf8')});
 await page.evaluate(()=>{
  const rows=[{slug:'one',code:'MB - 0070',title:'Nguyễn Khuyến <img src=x onerror="window.bad=1">',type:'Mặt bằng kinh doanh',categories:['Văn phòng'],area:'Hà Đông',size:60,price:15,reviewStatus:'published',post:{private_data:{sourceInfo:{sourceName:'Duy Trần'},address:'Số 18 Nguyễn Khuyến'}}},{slug:'two',code:'KX - 0002',title:'Kho Long Biên',type:'Kho xưởng',area:'Long Biên',size:200,price:30,reviewStatus:'rejected'}];
  window.lib=RentalSourceLibrary.mount(document.querySelector('#smart'),{smartSearch:true,extraFilters:[{key:'reviewStatus',label:'Trạng thái đăng',options:{published:'Đã đăng',rejected:'Đã gỡ'}}],detail:r=>'<button data-edit-post="'+r.slug+'">Sửa tin</button>'});lib.set(rows);
  RentalSourceLibrary.mount(document.querySelector('#ordinary'),{detail:()=>'',searchText:r=>r.title}).set(rows);
 });
 const q=page.locator('#smart [data-source-query]');
 await page.locator('#smart [data-source-area]').selectOption('Long Biên');
 await page.locator('#smart [data-source-budget]').selectOption('over-50');
 await q.fill('mặt bằng Hà Đông 50–100m² dưới 20 triệu');
 assert.match(await page.locator('#smart .source-count').textContent(),/1 tin/);
 assert.equal(await page.locator('#smart [role=option]').count(),1);assert.equal(await q.getAttribute('aria-expanded'),'true');
 assert.match(await page.locator('#smart .source-smart-criteria').textContent(),/50–100/);
 await q.press('ArrowDown');await q.press('Enter');assert.equal(await page.locator('#smart details[open] [data-edit-post=one]').count(),1);
 assert.equal(await q.getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>window.bad),undefined);
 await page.locator('#smart [data-source-reset]').click();await q.fill('nguon Duy Tran');assert.equal(await page.locator('#smart [role=option]').count(),1);
 await page.locator('#smart [data-source-extra]').selectOption('rejected');assert.match(await page.locator('#smart .source-count').textContent(),/0 tin/);
 await page.locator('#smart [data-source-reset]').click();await q.fill('MB0070');assert.equal(await page.locator('#smart [role=option]').count(),1);
 await page.evaluate(()=>lib.clear());assert.equal(await page.locator('#smart [role=option]').count(),0);assert(!((await page.locator('#smart').textContent()).includes('Duy Trần')));
 await page.locator('#ordinary [data-source-area]').selectOption('Long Biên');await page.locator('#ordinary [data-source-query]').fill('MB0070');assert.match(await page.locator('#ordinary .source-count').textContent(),/0 tin/,'code cannot bypass other filters');
 assert.equal(await page.locator('#ordinary [role=combobox]').count(),0);
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('Browser: suggestions, keyboard opening, filter precedence, private clearing, XSS, shared default and mobile passed');
}finally{await browser.close()}
