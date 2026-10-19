const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
 try{
  const page=await browser.newPage(),base=process.env.DEMO_URL||'http://127.0.0.1:3015';await page.goto(base);
  const keys=['under-5','under-10','10-20','20-30','30-50','over-50','over-100','over-200','over-300'];
  for(const selector of ['#budget','[name=preferredBudget]'])assert.deepEqual(await page.locator(selector+' option').evaluateAll(els=>els.slice(1).map(o=>o.value)),keys);
  for(const [limit,yes,no] of [[100,100.01,100],[200,200.01,200],[300,300.01,300]])assert.deepEqual(await page.evaluate(({limit,yes,no})=>[matchesBudget(yes,'over-'+limit),matchesBudget(no,'over-'+limit)],{limit,yes,no}),[true,false]);
  for(const key of keys.slice(-3)){await page.selectOption('#budget',key);await page.locator('#search button').click();await page.evaluate(()=>prepareCategoryConsultation());assert.equal(await page.locator('[name=preferredBudget]').inputValue(),key)}
  await page.addScriptTag({url:base+'/source-library.js'});
  await page.evaluate(()=>{const el=document.createElement('div');el.id='budget-library-test';document.body.append(el);const library=RentalSourceLibrary.mount(el,{detail:()=>''});library.set([176,250,350].map((price,i)=>({id:i,slug:'test-'+i,code:'TEST-'+i,title:'Tin thử',type:'Kho xưởng',area:'Hà Nội',price}))) });
  const host=page.locator('#budget-library-test');assert.deepEqual(await host.locator('[data-source-budget] option').evaluateAll(els=>els.slice(1).map(o=>o.value)),keys);
  for(const [key,count]of [['over-100',3],['over-200',2],['over-300',1]]){await host.locator('[data-source-budget]').selectOption(key);assert.equal(await host.locator('.source-row').count(),count)}
  console.log('PASS: nine synchronized budgets, strict >100/>200/>300 boundaries, inquiry prefill, admin/member source filters use total monthly rent.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
