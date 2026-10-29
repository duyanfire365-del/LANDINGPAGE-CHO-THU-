import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
import {createRequire} from 'node:module';
import {fixture} from './three-bot-fixture.mjs';
import {matchingSnapshot} from '../lib/matching-bots.mjs';
import handler from '../api/workspace.mjs';
const {chromium}=createRequire(import.meta.url)('playwright'),f=await fixture(),original=global.fetch;global.fetch=f.fetch;delete process.env.MATCH_BOTS_ENABLED;
process.env.ADMIN_SECRET='unit-test-secret-no-production-value-12345';const v=JSON.parse(await readFile('lib/admin-password.json','utf8')),value=String(Date.now()+3600000)+'.test',sig=createHmac('sha256','rental-admin-session:'+process.env.ADMIN_SECRET+':'+v.hash).update(value).digest('base64url'),cookie='rental_admin='+value+'.'+sig;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://matching-ui.example/**',async route=>{const u=new URL(route.request().url());if(u.pathname==='/api/admin')return route.fulfill({json:{authenticated:true,listings:[]}});
 if(u.pathname==='/api/workspace'){const body=route.request().method()==='POST'?route.request().postDataJSON():undefined;
  if(u.searchParams.get('view')==='matching-bots'||String(body?.action||'').startsWith('matching-bots-')){let status=200,payload;await handler({method:route.request().method(),url:u.pathname+u.search,body,headers:{host:'matching-ui.example',cookie,'content-type':'application/json'},socket:{remoteAddress:'matching-ui'}},{writeHead(s){status=s},end(p){payload=p},setHeader(){}});return route.fulfill({status,contentType:'application/json',body:payload})}
  if(u.searchParams.get('view')==='scan-sources')return route.fulfill({json:{items:[],schedule:{timezone:'Asia/Ho_Chi_Minh',times:['05:30'],enabled:false},revision:null,runtime:{ready:false,message:'Chưa kích hoạt'}}});
  return route.fulfill({json:{members:[],inquiries:[],posts:[],notifications:[],items:[],imports:[],commands:[],runs:[],sources:[],storageConfigured:true,storageReady:true,telegramConfigured:false}});
 }
 if(u.pathname.startsWith('/api/'))return route.fulfill({json:{posts:[],items:[],imports:[],sources:[],configuration:{},status:{}}});const name=u.pathname==='/admin'?'admin.html':u.pathname.slice(1);if(name.includes('..'))return route.abort();try{return route.fulfill({body:await readFile('public/'+name),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':undefined})}catch{return route.fulfill({status:404,body:''})}
 });
 await page.goto('https://matching-ui.example/admin');await page.locator('[data-admin-view=tools]').click();await page.locator('[data-manage=matching-bots]').click();await page.locator('[data-bot-counts]').filter({hasText:'3 hồ sơ'}).waitFor();assert.equal(await page.locator('[data-bot-cards] article').count(),3);assert.equal(f.messages.length,0);
 const s=await matchingSnapshot(),watch=s.customers.find(c=>c.origins[0].kind==='watch'),scanned=s.customers.find(c=>c.origins[0].kind==='scan');
 await page.locator('[data-bot-customer]').selectOption(watch.key);await page.locator('[data-bot-profile-panel]').waitFor();await page.locator('[data-bot-profile-panel] summary').click();
 await page.locator('details').filter({has:page.locator('[data-bot-stock]')}).locator('summary').click();await page.locator('[data-bot-stock]').selectOption(f.stock.slug);await page.locator('[data-bot-stock-form] [name=allowedIndustries]').fill('Cà phê');await page.locator('[data-bot-stock-form] button').click();await page.locator('[data-bot-status]').filter({hasText:'Đã lưu tiêu chí nguồn'}).waitFor();assert((await page.locator('[data-bot-matches]').textContent()).includes('Khớp đủ tiêu chí'));
 await page.locator('[data-bot-profile] [name=maxBudget]').fill(String(f.stock.price-1));await page.locator('[data-bot-profile] button').click();await page.locator('[data-bot-status]').filter({hasText:'Đã lưu tiêu chí riêng'}).waitFor();assert.equal(f.tables.customer_watch[0].data.maxBudget,f.stock.price+10,'never overwrite the original customer');
 await page.locator('[data-bot-customer]').selectOption(scanned.key);await page.locator('[data-bot-origins] a[href="https://example.com/tenant"]').waitFor();await page.locator('[data-bot-profile] [name=requirementsReviewed]').check();await page.locator('[data-bot-profile] button').click();await page.locator('[data-bot-status]').filter({hasText:'Đã lưu tiêu chí riêng'}).waitFor();assert((await page.locator('[data-bot-matches]').textContent()).includes('Khớp đủ tiêu chí'));
 await page.locator('[data-bot-run]').click();await page.locator('[data-bot-status]').filter({hasText:'Chưa bật'}).waitFor();assert.equal(f.messages.length,0);
 process.env.MATCH_BOTS_ENABLED='1';await page.locator('[data-bot-run]').click();await page.locator('[data-bot-status]').filter({hasText:'Đã xử lý'}).waitFor({timeout:60000});assert(f.messages.some(m=>m.body.text.includes('https://example.com/tenant')));assert(f.messages.some(m=>m.body.text.includes('KHỚP NGUỒN')));
 await page.locator('[data-bot-test=property]').click();await page.locator('[data-bot-status]').filter({hasText:'Telegram đã xác nhận'}).waitFor();assert(! (await page.locator('#matching-bots-root').textContent()).includes(process.env.TELEGRAM_MATCH_BOT_TOKEN));
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await page.evaluate(()=>window.dispatchEvent(new CustomEvent('admin-session',{detail:false})));assert.equal(await page.locator('#matching-bots-root').textContent(),'');assert.deepEqual(errors,[]);
 console.log('PASS matching admin UI → real handlers → private data doubles: three bot cards, all origins, stock criteria, customer profile, source preservation, strict matches, disabled activation, queue/send/test, secret masking, mobile and logout.');
}finally{await browser.close();global.fetch=original;delete process.env.MATCH_BOTS_ENABLED}
