const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  await page.route('http://rental.test/',route=>route.fulfill({path:path.resolve('dist/Nguon-cho-Thue-Ha-Noi-demo.html'),contentType:'text/html'}));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://rental.test/');
  const values=await page.locator('#type option').evaluateAll(options=>options.map(o=>o.value));
  assert.deepEqual(await page.locator('[data-type]').evaluateAll(buttons=>buttons.map(b=>b.dataset.type)),values);
  assert.deepEqual(values.slice(1,4),['Mặt bằng kinh doanh','Văn phòng','Kho xưởng']);
  assert.equal(await page.locator('#bat-dong-san .section-top h2').innerText(),'Chọn BĐS phù hợp.');
  const descriptions=new Set();
  for(const value of values){
   await page.locator(`[data-type="${value}"]`).click();
   assert.equal(await page.inputValue('#type'),value);
   assert.equal(await page.locator('#category-title').innerText(),value==='all'?'Tất cả BĐS cho thuê':value);
   descriptions.add(await page.locator('#category-description').innerText());
   assert.equal(await page.locator('[data-type][aria-pressed=true]').count(),1);
   assert.equal(await page.locator('#category-checklist li').count(),3);
   const count=({'all':6,'Nhà nguyên căn':1,'Căn hộ chung cư':3,'Căn hộ dịch vụ':2})[value]||0;
   assert.equal(await page.locator('.card').count(),count);
   if(count===0)assert((await page.locator('.empty').innerText()).includes(value.toLocaleLowerCase('vi')));
   await page.locator('#category-consult').click();
   assert.equal(await page.inputValue('[name=preferredType]'),value==='all'?'':value);
  }
  assert.equal(descriptions.size,values.length);
  await page.selectOption('#type','Văn phòng');await page.selectOption('#area','Cầu Giấy');await page.selectOption('#budget','20-30');await page.locator('#search button').click();
  assert.equal(await page.locator('#category-title').innerText(),'Văn phòng');
  await page.locator('#category-consult').click();
  assert.equal(await page.inputValue('[name=preferredArea]'),'Cầu Giấy');assert.equal(await page.inputValue('[name=preferredBudget]'),'20-30');
  await page.locator('[data-type="Kho xưởng"]').focus();await page.keyboard.press('Enter');assert.equal(await page.inputValue('#type'),'Kho xưởng');
  for(const width of [375,768,1440]){
   await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width);
   for(const button of await page.locator('[data-type]').all())assert((await button.boundingBox()).height>=44);
  }
  await page.setViewportSize({width:1440,height:1100});await page.locator('[data-type="Mặt bằng kinh doanh"]').click();await page.locator('#bat-dong-san').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/categories-desktop.png'});
  await page.setViewportSize({width:390,height:1000});await page.locator('.listing-toolbar').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/categories-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: all 12 category buttons, priority order, unique content, correct listings/empty states, consultation prefill, keyboard selection, responsive layout');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
