import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {trustedDraft} from '../lib/trusted-intake.mjs';
import defaults from '../lib/site-content-defaults.json' with {type:'json'};
const {chromium}=createRequire(import.meta.url)('playwright');
const base=(await trustedDraft({text:'Cho thuê mặt bằng Thanh Xuân\nDiện tích 80m2\nMặt tiền 7m\nGiá thuê 14tr/tháng'})).public_data;
const posts=['rent','sale'].flatMap((transactionType,t)=>Array.from({length:45},(_,i)=>({...base,id:1800000000000+t*100+i,slug:'live-'+(1800000000000+t*100+i),code:'TEST-'+transactionType+'-'+i,title:transactionType+' Listing '+i,transactionType,price:transactionType==='sale'?2000:14,salePrice:transactionType==='sale'?2000:null,href:'/tin?slug=test-'+transactionType+'-'+i})));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',async route=>{
 const u=new URL(route.request().url());if(u.origin!=='https://concise.test')return route.abort();
 if(u.pathname==='/listings-data.js')return route.fulfill({body:'window.RENTAL_LISTINGS=[];',contentType:'application/javascript'});
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/catalog'&&!u.search)return route.fulfill({json:{posts:posts,inventory:{},hot:{},hotSelected:{}}});
  if(u.searchParams.get('view')==='site-content')return route.fulfill({json:{content:defaults,logo:{url:'/logo.png'}}});
  return route.fulfill({json:{items:[],posts:[],authenticated:false,canViewTotal:false}});
 }
 const file=u.pathname==='/'?'index.html':u.pathname==='/tin'?'tin.html':u.pathname.slice(1);try{return route.fulfill({body:await readFile('public/'+file),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':undefined});}catch{return route.fulfill({status:404,body:''});}
 });
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('https://concise.test/');
  for(const mode of ['rent','sale']){
   await page.locator('[data-transaction="'+mode+'"]').click();
   await page.waitForFunction(()=>document.querySelectorAll('#properties .card').length===20);
   const titles=()=>page.locator('#properties .card h3').allTextContents();const first=await titles();
   assert.equal(await page.locator('#listing-pagination [aria-current="page"]').textContent(),'1');
   await page.locator('#listing-pagination [aria-label="Trang 2"]').click();assert.equal(await page.locator('#properties .card').count(),20);
   assert((await titles()).every(t=>!first.includes(t)));
   await page.locator('#listing-pagination [aria-label="Trang 3"]').click();assert.equal(await page.locator('#properties .card').count(),5);
   assert(await page.locator('#listing-pagination [aria-label="Sau"]').isDisabled());
   assert(!(await page.locator('#result-count').isVisible()));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   await page.locator('#search').evaluate(form=>form.requestSubmit());
   assert.equal(await page.locator('#listing-pagination [aria-current="page"]').textContent(),'1');
   await page.locator('#property-query').fill('no-result-xyz');await page.locator('#search').evaluate(form=>form.requestSubmit());
   assert.equal(await page.locator('#properties .card').count(),0);assert(!(await page.locator('#listing-pagination').isVisible()));
   await page.locator('#property-query').fill('');await page.locator('#search').evaluate(form=>form.requestSubmit());
  }
 }
 assert.deepEqual(errors,[]);console.log('Public pagination: 20/20/5, rent/sale, filters, hidden counts and responsive layout passed');
}finally{await browser.close();}
