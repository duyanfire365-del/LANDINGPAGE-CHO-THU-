import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createHmac,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import ExcelJS from 'exceljs';
import handler from '../api/workspace.mjs';
import {resultInput} from '../lib/scan-results.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
process.env.SUPABASE_URL='https://result-ui-db.test';process.env.SUPABASE_ANON_KEY='fake';process.env.SUPABASE_SERVICE_ROLE_KEY='fake';process.env.ADMIN_SECRET='fake-ui-test-secret-no-production-key-12345';
const v=JSON.parse(await readFile('lib/admin-password.json','utf8')),val=String(Date.now()+3600000)+'.result-test',signature=createHmac('sha256','rental-admin-session:'+process.env.ADMIN_SECRET+':'+v.hash).update(val).digest('base64url'),cookie='rental_admin='+val+'.'+signature;
const now=new Date(Date.now()-5000),records=Array.from({length:43},(_,i)=>resultInput({kind:i<40?'owner':'tenant',originalUrl:'https://example.com/post/'+i,content:'Tôi chính chủ cho thuê nhà. <script>window.bad=1</script>',address:'Số '+(i+1)+' Đặng Tất',district:i%2?'Ba Đình':'Tây Hồ',rent:i<40?10+i:null,size:i<40?20+i:null,phone:i%2?'0912345678':'',authorName:'Người đăng '+i,budget:i>=40?'Dưới 15 triệu':'',requirements:i>=40?'Tìm mặt bằng bán hàng':'',collectedAt:now.toISOString(),sources:[{name:'Nhóm mặt bằng A',url:'https://www.facebook.com/groups/123/'},{name:'Nhóm mặt bằng B',url:'https://www.facebook.com/groups/456/'}],industries:['Cửa hàng'],propertyType:'Nhà nguyên căn',frontage:4},new Date()));
records.push({id:randomUUID(),kind:'scan-run:v1',record_id:JSON.stringify({at:now.toISOString(),received:43,added:43}),created_at:now.toISOString(),sent:true});
const original=global.fetch;
global.fetch=async(raw,opts={})=>{const u=new URL(raw);assert.equal(u.origin,'https://result-ui-db.test');const kind=u.searchParams.get('kind')?.slice(3),id=u.searchParams.get('id')?.slice(3);if(!opts.method||opts.method==='GET')return Response.json(records.filter(x=>(!kind||x.kind===kind)&&(!id||x.id===id)).slice(+(u.searchParams.get('offset')||0),+(u.searchParams.get('offset')||0)+ +(u.searchParams.get('limit')||500)));assert.equal(opts.method,'PATCH');const row=records.find(x=>x.id===id);Object.assign(row,JSON.parse(opts.body));return Response.json([row])};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];let exported=null;page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://result-ui.example/**',async route=>{const u=new URL(route.request().url());if(u.pathname==='/api/admin')return route.fulfill({json:{authenticated:true,listings:[]}});
 if(u.pathname==='/api/workspace'){
  const body=route.request().method()==='POST'?route.request().postDataJSON():undefined;
  if(u.searchParams.get('view')==='scan-results'||String(body?.action||'').startsWith('scan-result-')){let status=200,payload,headers;await handler({method:route.request().method(),url:u.pathname+u.search,headers:{host:'result-ui.example',cookie,'content-type':'application/json'},body,socket:{remoteAddress:'result-ui'}},{writeHead(s,h){status=s;headers=h},end(p){payload=p},setHeader(){}});if(body?.action==='scan-result-export')exported=payload;return route.fulfill({status,headers,body:payload})}
  if(u.searchParams.get('view')==='scan-sources')return route.fulfill({json:{items:[],schedule:{timezone:'Asia/Ho_Chi_Minh',times:['05:30'],enabled:false},revision:null,runtime:{ready:false,message:'Chưa kích hoạt'}}});
  return route.fulfill({json:{members:[],inquiries:[],posts:[],notifications:[],items:[],imports:[],commands:[],runs:[],sources:[],storageConfigured:true,storageReady:true,telegramConfigured:false}});
 }
 if(u.pathname.startsWith('/api/'))return route.fulfill({json:{posts:[],items:[],imports:[],sources:[],configuration:{},status:{}}});
 const name=u.pathname==='/admin'?'admin.html':u.pathname.slice(1);if(name.includes('..'))return route.abort();try{return route.fulfill({body:await readFile('public/'+name),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':undefined})}catch{return route.fulfill({status:404,body:''})}
 });
 await page.goto('https://result-ui.example/admin');await page.locator('[data-admin-view=tools]').click();await page.locator('[data-manage=scan-results]').click();await page.locator('[data-result-count]').filter({hasText:'40 / 40'}).waitFor();assert.equal(await page.locator('[data-result-rows] tr').count(),30);assert.equal(await page.locator('.scan-stats article').count(),6);assert.equal(await page.locator('.scan-chart svg').count(),1);
 await page.locator('[data-result-next]').click();assert.equal(await page.locator('[data-result-rows] tr').count(),10);await page.locator('[data-result-prev]').click();
 await page.locator('[data-result-detail]').first().click();assert(await page.locator('[data-result-dialog]').isVisible());assert((await page.locator('[data-result-detail-body]').textContent()).includes('<script>'));assert.equal(await page.evaluate(()=>window.bad),undefined);await page.locator('[data-result-close]').click();
 await page.locator('[data-result-verify]').first().click();await page.locator('[data-result-verify]').first().filter({hasText:'Đã xác minh'}).waitFor();await page.locator('[data-result-status]').first().selectOption('published');await page.locator('.scan-stats article').filter({hasText:'Đã đăng nguồn'}).locator('strong').filter({hasText:'1'}).waitFor();
 await page.locator('#scan-results-root [name=q]').fill('so 1 dang tat');await page.locator('[data-result-count]').filter({hasText:'1 / 40'}).waitFor();await page.locator('[data-result-reset]').click();
 await page.locator('#scan-results-root [name=rentMin]').fill('20');await page.locator('#scan-results-root [name=rentMax]').fill('25');await page.locator('[data-result-count]').filter({hasText:'6 / 40'}).waitFor();
 await page.locator('[data-result-export]').click();await page.waitForFunction(()=>document.querySelector('[data-result-message]').textContent.includes('Đã xuất Excel'));const book=new ExcelJS.Workbook();await book.xlsx.load(exported);assert.equal(book.worksheets[0].rowCount,7,'export must match active filters across all pages');
 await page.locator('[data-result-reset]').click();await page.locator('[data-result-kind=tenant]').click();await page.locator('[data-result-count]').filter({hasText:'3 / 3'}).waitFor();assert((await page.locator('[data-result-rows]').textContent()).includes('Dưới 15 triệu'));
 await page.locator('[data-result-kind=owner]').click();await page.locator('#scan-results-root [name=hasPhone]').check();await page.locator('[data-result-count]').filter({hasText:'20 / 40'}).waitFor();await page.locator('[data-result-reset]').click();
 await mkdir('/workspace/work/scan-results-qa',{recursive:true});await page.screenshot({path:'/workspace/work/scan-results-qa/desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'only table, not page, should scroll horizontally');await page.screenshot({path:'/workspace/work/scan-results-qa/mobile.png',fullPage:true});
 records.length=0;await page.locator('[data-result-refresh]').click();await page.locator('[data-result-rows]').filter({hasText:'Chưa có tin phù hợp'}).waitFor();assert(await page.locator('[data-result-export]').isDisabled());assert.equal(await page.locator('.scan-stats strong').allTextContents().then(x=>x.every(v=>v==='0')),true);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('admin-session',{detail:false})));assert.equal(await page.locator('#scan-results-root').textContent(),'');assert.deepEqual(errors,[]);
 console.log('PASS real admin results UI: 6 stats, chart, pagination, escaped content dialog, persisted verification/status, search, price/phone filters, matching XLSX, tenant tab, mobile layout, logout cleanup.');
}finally{await browser.close();global.fetch=original}
