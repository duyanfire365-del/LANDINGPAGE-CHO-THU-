import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
import {createRequire} from 'node:module';
import sharp from 'sharp';
import {fixture} from './three-bot-fixture.mjs';
import workspace from '../api/workspace.mjs';
import catalog from '../api/catalog.mjs';
import files from '../api/files.mjs';
const {chromium}=createRequire(import.meta.url)('playwright'),f=await fixture(),original=global.fetch;global.fetch=f.fetch;
process.env.ADMIN_SECRET='logo-ui-only-fake-secret-12345678901234';const v=JSON.parse(await readFile('lib/admin-password.json','utf8')),value=String(Date.now()+3600000)+'.logo',sig=createHmac('sha256','rental-admin-session:'+process.env.ADMIN_SECRET+':'+v.hash).update(value).digest('base64url'),cookie='rental_admin='+value+'.'+sig;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function respond(route,handler,headers={}){const req=route.request();let status=200,payload='',out;await handler({method:req.method(),url:new URL(req.url()).pathname+new URL(req.url()).search,body:req.method()==='POST'?req.postDataJSON():undefined,headers:{host:'logo-ui.example',cookie,'content-type':'application/json',...headers},socket:{remoteAddress:'logo-ui'}},{writeHead(s,h){status=s;out=h},end(p){payload=p||''},setHeader(){}});return route.fulfill({status,headers:out,body:payload})}
 let saveReply=null,saveCount=0;
 await page.route('https://logo-ui.example/**',async route=>{const u=new URL(route.request().url());if(u.pathname==='/api/admin')return route.fulfill({json:{authenticated:true,listings:[]}});
 if(u.pathname==='/api/catalog'&&['website-brand','site-content'].includes(u.searchParams.get('view')))return respond(route,catalog);
 if(u.pathname==='/api/files'&&['website-logo','footer-logo'].includes(u.searchParams.get('action')))return respond(route,files);
 if(u.pathname==='/api/workspace'){
 const body=route.request().method()==='POST'?route.request().postDataJSON():undefined;if(body?.action==='site-content-save'&&saveReply){saveCount++;return saveReply(route);}
 if(['website-logo','site-content'].includes(u.searchParams.get('view'))||String(body?.action||'').startsWith('site-content-')||String(body?.action||'').startsWith('website-logo-'))return respond(route,workspace);
 if(u.searchParams.get('view')==='scan-sources')return route.fulfill({json:{items:[],schedule:{timezone:'Asia/Ho_Chi_Minh',times:['05:30'],enabled:false},revision:null,runtime:{ready:false,message:'Chưa kích hoạt'}}});return route.fulfill({json:{members:[],inquiries:[],posts:[],notifications:[],items:[],imports:[],commands:[],runs:[],sources:[],storageConfigured:true,storageReady:true,telegramConfigured:false}})}
 if(u.pathname.startsWith('/api/'))return route.fulfill({json:{posts:[],items:[],imports:[],inventory:{},hot:{},hotSelected:{}}});const name=u.pathname==='/admin'?'admin.html':u.pathname==='/'?'index.html':u.pathname.slice(1);if(name.includes('..'))return route.abort();try{return route.fulfill({body:await readFile('public/'+name),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':undefined})}catch{return route.fulfill({status:404,body:''})}
 });

 await page.goto('https://logo-ui.example/admin');
 const rent=page.locator('#site-content-settings'),sale=page.locator('#site-content-sale-settings');
 assert.equal(await sale.count(),1);await rent.locator(':scope > summary').click();await rent.getByLabel('Địa chỉ',{exact:true}).waitFor();
 await rent.getByText('Tiêu đề và nội dung: banner, danh sách BĐS, quy trình, liên hệ',{exact:true}).click();
 await rent.getByLabel('Banner: tiêu đề chính',{exact:true}).fill('Nguồn thuê giữ riêng');
 await sale.locator(':scope > summary').click();await sale.getByLabel('Địa chỉ',{exact:true}).waitFor();
 assert.equal(await rent.getByLabel('Banner: tiêu đề chính',{exact:true}).inputValue(),'Nguồn thuê giữ riêng');
 await sale.getByText('Tiêu đề và nội dung: banner, danh sách BĐS, quy trình, liên hệ',{exact:true}).click();
 assert.equal(await sale.getByLabel('Banner: tiêu đề chính',{exact:true}).inputValue(),'Tìm nguồn Mua/Bán BĐS tại Hà Nội');
 await sale.getByLabel('Banner: tiêu đề chính',{exact:true}).fill('Nguồn mua bán do admin chỉnh');
 await sale.getByLabel('Tìm kiếm: tên nút tìm',{exact:true}).fill('Tìm nguồn mua theo yêu cầu');
 await sale.getByLabel('Banner: tên nút xem BĐS',{exact:true}).fill('Xem nguồn bán mới');
 await sale.getByLabel('Link ảnh banner (https:// hoặc /đường-dẫn-ảnh; trống = ảnh mặc định)',{exact:true}).fill('/banner.png?v=sale-edited');
 await sale.getByLabel('Câu hỏi',{exact:true}).first().fill('FAQ mua bán tự sửa');
 await sale.getByLabel('Trả lời (văn bản thuần; xuống dòng để chia đoạn)',{exact:true}).first().fill('Câu trả lời mua bán tự sửa');
 await sale.getByLabel('Giới thiệu cuối trang',{exact:true}).fill('Giới thiệu mua bán độc lập');
 const sectionGroup=sale.locator('details').filter({has:page.locator('summary').filter({hasText:'Bố cục trang: thêm mục'})});await sectionGroup.locator('summary').click();
 await sale.locator('#sale-edit-process').getByLabel('Ẩn mục này / bỏ ẩn để khôi phục',{exact:true}).check();
 await sectionGroup.getByRole('button',{name:'+ Tạo mục / thư mục nội dung',exact:true}).click();
 await sale.getByLabel('Tên mục / tiêu đề',{exact:true}).fill('Hướng dẫn mua nhà riêng');
 await sale.getByLabel('Nội dung (xuống dòng để chia đoạn)',{exact:true}).fill('Nội dung riêng cho người mua.');
 const quick=sale.locator('details').filter({has:page.locator('summary').filter({hasText:'Đầu trang: nút tìm BĐS nổi bật'})});await quick.locator('summary').click();
 await quick.getByLabel('Tiêu đề tìm BĐS',{exact:true}).fill('TÌM MUA TỰ CHỈNH');
 const menu=sale.locator('details').filter({has:page.locator('summary').filter({hasText:'Menu đầu trang: sửa, thêm'})});await menu.locator('summary').click();await menu.getByLabel('Tên liên kết',{exact:true}).first().fill('Trang chủ BĐS');
 const categories=sale.locator('details').filter({has:page.locator('summary').filter({hasText:'Danh mục BĐS: đổi tên'})});await categories.locator('summary').click();const house=categories.locator('fieldset').filter({has:page.locator('legend').getByText('Nhà nguyên căn',{exact:true})});await house.getByLabel('Tên danh mục hiển thị',{exact:true}).fill('Nhà bán chính chủ');
 const colors=sale.locator('details').filter({has:page.locator('summary').getByText('Màu giao diện',{exact:true})});await colors.locator('summary').click();await colors.getByLabel('Màu chủ đạo',{exact:true}).fill('#145a54');
 const [backup]=await Promise.all([page.waitForEvent('download'),sale.getByRole('button',{name:'Tải bản sao lưu JSON',exact:true}).click()]);assert(backup.suggestedFilename().includes('sale'));
 const logo=await sharp({create:{width:200,height:100,channels:4,background:'blue'}}).png().toBuffer();await sale.locator('input[type=file]:not([aria-label])').setInputFiles({name:'sale-logo.png',mimeType:'image/png',buffer:logo});await sale.getByRole('button',{name:'Lưu logo cuối trang',exact:true}).click();await sale.getByRole('status').filter({hasText:'Đã lưu logo cuối trang riêng'}).waitFor();
 assert.equal(await sale.getByLabel('Câu hỏi',{exact:true}).first().inputValue(),'FAQ mua bán tự sửa');
 await sale.getByRole('button',{name:'Xem trước toàn trang',exact:true}).click();
 const frame=page.frameLocator('.site-editor-preview iframe');await frame.locator('.hero h1').getByText('Nguồn mua bán do admin chỉnh',{exact:true}).waitFor();
 assert((await frame.locator('.hero-photo img').getAttribute('src')).endsWith('/banner.png?v=sale-edited'));
 assert.equal(await frame.locator('#search > button').textContent(),'Tìm nguồn mua theo yêu cầu');assert(await frame.locator('#quy-trinh').isHidden());
 assert.equal(await frame.locator('header [data-custom-menu]').first().textContent(),'Trang chủ BĐS');assert.equal(await frame.locator('[data-type="Nhà nguyên căn"]').textContent(),'Nhà bán chính chủ');assert.equal(await frame.locator('html').evaluate(n=>n.style.getPropertyValue('--primary')),'#145a54');
 assert.equal(await frame.locator('.hero .button').textContent(),'Xem nguồn bán mới');assert.equal(await frame.getByText('Hướng dẫn mua nhà riêng',{exact:true}).count(),1);
 const beforeSave=await page.evaluate(async()=>fetch('/api/catalog?view=site-content').then(r=>r.json()));assert.notEqual(beforeSave.sale.content.layout.fields.heroTitle,'Nguồn mua bán do admin chỉnh');
 await frame.getByRole('button',{name:'CHO THUÊ',exact:true}).click();assert(!await frame.locator('#quy-trinh').isHidden());assert.equal(await frame.getByText('Hướng dẫn mua nhà riêng',{exact:true}).count(),0);
 await frame.getByRole('button',{name:'MUA/BÁN',exact:true}).click();assert.equal(await frame.locator('.hero h1').textContent(),'Nguồn mua bán do admin chỉnh');
 await page.getByRole('button',{name:'Đóng xem trước',exact:true}).click();
 await sale.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await sale.getByRole('status').filter({hasText:'Đã lưu thành công'}).waitFor();
 await rent.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await rent.getByRole('status').filter({hasText:'Đã lưu thành công'}).waitFor();
 await page.goto('https://logo-ui.example/?transaction=sale');await page.locator('.hero h1').getByText('Nguồn mua bán do admin chỉnh',{exact:true}).waitFor();
 assert.equal(await page.locator('#search > button').textContent(),'Tìm nguồn mua theo yêu cầu');assert(await page.locator('#quy-trinh').isHidden());
 assert.equal(await page.locator('.faq details').first().locator('summary span:last-child').textContent(),'FAQ mua bán tự sửa');
 assert.equal(await page.locator('.footer-brand > p').textContent(),'Giới thiệu mua bán độc lập');
 assert.equal(await page.locator('[data-quick-rental] strong').textContent(),'TÌM MUA TỰ CHỈNH');
 await page.getByRole('button',{name:'CHO THUÊ',exact:true}).click();assert.equal(await page.locator('.hero h1').textContent(),'Nguồn thuê giữ riêng');assert(!await page.locator('#quy-trinh').isHidden());
 await page.getByRole('button',{name:'MUA/BÁN',exact:true}).click();assert.equal(await page.locator('.hero h1').textContent(),'Nguồn mua bán do admin chỉnh');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));}
 await page.goto('https://logo-ui.example/admin');await page.locator('#site-content-sale-settings > summary').click();await page.locator('#site-content-sale-settings').getByLabel('Địa chỉ',{exact:true}).waitFor();
 const loaded=page.locator('#site-content-sale-settings');await loaded.getByText('Tiêu đề và nội dung: banner, danh sách BĐS, quy trình, liên hệ',{exact:true}).click();
 assert.equal(await loaded.getByLabel('Banner: tiêu đề chính',{exact:true}).inputValue(),'Nguồn mua bán do admin chỉnh');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('admin-session',{detail:false})));assert.equal(await page.locator('#site-content-sale-settings').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS independent sale editor: separate drafts/saves, full-page sale preview, no publish before save, custom hero/banner/search/quick/FAQ/footer/sections, rental preservation, reload, responsive widths and logout.');
}finally{await browser.close();global.fetch=original}
