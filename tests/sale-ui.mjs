import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {trustedDraft} from '../lib/trusted-intake.mjs';
import defaults from '../lib/site-content-defaults.json' with {type:'json'};
const {chromium}=createRequire(import.meta.url)('playwright');const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const sale=(await trustedDraft({text:'Bán nhà nguyên căn tại Cầu Giấy\nDiện tích 80m2\nGiá bán 3,5 tỷ\n5 tầng'})).public_data;sale.code='NC - 0999';sale.slug='live-1793899999999999';sale.id=1793899999999999;sale.href='/tin?slug='+sale.slug;
let siteContent=defaults;
const rent={...sale,id:2,slug:'live-1793899999999998',href:'/tin?slug=live-1793899999999998',transactionType:'rent',code:'NC - 0998',price:25,title:'Cho thuê nhà kiểm tra',description:'Cho thuê nhà 80 m².'};
try{const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://sales.test/**',async route=>{const u=new URL(route.request().url());if(u.pathname.startsWith('/api/')){if(u.pathname==='/api/catalog'&&!u.search)return route.fulfill({json:{posts:[sale,rent],inventory:{[sale.slug]:'available',[rent.slug]:'available'},hot:{},hotSelected:{}}});if(u.searchParams.get('view')==='site-content')return route.fulfill({json:{content:siteContent,logo:{url:'/logo.png',alt:'Logo'}}});if(u.pathname==='/api/members')return route.fulfill({status:401,json:{error:'Chưa đăng nhập'}});return route.fulfill({json:{items:[],posts:[],authenticated:false}});}const file=u.pathname==='/'?'index.html':u.pathname==='/tin'?'tin.html':u.pathname.slice(1);try{return route.fulfill({body:await readFile('public/'+file),contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.html')?'text/html':undefined});}catch{return route.fulfill({status:404,body:''});}});
async function salePresentation(){
 assert.equal(await p.locator('.hero h1').textContent(),'Tìm nguồn Mua/Bán BĐS tại Hà Nội');
 assert(!/thuê|còn trống/iu.test(await p.locator('.hero').textContent()));
 assert((await p.locator('.hero-photo img').getAttribute('src')).endsWith('/sale-banner.webp'));
 await p.waitForFunction(()=>document.querySelector('.hero-photo img').naturalWidth>0);
 assert.equal(await p.locator('.hero-desc a[href="tel:0906215365"]').count(),1);
 assert.equal(await p.locator('.hero-desc .zalo-link').count(),1);
 assert.equal(await p.locator('[data-quick-rental] strong').textContent(),'TÌM BĐS PHÙ HỢP');
 assert((await p.locator('[data-quick-rental]').getAttribute('href')).includes('transaction=sale'));
 assert.equal(await p.locator('header nav a:visible').filter({hasText:'Xem BĐS mua/bán'}).count(),1);
 assert(!/thuê/iu.test(await p.locator('.contact > div:first-child').textContent()));
 assert.equal(await p.locator('#lead-area-label').textContent(),'Khu vực muốn mua');
 assert.equal(await p.locator('#lead-type-label').textContent(),'BĐS muốn mua');
 assert.equal(await p.locator('.footer-browse').textContent(),'Xem BĐS mua/bán →');
}
await p.goto('https://sales.test/');await p.locator('#properties .card').first().waitFor();const tabs=await p.locator('.search-wrap > .transaction-tabs').boundingBox();assert(tabs.width<280&&tabs.height<=52,'Transaction tabs must stay compact');assert.equal(await p.locator('[data-transaction=rent]').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('#properties .card').filter({hasText:'NC - 0999'}).count(),0);assert.equal(await p.locator('header [data-sales-nav]').count(),0);const rentalHero=await p.locator('.hero').innerHTML(),rentalQuick=await p.locator('[data-quick-rental]').innerHTML();const rentalLabel=await p.locator('#search > button').textContent(),rentalProcess=await p.locator('#quy-trinh').innerHTML(),rentalListing=await p.locator('.listings > .section-top').innerHTML();await p.getByRole('button',{name:'MUA/BÁN',exact:true}).click();assert.equal(await p.locator('#search > button').textContent(),'Tìm BĐS Phù Hợp');assert(!/thuê|còn trống/iu.test(await p.locator('#quy-trinh').textContent()));assert.equal(await p.locator('.listings > .section-top .eyebrow').textContent(),'DANH SÁCH BĐS');assert.equal(await p.locator('.listings > .section-top > p').textContent(),'Chọn loại BĐS để xem thông tin và danh sách phù hợp.');assert((await p.locator('#quy-trinh').textContent()).includes('giá bán'));assert((await p.locator('#quy-trinh').textContent()).includes('hồ sơ pháp lý'));await salePresentation();await p.locator('#properties .card').filter({hasText:'NC - 0999'}).waitFor();assert((await p.locator('#type').locator('..').textContent()).includes('DANH MỤC BĐS'));assert.equal(await p.locator('#type option[value=all]').textContent(),'Tất cả danh mục BĐS');assert.equal(await p.locator('#properties .card').count(),1);assert((await p.locator('#properties .price').textContent()).includes('3,5 tỷ đồng'));assert(!(await p.locator('#properties').textContent()).includes('/tháng'));await p.locator('#budget').selectOption('sale-under-1000');await p.locator('#search button[type=submit]').click();assert.equal(await p.locator('#properties .card').count(),0);await p.locator('#budget').selectOption('all');await p.locator('#search button[type=submit]').click();assert.equal(await p.locator('#properties .card').count(),1);await p.reload();await p.locator('[data-transaction=sale][aria-pressed=true]').waitFor();assert(!/thuê|còn trống/iu.test(await p.locator('#quy-trinh').textContent()));assert.equal(await p.locator('.listings > .section-top .eyebrow').textContent(),'DANH SÁCH BĐS');assert.equal(await p.locator('.listings > .section-top > p').textContent(),'Chọn loại BĐS để xem thông tin và danh sách phù hợp.');assert.equal(await p.locator('#search > button').textContent(),'Tìm BĐS Phù Hợp');assert((await p.locator('#type').locator('..').textContent()).includes('DANH MỤC BĐS'));await salePresentation();assert.equal(await p.locator('#lead-form').getAttribute('data-transaction-type'),'sale');assert(await p.locator('#tenant-criteria').isHidden());for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));}
await p.getByRole('button',{name:'CHO THUÊ',exact:true}).click();assert.equal(await p.locator('.hero').innerHTML(),rentalHero);assert.equal(await p.locator('[data-quick-rental]').innerHTML(),rentalQuick);assert.equal(await p.locator('#search > button').textContent(),rentalLabel);assert.equal(await p.locator('#quy-trinh').innerHTML(),rentalProcess);assert.equal(await p.locator('.listings > .section-top').innerHTML(),rentalListing);await p.getByRole('button',{name:'MUA/BÁN',exact:true}).click();await p.evaluate(()=>window.dispatchEvent(new CustomEvent('site-layout-apply',{detail:{layout:{fields:{searchButton:'Nút thuê tùy chỉnh',step2Text:'Nội dung thuê tùy chỉnh <img src=x onerror=alert(1)>',listingIntro:'Lời giới thiệu thuê tùy chỉnh'}}}})));assert.equal(await p.locator('#search > button').textContent(),'Tìm BĐS Phù Hợp');await p.getByRole('button',{name:'CHO THUÊ',exact:true}).click();assert.equal(await p.locator('#search > button').textContent(),'Nút thuê tùy chỉnh');assert.equal(await p.locator('#quy-trinh .steps article:nth-child(2) p').textContent(),'Nội dung thuê tùy chỉnh <img src=x onerror=alert(1)>');assert.equal(await p.locator('#quy-trinh img').count(),0);assert.equal(await p.locator('.listings > .section-top > p').textContent(),'Lời giới thiệu thuê tùy chỉnh');await p.getByRole('button',{name:'MUA/BÁN',exact:true}).click();assert.equal(await p.locator('#search > button').textContent(),'Tìm BĐS Phù Hợp');assert(!/thuê|còn trống/iu.test(await p.locator('#quy-trinh').textContent()));assert.equal(await p.locator('.listings > .section-top .eyebrow').textContent(),'DANH SÁCH BĐS');assert.equal(await p.locator('.listings > .section-top > p').textContent(),'Chọn loại BĐS để xem thông tin và danh sách phù hợp.');
// Admin rental presentation is restored safely; sale presentation survives preview and footer refresh.
await p.evaluate(()=>window.dispatchEvent(new CustomEvent('site-layout-apply',{detail:{layout:{fields:{heroTitle:'Tiêu đề thuê tùy chỉnh',heroDescription:'Mô tả <img src=x onerror=alert(1)>',heroSlogan:'Khẩu hiệu thuê'},banner:'/banner.png?v=custom',quick:{title:'TÌM THUÊ TÙY CHỈNH',text:'Nội dung thuê tùy chỉnh'},menu:[{label:'Xem BĐS cho thuê',url:'/#bat-dong-san'},{label:'Cách tìm BĐS Thuê',url:'/#quy-trinh'}]}}})));
await salePresentation();
await p.getByRole('button',{name:'CHO THUÊ',exact:true}).click();
assert.equal(await p.locator('.hero h1').textContent(),'Tiêu đề thuê tùy chỉnh');
assert.equal(await p.locator('.hero-desc').textContent(),'Mô tả <img src=x onerror=alert(1)>');
assert.equal(await p.locator('.hero-desc img').count(),0);
assert((await p.locator('.hero-photo img').getAttribute('src')).endsWith('/banner.png?v=custom'));
assert.equal(await p.locator('[data-quick-rental] strong').textContent(),'TÌM THUÊ TÙY CHỈNH');
assert.equal(await p.locator('header nav [data-custom-menu]').first().textContent(),'Xem BĐS cho thuê');
assert.equal(await p.locator('header nav [data-custom-menu]').first().getAttribute('href'),'/#bat-dong-san');
await p.getByRole('button',{name:'MUA/BÁN',exact:true}).click();await salePresentation();
await p.evaluate(()=>window.dispatchEvent(new Event('site-content-updated')));
await p.waitForTimeout(100);await salePresentation();
await p.setViewportSize({width:1440,height:1000});await p.locator('.hero').screenshot({path:'/tmp/sale-hero-desktop.png'});
// FAQ follows transaction mode, including refreshes and chatbot exact question actions.
assert.equal(await p.locator('.faq details').count(),10);
assert((await p.locator('.faq .eyebrow').textContent()).includes('MUA/BÁN'));
assert(!/thuê|còn trống/iu.test(await p.locator('.faq').textContent()));
for(const row of await p.locator('.faq details').all()){await row.locator('summary').click();assert(await row.locator('.faq-answer').isVisible());assert((await row.locator('.faq-answer').textContent()).length>100);}
await p.evaluate(()=>window.dispatchEvent(new Event('site-content-updated')));
await p.waitForFunction(()=>window.RentalCurrentFAQ?.transaction==='sale');
assert((await p.locator('.faq details').first().textContent()).includes('Giá bán'));
await p.locator('#chat-launcher').click();await p.locator('[data-chat-action=faq]').click();
const saleQuestion=await p.locator('.faq details').nth(4).locator('summary span:last-child').textContent();
await p.locator('#chat-options').getByRole('button',{name:saleQuestion,exact:true}).click();
assert((await p.locator('#chat-messages').textContent()).includes('Ký gửi bán'));
await p.locator('#chat-close').click();
await p.getByRole('button',{name:'CHO THUÊ',exact:true}).click();
assert.equal(await p.locator('.faq .eyebrow').textContent(),defaults.faqEyebrow);
assert.equal(await p.locator('.faq details').first().locator('summary span:last-child').textContent(),defaults.faqs[0].question);
assert.equal(await p.evaluate(()=>window.RentalCurrentFAQ.transaction),'rent');
await p.getByRole('button',{name:'MUA/BÁN',exact:true}).click();await p.reload();
await p.waitForFunction(()=>window.RentalCurrentFAQ?.transaction==='sale');
assert.equal(await p.locator('.faq details').count(),10);
assert(!/thuê|còn trống/iu.test(await p.locator('.faq').textContent()));
siteContent={...defaults,layout:{fields:{heroTitle:'Tiêu đề thuê lưu sẵn',heroDescription:'Giới thiệu thuê lưu sẵn'},banner:'/banner.png?v=saved',quick:{title:'TÌM THUÊ LƯU SẴN'}}};
await p.goto('https://sales.test/?transaction=sale');await p.locator('#properties .card').first().waitFor();await p.waitForTimeout(150);await salePresentation();
await p.getByRole('button',{name:'CHO THUÊ',exact:true}).click();
assert.equal(await p.locator('.hero h1').textContent(),'Tiêu đề thuê lưu sẵn');
assert.equal(await p.locator('.hero-desc').textContent(),'Giới thiệu thuê lưu sẵn');
assert((await p.locator('.hero-photo img').getAttribute('src')).endsWith('/banner.png?v=saved'));
assert.equal(await p.locator('[data-quick-rental] strong').textContent(),'TÌM THUÊ LƯU SẴN');
await p.getByRole('button',{name:'MUA/BÁN',exact:true}).click();
await p.locator('[data-type="Đất cho thuê"]').click();
assert(!/thuê/iu.test(await p.locator('#results-title').textContent()));
assert(!/thuê/iu.test(await p.locator('#properties .empty').textContent()));
await p.goto('https://sales.test/tin?slug='+sale.slug);await p.locator('.property-title').waitFor();const metric=await p.locator('.property-key-rent').textContent();assert(metric.includes('Giá bán'));assert(metric.includes('3,5 tỷ'));assert(!metric.includes('tháng'));assert.deepEqual(errors,[]);console.log('PASS sale UI: isolated tabs/categories/budgets, one-time card/detail pricing, URL reload, sale lead context, rental matcher exclusion and four mobile widths.');}finally{await browser.close();}
