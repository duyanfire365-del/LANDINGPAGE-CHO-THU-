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
 await page.route('https://logo-ui.example/**',async route=>{const u=new URL(route.request().url());if(u.pathname==='/api/admin')return route.fulfill({json:{authenticated:true,listings:[]}});
 if(u.pathname==='/api/catalog'&&['website-brand','site-content'].includes(u.searchParams.get('view')))return respond(route,catalog);
 if(u.pathname==='/api/files'&&['website-logo','footer-logo'].includes(u.searchParams.get('action')))return respond(route,files);
 if(u.pathname==='/api/workspace'){
 const body=route.request().method()==='POST'?route.request().postDataJSON():undefined;if(['website-logo','site-content'].includes(u.searchParams.get('view'))||String(body?.action||'').startsWith('site-content-')||String(body?.action||'').startsWith('website-logo-'))return respond(route,workspace);
 if(u.searchParams.get('view')==='scan-sources')return route.fulfill({json:{items:[],schedule:{timezone:'Asia/Ho_Chi_Minh',times:['05:30'],enabled:false},revision:null,runtime:{ready:false,message:'Chưa kích hoạt'}}});return route.fulfill({json:{members:[],inquiries:[],posts:[],notifications:[],items:[],imports:[],commands:[],runs:[],sources:[],storageConfigured:true,storageReady:true,telegramConfigured:false}})}
 if(u.pathname.startsWith('/api/'))return route.fulfill({json:{posts:[],items:[],imports:[],inventory:{},hot:{},hotSelected:{}}});const name=u.pathname==='/admin'?'admin.html':u.pathname==='/'?'index.html':u.pathname.slice(1);if(name.includes('..'))return route.abort();try{return route.fulfill({body:await readFile('public/'+name),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':undefined})}catch{return route.fulfill({status:404,body:''})}
 });
 await page.goto('https://logo-ui.example/admin');await page.locator('#site-content-settings summary').click();await page.getByLabel('Địa chỉ',{exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('#site-content-settings input').disabled);
 await page.getByLabel('Địa chỉ',{exact:true}).fill('Địa chỉ mới Hà Nội');await page.getByLabel('Câu hỏi',{exact:true}).first().fill('<img src=x onerror=alert(1)>');await page.getByLabel('Trả lời (văn bản thuần; xuống dòng để chia đoạn)',{exact:true}).first().fill('Trả lời thủ công mới');await page.getByRole('button',{name:'Lưu nội dung',exact:true}).click();await page.getByRole('status').filter({hasText:'Đã lưu nội dung'}).waitFor();
 await page.getByRole('button',{name:'+ Thêm câu hỏi',exact:true}).click();assert.equal(await page.getByLabel('Câu hỏi',{exact:true}).count(),11);await page.getByRole('button',{name:'Xóa câu hỏi',exact:true}).last().click();assert.equal(await page.getByLabel('Câu hỏi',{exact:true}).count(),10);
 const png=await sharp({create:{width:600,height:150,channels:4,background:'green'}}).png().toBuffer();await page.locator('#site-content-settings input[type=file]').setInputFiles({name:'new.png',mimeType:'image/png',buffer:png});await page.getByRole('status').filter({hasText:'Đang xem trước'}).waitFor();await page.getByRole('button',{name:'Lưu logo cuối trang',exact:true}).click();await page.getByRole('status').filter({hasText:'Đã lưu logo cuối trang riêng'}).waitFor();
 await page.goto('https://logo-ui.example/');await page.waitForFunction(()=>document.querySelector('.footer-office address').textContent.includes('Địa chỉ mới Hà Nội'));assert.equal(await page.locator('.faq details summary span:last-child').first().textContent(),'<img src=x onerror=alert(1)>');assert.equal(await page.locator('.faq details img').count(),0);assert.equal(await page.locator('.footer-custom-logo').count(),1);assert((await page.locator('.footer-custom-logo').getAttribute('src')).includes('footer-logo'));
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));const image=await page.locator('.footer-custom-logo').boundingBox();assert(image.width<=320&&image.height<=112)}
 await page.reload();await page.waitForFunction(()=>document.querySelector('.footer-office address').textContent.includes('Địa chỉ mới Hà Nội'));
 await page.goto('https://logo-ui.example/admin');await page.locator('#site-content-settings summary').click();await page.getByLabel('Địa chỉ',{exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('#site-content-settings input').disabled);await page.getByRole('button',{name:'Dùng logo đầu trang',exact:true}).click();await page.getByRole('status').filter({hasText:'Cuối trang đã dùng logo đầu trang'}).waitFor();await page.evaluate(()=>window.dispatchEvent(new CustomEvent('admin-session',{detail:false})));assert.equal(await page.locator('#site-content-settings').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS admin → real API → public FAQ/footer: manual edit/save/reload, add/delete, escaped text, separate logo preview/save/reset, 4 responsive sizes, logout.');
}finally{await browser.close();global.fetch=original}
