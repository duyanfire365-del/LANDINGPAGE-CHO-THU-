const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const base=process.env.ADMIN_TEST_URL||'http://127.0.0.1:3004',secret=process.env.ADMIN_LOGIN_PASSWORD;
 assert(secret,'Provide ADMIN_LOGIN_PASSWORD through the environment, never in test source');
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
 try{
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let response=await context.request.get(base+'/api/admin');assert.equal(response.status(),401);assert(!(await response.text()).includes('10A'));
  response=await context.request.post(base+'/api/admin',{data:{action:'login',password:'incorrect'}});assert.equal(response.status(),401);
  response=await context.request.post(base+'/api/admin',{headers:{origin:'https://untrusted.example'},data:{action:'login',password:secret}});assert.equal(response.status(),403);
  await page.goto(base+'/admin');assert(await page.locator('#admin-workspace').isHidden());assert(!(await page.content()).includes('#DuyHome'));
  await page.locator('#admin-password').fill(secret);await page.locator('#admin-login button').click();await page.locator('#admin-workspace').waitFor();
  assert.equal(await page.locator('#admin-records .source-row').count(),10);
  assert.equal(await page.locator('#admin-records .source-detail h3').count(),0,'details must not render until opened');
  await page.locator('#admin-records [data-source-next]').click();assert((await page.locator('#admin-records .source-count').innerText()).includes('11–20'));
  await page.locator('#admin-records [data-source-folder="Kho xưởng"]').click();assert.equal(await page.locator('#admin-records .source-row').count(),1);
  await page.locator('#admin-records [data-source-reset]').click();
  await page.locator('#admin-records [data-source-area]').selectOption('Ba Đình');assert((await page.locator('#admin-records .source-count').innerText()).includes('tin'));
  await page.locator('#admin-records [data-source-reset]').click();
  const cookies=await context.cookies();const session=cookies.find(c=>c.name==='rental_admin');assert(session.httpOnly);assert.equal(session.sameSite,'Strict');
  response=await context.request.get(base+'/api/admin');assert.equal(response.status(),200);assert.match(response.headers()['cache-control'],/no-store/);
  const records=(await response.json()).listings;assert.equal(records[5].address,'10A Phạm Huy Thông, Ba Đình, Hà Nội');assert(records[5].hashtags.includes('#DongDa'));
  await page.locator('#admin-records [data-source-query]').fill('HN-006');assert.equal(await page.locator('.admin-record').count(),1);
  await page.locator('#admin-records .source-row>summary').click();
  assert((await page.locator('.admin-address').innerText()).includes('10A'));assert((await page.locator('.admin-hashtags').innerText()).includes('#DongDa'));
  await page.locator('[data-share-action=copy]').click();const caption=await page.evaluate(()=>navigator.clipboard.readText());assert(caption.includes('#DongDa'));assert(!caption.includes('10A'));assert(caption.includes('Ba Đình'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('admin-secret')),null);
  for(const width of [375,768,1440]){await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  await page.locator('[data-admin-view="telegram"]').click();assert(await page.locator('#private-library').isHidden());assert(await page.locator('#management').isHidden());assert(await page.locator('#source-inbox').isVisible());
  await page.route('**/api/telegram-inbox',route=>route.fulfill({json:{items:Array.from({length:23},(_,i)=>({id:String(i),created_at:new Date().toISOString(),processing_status:'published',content:'Nguồn kiểm thử '+i,media:[]})),automation:{enabled:false}}}));
  await page.locator('#source-inbox>summary').click();await page.locator('#source-inbox [data-refresh]').click();await page.waitForFunction(()=>document.querySelectorAll('.source-inbox-row').length===10);assert.equal(await page.locator('.source-inbox-row[open]').count(),0);await page.locator('[data-inbox-next]').click();assert((await page.locator('.source-inbox-row>summary').first().innerText()).includes('Nguồn kiểm thử 10'));
  await page.locator('[data-admin-view="sources"]').click();assert(await page.locator('#private-library').isVisible());
  await page.screenshot({path:'/tmp/admin-private-review.png'});
  await page.locator('#admin-logout').click();await page.locator('#admin-login').waitFor();assert.equal(await page.locator('.admin-record').count(),0);assert(!(await page.content()).includes('10A'));
  assert.equal((await context.request.get(base+'/api/admin')).status(),401);
  await context.addCookies([{name:'rental_admin',value:session.value+'tamper',url:base}]);assert.equal((await context.request.get(base+'/api/admin')).status(),401);
  for(const path of ['/lib/admin-listings.enc.json','/admin-original.json','/admin-secret.key'])assert.equal((await context.request.get(base+path)).status(),404);
  for(const r of require('../public/listings.json')){
   const html=fs.readFileSync('public/bds/'+r.slug+'/index.html','utf8');assert(!html.includes('#DuyHome'));assert(!html.includes('hashtag gốc'));
   assert(!/(?:số \d|ngõ \d|ngách \d|15B|10A|49A|LK13)/i.test(html));
  }
  assert.deepEqual(errors,[]);console.log('PASS: private API denies anonymous/wrong/cross-origin/forged sessions; authenticated admin sees 30 private addresses/hashtags; sharing omits exact address; logout clears data; public routes exclude private details');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
