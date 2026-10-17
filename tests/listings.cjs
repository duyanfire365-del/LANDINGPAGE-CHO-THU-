const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const records=require('../public/listings.json');
(async()=>{
 assert.equal(records.length,22);
 for(const field of ['id','slug','image'])assert.equal(new Set(records.map(r=>r[field])).size,22,field);
 assert.equal(records[5].area,'Ba Đình');assert.equal(records[14].area,'Thanh Trì');
 assert.equal(records[5].price,40);assert.equal(records[5].transferPrice,320);
 assert.deepEqual(records[9].priceOptions.map(o=>o.price),[25,50]);
 assert(records[5].notes.some(s=>s.includes('diện tích')));
 const hashes=new Set();
 for(const r of records){
  for(const field of ['image','shareImage'])assert(fs.statSync('public'+r[field]).size>10000);
  hashes.add(crypto.createHash('sha256').update(fs.readFileSync('public'+r.image)).digest('hex'));
  assert.equal(r.hashtags,undefined);assert(!r.shareText.includes('#'));
  assert(!/(?:số \d|ngõ \d|ngách \d|15B|10A|49A|LK13)/i.test(JSON.stringify(r)));
  assert(!/0867561961|0967841598|0948743688/.test(JSON.stringify(r)));
 }
 assert.equal(hashes.size,22);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
 try{
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.DEMO_URL||'http://127.0.0.1:3003';await page.goto(base);
  assert.equal(await page.locator('#result-count').innerText(),'22 BĐS phù hợp');
  assert.equal(await page.locator('.card').count(),9);await page.locator('#load-more').click();assert.equal(await page.locator('.card').count(),18);
  await page.locator('#load-more').click();assert.equal(await page.locator('.card').count(),22);assert(await page.locator('#load-more').isHidden());
  await page.locator('#property-query').fill('HN-006');await page.locator('#search button').click();assert.equal(await page.locator('.card').count(),1);
  assert((await page.locator('.card').innerText()).includes('Ba Đình'));
  await page.locator('[data-detail="1006"]').click();assert((await page.locator('#detail-content').innerText()).includes('320 triệu'));
  await page.locator('#detail [data-share-action=copy]').click();
  const clipboard=await page.evaluate(()=>navigator.clipboard.readText());assert(!clipboard.includes('#DongDa'));assert(!clipboard.includes('10A'));assert(clipboard.includes('Ba Đình'));assert(clipboard.endsWith('/bds/hn-006'));
  await page.locator('#close-detail').click();
  await page.goto(base+'/bds/hn-019');assert.equal(await page.locator('h1').innerText(),records[18].title);
  assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'),'https://webchothue.vercel.app/images/hn-019.jpg');
  const picture=await page.request.get(base+records[18].shareImage);assert.equal(picture.status(),200);assert.equal(picture.headers()['content-type'],'image/jpeg');
  await page.evaluate(()=>{navigator.share=async payload=>{window.shareResult={text:payload.text,files:payload.files?.map(f=>({name:f.name,type:f.type,size:f.size}))}};navigator.canShare=()=>true});
  await page.locator('[data-share-action=native]').click();await page.waitForFunction(()=>window.shareResult);
  const shared=await page.evaluate(()=>window.shareResult);assert(!shared.text.includes('#'));assert(!shared.text.includes('16/26'));assert.equal(shared.files[0].type,'image/jpeg');assert(shared.files[0].size>10000);
  for(const width of [375,768,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'detail overflow '+width)}
  await page.locator('a[href*="inquiry=hn-019"]').click();await page.waitForFunction(()=>document.querySelector('#lead-property')?.value==='1019');
  assert.equal(await page.inputValue('[name=preferredType]'),'Kho xưởng');assert.equal(await page.inputValue('[name=preferredArea]'),'Nam Từ Liêm');
  for(const r of records){const response=await page.request.get(base+'/bds/'+r.slug);assert.equal(response.status(),200);assert((await response.text()).includes('tel:0906215365'))}
  assert.equal((await page.request.get(base+'/bds/unknown')).status(),404);
  assert.deepEqual(errors,[]);
  console.log('PASS: 22 reviewed listings, corrected districts, separate rents/transfers, unique images, pagination/search, copy/native image sharing, 22 public pages, metadata, inquiry prefill and responsive detail');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
