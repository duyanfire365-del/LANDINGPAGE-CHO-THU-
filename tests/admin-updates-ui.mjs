import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
const page=await browser.newPage();const errors=[],submitted=[];page.on('pageerror',error=>errors.push(error.message));
const post={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',status:'published',public_data:{id:1,slug:'live-1234567890123456',code:'KX - 0001',type:'Kho xưởng',categories:['Kho xưởng'],title:'Cho thuê kho xưởng 105 m² — Thanh Xuân',titleMode:'custom',address:'Thanh Xuân, Hà Nội',area:'Thanh Xuân',size:105,price:12,description:'Kho xưởng phù hợp lưu trữ hàng hóa.',media:[],facts:[],notes:[],image:'/banner.png'},private_data:{address:'',hashtags:['#KX']}};
await page.route('https://local.test/**',async route=>{const req=route.request(),url=new URL(req.url());
 if(url.pathname.startsWith('/api/')){
  let data={};if(req.method()==='POST'){const body=req.postDataJSON();submitted.push(body);if(body.action==='member-create')data={created:true,nickname:body.nickname};if(body.action==='edit-post')data={saved:true,post:{...post.public_data,code:body.code}};}
  else if(url.pathname==='/api/admin')data={listings:[]};
  else if(url.pathname==='/api/workspace'&&!url.search)data={members:[],inquiries:[],posts:[post],notifications:[]};
  else if(url.searchParams.get('view')==='source-private')data={slug:post.public_data.slug,code:post.public_data.code,canEdit:true,canViewCommission:true,sharedEmails:[],recipients:[],data:{ownerPhones:['0987654321'],partnerPhones:['0912345678'],commission:'Hoa hồng: 1 tháng',privateNotes:'Hẹn chủ trước 30 phút'}};
  else if(url.searchParams.get('view')==='connections')data={storageReady:true,storageConfigured:true,telegramConfigured:true};
  else data={items:[],customers:[],inquiries:[],sources:[],records:[],members:[],history:[],events:[],items:[],posts:[],automation:{enabled:true}};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});return;
 }
 const path=url.pathname==='/admin'?'/admin.html':url.pathname;
 try{const bytes=await readFile(new URL('../public'+path,import.meta.url));const ext=path.split('.').at(-1);await route.fulfill({status:200,contentType:({html:'text/html',js:'text/javascript',css:'text/css',json:'application/json',png:'image/png'})[ext]||'application/octet-stream',body:bytes});}catch{await route.fulfill({status:404,body:''});}
});
try{
 await page.goto('https://local.test/admin');
 await page.locator('[data-admin-view=tools]').click();
 await page.locator('[data-manage=members]').click();
 const form=page.locator('#admin-member-create');await form.locator('[name=nickname]').fill('duy_test');await form.locator('[name=name]').fill('Thành viên thử');await form.locator('[name=password]').fill('Test-password-123');await form.locator('button[type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('[data-create-member-status]').textContent.includes('Đã tạo'));
 assert(submitted.some(b=>b.action==='member-create'&&b.nickname==='duy_test'&&!b.email));
 assert.equal(await form.locator('[name=password]').inputValue(),'');
 await page.locator('[data-admin-view=posts]').click();await page.locator('#management-posts .source-row>summary').click();await page.locator('[data-edit-post]').click();
 const edit=page.locator('#post-edit-dialog');await edit.locator('[name=code]').fill('KX - 0077');await edit.locator('button[type=submit]').click();
 await page.waitForFunction(()=>!document.querySelector('#post-edit-dialog'));
 assert(submitted.some(b=>b.action==='edit-post'&&b.code==='KX - 0077'));
if(!await page.locator('#management-posts .source-row').evaluate(el=>el.open))await page.locator('#management-posts .source-row>summary').click();await page.locator('#management-posts [data-source-open]').click();
 await page.locator('dialog[open] .source-info-fields [name=privateNotes]').waitFor();assert.equal(await page.locator('dialog[open] .source-info-fields [name=privateNotes]').inputValue(),'Hẹn chủ trước 30 phút');
 assert.deepEqual(errors,[]);
 console.log('PASS: admin UI creates nickname-only member, clears password, and submits a manual listing code without browser errors.');
}finally{await browser.close();}
