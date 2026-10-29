import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
import handler from '../api/workspace.mjs';
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
 await page.goto('https://scan-ui.example/admin');await page.locator('[data-admin-view=tools]').click();await page.locator('[data-manage="scan-sources"]').click();
 await page.locator('[data-scan-runtime]').filter({hasText:'Chưa kích hoạt'}).waitFor();assert.equal(writes,0);
 await page.locator('[data-scan-text] textarea').fill('https://example.com/a\nhttps://example.com/a#top\nhttps://www.facebook.com/groups/123');await page.locator('[data-scan-text] button').click();await page.locator('[data-scan-save]').waitFor();assert.equal(writes,0,'preview must not save or activate');assert((await page.locator('[data-scan-preview]').textContent()).includes('1 link trùng'));
 await page.locator('[data-scan-save]').click();await page.locator('[data-scan-count]').filter({hasText:'2 nguồn đã lưu'}).waitFor();assert.equal(writes,1);assert((await page.locator('[data-scan-list]').textContent()).includes('cần kết nối đọc bài'));
 await page.locator('[data-scan-file] input').setInputFiles({name:'more.txt',mimeType:'text/plain',buffer:Buffer.from('https://example.com/b')});await page.locator('[data-scan-file] button[type=submit]').click();await page.locator('[data-scan-save]').click();await page.locator('[data-scan-count]').filter({hasText:'3 nguồn đã lưu'}).waitFor();
 await page.locator('[data-scan-schedule] [name=enabled]').check();await page.locator('[data-scan-schedule] button').click();await page.locator('[data-scan-schedule-state]').filter({hasText:'Đã lưu yêu cầu'}).waitFor();assert((await page.locator('[data-scan-schedule-state]').textContent()).includes('chưa có lượt quét tự động'));
 await page.locator('[data-scan-search]').fill('example.com/b');assert.equal(await page.locator('[data-scan-list] article').count(),1);await page.locator('[data-scan-toggle]').click();await page.locator('[data-scan-list]').filter({hasText:'Đã tạm dừng'}).waitFor();await page.locator('[data-scan-remove]').click();await page.locator('[data-scan-count]').filter({hasText:'2 nguồn đã lưu'}).waitFor();
 await page.setViewportSize({width:390,height:844});await page.locator('[data-scan-search]').fill('');await page.waitForTimeout(200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'portal should fit mobile');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('admin-session',{detail:false})));assert.equal(await page.locator('#scan-sources-root').textContent(),'');assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS real admin UI → portal tab → preview/deduplication → TXT upload → private save → schedule → search/pause/delete → mobile → logout clears data; backend and storage mock integrated.');
}finally{await browser.close();global.fetch=original}
