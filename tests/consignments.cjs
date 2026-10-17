const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.DEMO_URL||'http://127.0.0.1:3008');
  assert.deepEqual(await page.locator('[data-lead-intent]').evaluateAll(nodes=>nodes.map(n=>n.dataset.leadIntent)),['tenant','owner','owner_sale','owner_transfer']);
  await page.locator('[data-lead-intent=owner_sale]').click();
  assert.equal(await page.locator('#lead-heading').innerText(),'Thông tin ký gửi bán BĐS');assert.equal(await page.locator('#owner-price-label').innerText(),'Giá bán (triệu đồng)');
  assert(await page.locator('#transfer-rent-field').isHidden());assert(await page.locator('[name=preferredBudget]').isHidden());
  await page.locator('[name=name]').fill('Nguyễn An');await page.locator('[name=phone]').fill('0906215365');await page.locator('[name=ownerAddress]').fill('Địa chỉ ký gửi riêng');await page.locator('[name=ownerSize]').fill('80');await page.locator('[name=ownerRent]').fill('5500');await page.locator('[name=ownerAuthority]').check();await page.locator('[name=contactConsent]').check();
  await page.locator('#lead-form button[type=submit]').click();let summary=await page.locator('#lead-summary').innerText();assert(summary.includes('KÝ GỬI BÁN'));assert(summary.includes('Giá bán dự kiến: 5500 triệu đồng'));assert(!summary.includes('triệu đồng/tháng'));
  await page.locator('[data-lead-intent=owner_transfer]').click();assert.equal(await page.inputValue('[name=ownerRent]'),'','a sale price must not silently become a transfer price');assert(!(await page.locator('[name=ownerAuthority]').isChecked()));
  assert(await page.locator('#transfer-rent-field').isVisible());await page.locator('[name=ownerRent]').fill('350');await page.locator('[name=transferMonthlyRent]').fill('20');await page.locator('[name=ownerAuthority]').check();await page.locator('#lead-form button[type=submit]').click();
  summary=await page.locator('#lead-summary').innerText();assert(summary.includes('Giá chuyển nhượng dự kiến: 350 triệu đồng'));assert(summary.includes('Tiền thuê hiện tại: 20 triệu đồng/tháng'));
  await page.locator('#lead-form').screenshot({path:'/tmp/consignment-transfer-mobile.png'});
  await page.locator('[data-lead-intent=owner_sale]').click();assert.equal(await page.inputValue('[name=ownerRent]'),'5500');
  for(const width of [375,768,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  await page.locator('[data-lead-intent=tenant]').click();assert(await page.locator('#owner-fields').isHidden());assert(await page.locator('[name=transferMonthlyRent]').isDisabled());assert(await page.locator('[name=preferredBudget]').isVisible());
  assert.deepEqual(errors,[]);console.log('PASS: four intents, correct one-off/monthly price units, transfer rental cost kept separate, per-intent price memory, renewed ownership consent and responsive layout');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
