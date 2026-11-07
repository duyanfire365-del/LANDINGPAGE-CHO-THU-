import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {trustedDraft} from '../lib/trusted-intake.mjs';
import defaults from '../lib/site-content-defaults.json' with {type:'json'};
const {chromium}=createRequire(import.meta.url)('playwright');
const p=(await trustedDraft({text:'Cho thuê mặt bằng Phố Mẫu, Thanh Xuân\nTầng 1: 25m2\nTầng 2: 30m2\nMặt tiền: 3,5m\nGiá thuê 25tr/tháng\nLối đi riêng\nKhông kinh doanh hàng ăn'})).public_data;
p.code='MB - 0999';p.id=1794999999999999;p.slug='live-'+p.id;p.href='/tin?slug='+p.slug;p.facts=['Mặt tiền: 3.5 m.','Tầng 1: 25 m².','Tầng 2: 30 m².','Diện tích chính hiển thị: tầng 1.','Có lối đi riêng.'];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',async route=>{
 const u=new URL(route.request().url());if(u.origin!=='https://concise.test')return route.abort();
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/catalog'&&!u.search)return route.fulfill({json:{posts:[p],inventory:{},hot:{},hotSelected:{}}});
  if(u.searchParams.get('view')==='site-content')return route.fulfill({json:{content:defaults,logo:{url:'/logo.png'}}});
  return route.fulfill({json:{items:[],posts:[],authenticated:false,canViewTotal:false}});
 }
 const file=u.pathname==='/'?'index.html':u.pathname==='/tin'?'tin.html':u.pathname.slice(1);try{return route.fulfill({body:await readFile('public/'+file),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':undefined});}catch{return route.fulfill({status:404,body:''});}
 });
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('https://concise.test/');await page.locator('[data-detail="'+p.id+'"]').click();await page.locator('#detail[open]').waitFor();
  assert.equal((await page.locator('#detail .property-description').textContent()).match(/Mặt tiền:/g).length,1);
  assert.equal(await page.locator('#detail .detail-facts li').filter({hasText:/Mặt tiền|Tầng 1|Tầng 2|hiển thị|lối đi riêng/i}).count(),0);
  assert(!(await page.locator('#detail-content').textContent()).includes('Diện tích chính hiển thị'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await page.goto('https://concise.test/tin?slug='+p.slug);await page.locator('.property-description').waitFor();
  assert.equal(await page.locator('.property-dimensions .property-key-frontage').count(),0);
  assert(!(await page.locator('.property-content').textContent()).includes('Diện tích chính hiển thị'));
  assert(await page.locator('.property-contact a[href="tel:0906215365"]').isVisible());
 }assert.deepEqual(errors,[]);console.log('PASS browser: concise modal and standalone details on phone/desktop, no repeated frontage/floors/features or parser metadata, contact and layout intact.');
}finally{await browser.close()}
