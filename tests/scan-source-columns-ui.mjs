import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
import handler from '../api/workspace.mjs';
import {saveScanSources} from '../lib/scan-sources.mjs';
process.env.SUPABASE_URL='https://scan-ui-db.test';process.env.SUPABASE_ANON_KEY='fake';process.env.SUPABASE_SERVICE_ROLE_KEY='fake';process.env.ADMIN_SECRET='fake-ui-test-secret-no-production-key-12345';
const v=JSON.parse(await readFile('lib/admin-password.json','utf8')),value=String(Date.now()+3600000)+'.ui-test',signature=createHmac('sha256','rental-admin-session:'+process.env.ADMIN_SECRET+':'+v.hash).update(value).digest('base64url'),cookie='rental_admin='+value+'.'+signature;
const original=global.fetch;let record=null,writes=0;
global.fetch=async(raw,opts={})=>{const u=new URL(raw);assert.equal(u.origin,'https://scan-ui-db.test');assert.equal(u.pathname,'/rest/v1/notification_log');if(!opts.method||opts.method==='GET')return Response.json(record?[record]:[]);writes++;const body=JSON.parse(opts.body);record={...record,...body,created_at:body.created_at||new Date().toISOString()};return Response.json([record])};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://scan-ui.example/**',async route=>{const url=new URL(route.request().url());
  if(url.pathname==='/api/admin')return route.fulfill({json:{authenticated:true,listings:[]}});
  if(url.pathname==='/api/workspace'){
   const body=route.request().method()==='POST'?route.request().postDataJSON():undefined;
   if(url.searchParams.get('view')==='scan-sources'||String(body?.action||'').startsWith('scan-')){let status=200,payload;await handler({method:route.request().method(),url:url.pathname+url.search,headers:{host:'scan-ui.example',cookie,'content-type':'application/json'},body,socket:{remoteAddress:'ui-test'}},{writeHead(s){status=s},end(text){payload=JSON.parse(text)},setHeader(){}});return route.fulfill({status,json:payload})}
   return route.fulfill({json:{members:[],inquiries:[],posts:[],notifications:[],items:[],imports:[],commands:[],runs:[],sources:[],storageConfigured:true,storageReady:true,telegramConfigured:false}});
  }
  if(url.pathname.startsWith('/api/'))return route.fulfill({json:{posts:[],items:[],imports:[],sources:[],configuration:{},status:{}}});
  const name=url.pathname==='/admin'?'admin.html':url.pathname.slice(1);if(name.includes('..'))return route.abort();
  try{return route.fulfill({body:await readFile('public/'+name),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':undefined})}catch{return route.fulfill({status:404,body:''})}
 });
 await saveScanSources({action:'scan-import',revision:null,text:[...Array.from({length:11},(_,i)=>`https://example.com/site/${i+1}`),...Array.from({length:163},(_,i)=>`https://www.facebook.com/groups/group${i+1}/`)].join('\n')});writes=0;
 await page.goto('https://scan-ui.example/admin');await page.locator('[data-admin-view=tools]').click();await page.locator('[data-manage="scan-sources"]').click();
 await page.locator('[data-scan-count]').filter({hasText:'174 nguồn đã lưu'}).waitFor();
 const web=page.locator('[data-scan-column=website]'),fb=page.locator('[data-scan-column=facebook]');
 assert.equal(await web.locator('article').count(),11);assert.equal(await fb.locator('article').count(),20);
 assert.equal(await web.locator('.source-list-index').first().textContent(),'1');assert.equal(await fb.locator('.source-list-index').last().textContent(),'20');
 assert(await web.locator('[aria-label="website: trang trước"]').isDisabled());assert(await web.locator('[aria-label="website: trang sau"]').isDisabled());
 await fb.locator('[aria-label="Facebook: trang 2"]').click();assert.equal(await fb.locator('.source-list-index').first().textContent(),'21');assert.equal(await web.locator('.source-list-index').first().textContent(),'1');
 await fb.locator('[data-scan-toggle]').first().click();await page.locator('[data-scan-status]').filter({hasText:'Đã cập nhật'}).waitFor();assert.equal(await fb.locator('.source-list-index').first().textContent(),'21');assert((await fb.locator('article').first().textContent()).includes('Đã tạm dừng'));
 await fb.locator('[data-scan-page="9"]').click();assert.equal(await fb.locator('article').count(),3);assert.equal(await fb.locator('.source-list-index').first().textContent(),'161');
 for(let i=0;i<3;i++){const current=await fb.locator('article').count();await fb.locator('[data-scan-remove]').last().click();await page.waitForFunction(n=>document.querySelectorAll('[data-scan-column=facebook] article').length!==n,current)}
 assert.equal(await fb.locator('article').count(),20);assert((await fb.locator('.source-list-range').textContent()).includes('Trang 8 / 8'));assert.equal(await fb.locator('.source-list-index').first().textContent(),'141');
 await page.locator('[data-scan-mode=all]').click();assert.equal(await fb.locator('article').count(),160);assert.equal(await web.locator('article').count(),11);assert.equal(await page.locator('.source-list-pagination').count(),0);
 await page.locator('[data-scan-search]').fill('example.com/site/11');assert.equal(await web.locator('article').count(),1);assert.equal(await fb.locator('article').count(),0);assert.equal(await web.locator('.source-list-index').textContent(),'11','search keeps original per-type number');
 await page.locator('[data-scan-search]').fill('');await page.locator('[data-scan-mode="20"]').click();assert.equal(await fb.locator('article').count(),20);assert.equal(await fb.locator('.source-list-index').first().textContent(),'1');
 page.on('dialog',dialog=>dialog.accept());
 const beforeBulk=writes;await page.locator('[data-scan-select]').first().check();assert.equal(writes,beforeBulk);await fb.locator('[aria-label="Facebook: trang 2"]').click();await fb.locator('[data-scan-select]').first().check();await page.locator('[data-scan-bulk="selected-off"]').click();await page.locator('[data-scan-status]').filter({hasText:'Đã tắt 2 nguồn'}).waitFor();assert.equal(JSON.parse(record.record_id).items.filter(x=>!x.enabled).length,2);assert.equal(writes,beforeBulk+1);
 await page.locator('[data-scan-scope]').selectOption('facebook');await page.locator('[data-scan-bulk="all-off"]').click();await page.locator('[data-scan-status]').filter({hasText:'Đã tắt 160 nguồn'}).waitFor();assert(JSON.parse(record.record_id).items.filter(x=>x.platform==='facebook').every(x=>!x.enabled));assert(JSON.parse(record.record_id).items.filter(x=>x.platform==='website').some(x=>x.enabled));
 await page.locator('[data-scan-scope]').selectOption('all');await page.locator('[data-scan-search]').fill('example.com/site/11');await page.locator('[data-scan-bulk="all-on"]').click();await page.locator('[data-scan-status]').filter({hasText:'Đã bật 171 nguồn'}).waitFor();assert(JSON.parse(record.record_id).items.every(x=>x.enabled),'all includes sources outside search and page');



 await page.locator('[data-scan-clear-selection]').click();await page.locator('[data-scan-select-matches]').click();assert((await page.locator('[data-scan-selected]').textContent()).includes('Đã chọn 1 nguồn'));await page.locator('[data-scan-search]').fill('');
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));const positions=await page.locator('.source-list-column').evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y})));assert.equal(positions[0].x,positions[1].x);assert(positions[1].y>positions[0].y);
 assert.equal(writes,7,'four original mutations plus three atomic bulk changes; checkbox/search/pagination never write');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('admin-session',{detail:false})));assert.equal(await page.locator('#scan-sources-root').textContent(),'');assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS source columns: 11 websites/163 groups, numbering, independent 20-row pagination, last-page deletion/clamping, pause preserves page, show-all, search keeps numbering, mobile stacking, bulk selected/across-pages/platform/all beyond search, no writes for checkbox/navigation, logout.');
}finally{await browser.close();global.fetch=original}
