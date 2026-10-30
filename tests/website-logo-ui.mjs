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
 if(u.pathname==='/api/catalog'&&u.searchParams.get('view')==='website-brand')return respond(route,catalog);
 if(u.pathname==='/api/files'&&u.searchParams.get('action')==='website-logo')return respond(route,files);
 if(u.pathname==='/api/workspace'){
 const body=route.request().method()==='POST'?route.request().postDataJSON():undefined;if(u.searchParams.get('view')==='website-logo'||String(body?.action||'').startsWith('website-logo-'))return respond(route,workspace);
 if(u.searchParams.get('view')==='scan-sources')return route.fulfill({json:{items:[],schedule:{timezone:'Asia/Ho_Chi_Minh',times:['05:30'],enabled:false},revision:null,runtime:{ready:false,message:'Chưa kích hoạt'}}});return route.fulfill({json:{members:[],inquiries:[],posts:[],notifications:[],items:[],imports:[],commands:[],runs:[],sources:[],storageConfigured:true,storageReady:true,telegramConfigured:false}})}
 if(u.pathname.startsWith('/api/'))return route.fulfill({json:{posts:[],items:[],imports:[],inventory:{},hot:{},hotSelected:{}}});const name=u.pathname==='/admin'?'admin.html':u.pathname==='/'?'index.html':u.pathname.slice(1);if(name.includes('..'))return route.abort();try{return route.fulfill({body:await readFile('public/'+name),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':undefined})}catch{return route.fulfill({status:404,body:''})}
 });
 await page.goto('https://logo-ui.example/admin');await page.locator('#website-logo-settings summary').click();await page.waitForFunction(()=>!document.querySelector('[data-logo-form] [name=logo]').disabled);assert.equal(await page.locator('header .website-header-logo').count(),0);
 const png=await sharp({create:{width:1200,height:240,channels:4,background:{r:20,g:100,b:180,alpha:1}}}).png().toBuffer();await page.locator('[data-logo-form] [name=logo]').setInputFiles({name:'logo.png',mimeType:'image/png',buffer:png});await page.locator('[data-logo-status]').filter({hasText:'chưa thay logo'}).waitFor();assert.equal(await page.locator('header .website-header-logo').count(),0);
 await page.locator('[data-logo-form] [name=alt]').fill('Logo thương hiệu mới');await page.locator('[data-logo-form] button[type=submit]').click();await page.locator('[data-logo-status]').filter({hasText:'Đã lưu logo'}).waitFor();await page.locator('header .website-header-logo').waitFor();assert.equal(await page.locator('header .website-header-logo').getAttribute('alt'),'Logo thương hiệu mới');assert.equal(await page.locator('header a.logo').getAttribute('href'),'/');const box=await page.locator('header .website-header-logo').boundingBox();assert(box.width>320&&box.width<=440&&box.height<=112);assert(Math.abs(box.width/box.height-5)<.05);
 await page.reload();await page.locator('header .website-header-logo').waitFor();for(const width of [320,390,700,768,1024,1440]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));const image=await page.locator('header .website-header-logo').boundingBox();assert(image.width<=(width<=700?320:440)&&image.height<=(width<=700?96:112));assert(Math.abs(image.width/image.height-5)<.05);const nav=await page.locator('header nav').boundingBox();assert(image.y+image.height<=nav.y+1||image.x+image.width<=nav.x+1,'logo and navigation must not overlap')}await page.setViewportSize({width:390,height:844});
 await page.locator('#website-logo-settings summary').click();await page.waitForFunction(()=>!document.querySelector('[data-logo-reset]').disabled);await page.locator('[data-logo-reset]').click();await page.locator('[data-logo-status]').filter({hasText:'Đã khôi phục'}).waitFor();await page.waitForFunction(()=>!document.querySelector('header .website-header-logo'));assert((await page.locator('header .logo').textContent()).includes('Nguồn cho thuê BĐS Hà Nội'));
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('admin-session',{detail:false})));assert.equal(await page.locator('#website-logo-settings').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS logo admin UI: preview without saving, upload and public header replacement, alt/home link, reload persistence, mobile aspect/layout, default reset and logout; real API handlers with fake private store.');
}finally{await browser.close();global.fetch=original}
