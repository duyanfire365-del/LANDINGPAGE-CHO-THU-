const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'});
  try {
    const page = await browser.newPage();
    await page.goto(process.env.DEMO_URL || 'http://127.0.0.1:3001');
    const areas = await page.locator('#area optgroup option').allTextContents();
    const expected = ['Ba Đình','Bắc Từ Liêm','Cầu Giấy','Đống Đa','Hà Đông','Hai Bà Trưng','Hoàn Kiếm','Hoàng Mai','Long Biên','Nam Từ Liêm','Tây Hồ','Thanh Xuân','Ba Vì','Chương Mỹ','Đan Phượng','Đông Anh','Gia Lâm','Hoài Đức','Mê Linh','Mỹ Đức','Phú Xuyên','Phúc Thọ','Quốc Oai','Sóc Sơn','Thạch Thất','Thanh Oai','Thanh Trì','Thường Tín','Ứng Hòa','Sơn Tây'];
    assert.deepEqual(areas, expected);
    assert.equal(new Set(areas).size, 30);
    assert.deepEqual(await page.locator('[name=preferredArea] optgroup option').allTextContents(), areas);
    assert.deepEqual(await page.locator('[name=preferredType] option').allTextContents().then(x=>x.slice(1)), await page.locator('#type option').allTextContents().then(x=>x.slice(1)));
    const ranges = ['under-5','under-10','10-20','20-30','30-50','over-50'];
    assert.deepEqual(await page.locator('#budget option').evaluateAll(els=>els.slice(1).map(o=>o.value)),ranges);
    assert.deepEqual(await page.locator('[name=preferredBudget] option').evaluateAll(els=>els.slice(1).map(o=>o.value)),ranges);
    const boundaries = [[4.9,[true,true,false,false,false,false]],[5,[false,true,false,false,false,false]],[10,[false,false,true,false,false,false]],[20,[false,false,false,true,false,false]],[30,[false,false,false,false,true,false]],[50,[false,false,false,false,true,false]],[50.1,[false,false,false,false,false,true]]];
    for (const [price, expected] of boundaries) assert.deepEqual(await page.evaluate(({price,ranges})=>ranges.map(r=>matchesBudget(price,r)),{price,ranges}),expected);
    for(const [range,count] of [['under-5',0],['under-10',2],['10-20',2],['20-30',2],['30-50',0],['over-50',0]]) {
      await page.selectOption('#budget',range);
      await page.locator('#search button').click();
      assert.equal(await page.locator('.card').count(),count,range);
    }
    await page.selectOption('#budget','all');
    for(const area of expected) {await page.selectOption('#area',area);await page.locator('#search button').click();assert.equal(await page.locator('.card').count(),['Tây Hồ','Cầu Giấy','Ba Đình'].includes(area)?2:0);}
    await page.selectOption('#area','all');
    for(const type of ['Mặt bằng kinh doanh','Văn phòng','Kho xưởng','Nhà nguyên căn','Căn hộ chung cư','Căn hộ dịch vụ','Phòng trọ']) {
      await page.selectOption('#type',type);await page.locator('#search button').click();
      assert.equal(await page.locator('.card').count(),({'Nhà nguyên căn':1,'Căn hộ chung cư':3,'Căn hộ dịch vụ':2})[type]||0);
    }
    await page.selectOption('#type','all');await page.selectOption('#area','Tây Hồ');await page.selectOption('#budget','10-20');await page.locator('#search button').click();assert.equal(await page.locator('.card').count(),2);
    for(const width of [375,768,1440]) {await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width)}
    await page.setViewportSize({width:1440,height:1000});await page.locator('#search').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/filters-desktop.png'});
    console.log('PASS: all 30 old Hanoi areas, property categories, synchronized form options, six budgets, exact boundaries, combined filters and responsive layout');
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
