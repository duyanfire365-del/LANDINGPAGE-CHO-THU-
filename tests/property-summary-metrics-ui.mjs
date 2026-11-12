import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const base={id:1794999999999999,slug:'live-1794999999999999',href:'/tin?slug=live-1794999999999999',code:'MB - 9999',type:'Mặt bằng kinh doanh',categories:['Mặt bằng kinh doanh'],title:'BĐS kiểm tra',address:'Mễ Trì, Nam Từ Liêm, Hà Nội',area:'Nam Từ Liêm',size:80,areaText:'80 m²',frontage:7,price:14,salePrice:3500,description:'Diện tích: 80 m².\nMặt tiền: 7 m.\nGiá thuê: 14 triệu đồng/tháng.',facts:[],notes:[],media:[],image:'/banner.png'};
let post={...base,transactionType:'rent'};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!=='https://metrics.test')return route.abort();if(u.pathname.startsWith('/api/'))return route.fulfill({json:{posts:[post],items:[],inventory:{},hot:{},hotSelected:{}}});const file=u.pathname==='/tin'?'tin.html':u.pathname.slice(1);try{return route.fulfill({body:await readFile('public/'+file),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});}catch{return route.fulfill({status:404,body:''});}});
for(const width of [390,1440])for(const [kind,view]of [['rent','rent'],['sale','sale'],['both','rent'],['both','sale']]){
 await page.setViewportSize({width,height:900});post={...base,transactionType:kind,price:kind==='sale'?3500:14};await page.goto('https://metrics.test/tin?slug='+post.slug+(view==='sale'?'&transaction=sale':''));await page.locator('.property-dimensions').waitFor();
 for(const metric of ['area','frontage','rent'])assert(await page.locator('.property-key-'+metric).isVisible(),kind+'/'+view+'/'+metric);
 assert((await page.locator('.property-key-area dd').textContent()).includes('80'));
 assert((await page.locator('.property-key-frontage dd').textContent()).includes('7 m'));
 const price=await page.locator('.property-key-rent').textContent();assert(price.includes(view==='sale'?'Giá bán':'Giá thuê'));assert(price.includes(view==='sale'?'3,5 tỷ':'14 triệu'));if(view==='sale')assert(!price.includes('tháng'));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
}
post={...base,transactionType:'rent',size:null,frontage:null,price:null,description:'Thông tin đang xác nhận.'};await page.goto('https://metrics.test/tin?slug='+post.slug);await page.locator('.property-dimensions').waitFor();assert.equal(await page.locator('.property-key-area dd').textContent(),'Chưa cập nhật');assert.equal(await page.locator('.property-key-frontage dd').textContent(),'Chưa cập nhật');assert(await page.locator('.property-key-rent').isVisible());assert.deepEqual(errors,[]);
console.log('PASS primary summary: area/frontage/price persist despite repeated prose, rent/sale/both, accurate units, missing-data placeholders and mobile/desktop layout.');
}finally{await browser.close()}
